import { Button, Group, MultiSelect, Stack } from "@mantine/core";
import { useEffect, useState } from "react";

/**
 * Edits one side of the Sofer <-> Vehicul many-to-many. The server route
 * replaces the whole set, so an accidentally emptied MultiSelect would wipe
 * every link: the save is therefore gated on the selection actually being
 * dirty, and the current links stay visible above it.
 */
export function LinkEditor({
  label,
  placeholder,
  options,
  value,
  onSave,
  saving,
  loading,
}: {
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  value: number[];
  onSave: (ids: number[]) => void;
  saving: boolean;
  loading?: boolean;
}) {
  const [selected, setSelected] = useState(() => value.map(String));

  // Re-sync whenever the server's version changes (after a save, or a refetch
  // triggered by an edit made on the other entity's page).
  const canonical = value.map(String).join(",");
  useEffect(() => setSelected(canonical === "" ? [] : canonical.split(",")), [canonical]);

  const dirty = [...selected].sort().join(",") !== [...canonical.split(",")].sort().join(",");

  return (
    <Stack gap="xs">
      <MultiSelect
        label={label}
        placeholder={placeholder}
        data={options}
        value={selected}
        onChange={setSelected}
        disabled={loading}
        searchable
        clearable
        hidePickedOptions
        nothingFoundMessage="Niciun rezultat"
      />
      <Group gap="xs">
        <Button size="xs" disabled={!dirty} loading={saving} onClick={() => onSave(selected.map(Number))}>
          Salvează legăturile
        </Button>
        <Button
          size="xs"
          variant="subtle"
          disabled={!dirty || saving}
          onClick={() => setSelected(canonical === "" ? [] : canonical.split(","))}
        >
          Anulează
        </Button>
      </Group>
    </Stack>
  );
}
