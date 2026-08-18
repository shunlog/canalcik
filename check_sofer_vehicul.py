#!/usr/bin/env python3
"""Check that the Sofer <-> Vehicul mapping is consistent between the two
gestiune_flota CSV exports.

The same driver/vehicle assignment is stored twice:

  * data_source/gestiune_flota_vehicule.csv
      one row per vehicle; column "Șofer curent" holds the assigned drivers,
      separated by "/".
  * data_source/gestiune_flota_soferi.csv
      one row per driver; columns "Vehicul litere" / "Vehicul cifre" hold the
      plate of the vehicle the driver is assigned to.

Both are reduced to a set of (plate, driver) pairs and compared.  Because the
names are typed by hand in both files, pairs that only differ by spelling are
reported separately from genuinely missing assignments.
"""

import csv
import difflib
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

SOURCES = Path(__file__).parent / "data_source"
VEHICULE_CSV = SOURCES / "gestiune_flota_vehicule.csv"
SOFERI_CSV = SOURCES / "gestiune_flota_soferi.csv"

# Placeholder plate used in the soferi file for "no vehicle assigned".
NO_VEHICLE = ("XXX", "999")
# Placeholder used in the vehicule file for "driver unknown".
UNKNOWN_DRIVER = {"???", "?", "-", ""}

# Names are considered the same spelling variant above this ratio.
SIMILARITY_THRESHOLD = 0.8


def normalize_plate(litere, cifre):
    """('TAY', '066') and ('tay', '66') both become ('TAY', '66')."""
    litere = litere.strip().upper()
    cifre = cifre.strip().lstrip("0") or cifre.strip()
    return litere, cifre


def plate_str(plate):
    return f"{plate[0]} {plate[1]}"


def fold(name):
    """Lowercase, strip diacritics and collapse whitespace, for comparison."""
    decomposed = unicodedata.normalize("NFKD", name.strip().lower())
    stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
    return " ".join(stripped.split())


def read_vehicule():
    """plate -> {driver name as written in the vehicule file}"""
    mapping = defaultdict(set)
    with VEHICULE_CSV.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.reader(f))
    header = rows[0]
    # "Nr. înmatriculare" appears three times: litere, cifre, concatenated.
    i_litere, i_cifre = [i for i, h in enumerate(header) if h == "Nr. înmatriculare"][:2]
    i_sofer = header.index("Șofer curent")
    for row in rows[1:]:
        if not any(cell.strip() for cell in row):
            continue
        plate = normalize_plate(row[i_litere], row[i_cifre])
        for name in row[i_sofer].split("/"):
            name = name.strip()
            if name and name not in UNKNOWN_DRIVER:
                mapping[plate].add(name)
    return dict(mapping)


def read_soferi():
    """plate -> {driver name as written in the soferi file}"""
    mapping = defaultdict(set)
    with SOFERI_CSV.open(encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            name = (row["Nume Prenume"] or "").strip()
            plate = normalize_plate(row["Vehicul litere"] or "", row["Vehicul cifre"] or "")
            if not name or plate == NO_VEHICLE or not plate[0]:
                continue
            mapping[plate].add(name)
    return dict(mapping)


def pair_up(only_a, only_b):
    """Split two name sets into (spelling variants, unmatched_a, unmatched_b).

    Greedily pairs each name in only_a with the most similar unused name in
    only_b, if they are similar enough to be a typo of one another.
    """
    variants = []
    remaining_b = list(only_b)
    unmatched_a = []
    for name_a in sorted(only_a):
        best, best_ratio = None, 0.0
        for name_b in remaining_b:
            ratio = difflib.SequenceMatcher(None, fold(name_a), fold(name_b)).ratio()
            if ratio > best_ratio:
                best, best_ratio = name_b, ratio
        if best is not None and best_ratio >= SIMILARITY_THRESHOLD:
            remaining_b.remove(best)
            variants.append((name_a, best, best_ratio))
        else:
            unmatched_a.append(name_a)
    return variants, unmatched_a, sorted(remaining_b)


def compare(vehicule, soferi):
    """Return (spelling_variants, differences) for all plates in either file."""
    spelling_variants = []  # (plate, name_in_vehicule, name_in_soferi, ratio)
    differences = []  # (plate, missing_from_soferi, missing_from_vehicule, common)

    for plate in sorted(set(vehicule) | set(soferi)):
        names_v = vehicule.get(plate, set())
        names_s = soferi.get(plate, set())
        folded_v = {fold(n): n for n in names_v}
        folded_s = {fold(n): n for n in names_s}
        only_v = {folded_v[k] for k in folded_v.keys() - folded_s.keys()}
        only_s = {folded_s[k] for k in folded_s.keys() - folded_v.keys()}
        if not only_v and not only_s:
            continue
        common = sorted(folded_v[k] for k in folded_v.keys() & folded_s.keys())
        variants, unmatched_v, unmatched_s = pair_up(only_v, only_s)
        for name_v, name_s, ratio in variants:
            spelling_variants.append((plate, name_v, name_s, ratio))
        # names paired up as spelling variants are shared too, just typed differently
        common += [f"{name_v} / {name_s}" for name_v, name_s, _ in variants]
        if unmatched_v or unmatched_s:
            differences.append((plate, unmatched_v, unmatched_s, common))
    return spelling_variants, differences


def print_table(headers, rows, indent="  "):
    """Print rows as a table; each cell after the first is a list of names,
    printed one per line inside its column."""
    cells = [[[r[0]]] + [list(c) for c in r[1:]] for r in rows]
    widths = [
        max([len(h)] + [max((len(line) for line in row[i]), default=0) for row in cells])
        for i, h in enumerate(headers)
    ]
    sep = "  "

    def line(values):
        return (indent + sep.join(v.ljust(w) for v, w in zip(values, widths))).rstrip()

    print(line(headers))
    print(line(["-" * w for w in widths]))
    for row in cells:
        for i in range(max(len(c) for c in row)):
            print(line([c[i] if i < len(c) else "" for c in row]))


def main():
    vehicule = read_vehicule()
    soferi = read_soferi()

    pairs_v = sum(len(v) for v in vehicule.values())
    pairs_s = sum(len(v) for v in soferi.values())
    print(f"{VEHICULE_CSV.name}: {len(vehicule)} vehicles, {pairs_v} (vehicle, driver) pairs")
    print(f"{SOFERI_CSV.name}:   {len(soferi)} vehicles, {pairs_s} (vehicle, driver) pairs")
    print()

    only_in_vehicule = sorted(set(vehicule) - set(soferi))
    only_in_soferi = sorted(set(soferi) - set(vehicule))
    if only_in_vehicule:
        print(f"Plates present only in {VEHICULE_CSV.name} ({len(only_in_vehicule)}):")
        for plate in only_in_vehicule:
            print(f"  {plate_str(plate):10} drivers: {', '.join(sorted(vehicule[plate]))}")
        print()
    if only_in_soferi:
        print(f"Plates present only in {SOFERI_CSV.name} ({len(only_in_soferi)}):")
        for plate in only_in_soferi:
            print(f"  {plate_str(plate):10} drivers: {', '.join(sorted(soferi[plate]))}")
        print()

    spelling_variants, differences = compare(vehicule, soferi)

    if spelling_variants:
        print(f"Same driver, different spelling ({len(spelling_variants)}):")
        for plate, name_v, name_s, ratio in spelling_variants:
            print(f"  {plate_str(plate):10} {name_v!r} (vehicule) vs {name_s!r} (soferi)  [{ratio:.2f}]")
        print()

    if differences:
        print(f"Mismatched assignments ({len(differences)} plates):")
        rows = [
            (plate_str(plate), common, missing_v, missing_s)
            for plate, missing_s, missing_v, common in differences
        ]
        print_table(("Vehicul", "in both", f"only {SOFERI_CSV.name}", f"only {VEHICULE_CSV.name}"), rows)
        print()

    ok = not (only_in_vehicule or only_in_soferi or differences)
    print("OK: the two files agree." if ok else "FAIL: the two files disagree (see above).")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
