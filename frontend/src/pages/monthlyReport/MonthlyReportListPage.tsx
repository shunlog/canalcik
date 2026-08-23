import { Anchor, Badge, Button, Table, Text, Tooltip } from "@mantine/core";
import { Link } from "react-router";
import { useMonthlyReports, useGenerateMonthlyReport } from "../../api/monthlyReport.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { showError, showSaved } from "../../lib/feedback.ts";
import { formatIsoDate, formatMonth } from "../../lib/forms.ts";

export function MonthlyReportListPage() {
  const query = useMonthlyReports();
  const gen = useGenerateMonthlyReport();

  const generate = (month: string) => {
    gen.mutate(month, {
      onSuccess: () => showSaved("Fișă limită generată"),
      onError: (err) => showError(err, "Generarea a eșuat"),
    });
  };

  return (
    <>
      <PageHeader title="Fișa limită" />

      <QueryBoundary query={query}>
        {(monthlyReports) =>
          monthlyReports.length === 0 ? (
            <Text c="dimmed">Nicio lună găsită.</Text>
          ) : (
            <Table.ScrollContainer minWidth={620}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Luna</Table.Th>
                    <Table.Th w={90}>Bonuri</Table.Th>
                    <Table.Th w={130}>Factură</Table.Th>
                    <Table.Th w={170}>Document</Table.Th>
                    <Table.Th w={160} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {monthlyReports.map((m) => {
                    const reason =
                      m.nrBonuri === 0
                        ? "Luna nu are bonuri"
                        : !m.factura
                          ? "Luna nu are factură de expediție"
                          : null;
                    const isLoading = gen.isPending && gen.variables === m.month;

                    return (
                      <Table.Tr key={m.month}>
                        <Table.Td>{formatMonth(m.month)}</Table.Td>
                        <Table.Td>
                          <Badge variant="light">
                            {m.nrBonuri}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {m.factura ? (
                            <Anchor component={Link} to={`/facturi/${m.factura.id}`}>
                              {formatIsoDate(m.factura.data)}
                            </Anchor>
                          ) : (
                            formatIsoDate(null)
                          )}
                        </Table.Td>
                        <Table.Td>
                          {m.document ? (
                            <Anchor href={m.document.driveUrl} target="_blank" rel="noreferrer">
                              {new Date(m.document.createdAt).toLocaleString("ro-RO")}
                            </Anchor>
                          ) : (
                            formatIsoDate(null)
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Tooltip label={reason} disabled={!reason}>
                            <Button
                              size="xs"
                              loading={isLoading}
                              data-disabled={!!reason}
                              onClick={(e) => {
                                if (reason) {
                                  e.preventDefault();
                                  return;
                                }
                                generate(m.month);
                              }}
                            >
                              {m.document ? "Re-generează" : "Generează"}
                            </Button>
                          </Tooltip>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )
        }
      </QueryBoundary>
    </>
  );
}
