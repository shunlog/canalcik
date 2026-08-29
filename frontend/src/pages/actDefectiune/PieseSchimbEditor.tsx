import { ActionIcon, Button, NumberInput, Select, Stack, Table } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { ProdusIndexat } from "../../lib/produse.tsx";
import { AutoFillTextInput } from "./AutoFillTextInput.tsx";
import { ProdusCombobox } from "./ProdusCombobox.tsx";
import { newPiesaRow, produsAuto, statusCamp, type ActFormValues } from "./actForm.ts";

export function PieseSchimbEditor({
  form,
  produse,
}: {
  form: UseFormReturnType<ActFormValues>;
  produse: ProdusIndexat[];
}) {
  const rows = form.getValues().pieseSchimb;

  return (
    <Stack gap="xs">
      <Table.ScrollContainer minWidth={1100}>
        <Table withTableBorder verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={50}>Nr.</Table.Th>
              <Table.Th w={140}>Nr. nomenclator</Table.Th>
              <Table.Th miw={280}>Piesa de schimb</Table.Th>
              <Table.Th w={100}>UM</Table.Th>
              <Table.Th w={120}>Cantitate</Table.Th>
              <Table.Th w={180}>Cauza (rând tab. 1)</Table.Th>
              <Table.Th w={130}>Necesită înlocuire</Table.Th>
              <Table.Th w={50} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row, i) => (
              <Table.Tr key={row.key}>
                <Table.Td>{i + 1}</Table.Td>
                <Table.Td>
                  <AutoFillTextInput
                    placeholder="120673"
                    status={statusCamp(row.auto?.nrNomenclator, row.nrNomenclator)}
                    {...form.getInputProps(`pieseSchimb.${i}.nrNomenclator`)}
                  />
                </Table.Td>
                <Table.Td>
                  <ProdusCombobox
                    produse={produse}
                    value={row.piesaSchimb}
                    codSelectat={row.auto?.nrNomenclator ?? null}
                    status={statusCamp(row.auto?.piesaSchimb, row.piesaSchimb)}
                    error={form.errors[`pieseSchimb.${i}.piesaSchimb`]}
                    onChange={(nume) => form.setFieldValue(`pieseSchimb.${i}.piesaSchimb`, nume)}
                    onSelect={(p) => {
                      const auto = produsAuto(p);
                      form.setFieldValue(`pieseSchimb.${i}.auto`, auto);
                      form.setFieldValue(`pieseSchimb.${i}.nrNomenclator`, auto.nrNomenclator);
                      form.setFieldValue(`pieseSchimb.${i}.piesaSchimb`, auto.piesaSchimb);
                      form.setFieldValue(`pieseSchimb.${i}.um`, auto.um);
                    }}
                  />
                </Table.Td>
                <Table.Td>
                  <AutoFillTextInput
                    placeholder="buc"
                    status={statusCamp(row.auto?.um, row.um)}
                    {...form.getInputProps(`pieseSchimb.${i}.um`)}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    min={0}
                    step={1}
                    decimalScale={3}
                    placeholder="2"
                    {...form.getInputProps(`pieseSchimb.${i}.cantitate`)}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    min={1}
                    step={1}
                    allowDecimal={false}
                    placeholder="1"
                    {...form.getInputProps(`pieseSchimb.${i}.cauza`)}
                  />
                </Table.Td>
                <Table.Td>
                  <Select
                    data={["da", "nu"]}
                    allowDeselect={false}
                    value={row.necesitaInlocuire}
                    onChange={(v) =>
                      form.setFieldValue(
                        `pieseSchimb.${i}.necesitaInlocuire`,
                        v === "nu" ? "nu" : "da",
                      )
                    }
                  />
                </Table.Td>
                <Table.Td>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    aria-label="Șterge linia"
                    onClick={() => form.removeListItem("pieseSchimb", i)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <Button
        variant="light"
        w="fit-content"
        leftSection={<IconPlus size={16} />}
        onClick={() => form.insertListItem("pieseSchimb", newPiesaRow())}
      >
        Adaugă linie
      </Button>
    </Stack>
  );
}
