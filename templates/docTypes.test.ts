import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, beforeAll } from "@jest/globals";
import {
  renderComandaMateriale,
  type DataComandaMateriale,
  renderFisaLimita,
  type DataFisaLimita,
} from "./docTypes.ts";
import { TEMPLATES, loadTemplate } from "./templateManifest.ts";

const OUTPUT_DIR = path.resolve("test-output");

const COMANDA_DATA: DataComandaMateriale = {
  data: "25.06.2026",
  materiale: [
    {
      nr: 1,
      nume: "Bara reactiva K-3 MAZ 5337",
      spec: "CA 786",
      um: "buc",
      cantitate: "2",
      cod: "120673",
    },
    {
      nr: 2,
      nume: "Bara reactiva K-3 MAZ 5337",
      spec: "CA 786",
      um: "buc",
      cantitate: "2",
      cod: "120673",
    },
  ],
};

describe("renderComandaMateriale", () => {
  const template = loadTemplate(TEMPLATES.comandaMateriale);

  beforeAll(() => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  });

  it("returns a non-empty Buffer for valid data", () => {
    const buf = renderComandaMateriale(template, COMANDA_DATA);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
  });

  it(`write to ${OUTPUT_DIR} for visual inspection`, () => {
    const outPath = path.join(OUTPUT_DIR, "comanda_materiale_1.docx");
    const buf = renderComandaMateriale(template, COMANDA_DATA);
    fs.writeFileSync(outPath, buf);
    expect(fs.statSync(outPath).size).toBeGreaterThan(0);
    console.log(`Wrote ${outPath}`);
  });

  it("throws on missing template tags", () => {
    expect(() =>
      renderComandaMateriale(template, { materiale: [{}] } as any),
    ).toThrow(/Missing template values/);
  });
});

const fisaRow = (data: string, nr_cart: string, nume: string) => ({
  data,
  nr_cart,
  nume,
  nr: 1,
  unit: "l",
  cant: "10",
  pret_lei: "20",
  pret_bani: "50",
  suma_lei: "205",
  suma_bani: "00",
});

const FISA_DATA: DataFisaLimita = {
  nr_inregistrare: "CBE 276",
  nume_sofer: "Celpan Ion",
  cod_sofer: "4984",
  tbl: [
    fisaRow("26.05.2026", "2111121795", "Motorina"),
    fisaRow("27.05.2026", "2111121796", "Ulei motor"),
    fisaRow("28.05.2026", "2111121797", "Antigel"),
  ],
};

describe("renderFisaLimita", () => {
  // Loaded lazily (not at describe-body time like the docx template) so a
  // not-yet-fetched template fails only these tests, not the whole file.
  let template: Buffer;

  beforeAll(() => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    template = loadTemplate(TEMPLATES.fisaLimita);
  });

  it("returns a non-empty Buffer for valid data", () => {
    const buf = renderFisaLimita(template, FISA_DATA);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
  });

  it(`writes to ${OUTPUT_DIR} for visual inspection`, () => {
    const outPath = path.join(OUTPUT_DIR, "fisa_limita_1.xlsx");
    fs.writeFileSync(outPath, renderFisaLimita(template, FISA_DATA));
    expect(fs.statSync(outPath).size).toBeGreaterThan(0);
    console.log(`Wrote ${outPath}`);
  });

  it("throws when a template value is missing", () => {
    const { cod_sofer, ...incomplete } = FISA_DATA;
    expect(() =>
      renderFisaLimita(template, incomplete as DataFisaLimita),
    ).toThrow(/Missing template values/);
  });
});
