import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import inspectModuleCjs from "docxtemplater/js/inspect-module.js";
import { findUnusedValues, type TagTree } from "./unusedValues.ts";

// docxtemplater's inspect module collects every tag it sees while compiling the
// template — that's how we know which values the template actually asks for.
// It returns them as a tree, nested through loops: {name} {#rows}{nume}{/rows}
// gives {name: {}, rows: {nume: {}}}, so we know the per-row fields too.
// It ships as a CommonJS factory whose bundled types declare a default-exported
// class instead, so we describe the bit we use rather than fight the interop.
type InspectModule = { getAllTags(): TagTree };
const newInspectModule = inspectModuleCjs as unknown as () => InspectModule;

// Fills a .docx template with `data` and returns the rendered document as a
// Buffer. Placeholders use docxtemplater's {...} syntax.
//
// The data type is the contract: every placeholder in the template must have a
// value, so an unresolved one is an error rather than a silent blank. The
// contract runs both ways: a value in `data` that no tag uses is also an error
// (down to the fields of a loop's rows), since it usually means the template
// and the data type have drifted apart (a renamed or deleted tag).
export function renderDocxBuf(
  templateBuf: Buffer,
  data: Record<string, any>,
): Buffer {
  const zip = new PizZip(templateBuf);
  const missing = new Set<string>();
  const inspect = newInspectModule();
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    modules: [inspect],
    nullGetter: (part) => {
      if (!part.module) missing.add(part.value);
      return "";
    },
  });
  doc.render(data);
  if (missing.size > 0) {
    throw new Error(`Missing template values: ${[...missing].join(", ")}`);
  }
  const unused = findUnusedValues(inspect.getAllTags(), data);
  if (unused.length > 0) {
    throw new Error(`Unused data values: ${unused.join(", ")}`);
  }
  return doc.getZip().generate({ type: "nodebuffer" });
}

