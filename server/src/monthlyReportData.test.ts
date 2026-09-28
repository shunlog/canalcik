import { describe, expect, it } from "@jest/globals";
import {
  UnmatchedMaterialeError,
  baniSplit,
  buildMonthlyReport,
  buildReconciliere,
  type BuildMonthlyReportInput,
  type MonthlyReportBon,
  type ReconcilereFacturaLine,
  intervalMonths,
  liniiCuDiferente,
} from "./monthlyReportData.ts";


describe("baniSplit", () => {
  it("splits and pads the bani part", () => {
    expect(baniSplit(24.6)).toEqual({ lei: 24, bani: "60" });
    expect(baniSplit(33.25)).toEqual({ lei: 33, bani: "25" });
    expect(baniSplit(0)).toEqual({ lei: 0, bani: "00" });
    expect(baniSplit(312)).toEqual({ lei: 312, bani: "00" });
  });
});

describe("intervalMonths", () => {
  it("returns just the current month when given nothing", () => {
    expect(intervalMonths([])).toEqual([expect.stringMatching(/^\d{4}-\d{2}$/)]);
    expect(intervalMonths([]).length).toBe(1);
  });

  it("returns a single month when it's the only one and matches the current month", () => {
    const cur = intervalMonths([])[0];
    expect(intervalMonths([cur])).toEqual([cur]);
  });

  it("spans a December -> January boundary", () => {
    // Anchor beyond "now" so the result isn't at the mercy of the current month.
    expect(intervalMonths(["2030-12", "2031-01"])).toEqual(
      expect.arrayContaining(["2030-12", "2031-01"]),
    );
    const range = intervalMonths(["2030-12", "2031-01"]);
    expect(range[range.length - 2]).toBe("2030-12");
    expect(range[range.length - 1]).toBe("2031-01");
  });

  it("extends past the current month for a future-dated record", () => {
    const range = intervalMonths(["2099-03"]);
    expect(range[range.length - 1]).toBe("2099-03");
  });
});

const MONTH = "2026-05";

const bon = (overrides: Partial<MonthlyReportBon> = {}): MonthlyReportBon => ({
  id: 1,
  data: `${MONTH}-10`,
  soferId: 1,
  vehiculId: 1,
  sofer: { nume: "Celpan Ion", cod: 4984 },
  vehicul: { nrInmatriculare: "CBE 276", nrInventar: 42691696 },
  linii: [],
  ...overrides,
});

describe("buildMonthlyReport", () => {
  it("groups bonuri by vehicul+sofer into one sheet each, ordered by (nrInmatriculare, sofer)", () => {
    const input: BuildMonthlyReportInput = {
      month: MONTH,
      bonuri: [
        bon({
          id: 1,
          vehiculId: 2,
          soferId: 2,
          vehicul: { nrInmatriculare: "CBE 277", nrInventar: 42691697 },
          sofer: { nume: "Rusu Maria", cod: 1111 },
          linii: [
            {
              id: 1,
              materialId: 1,
              materialNume: "Motorina",
              um: "l",
              cantitate: 10,
            },
          ],
        }),
        bon({
          id: 2,
          vehiculId: 1,
          soferId: 1,
          linii: [
            {
              id: 2,
              materialId: 2,
              materialNume: "Ulei motor",
              um: "l",
              cantitate: 5,
            },
          ],
        }),
      ],
      facturaLinii: [
        { materialId: 1, nrCart: "2111", pretUnitar: 20 },
        { materialId: 2, nrCart: "2222", pretUnitar: 24.6 },
      ],
    };

    const sheets = buildMonthlyReport(input);
    expect(sheets.map((s) => s.nr_inregistrare)).toEqual(["CBE 276", "CBE 277"]);
    expect(sheets[0].nume_sofer).toBe("Celpan Ion");
    expect(sheets[1].nume_sofer).toBe("Rusu Maria");
  });

  it("keeps two sheets separate when only the sofer diverges", () => {
    const sameLinii = [{ id: 1, materialId: 1, materialNume: "Motorina", um: "l", cantitate: 10 }];
    const input: BuildMonthlyReportInput = {
      month: MONTH,
      bonuri: [
        bon({ id: 1, soferId: 1, sofer: { nume: "Celpan Ion", cod: 4984 }, linii: sameLinii }),
        bon({ id: 2, soferId: 2, sofer: { nume: "Rusu Maria", cod: 1111 }, linii: sameLinii }),
      ],
      facturaLinii: [{ materialId: 1, nrCart: "2111", pretUnitar: 20 }],
    };

    const sheets = buildMonthlyReport(input);
    expect(sheets).toHaveLength(2);
    expect(sheets.map((s) => s.nr_inregistrare)).toEqual(["CBE 276", "CBE 276"]);
    expect(sheets.map((s) => s.nume_sofer)).toEqual(["Celpan Ion", "Rusu Maria"]);
  });

  it("stamps each sheet with the vehicle's inventory number and the month in romanian", () => {
    const [sheet] = buildMonthlyReport({
      month: "2026-05",
      bonuri: [
        bon({
          linii: [{ id: 1, materialId: 1, materialNume: "Motorina", um: "l", cantitate: 10 }],
        }),
      ],
      facturaLinii: [{ materialId: 1, nrCart: "2111", pretUnitar: 20 }],
    });

    expect(sheet.nr_inventar).toBe("42691696");
    expect(sheet.luna).toBe("Mai");
    expect(sheet.anul).toBe("2026");
  });

  it("orders rows within a sheet by (data, bonId, lineId)", () => {
    const input: BuildMonthlyReportInput = {
      month: MONTH,
      bonuri: [
        bon({
          id: 2,
          data: "2026-05-05",
          linii: [{ id: 1, materialId: 1, materialNume: "A", um: "l", cantitate: 1 }],
        }),
        bon({
          id: 1,
          data: "2026-05-01",
          linii: [{ id: 2, materialId: 2, materialNume: "B", um: "l", cantitate: 1 }],
        }),
      ],
      facturaLinii: [
        { materialId: 1, nrCart: "1", pretUnitar: 10 },
        { materialId: 2, nrCart: "2", pretUnitar: 10 },
      ],
    };

    const [sheet] = buildMonthlyReport(input);
    expect(sheet.tbl.map((r) => r.data)).toEqual(["01.05.2026", "05.05.2026"]);
  });

  it("splits price and total into lei/bani, rounding the total from cents", () => {
    const input: BuildMonthlyReportInput = {
      month: MONTH,
      bonuri: [
        bon({
          linii: [
            {
              id: 1,
              materialId: 1,
              materialNume: "ULEI MOTOR DIZEL M10G2K",
              um: "l",
              cantitate: 12,
            },
          ],
        }),
      ],
      facturaLinii: [{ materialId: 1, nrCart: "2222", pretUnitar: 24.6 }],
    };

    const [sheet] = buildMonthlyReport(input);
    const row = sheet.tbl[0];
    expect(row.pret_lei).toBe(24);
    expect(row.pret_bani).toBe("60");
    expect(row.suma_lei).toBe(295);
    expect(row.suma_bani).toBe("20");
  });

  it("excludes a scratchpad-note line (no materialId) instead of erroring, keeping only linked materials", () => {
    const input: BuildMonthlyReportInput = {
      month: MONTH,
      bonuri: [
        bon({
          linii: [
            { id: 1, materialId: null, materialNume: "de verificat", um: "l", cantitate: 5 },
            { id: 2, materialId: 1, materialNume: "A", um: "l", cantitate: 2 },
          ],
        }),
      ],
      facturaLinii: [{ materialId: 1, nrCart: "1", pretUnitar: 10 }],
    };

    const [sheet] = buildMonthlyReport(input);
    expect(sheet.tbl).toHaveLength(1);
    expect(sheet.tbl[0].nume).toBe("A");
  });

  it("throws, naming every unmatched material, when a bon line's material has no factura line at all", () => {
    const input: BuildMonthlyReportInput = {
      month: MONTH,
      bonuri: [
        bon({
          linii: [
            {
              id: 1,
              materialId: 1,
              materialNume: "ULEI MOTOR 10W40 DIZEL SEMISINTETIC",
              um: "l",
              cantitate: 1,
            },
          ],
        }),
      ],
      facturaLinii: [],
    };

    expect(() => buildMonthlyReport(input)).toThrow(UnmatchedMaterialeError);
    try {
      buildMonthlyReport(input);
      throw new Error("expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(UnmatchedMaterialeError);
      expect((err as UnmatchedMaterialeError).materiale[0]).toContain(
        "ULEI MOTOR 10W40 DIZEL SEMISINTETIC",
      );
    }
  });

  it("resolves a bon line by materialId when the factura carries exactly one line for it", () => {
    const input: BuildMonthlyReportInput = {
      month: MONTH,
      bonuri: [
        bon({
          linii: [{ id: 1, materialId: 1, materialNume: "Motorina", um: "l", cantitate: 1 }],
        }),
      ],
      facturaLinii: [{ materialId: 1, nrCart: "2111", pretUnitar: 20 }],
    };

    const [sheet] = buildMonthlyReport(input);
    expect(sheet.tbl[0].nr_cart).toBe("2111");
  });

  it("drops a bon that ends up with no rows", () => {
    const input: BuildMonthlyReportInput = {
      month: MONTH,
      bonuri: [bon({ linii: [] })],
      facturaLinii: [],
    };
    expect(buildMonthlyReport(input)).toEqual([]);
  });
});

describe("buildMonthlyReport row merging", () => {
  const line = (over: Partial<MonthlyReportBon["linii"][number]> = {}) => ({
    id: 1,
    materialId: 1,
    materialNume: "ANTIGEL ALBASTRU -40C",
    um: "L",
    cantitate: 5,
    ...over,
  });

  it("sums two lines of one bon for the same day and material", () => {
    const [sheet] = buildMonthlyReport({
      month: MONTH,
      bonuri: [
        bon({
          linii: [line({ id: 1, cantitate: 5 }), line({ id: 2, cantitate: 1 })],
        }),
      ],
      facturaLinii: [{ materialId: 1, nrCart: "2111017178", pretUnitar: 20 }],
    });

    expect(sheet.tbl).toHaveLength(1);
    expect(sheet.tbl[0].cant).toBe(6);
    // One rounding, from the summed quantity: 6 × 20.
    expect(sheet.tbl[0].suma_lei).toBe(120);
    expect(sheet.tbl[0].suma_bani).toBe("00");
  });

  it("merges across two bonuri on the same date for the same vehicul and sofer", () => {
    const [sheet] = buildMonthlyReport({
      month: MONTH,
      bonuri: [
        bon({ id: 1, linii: [line({ id: 1, cantitate: 5 })] }),
        bon({ id: 2, linii: [line({ id: 2, cantitate: 2.5 })] }),
      ],
      facturaLinii: [{ materialId: 1, nrCart: "2111017178", pretUnitar: 20 }],
    });

    expect(sheet.tbl).toHaveLength(1);
    expect(sheet.tbl[0].cant).toBe(7.5);
  });

  it("sums two lines across different dates, keeping the oldest date", () => {
    const [sheet] = buildMonthlyReport({
      month: MONTH,
      bonuri: [
        bon({ id: 2, data: "2026-05-18", linii: [line({ id: 2, cantitate: 3 })] }),
        bon({ id: 1, data: "2026-05-04", linii: [line({ id: 1, cantitate: 5 })] }),
      ],
      facturaLinii: [{ materialId: 1, nrCart: "2111017178", pretUnitar: 20 }],
    });

    expect(sheet.tbl.length).toBe(1);
    expect(sheet.tbl[0].data).toBe("04.05.2026");
    expect(sheet.tbl[0].cant).toBe(8);
  });

  it("sums floats without leaving binary noise in the cell", () => {
    const [sheet] = buildMonthlyReport({
      month: MONTH,
      bonuri: [
        bon({
          linii: [line({ id: 1, cantitate: 0.1 }), line({ id: 2, cantitate: 0.2 })],
        }),
      ],
      facturaLinii: [{ materialId: 1, nrCart: "2111017178", pretUnitar: 10 }],
    });

    expect(sheet.tbl[0].cant).toBe(0.3);
  });

  it("does not add together two different units", () => {
    const [sheet] = buildMonthlyReport({
      month: MONTH,
      bonuri: [
        bon({
          linii: [line({ id: 1, um: "L", cantitate: 5 }), line({ id: 2, um: "KG", cantitate: 3 })],
        }),
      ],
      facturaLinii: [{ materialId: 1, nrCart: "2111017178", pretUnitar: 20 }],
    });

    expect(sheet.tbl).toHaveLength(2);
    expect(sheet.tbl.map((r) => [r.unit, r.cant])).toEqual([
      ["L", 5],
      ["KG", 3],
    ]);
  });
});

describe("buildReconciliere", () => {
  const fLine = (over: Partial<ReconcilereFacturaLine> = {}): ReconcilereFacturaLine => ({
    materialId: 1,
    materialNume: "ANTIGEL ALBASTRU -40C",
    nrCart: "2111017178",
    um: "L",
    cantitate: 6,
    ramas: false,
    facturaId: 100,
    facturaData: "2026-05-10",
    ...over,
  });

  const bLine = (over: Partial<MonthlyReportBon["linii"][number]> = {}) => ({
    id: 1,
    materialId: 1,
    materialNume: "ANTIGEL ALBASTRU -40C",
    um: "L",
    cantitate: 6,
    ...over,
  });

  it("reports no difference when the bonuri sum to the invoiced quantity", () => {
    const linii = buildReconciliere({
      bonuri: [bon({ linii: [bLine({ id: 1, cantitate: 5 }), bLine({ id: 2, cantitate: 1 })] })],
      facturaLinii: [fLine({ cantitate: 6 })],
    });

    expect(linii).toHaveLength(1);
    expect(linii[0]).toMatchObject({
      nrCart: "2111017178",
      cantitateFactura: 6,
      cantitateBonuri: 6,
    });
    expect(liniiCuDiferente(linii)).toEqual([]);
  });

  it("treats a factura line with no bonuri at all as a full shortfall", () => {
    const [row] = buildReconciliere({
      bonuri: [],
      facturaLinii: [fLine({ cantitate: 6 })],
    });
    expect(row).toMatchObject({ cantitateBonuri: 0, bonuri: [] });
    expect(liniiCuDiferente([row])).toHaveLength(1);
  });

  it("gives a bon line whose material has no factura line its own row", () => {
    const rows = buildReconciliere({
      bonuri: [bon({ linii: [bLine({ materialId: 9, materialNume: "MOTORINA" })] })],
      facturaLinii: [fLine()],
    });

    const orphan = rows.find((r) => r.nume === "MOTORINA");
    expect(orphan).toMatchObject({ nrCart: null, cantitateFactura: null });
    expect(liniiCuDiferente([orphan!])).toHaveLength(1);
  });

  it("compares float sums exactly, so 0.1 three times matches 0.3", () => {
    const linii = buildReconciliere({
      bonuri: [
        bon({
          linii: [
            bLine({ id: 1, cantitate: 0.1 }),
            bLine({ id: 2, cantitate: 0.1 }),
            bLine({ id: 3, cantitate: 0.1 }),
          ],
        }),
      ],
      facturaLinii: [fLine({ cantitate: 0.3 })],
    });
    expect(linii[0].cantitateBonuri).toBe(0.3);
    expect(liniiCuDiferente(linii)).toEqual([]);
  });

  it("links a bon once even when it carries two lines for the same material", () => {
    const [row] = buildReconciliere({
      bonuri: [
        bon({ id: 51, linii: [bLine({ id: 1, cantitate: 5 }), bLine({ id: 2, cantitate: 1 })] }),
      ],
      facturaLinii: [fLine({ cantitate: 6 })],
    });
    expect(row.bonuri).toEqual([{ id: 51, data: "2026-05-10" }]);
  });

  it("lists every bon touching a material, oldest first", () => {
    const [row] = buildReconciliere({
      bonuri: [
        bon({ id: 2, data: "2026-05-18", linii: [bLine({ cantitate: 1 })] }),
        bon({ id: 1, data: "2026-05-04", linii: [bLine({ cantitate: 5 })] }),
      ],
      facturaLinii: [fLine({ cantitate: 6 })],
    });

    expect(row.bonuri).toEqual([
      { id: 1, data: "2026-05-04" },
      { id: 2, data: "2026-05-18" },
    ]);
  });

  it("sums the quantity across every factura naming the material, listing them oldest first", () => {
    const [row] = buildReconciliere({
      bonuri: [bon({ linii: [bLine({ cantitate: 6 })] })],
      facturaLinii: [
        fLine({ facturaId: 2, facturaData: "2026-05-18", cantitate: 2 }),
        fLine({ facturaId: 1, facturaData: "2026-05-04", cantitate: 4 }),
      ],
    });

    expect(row.facturi).toEqual([
      { id: 1, data: "2026-05-04" },
      { id: 2, data: "2026-05-18" },
    ]);
    expect(row.cantitateFactura).toBe(6);
  });

  it("flags a difference against the summed quantity of several facturi", () => {
    const [row] = buildReconciliere({
      bonuri: [bon({ linii: [bLine({ cantitate: 10 })] })],
      facturaLinii: [
        fLine({ facturaId: 1, facturaData: "2026-05-04", cantitate: 4 }),
        fLine({ facturaId: 2, facturaData: "2026-05-18", cantitate: 2 }),
      ],
    });

    expect(row).toMatchObject({ cantitateFactura: 6, cantitateBonuri: 10 });
    expect(liniiCuDiferente([row])).toHaveLength(1);
  });

  it("gives an orphan row no facturi", () => {
    const rows = buildReconciliere({
      bonuri: [bon({ linii: [bLine({ materialId: 9, materialNume: "MOTORINA" })] })],
      facturaLinii: [fLine()],
    });
    const orphan = rows.find((r) => r.nume === "MOTORINA");
    expect(orphan?.facturi).toEqual([]);
  });

  it("returns nothing for a month with neither bonuri nor a factura", () => {
    expect(buildReconciliere({ bonuri: [], facturaLinii: [] })).toEqual([]);
  });

  it("carries the matched factura line's ramas onto the row", () => {
    const [row] = buildReconciliere({
      bonuri: [bon({ linii: [bLine({ cantitate: 6 })] })],
      facturaLinii: [fLine({ cantitate: 6, ramas: true })],
    });
    expect(row.ramas).toBe(true);
  });

  it("defaults ramas to false on an orphan row with no factura line", () => {
    const rows = buildReconciliere({
      bonuri: [bon({ linii: [bLine({ materialId: 9, materialNume: "MOTORINA" })] })],
      facturaLinii: [fLine()],
    });
    const orphan = rows.find((r) => r.nume === "MOTORINA");
    expect(orphan?.ramas).toBe(false);
  });
});
