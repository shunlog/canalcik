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

const bon = (overrides: Partial<MonthlyReportBon> = {}): MonthlyReportBon => ({
  id: 1,
  data: "2026-05-10",
  soferId: 1,
  vehiculId: 1,
  sofer: { nume: "Celpan Ion", cod: 4984 },
  vehicul: { litere: "CBE", cifre: "276" },
  linii: [],
  ...overrides,
});

describe("buildMonthlyReport", () => {
  it("groups bonuri by vehicul+sofer into one sheet each, ordered by (litere, cifre, sofer)", () => {
    const input: BuildMonthlyReportInput = {
      bonuri: [
        bon({
          id: 1,
          vehiculId: 2,
          soferId: 2,
          vehicul: { litere: "CBE", cifre: "277" },
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

  it("orders rows within a sheet by (data, bonId, lineId)", () => {
    const input: BuildMonthlyReportInput = {
      bonuri: [
        bon({
          id: 2,
          data: "2026-05-05",
          linii: [{ id: 1, materialId: 1, materialNume: "A", um: "l", cantitate: 1 }],
        }),
        bon({
          id: 1,
          data: "2026-05-01",
          linii: [{ id: 2, materialId: 1, materialNume: "A", um: "l", cantitate: 1 }],
        }),
      ],
      facturaLinii: [{ materialId: 1, nrCart: "1", pretUnitar: 10 }],
    };

    const [sheet] = buildMonthlyReport(input);
    expect(sheet.tbl.map((r) => r.data)).toEqual(["01.05.2026", "05.05.2026"]);
  });

  it("splits price and total into lei/bani, rounding the total from cents", () => {
    const input: BuildMonthlyReportInput = {
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

  it("throws, naming every unmatched material, when a bon line's material has no factura line at all", () => {
    const input: BuildMonthlyReportInput = {
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
      bonuri: [
        bon({ id: 1, linii: [line({ id: 1, cantitate: 5 })] }),
        bon({ id: 2, linii: [line({ id: 2, cantitate: 2.5 })] }),
      ],
      facturaLinii: [{ materialId: 1, nrCart: "2111017178", pretUnitar: 20 }],
    });

    expect(sheet.tbl).toHaveLength(1);
    expect(sheet.tbl[0].cant).toBe(7.5);
  });

  it("sums floats without leaving binary noise in the cell", () => {
    const [sheet] = buildMonthlyReport({
      bonuri: [
        bon({
          linii: [line({ id: 1, cantitate: 0.1 }), line({ id: 2, cantitate: 0.2 })],
        }),
      ],
      facturaLinii: [{ materialId: 1, nrCart: "2111017178", pretUnitar: 10 }],
    });

    expect(sheet.tbl[0].cant).toBe(0.3);
  });

  it("keeps the same material on two dates as two rows", () => {
    const [sheet] = buildMonthlyReport({
      bonuri: [
        bon({ id: 1, data: "2026-05-04", linii: [line({ id: 1, cantitate: 5 })] }),
        bon({ id: 2, data: "2026-05-18", linii: [line({ id: 2, cantitate: 3 })] }),
      ],
      facturaLinii: [{ materialId: 1, nrCart: "2111017178", pretUnitar: 20 }],
    });

    expect(sheet.tbl.map((r) => [r.data, r.cant])).toEqual([
      ["04.05.2026", 5],
      ["18.05.2026", 3],
    ]);
  });

  it("does not add together two different units", () => {
    const [sheet] = buildMonthlyReport({
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
      diferenta: 0,
    });
    expect(liniiCuDiferente(linii)).toEqual([]);
  });

  it("reports a positive difference when we recorded more than the factura", () => {
    const [row] = buildReconciliere({
      bonuri: [bon({ linii: [bLine({ cantitate: 8 })] })],
      facturaLinii: [fLine({ cantitate: 6 })],
    });
    expect(row.diferenta).toBe(2);
  });

  it("reports a negative difference when we recorded less than the factura", () => {
    const [row] = buildReconciliere({
      bonuri: [bon({ linii: [bLine({ cantitate: 4 })] })],
      facturaLinii: [fLine({ cantitate: 6 })],
    });
    expect(row.diferenta).toBe(-2);
  });

  it("treats a factura line with no bonuri at all as a full shortfall", () => {
    const [row] = buildReconciliere({
      bonuri: [],
      facturaLinii: [fLine({ cantitate: 6 })],
    });
    expect(row).toMatchObject({ cantitateBonuri: 0, diferenta: -6, bonuri: [] });
  });

  it("gives a bon line whose material has no factura line its own row", () => {
    const rows = buildReconciliere({
      bonuri: [bon({ linii: [bLine({ materialId: 9, materialNume: "MOTORINA" })] })],
      facturaLinii: [fLine()],
    });

    const orphan = rows.find((r) => r.nume === "MOTORINA");
    expect(orphan).toMatchObject({ nrCart: null, cantitateFactura: null, diferenta: 6 });
  });

  it("attributes a bon line to the only factura line for that material", () => {
    const rows = buildReconciliere({
      bonuri: [bon({ linii: [bLine({ cantitate: 6 })] })],
      facturaLinii: [fLine({ cantitate: 6 })],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ nrCart: "2111017178", diferenta: 0 });
  });

  it("compares float sums exactly, so 0.1 three times matches 0.3", () => {
    const [row] = buildReconciliere({
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
    expect(row.diferenta).toBe(0);
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

  it("returns nothing for a month with neither bonuri nor a factura", () => {
    expect(buildReconciliere({ bonuri: [], facturaLinii: [] })).toEqual([]);
  });
});
