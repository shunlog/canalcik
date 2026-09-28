import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useMateriale } from "../../api/materiale.ts";
import { formatMoney } from "../../lib/forms.ts";
import { materialLabel } from "../../lib/labels.ts";
import { fuzzyOptionsFilter } from "../../lib/search.ts";
import {
  facturaTotal,
  lineValue,
  newFacturaRow,
  type FacturaFormValues,
} from "./facturaForm.ts";
import { NouMaterialModal } from "./NouMaterialModal.tsx";

/**
 * The factura's lines. Unlike the bon's editor, a line here always points at
 * a real MaterialeIntretinere row (matched by `materialId` in the database —
 * see dto.ts's facturaDetailSelect), so the row is filled in by picking one
 * from the catalogue, never by free-typing a name. A material the catalogue
 * doesn't carry yet is added on the spot through the "+" button, which
 * creates it right away (POST /materiale) rather than waiting for the
 * factura's own save.
 */
export function MaterialeFacturaEditor({ form }: { form: UseFormReturnType<FacturaFormValues> }) {
  const rows = form.getValues().materiale;
  const materiale = useMateriale();
  const [randNou, setRandNou] = useState<number | null>(null);

  const materialById = useMemo(
    () => new Map((materiale.data ?? []).map((m) => [m.id, m])),
    [materiale.data],
  );
  const optiuniMateriale = useMemo(
    () =>
      (materiale.data ?? []).map((m) => ({
        value: String(m.id),
        label: `${materialLabel(m)} · ${m.um}`,
      })),
    [materiale.data],
  );

  const alege = (i: number, id: string | null) => {
    form.setFieldValue(`materiale.${i}.materialId`, id ? Number(id) : null);
  };

  return (
    <Stack gap="xs">
      <Table.ScrollContainer minWidth={1150} maw={1250}>
        <Table withTableBorder verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th miw={390}>Material</Table.Th>
              <Table.Th w={140}>Cod nomenclator</Table.Th>
              <Table.Th w={80}>UM</Table.Th>
              <Table.Th w={140}>Cantitate</Table.Th>
              <Table.Th w={150}>Preț unitar (lei)</Table.Th>
              <Table.Th w={130}>Valoare (lei)</Table.Th>
              <Table.Th w={50} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row, i) => {
              const material = row.materialId === null ? undefined : materialById.get(row.materialId);

              return (
                <Table.Tr key={row.key}>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <Select
                        style={{ flex: 1 }}
                        placeholder="Caută un material"
                        searchable
                        clearable
                        filter={fuzzyOptionsFilter}
                        nothingFoundMessage="Niciun rezultat"
                        data={optiuniMateriale}
                        value={row.materialId === null ? null : String(row.materialId)}
                        onChange={(value) => alege(i, value)}
                        error={form.errors[`materiale.${i}.materialId`]}
                      />
                      <ActionIcon
                        variant="light"
                        aria-label="Adaugă material nou"
                        onClick={() => setRandNou(i)}
                      >
                        <IconPlus size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c={material ? undefined : "dimmed"}>
                      {material?.nrCart || "—"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c={material ? undefined : "dimmed"}>
                      {material?.um || "—"}
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
                    <NumberInput
                      min={0}
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

      <NouMaterialModal
        rand={randNou}
        onInchide={() => setRandNou(null)}
        onCreat={(material, i) => {
          form.setFieldValue(`materiale.${i}.materialId`, material.id);
        }}
      />
    </Stack>
  );
}
