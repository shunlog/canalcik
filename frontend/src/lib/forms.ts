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

/**
 * Money as "1.234,56", the Romanian convention. The currency (lei) is named in
 * the column header rather than repeated on every number.
 */
export const formatMoney = (n: number): string =>
  n.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Displays a "YYYY-MM" string as "Iunie 2026". The server has its own numeLuna for the filename. */
export const formatLuna = (v: string): string => {
  const [y, m] = v.split("-").map(Number);
  if (!y || !m) return v;
  const nume = new Date(y, m - 1, 1).toLocaleDateString("ro-RO", { month: "long" });
  return `${nume.charAt(0).toUpperCase()}${nume.slice(1)} ${y}`;
};
