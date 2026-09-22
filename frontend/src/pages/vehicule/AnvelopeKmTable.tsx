import type { AnvelopaKm } from "@canalcik/server/api-types";
import { Button, Group, Stack, Table, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { useUpdateAnvelope } from "../../api/vehicule.ts";
import { EditableDataInstalarii } from "../../components/EditableDataInstalarii.tsx";
import { showError, showSaved } from "../../lib/feedback.ts";

const formatKm = (n: number) => n.toLocaleString("ro-RO");

/** The vehicul's distance-based tires — one row per physical tire. */
export function AnvelopeKmTable({
  vehiculId,
  anvelope,
}: {
  vehiculId: number;
  anvelope: AnvelopaKm[];
}) {
  const [edits, setEdits] = useState<Record<number, string>>({});
  const update = useUpdateAnvelope();

  useEffect(() => setEdits({}), [anvelope]);

  if (anvelope.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Nicio anvelopă cu normă în km pentru acest vehicul.
      </Text>
    );
  }

  const dirty = Object.keys(edits).length > 0;

  const save = () => {
    update.mutate(
      {
        vehiculId,
        anvelopeKm: Object.entries(edits).map(([id, dataInstalarii]) => ({
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
      <Table.ScrollContainer minWidth={720}>
        <Table striped highlightOnHover verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Model</Table.Th>
              <Table.Th>Data instalării</Table.Th>
              <Table.Th>Km la instalare</Table.Th>
              <Table.Th>Normă (km)</Table.Th>
              <Table.Th>Km rămași</Table.Th>
              <Table.Th>Uzură</Table.Th>
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
                  <Table.Td>{formatKm(a.kmInstalare)}</Table.Td>
                  <Table.Td>{formatKm(a.normaKm)}</Table.Td>
                  <Table.Td c={a.kmRamasi !== null && a.kmRamasi < 0 ? "red" : undefined}>
                    {a.kmRamasi === null ? "—" : formatKm(a.kmRamasi)}
                  </Table.Td>
                  <Table.Td c={a.procenteUzura !== null && a.procenteUzura >= 100 ? "red" : undefined}>
                    {a.procenteUzura === null ? "—" : `${a.procenteUzura}%`}
                  </Table.Td>
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
