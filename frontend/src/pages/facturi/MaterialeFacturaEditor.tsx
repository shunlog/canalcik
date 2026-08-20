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
import { formatMoney } from "../../lib/forms.ts";
import {
  facturaTotal,
  lineValue,
  newFacturaRow,
  type FacturaFormValues,
} from "./facturaForm.ts";

/**
 * The factura's lines. Same shape as the bon's editor — the denumire is an
 * Autocomplete over MaterialeIntretinere that also accepts a free-typed name,
 * so a delivery of something new can be recorded and the material is created on
 * save — plus the two columns a delivery has and an issue slip doesn't: the
 * price it came at, and the resulting line value.
 */
export function MaterialeFacturaEditor({ form }: { form: UseFormReturnType<FacturaFormValues> }) {
  const rows = form.getValues().materiale;
  const materiale = useMateriale();

  const known = useMemo(
    () => new Set((materiale.data ?? []).map((m) => m.nume)),
    [materiale.data],
  );
  const options = useMemo(() => [...known], [known]);

  return (
    <Stack gap="xs">
      <Table.ScrollContainer minWidth={860}>
        <Table withTableBorder verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={170}>Cod nomenclator</Table.Th>
              <Table.Th>Denumire</Table.Th>
              <Table.Th w={100}>UM</Table.Th>
              <Table.Th w={140}>Cantitate</Table.Th>
              <Table.Th w={150}>Preț unitar (lei)</Table.Th>
              <Table.Th w={130}>Valoare (lei)</Table.Th>
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
                    <TextInput
                      placeholder="2111121795"
                      {...form.getInputProps(`materiale.${i}.nrCart`)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Autocomplete
                      placeholder="Căutați sau scrieți un material"
                      data={options}
                      limit={20}
                      {...form.getInputProps(`materiale.${i}.nume`)}
                      rightSection={
                        isNew ? (
                          <Tooltip
                            multiline
                            w={220}
                            label="Material nou — va fi adăugat în lista de materiale la salvarea facturii"
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
                      step={0.1}
                      decimalScale={3}
                      placeholder="12.5"
                      {...form.getInputProps(`materiale.${i}.cantitate`)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      min={0}
                      step={0.01}
                      decimalScale={2}
                      placeholder="33.25"
                      {...form.getInputProps(`materiale.${i}.pretUnitar`)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" ta="right">
                      {formatMoney(lineValue(row))}
                    </Text>
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
          {rows.length > 0 && (
            <Table.Tfoot>
              <Table.Tr>
                <Table.Th colSpan={5} ta="right">
                  Total
                </Table.Th>
                <Table.Th ta="right">{formatMoney(facturaTotal(rows))}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Tfoot>
          )}
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
        onClick={() => form.insertListItem("materiale", newFacturaRow())}
      >
        Adaugă linie
      </Button>
    </Stack>
  );
}
