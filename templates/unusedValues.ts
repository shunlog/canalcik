// Shared by renderDocx.ts and renderXlsx.ts: the "is every value actually
// rendered?" half of the template contract. Each renderer works out which paths
// its template reads — docxtemplater's inspect module hands us the tree
// directly, the xlsx side builds one from its ${...} placeholders — and this
// module walks `data` against that tree.

// What a template reads from one value. An empty tree means the value is
// consumed whole (a scalar tag like {name} / ${name}, or a docx conditional
// section {#flag}); a non-empty one names the fields read from inside it.
export type TagTree = { [key: string]: TagTree };

// Returns the paths in `data` that no tag reads, e.g. ["cod_vechi",
// "sofer.cod", "tbl.pret_bani"]. Array elements share one path without an
// index: a field missing from every row is reported once, as "rows.prop",
// since the rows all have the same shape and one line per row would be noise.
export function findUnusedValues(
  tags: TagTree,
  data: Record<string, any>,
): string[] {
  const unused = new Set<string>();
  walkObject(data, tags, "", unused);
  return [...unused];
}

function walkObject(
  obj: Record<string, any>,
  tags: TagTree,
  prefix: string,
  unused: Set<string>,
): void {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const sub = tags[key];
    if (sub === undefined) unused.add(path);
    else walkValue(value, sub, path, unused);
  }
}

function walkValue(
  value: any,
  tags: TagTree,
  path: string,
  unused: Set<string>,
): void {
  // No fields named under this tag: the template uses the value itself.
  if (Object.keys(tags).length === 0) return;
  // docx writes the current loop element as {.} — that reads it whole too.
  if ("." in tags) return;
  if (Array.isArray(value)) {
    // The tag tree describes one element, so every element is checked against
    // it; `path` stays index-free so the rows collapse into one report.
    for (const element of value) walkValue(element, tags, path, unused);
  } else if (isPlainObject(value)) {
    walkObject(value, tags, path, unused);
  }
  // Anything else is a scalar the template reached into (e.g. {#s}{a}{/s} over
  // a string) — there are no fields to call unused.
}

function isPlainObject(value: any): boolean {
  return typeof value === "object" && value !== null;
}
