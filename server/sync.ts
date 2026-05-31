import path from "node:path";
import { db } from "./db.ts";
import { parseCategorii } from "./parsers/categorii.ts";
import { parseVehicule } from "./parsers/vehicule.ts";

const CATEGORII_PATH = path.resolve("sources/categorii_produse.csv");
const VEHICULE_PATH = path.resolve("sources/gestiune_flota_vehicule.csv");

export type SyncResult = {
  materials: number;
  vehicles: number;
  drivers: number;
};

export async function syncFromCsv(): Promise<SyncResult> {
  const materials = parseCategorii(CATEGORII_PATH);
  const vehicles = parseVehicule(VEHICULE_PATH);

  const now = new Date();

  // Materials: upsert by `cod`.
  for (const m of materials) {
    await db.material.upsert({
      where: { cod: m.cod },
      update: {
        denumire: m.denumire,
        unitateMasura: m.unitateMasura,
        caleCategorie: m.caleCategorie,
        syncedAt: now,
      },
      create: {
        cod: m.cod,
        denumire: m.denumire,
        unitateMasura: m.unitateMasura,
        caleCategorie: m.caleCategorie,
        syncedAt: now,
      },
    });
  }

  // Drivers: collect distinct names so we can upsert once per name.
  const driverNames = new Set<string>();
  for (const v of vehicles) for (const n of v.drivers) driverNames.add(n);
  for (const nume of driverNames) {
    await db.sofer.upsert({
      where: { nume },
      update: { syncedAt: now },
      create: { nume, syncedAt: now },
    });
  }

  // Vehicles: upsert by `nrInmatriculare`, then re-link drivers.
  for (const v of vehicles) {
    const driverIds = v.drivers.length
      ? (
          await db.sofer.findMany({
            where: { nume: { in: v.drivers } },
            select: { id: true },
          })
        ).map((s) => ({ id: s.id }))
      : [];

    await db.vehicul.upsert({
      where: { nrInmatriculare: v.nrInmatriculare },
      update: {
        tip: v.tip,
        model: v.model,
        nrInventar: v.nrInventar,
        anProducere: v.anProducere,
        syncedAt: now,
        soferi: { set: driverIds },
      },
      create: {
        tip: v.tip,
        model: v.model,
        nrInmatriculare: v.nrInmatriculare,
        nrInventar: v.nrInventar,
        anProducere: v.anProducere,
        syncedAt: now,
        soferi: { connect: driverIds },
      },
    });
  }

  return {
    materials: materials.length,
    vehicles: vehicles.length,
    drivers: driverNames.size,
  };
}
