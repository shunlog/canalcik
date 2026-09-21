import type { AnvelopaLuni } from "@canalcik/server/api-types";
import { Button, Group, Stack, Table, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { useUpdateAnvelope } from "../../api/vehicule.ts";
import { EditableDataInstalarii } from "../../components/EditableDataInstalarii.tsx";
import { showError, showSaved } from "../../lib/feedback.ts";

/** The vehicul's month-based tires — one row per physical tire. */
export function AnvelopeLuniTable({
  vehiculId,
  anvelope,
}: {
  vehiculId: number;
  anvelope: AnvelopaLuni[];
}) {
  const [edits, setEdits] = useState<Record<number, string>>({});
  const update = useUpdateAnvelope(vehiculId);

  useEffect(() => setEdits({}), [anvelope]);

  if (anvelope.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Nicio anvelopă cu normă în luni pentru acest vehicul.
      </Text>
    );
  }

  const dirty = Object.keys(edits).length > 0;

  const save = () => {
    update.mutate(
      {
        anvelopeLuni: Object.entries(edits).map(([id, dataInstalarii]) => ({
          id: Number(id),
          dataInstalarii,
        })),
      },
      {
        onSuccess: () => showSaved("Anvelope salvate"),
        onError: (err) => showError(err, "Salvarea anvelopelor a eșuat"),
      },
    );
  };

  return (
    <Stack gap="xs">
      <Table.ScrollContainer minWidth={560}>
        <Table striped highlightOnHover verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Model</Table.Th>
              <Table.Th>Data instalării</Table.Th>
              <Table.Th>Normă (luni)</Table.Th>
              <Table.Th>Luni rămase</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {anvelope.map((a) => {
              const value = edits[a.id] ?? a.dataInstalarii;
              return (
                <Table.Tr key={a.id}>
                  <Table.Td>{a.model ?? "—"}</Table.Td>
                  <Table.Td>
                    <EditableDataInstalarii
                      value={value}
                      dirty={value !== a.dataInstalarii}
                      onChange={(v) => setEdits((e) => ({ ...e, [a.id]: v }))}
                    />
                  </Table.Td>
                  <Table.Td>{a.normaLuni}</Table.Td>
                  <Table.Td c={a.luniRamase < 0 ? "red" : undefined}>{a.luniRamase}</Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <Group>
        <Button onClick={save} loading={update.isPending} disabled={!dirty}>
          Salvează anvelope
        </Button>
      </Group>
    </Stack>
  );
}
