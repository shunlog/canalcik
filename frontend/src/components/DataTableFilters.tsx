import { MultiSelect, TextInput } from "@mantine/core";
import { fuzzyOptionsFilter } from "../lib/search.ts";

/** `filter`/`filtering` pair for a DataTable column backed by a free-text search field. */
export function textFilterColumn(props: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return {
    filter: (
      <TextInput
        label={props.label}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(event) => props.onChange(event.currentTarget.value)}
      />
    ),
    filtering: props.value.trim() !== "",
  };
}

/** `filter`/`filtering` pair for a DataTable column backed by a fuzzy-searchable MultiSelect. */
export function multiSelectFilterColumn(props: {
  label: string;
  data: string[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return {
    filter: (
      <MultiSelect
        label={props.label}
        placeholder="Toate"
        searchable
        clearable
        filter={fuzzyOptionsFilter}
        data={props.data}
        value={props.value}
        onChange={props.onChange}
        comboboxProps={{ withinPortal: false }}
      />
    ),
    filtering: props.value.length > 0,
  };
}
