// Month names in Romanian, capitalized as the documents print them. Hardcoded
// rather than taken from Intl: the same names must come out of the server, the
// browser and the tests, whatever locale data the runtime happens to carry.
const LUNI = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
] as const;

/** The Romanian name of a 1-based month number, "" outside 1..12. */
export const numeLuna = (luna: number): string => LUNI[luna - 1] ?? "";

/** Splits a "YYYY-MM" string into the two fields a document prints separately. */
export function lunaSiAnul(month: string): { luna: string; anul: string } {
  const [y, m] = month.split("-");
  return { luna: numeLuna(Number(m)), anul: y ?? "" };
}

/** A "YYYY-MM" string as "Iunie 2026"; unparsable input is returned as it came. */
export function formatLuna(month: string): string {
  const { luna, anul } = lunaSiAnul(month);
  return luna && anul ? `${luna} ${anul}` : month;
}

/** An ISO "YYYY-MM-DD" date as "25.06.2026", the form the documents print. */
export const isoToDDMMYYYY = (iso: string): string => {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};
