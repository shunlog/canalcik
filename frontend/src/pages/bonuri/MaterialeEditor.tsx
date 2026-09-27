import {
  ActionIcon,
  Autocomplete,
  Button,
  NumberInput,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconAlertTriangle, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMemo } from "react";
import { useMateriale } from "../../api/materiale.ts";
import { fuzzyOptionsFilter } from "../../lib/search.ts";
import { materialPickerLabel, newMaterialRow, type BonFormValues } from "./bonForm.ts";

/**
 * The bon's material lines: quantities belong to the bon and are edited inline
 * here, while each line either links a real, invoiced material (picked from
 * the combobox by "<nrCart>, <nume>") or is a scratchpad note — free-typed
 * text that doesn't match anything yet. A note never creates a catalogue row;
 * the user comes back and picks the real material once the factura naming it
 * arrives.
 */
export function MaterialeEditor({ form }: { form: UseFormReturnType<BonFormValues> }) {
  const rows = form.getValues().materiale;
  const materiale = useMateriale();

  const items = materiale.data ?? [];
  const itemById = useMemo(() => new Map(items.map((m) => [m.id, m])), [items]);
  const itemByLabel = useMemo(
    () => new Map(items.map((m) => [materialPickerLabel(m), m])),
    [items],
  );
  const options = useMemo(() => [...itemByLabel.keys()], [itemByLabel]);

  const labelFor = (row: { materialId: number | null; nota: string }) => {
    if (row.materialId === null) return row.nota;
    const item = itemById.get(row.materialId);
    return item ? materialPickerLabel(item) : row.nota;
  };

  const onPick = (i: number, value: string) => {
    const matched = itemByLabel.get(value);
    form.setFieldValue(`materiale.${i}.nota`, value);
    form.setFieldValue(`materiale.${i}.materialId`, matched?.id ?? null);
  };

  return (
    <Stack gap="xs">
      <Table.ScrollContainer minWidth={820} maw={900}>
        <Table withTableBorder verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th miw={280}>Material</Table.Th>
              <Table.Th w={140}>Cod nomenclator</Table.Th>
              <Table.Th w={90}>UM</Table.Th>
              <Table.Th w={150}>Cantitate</Table.Th>
              <Table.Th w={50} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row, i) => {
              const value = labelFor(row);
              const isNota = row.materialId === null && value.trim() !== "";

              return (
                <Table.Tr key={row.key}>
                  <Table.Td>
                    <Autocomplete
                      placeholder="Căutați după cod sau denumire, sau scrieți o notă"
                      data={options}
                      limit={20}
                      // Fuzzy-filters the options against what is typed, so
                      // this is a search box; the typed text stays the value
                      // whether or not it matched anything.
                      filter={fuzzyOptionsFilter}
                      value={value}
                      onChange={(v) => onPick(i, v)}
                      styles={
                        isNota
                          ? { input: { borderColor: "var(--mantine-color-yellow-6)" } }
                          : undefined
                      }
                      rightSection={
                        isNota ? (
                          <Tooltip
                            multiline
                            w={240}
                            label="Notă provizorie: nu este legată de niciun material din catalog. Reveniți aici și alegeți materialul corect când factura sosește."
                          >
                            <IconAlertTriangle
                              size={16}
                              color="var(--mantine-color-yellow-6)"
                              aria-label="Notă provizorie"
                            />
                          </Tooltip>
                        ) : null
                      }
                      rightSectionPointerEvents="auto"
                      error={form.errors[`materiale.${i}.nota`]}
                    />
                  </Table.Td>
                  <Table.Td>
                    {/* Derived from the linked material — a note isn't linked
                        to one yet, so it has no code until it is. */}
                    <Text size="sm" c={row.materialId === null ? "dimmed" : undefined}>
                      {row.materialId === null ? "—" : (itemById.get(row.materialId)?.nrCart ?? "")}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {/* Derived from the linked material — a note isn't linked
                        to one yet, so it has no unit until it is. */}
                    <Text size="sm" c={row.materialId === null ? "dimmed" : undefined}>
                      {row.materialId === null ? "—" : (itemById.get(row.materialId)?.um ?? "")}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      min={0}
                      decimalScale={3}
                      placeholder="12.5"
                      {...form.getInputProps(`materiale.${i}.cantitate`)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      aria-label="Șterge linia"
                      onClick={() => form.removeListItem("materiale", i)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {rows.length === 0 && (
        <Text size="sm" c="dimmed">
          Niciun material. Adăugați cel puțin o linie.
        </Text>
      )}

      <Button
        variant="light"
        w="fit-content"
        leftSection={<IconPlus size={16} />}
        onClick={() => form.insertListItem("materiale", newMaterialRow())}
      >
        Adaugă linie
      </Button>
    </Stack>
  );
}

