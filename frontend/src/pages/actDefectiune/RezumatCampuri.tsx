import { Paper, Table, Text } from "@mantine/core";

/**
 * What the act will print for the record picked above it. Read-only and never
 * stored: these are the fleet and staff records, so a wrong value is fixed in
 * Vehicule or Șoferi, not here.
 */
export function RezumatCampuri({
  campuri,
}: {
  campuri: { label: string; value: string }[];
}) {
  return (
    <Paper withBorder radius="sm" mt="xs" maw={480} style={{ overflow: "hidden" }}>
      <Table variant="vertical" layout="fixed" withRowBorders={false}>
        <Table.Tbody>
          {campuri.map((c) => (
            <Table.Tr key={c.label}>
              <Table.Th w={210} fz="sm" fw={400} c="dimmed">
                {c.label}
              </Table.Th>
              <Table.Td fz="sm">
                {c.value.trim() || (
                  <Text span c="dimmed" inherit>
                    —
                  </Text>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
