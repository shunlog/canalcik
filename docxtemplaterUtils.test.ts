import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, beforeAll } from "@jest/globals";
import { render } from "./docxtemplaterUtils.ts";

const TEMPLATE = "sources/template_comanda_materiale.docx";
const OUTPUT_DIR = path.resolve("test-output");
const OUTPUT = path.join(OUTPUT_DIR, "comanda.docx");

const material = {
  nr: 1,
  nume: "Test material",
  spec: "Spec",
  um: "buc",
  cantitate: "42",
  cod: 123,
};

const data: Record<string, any> = {
  test: "test",
  materiale: Array.from({ length: 9 }, () => material),
};

beforeAll(() => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
});

describe("render", () => {
  it("renders the template and writes a non-empty .docx to inspect", () => {
    expect(() => render(TEMPLATE, data, OUTPUT)).not.toThrow();
    expect(fs.existsSync(OUTPUT)).toBe(true);
    expect(fs.statSync(OUTPUT).size).toBeGreaterThan(0);
    // Open this path to eyeball the rendered document:
    console.log(`Wrote ${OUTPUT}`);
  });

  it("returns a Buffer when no output path is given", () => {
    const buf = render(TEMPLATE, data);
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it("throws listing the missing tags when data is incomplete", () => {
    expect(() => render(TEMPLATE, { materiale: [{}] })).toThrow(
      /Missing template values/,
    );
  });
});
