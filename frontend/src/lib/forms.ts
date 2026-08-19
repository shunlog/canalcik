/**
 * Conversions at the form boundary. Mantine's controlled inputs need a string,
 * the API and the database use null — so each value crosses exactly twice, here
 * and nowhere else.
 */

export const nullToEmpty = (v: string | null | undefined): string => v ?? "";

export const emptyToNull = (v: string): string | null => (v.trim() === "" ? null : v.trim());

/** NumberInput hands back `number | string` — "" once the user clears it. */
export const numOrNull = (v: number | string): number | null =>
  v === "" || Number.isNaN(Number(v)) ? null : Number(v);

export const numOrZero = (v: number | string): number =>
  v === "" || Number.isNaN(Number(v)) ? 0 : Number(v);

/** Today as "YYYY-MM-DD" in local time. `toISOString()` is UTC and is a day off after ~21:00 here. */
export const todayLocalIso = (): string => new Date().toLocaleDateString("sv-SE");

export const requiredText = (label: string) => (v: string) =>
  v.trim() === "" ? `${label} este obligatoriu` : null;

export const requiredNum = (label: string) => (v: number | string) =>
  v === "" || Number.isNaN(Number(v)) ? `${label} este obligatoriu` : null;

/** Displays a "YYYY-MM-DD" string as "ZZ.LL.AAAA" without going through Date. */
export const formatIsoDate = (v: string | null | undefined): string => {
  if (!v) return "—";
  const [y, m, d] = v.split("-");
  return y && m && d ? `${d}.${m}.${y}` : v;
};
