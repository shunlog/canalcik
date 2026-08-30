import {
  ActionIcon,
  Button,
  Fieldset,
  Group,
  NumberInput,
  Stack,
  Table,
  TextInput,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconPlus, IconTrash, IconWand } from "@tabler/icons-react";
import type { ProdusIndexat } from "../../lib/produse.tsx";
import { lucrareDinPiesa, newLucrareRow, type ActFormValues } from "./actForm.ts";

export function LucrariEditor({
  form,
  produse,
}: {
  form: UseFormReturnType<ActFormValues>;
  produse: ProdusIndexat[];
}) {
  const values = form.getValues();
  const rows = values.lucrari;
  // Only rows naming a product the catalogue still has can seed a lucrare —
  // the name and the UM come from it, not from the row.
  const dinPiese = values.pieseSchimb.flatMap((p) => {
    const produs = produse.find((x) => x.cod === p.nrNomenclator);
    return produs ? [{ piesa: p, produs }] : [];
  });

  return (
    <Fieldset legend="Lista lucrărilor de reparații necesare">
      <Stack gap="xs">
        <Table.ScrollContainer minWidth={860}>
          <Table withTableBorder verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={50}>Nr.</Table.Th>
                <Table.Th miw={280}>Denumirea lucrărilor</Table.Th>
                <Table.Th w={100}>UM</Table.Th>
                <Table.Th w={120}>Cantitate</Table.Th>
                <Table.Th w={180}>Cauza (rând tab. 1)</Table.Th>
                <Table.Th w={50} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row, i) => (
                <Table.Tr key={row.key}>
                  <Table.Td>{i + 1}</Table.Td>
                  <Table.Td>
                    <TextInput
                      placeholder="de inlocuit Bara reactiva K-3 MAZ 5337"
                      {...form.getInputProps(`lucrari.${i}.denumire`)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput placeholder="buc" {...form.getInputProps(`lucrari.${i}.um`)} />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      min={0}
                      step={1}
                      decimalScale={3}
                      placeholder="2"
                      {...form.getInputProps(`lucrari.${i}.cantitate`)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      min={1}
                      step={1}
                      allowDecimal={false}
                      placeholder="1"
                      {...form.getInputProps(`lucrari.${i}.cauza`)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      aria-label="Șterge linia"
                      onClick={() => form.removeListItem("lucrari", i)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <Group gap="xs">
          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={() => form.insertListItem("lucrari", newLucrareRow())}
          >
            Adaugă linie
          </Button>
          <Button
            variant="subtle"
            disabled={dinPiese.length === 0}
            leftSection={<IconWand size={16} />}
            onClick={() => {
              for (const { piesa, produs } of dinPiese) {
              form.insertListItem("lucrari", lucrareDinPiesa(piesa, produs));
            }
            }}
          >
            Adaugă din piesele de schimb
          </Button>
        </Group>
      </Stack>
    </Fieldset>
  );
}
