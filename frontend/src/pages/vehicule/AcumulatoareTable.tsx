import type { Acumulator } from "@canalcik/server/api-types";
import { acumulatorExpiryDate } from "@canalcik/server/derived";
import { Button, Group, Stack, Table, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { useUpdateAcumulatoare } from "../../api/vehicule.ts";
import { EditableDataInstalarii } from "../../components/EditableDataInstalarii.tsx";
import { showError, showSaved } from "../../lib/feedback.ts";
import { formatIsoDate, todayLocalIso } from "../../lib/forms.ts";

/** The vehicul's accumulators — one row per physical accumulator. */
export function AcumulatoareTable({
  vehiculId,
  acumulatoare,
}: {
  vehiculId: number;
  acumulatoare: Acumulator[];
}) {
  const [edits, setEdits] = useState<Record<number, string>>({});
  const update = useUpdateAcumulatoare();

  useEffect(() => setEdits({}), [acumulatoare]);

  const today = todayLocalIso();

  if (acumulatoare.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Niciun acumulator pentru acest vehicul.
      </Text>
    );
  }

  const dirty = Object.keys(edits).length > 0;

  const save = () => {
    update.mutate(
      {
        vehiculId,
        acumulatoare: Object.entries(edits).map(([id, dataInstalarii]) => ({
          id: Number(id),
          dataInstalarii,
        })),
      },
      {
        onSuccess: () => showSaved("Acumulatoare salvate"),
        onError: (err) => showError(err, "Salvarea acumulatoarelor a eșuat"),
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
              <Table.Th>Data expirării</Table.Th>
              <Table.Th>Normă (luni)</Table.Th>
              <Table.Th>Luni rămase</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {acumulatoare.map((a) => {
              const value = edits[a.id] ?? a.dataInstalarii;
              const dataExpirarii = acumulatorExpiryDate(value, a.normaLuni);
              const expired = dataExpirarii <= today;
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
                  <Table.Td>
                    {expired ? (
                      <Text c="red" span>
                        ⚠️ {formatIsoDate(dataExpirarii)}
                      </Text>
                    ) : (
                      formatIsoDate(dataExpirarii)
                    )}
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
          Salvează acumulatoare
        </Button>
      </Group>
    </Stack>
  );
}
