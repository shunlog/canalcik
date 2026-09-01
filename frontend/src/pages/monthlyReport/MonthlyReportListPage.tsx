import { Anchor, Badge, Table, Text } from "@mantine/core";
import { Link } from "react-router";
import { useMonthlyReports, useGenerateMonthlyReport } from "../../api/monthlyReport.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { showError, showSaved } from "../../lib/feedback.ts";
import { formatIsoDate, formatMonth, formatTimestamp } from "../../lib/forms.ts";
import { GenerateMonthlyReportButton } from "./GenerateMonthlyReportButton.tsx";

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
      <PageHeader title="Fișe limită" />

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
                    const isLoading = gen.isPending && gen.variables === m.month;

                    return (
                      <Table.Tr key={m.month}>
                        <Table.Td>
                          <Anchor component={Link} to={`/monthly-report/${m.month}`}>
                            {formatMonth(m.month)}
                          </Anchor>
                        </Table.Td>
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
                              {formatTimestamp(m.document.createdAt)}
                            </Anchor>
                          ) : (
                            formatTimestamp(null)
                          )}
                        </Table.Td>
                        <Table.Td>
                          <GenerateMonthlyReportButton
                            report={m}
                            loading={isLoading}
                            onGenerate={() => generate(m.month)}
                          />
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
