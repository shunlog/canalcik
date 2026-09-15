import {
  ActionIcon,
  Autocomplete,
  Button,
  NumberInput,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconAlertTriangle, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMemo } from "react";
import { useMateriale } from "../../api/materiale.ts";
import { fuzzyOptionsFilter } from "../../lib/search.ts";
import { newMaterialRow, type BonFormValues } from "./bonForm.ts";

/**
 * The bon's material lines: quantities belong to the bon and are edited inline
 * here, while the denumire is a reference into MaterialeIntretinere. The field
 * is an Autocomplete rather than a Select because a bon must be writable for
 * something the catalogue has never seen — a free-typed name is accepted and
 * flagged, and the server creates the material when the bon is saved.
 */
export function MaterialeEditor({ form }: { form: UseFormReturnType<BonFormValues> }) {
  const rows = form.getValues().materiale;
  const materiale = useMateriale();

  const known = useMemo(
    () => new Set((materiale.data ?? []).map((m) => m.nume)),
    [materiale.data],
  );
  const options = useMemo(() => [...known], [known]);

  return (
    <Stack gap="xs">
      <Table.ScrollContainer minWidth={640} maw={760}>
        <Table withTableBorder verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Denumire</Table.Th>
              <Table.Th w={110}>UM</Table.Th>
              <Table.Th w={150}>Cantitate</Table.Th>
              <Table.Th w={50} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row, i) => {
              const nume = row.nume.trim();
              // Only warn once the catalogue has actually loaded, so a slow
              // request doesn't flag every existing material as new.
              const isNew = nume !== "" && !materiale.isPending && !known.has(nume);

              return (
                <Table.Tr key={row.key}>
                  <Table.Td>
                    <Autocomplete
                      placeholder="Căutați sau scrieți un material"
                      data={options}
                      limit={20}
                      // Fuzzy-filters the options against what is typed, so
                      // this is a search box; the typed text stays the value
                      // whether or not it matched anything.
                      filter={fuzzyOptionsFilter}
                      {...form.getInputProps(`materiale.${i}.nume`)}
                      rightSection={
                        isNew ? (
                          <Tooltip
                            multiline
                            w={220}
                            label="Material nou — va fi adăugat în lista de materiale la salvarea bonului"
                          >
                            <IconAlertTriangle
                              size={16}
                              color="var(--mantine-color-yellow-6)"
                              aria-label="Material inexistent"
                            />
                          </Tooltip>
                        ) : null
                      }
                      rightSectionPointerEvents="auto"
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput placeholder="L" {...form.getInputProps(`materiale.${i}.um`)} />
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
