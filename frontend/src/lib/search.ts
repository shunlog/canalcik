import type { ComboboxItem, ComboboxParsedItem } from "@mantine/core";
import fuzzysort from "fuzzysort";

/** Fuzzy-filters a list of records against one or more text/number fields. */
export function fuzzySearch<T>(
  items: T[],
  search: string,
  keys: ReadonlyArray<(item: T) => string | number | null | undefined>,
): T[] {
  const trimmed = search.trim();
  if (trimmed === "") return items;
  return fuzzysort
    .go(trimmed, items, {
      keys: keys.map((key) => (item: T) => {
        const value = key(item);
        return value === null || value === undefined ? "" : String(value);
      }),
      limit: 0,
    })
    .map((r) => r.obj);
}

/** Fuzzy `filter` for Mantine's Select/MultiSelect/Autocomplete `data` options. */
export function fuzzyOptionsFilter({
  options,
  search,
  limit,
}: {
  options: ComboboxParsedItem[];
  search: string;
  limit: number;
}): ComboboxParsedItem[] {
  const trimmed = search.trim();
  if (trimmed === "") return options;
  const items = options as ComboboxItem[];
  return fuzzysort
    .go(trimmed, items, { key: "label", limit: Number.isFinite(limit) ? limit : 0 })
    .map((r) => r.obj);
}
