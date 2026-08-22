import { describe, expect, it } from "@jest/globals";
import {
  UnmatchedMaterialeError,
  baniSplit,
  buildFisaLimita,
  type BuildFisaLimitaInput,
  type FisaLimitaBon,
  intervalLuni,
} from "./fisaLimitaData.ts";


describe("baniSplit", () => {
  it("splits and pads the bani part", () => {
    expect(baniSplit(24.6)).toEqual({ lei: 24, bani: "60" });
    expect(baniSplit(33.25)).toEqual({ lei: 33, bani: "25" });
    expect(baniSplit(0)).toEqual({ lei: 0, bani: "00" });
    expect(baniSplit(312)).toEqual({ lei: 312, bani: "00" });
  });
});

describe("intervalLuni", () => {
  it("returns just the current month when given nothing", () => {
    expect(intervalLuni([])).toEqual([expect.stringMatching(/^\d{4}-\d{2}$/)]);
    expect(intervalLuni([]).length).toBe(1);
  });

  it("returns a single month when it's the only one and matches the current month", () => {
    const cur = intervalLuni([])[0];
    expect(intervalLuni([cur])).toEqual([cur]);
  });

  it("spans a December -> January boundary", () => {
    // Anchor beyond "now" so the result isn't at the mercy of the current month.
    expect(intervalLuni(["2030-12", "2031-01"])).toEqual(
      expect.arrayContaining(["2030-12", "2031-01"]),
    );
    const range = intervalLuni(["2030-12", "2031-01"]);
    expect(range[range.length - 2]).toBe("2030-12");
    expect(range[range.length - 1]).toBe("2031-01");
  });

  it("extends past the current month for a future-dated record", () => {
    const range = intervalLuni(["2099-03"]);
    expect(range[range.length - 1]).toBe("2099-03");
  });
});

const bon = (overrides: Partial<FisaLimitaBon> = {}): FisaLimitaBon => ({
  id: 1,
  data: "2026-05-10",
  soferId: 1,
  vehiculId: 1,
  sofer: { nume: "Celpan Ion", cod: 4984 },
  vehicul: { litere: "CBE", cifre: "276" },
  linii: [],
  ...overrides,
});

describe("buildFisaLimita", () => {
  it("groups bonuri by vehicul+sofer into one sheet each, ordered by (litere, cifre, sofer)", () => {
    const input: BuildFisaLimitaInput = {
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
              nrCart: "2111",
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
              nrCart: "2222",
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

    const sheets = buildFisaLimita(input);
    expect(sheets.map((s) => s.nr_inregistrare)).toEqual(["CBE 276", "CBE 277"]);
    expect(sheets[0].nume_sofer).toBe("Celpan Ion");
    expect(sheets[1].nume_sofer).toBe("Rusu Maria");
  });

  it("orders rows within a sheet by (data, bonId, lineId)", () => {
    const input: BuildFisaLimitaInput = {
      bonuri: [
        bon({
          id: 2,
          data: "2026-05-05",
          linii: [
            { id: 1, materialId: 1, materialNume: "A", nrCart: "1", um: "l", cantitate: 1 },
          ],
        }),
        bon({
          id: 1,
          data: "2026-05-01",
          linii: [
            { id: 2, materialId: 1, materialNume: "A", nrCart: "1", um: "l", cantitate: 1 },
          ],
        }),
      ],
      facturaLinii: [{ materialId: 1, nrCart: "1", pretUnitar: 10 }],
    };

    const [sheet] = buildFisaLimita(input);
    expect(sheet.tbl.map((r) => r.data)).toEqual(["01.05.2026", "05.05.2026"]);
  });

  it("splits price and total into lei/bani, rounding the total from cents", () => {
    const input: BuildFisaLimitaInput = {
      bonuri: [
        bon({
          linii: [
            {
              id: 1,
              materialId: 1,
              materialNume: "ULEI MOTOR DIZEL M10G2K",
              nrCart: "2222",
              um: "l",
              cantitate: 12,
            },
          ],
        }),
      ],
      facturaLinii: [{ materialId: 1, nrCart: "2222", pretUnitar: 24.6 }],
    };

    const [sheet] = buildFisaLimita(input);
    const row = sheet.tbl[0];
    expect(row.pret_lei).toBe(24);
    expect(row.pret_bani).toBe("60");
    expect(row.suma_lei).toBe(295);
    expect(row.suma_bani).toBe("20");
  });

  it("matches by (materialId, nrCart) when the bon line carries a nrCart", () => {
    const input: BuildFisaLimitaInput = {
      bonuri: [
        bon({
          linii: [
            {
              id: 1,
              materialId: 1,
              materialNume: "Motorina",
              nrCart: "2111",
              um: "l",
              cantitate: 1,
            },
          ],
        }),
      ],
      // Two factura lines for the same material under different codes — only
      // the exact-code one should apply.
      facturaLinii: [
        { materialId: 1, nrCart: "2111", pretUnitar: 20 },
        { materialId: 1, nrCart: "9999", pretUnitar: 999 },
      ],
    };

    const [sheet] = buildFisaLimita(input);
    expect(sheet.tbl[0].nr_cart).toBe("2111");
    expect(sheet.tbl[0].pret_lei).toBe(20);
  });

  it("throws, naming every unmatched material, when a bon line's nrCart has no exact factura match", () => {
    const input: BuildFisaLimitaInput = {
      bonuri: [
        bon({
          linii: [
            {
              id: 1,
              materialId: 1,
              materialNume: "ULEI MOTOR 10W40 DIZEL SEMISINTETIC",
              nrCart: "2112210812",
              um: "l",
              cantitate: 1,
            },
          ],
        }),
      ],
      facturaLinii: [],
    };

    expect(() => buildFisaLimita(input)).toThrow(UnmatchedMaterialeError);
    try {
      buildFisaLimita(input);
      throw new Error("expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(UnmatchedMaterialeError);
      expect((err as UnmatchedMaterialeError).materiale[0]).toContain(
        "ULEI MOTOR 10W40 DIZEL SEMISINTETIC",
      );
    }
  });

  it("throws an ambiguous error naming the codes when a bon line has no nrCart and more than one factura line matches", () => {
    const input: BuildFisaLimitaInput = {
      bonuri: [
        bon({
          linii: [
            {
              id: 1,
              materialId: 1,
              materialNume: "ANTIGEL ALBASTRU -40C",
              nrCart: null,
              um: "l",
              cantitate: 1,
            },
          ],
        }),
      ],
      facturaLinii: [
        { materialId: 1, nrCart: "111", pretUnitar: 10 },
        { materialId: 1, nrCart: "222", pretUnitar: 20 },
      ],
    };

    try {
      buildFisaLimita(input);
      throw new Error("expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(UnmatchedMaterialeError);
      const message = (err as UnmatchedMaterialeError).materiale[0];
      expect(message).toContain("ANTIGEL ALBASTRU -40C");
      expect(message).toContain("111");
      expect(message).toContain("222");
    }
  });

  it("resolves an unambiguous match when the bon line has no nrCart", () => {
    const input: BuildFisaLimitaInput = {
      bonuri: [
        bon({
          linii: [
            { id: 1, materialId: 1, materialNume: "Motorina", nrCart: null, um: "l", cantitate: 1 },
          ],
        }),
      ],
      facturaLinii: [{ materialId: 1, nrCart: "2111", pretUnitar: 20 }],
    };

    const [sheet] = buildFisaLimita(input);
    expect(sheet.tbl[0].nr_cart).toBe("2111");
  });

  it("drops a bon that ends up with no rows", () => {
    const input: BuildFisaLimitaInput = {
      bonuri: [bon({ linii: [] })],
      facturaLinii: [],
    };
    expect(buildFisaLimita(input)).toEqual([]);
  });
});
