import { Anchor, Button, Group, Paper, Table, Text, Title } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useSyncTemplates, useTemplates } from "../api/templates.ts";
import { PageHeader } from "../components/PageHeader.tsx";
import { QueryBoundary } from "../components/QueryBoundary.tsx";
import { showError, showSaved } from "../lib/feedback.ts";

export function SetariPage() {
  const query = useTemplates();
  const sync = useSyncTemplates();

  const sincronizeaza = () => {
    sync.mutate(undefined, {
      onSuccess: () => showSaved("Șabloane sincronizate"),
      onError: (err) => showError(err, "Sincronizarea a eșuat"),
    });
  };

  return (
    <>
      <PageHeader title="Setări" />

      <Paper withBorder p="md">
        <Group justify="space-between" align="center" mb="md" wrap="nowrap">
          <Title order={3}>Șabloane</Title>
          <Button
            leftSection={<IconRefresh size={16} />}
            loading={sync.isPending}
            onClick={sincronizeaza}
          >
            Sincronizează
          </Button>
        </Group>

        <Text size="sm" c="dimmed" mb="md">
          Documentele generate pornesc de la copiile locale ale acestor fișiere. Sincronizarea le
          descarcă din nou din Drive.
        </Text>

        <QueryBoundary query={query}>
          {(templates) => (
            <Table.ScrollContainer minWidth={520}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Fișier în Drive</Table.Th>
                    <Table.Th w={220}>Ultima descărcare</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {templates.map((t) => (
                    <Table.Tr key={t.key}>
                      <Table.Td>
                        {t.driveUrl ? (
                          <Anchor href={t.driveUrl} target="_blank" rel="noreferrer">
                            {t.driveName}
                          </Anchor>
                        ) : (
                          <Text c="dimmed">{t.driveName} (link neconfigurat)</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {t.fetchedAt ? (
                          new Date(t.fetchedAt).toLocaleString("ro-RO")
                        ) : (
                          <Text c="dimmed">nedescărcat</Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </QueryBoundary>
      </Paper>
    </>
  );
}
