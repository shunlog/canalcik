import { Anchor } from "@mantine/core";
import type { MonthlyReport } from "@canalcik/server/api-types";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import { useMemo, useState } from "react";
import { useMonthlyReports, useGenerateMonthlyReport } from "../../api/monthlyReport.ts";
import { FacturaLink } from "../../components/FacturaLink.tsx";
import { MonthlyReportLink } from "../../components/MonthlyReportLink.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { showError, showSaved } from "../../lib/feedback.ts";
import { formatIsoDate, formatTimestamp } from "../../lib/forms.ts";
import { sortRecords } from "../../lib/sort.ts";
import { GenerateMonthlyReportButton } from "./GenerateMonthlyReportButton.tsx";

export function MonthlyReportListPage() {
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<MonthlyReport>>({
    columnAccessor: "month",
    direction: "desc",
  });
  const query = useMonthlyReports();
  const gen = useGenerateMonthlyReport();

  const monthlyReports = useMemo(
    () => sortRecords([...(query.data ?? [])], sortStatus),
    [query.data, sortStatus],
  );

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
        {() =>
          <DataTable
            records={monthlyReports}
            idAccessor="month"
            striped
            highlightOnHover
            minHeight={monthlyReports.length === 0 ? 150 : undefined}
            noRecordsText="Nicio lună găsită."
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            scrollAreaProps={{ type: "auto" }}
            columns={[
              {
                accessor: "month",
                title: "Luna",
                sortable: true,
                render: (m) => <MonthlyReportLink report={m} />,
              },
              {
                accessor: "nrBonuri",
                title: "Bonuri",
                width: 90,
                sortable: true,
                render: (m) => m.nrBonuri,
              },
              {
                accessor: "factura",
                title: "Factură",
                width: 130,
                render: (m) => (m.factura ? <FacturaLink factura={m.factura} /> : formatIsoDate(null)),
              },
              {
                accessor: "document",
                title: "Document",
                width: 170,
                render: (m) =>
                  m.document ? (
                    <Anchor href={m.document.driveUrl} target="_blank" rel="noreferrer">
                      {formatTimestamp(m.document.createdAt)}
                    </Anchor>
                  ) : (
                    formatTimestamp(null)
                  ),
              },
              {
                accessor: "actions",
                title: "",
                width: 160,
                render: (m) => {
                  const isLoading = gen.isPending && gen.variables === m.month;
                  return (
                    <GenerateMonthlyReportButton
                      report={m}
                      loading={isLoading}
                      onGenerate={() => generate(m.month)}
                    />
                  );
                },
              },
            ]}
          />
        }
      </QueryBoundary>
    </>
  );
}
