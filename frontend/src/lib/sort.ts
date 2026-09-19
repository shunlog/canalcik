import type { DataTableSortStatus } from "mantine-datatable";

/** Sorts records by the DataTable's current sort column/direction, numerically or via Romanian locale comparison. */
export function sortRecords<T>(records: T[], sortStatus: DataTableSortStatus<T>): T[] {
  const accessor = sortStatus.columnAccessor as keyof T;
  return records.sort((a, b) => {
    const aValue = a[accessor];
    const bValue = b[accessor];
    const result =
      typeof aValue === "number" && typeof bValue === "number"
        ? aValue - bValue
        : String(aValue ?? "").localeCompare(String(bValue ?? ""), "ro", {
            numeric: true,
            sensitivity: "base",
          });
    return sortStatus.direction === "asc" ? result : -result;
  });
}

/** Unique, Romanian-locale-sorted values for a MultiSelect filter's options. */
export function uniqueSortedOptions<T>(items: T[], getter: (item: T) => string | null): string[] {
  const values = items.flatMap((item) => {
    const value = getter(item);
    return value ? [value] : [];
  });
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "ro"));
}
