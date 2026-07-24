import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, beforeAll } from "@jest/globals";
import {
  renderComandaMateriale,
  type DataComandaMateriale,
} from "./types.ts";
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
