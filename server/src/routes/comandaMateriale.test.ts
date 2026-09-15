import { describe, expect, it } from "@jest/globals";
import type { ComandaMaterialeDetail } from "../api-types.ts";
import { materialePentruComandaTemplate } from "./comandaMateriale.ts";

describe("materialePentruComandaTemplate", () => {
  it("maps linked act pieces before manual rows and numbers the combined table", () => {
    const comanda = {
      acteDefectiune: [
        {
          id: 7,
          data: "2026-09-15",
          vehicul: {
            id: 8,
            litere: "CA",
            cifre: "786",
            nrInventar: 42691696,
            tip: "Tractor",
            model: "MTZ-82",
          },
          pieseSchimb: [
            {
              nr: 1,
              nrNomenclator: "120673",
              piesaSchimb: "Bară reactivă",
              um: "buc",
              cantitate: 2,
              cauza: 1,
              necesitaInlocuire: "da" as const,
            },
          ],
        },
      ],
      materiale: [
        {
          id: 9,
          nr: 1,
          vehiculId: 10,
          vehicul: {
            id: 10,
            litere: "MRZ",
            cifre: "40",
            nrInventar: 11,
            tip: "Autocamion",
            model: "MAZ",
          },
          nume: "Ulei motor",
          cod: "321",
          um: "l",
          cantitate: 5,
          spec: "MRZ 40",
        },
      ],
    } satisfies Pick<ComandaMaterialeDetail, "acteDefectiune" | "materiale">;

    expect(materialePentruComandaTemplate(comanda)).toEqual([
      {
        nr: 1,
        nume: "Bară reactivă",
        spec: "CA 786",
        um: "buc",
        cantitate: "2",
        cod: "120673",
      },
      {
        nr: 2,
        nume: "Ulei motor",
        spec: "MRZ 40",
        um: "l",
        cantitate: "5",
        cod: "321",
      },
    ]);
  });
});
