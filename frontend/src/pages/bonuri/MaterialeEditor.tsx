import { ActionIcon, Button, NumberInput, Stack, Table, Text, TextInput } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { newMaterialRow, type BonFormValues } from "./bonForm.ts";

/**
 * The bon's material lines. They are owned by the bon rather than references to
 * a catalogue, so they are edited inline here and saved with the bon in one request.
 */
export function MaterialeEditor({ form }: { form: UseFormReturnType<BonFormValues> }) {
  const rows = form.getValues().materiale;

  return (
    <Stack gap="xs">
      <Table.ScrollContainer minWidth={640}>
        <Table withTableBorder verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={170}>Cod nomenclator</Table.Th>
              <Table.Th>Denumire</Table.Th>
              <Table.Th w={110}>UM</Table.Th>
              <Table.Th w={150}>Cantitate</Table.Th>
              <Table.Th w={50} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row, i) => (
              <Table.Tr key={row.key}>
                <Table.Td>
                  <TextInput placeholder="2111121795" {...form.getInputProps(`materiale.${i}.nrCart`)} />
                </Table.Td>
                <Table.Td>
                  <TextInput
                    placeholder="ULEI MOTOR 10W40"
                    {...form.getInputProps(`materiale.${i}.nume`)}
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
            ))}
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
