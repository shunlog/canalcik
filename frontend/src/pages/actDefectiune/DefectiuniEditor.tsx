import { ActionIcon, Button, Stack, Table, TextInput } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { newDefectiuneRow, type ActFormValues } from "./actForm.ts";

export function DefectiuniEditor({ form }: { form: UseFormReturnType<ActFormValues> }) {
  const rows = form.getValues().defectiuni;

  return (
    <Stack gap="xs">
      <Table.ScrollContainer minWidth={640}>
        <Table withTableBorder verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={50}>Nr.</Table.Th>
              <Table.Th>Defecțiunea</Table.Th>
              <Table.Th>Cauzele probabile ale defecțiunilor</Table.Th>
              <Table.Th w={50} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row, i) => (
              <Table.Tr key={row.key}>
                <Table.Td>{i + 1}</Table.Td>
                <Table.Td>
                  <TextInput
                    placeholder="Bara reactiva rupta"
                    {...form.getInputProps(`defectiuni.${i}.defectiunea`)}
                  />
                </Table.Td>
                <Table.Td>
                  <TextInput
                    placeholder="Uzura in exploatare"
                    {...form.getInputProps(`defectiuni.${i}.cauze`)}
                  />
                </Table.Td>
                <Table.Td>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    aria-label="Șterge linia"
                    onClick={() => form.removeListItem("defectiuni", i)}
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
        onClick={() => form.insertListItem("defectiuni", newDefectiuneRow())}
      >
        Adaugă linie
      </Button>
    </Stack>
  );
}
