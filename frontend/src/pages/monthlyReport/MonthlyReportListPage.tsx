import { Anchor } from "@mantine/core";
import type { MonthlyReport } from "@canalcik/server/api-types";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import { useMemo, useState } from "react";
import { useMonthlyReports } from "../../api/monthlyReport.ts";
import { MonthlyReportLink } from "../../components/MonthlyReportLink.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { RefLinkList } from "../../components/RefLinkList.tsx";
import { formatTimestamp } from "../../lib/forms.ts";
import { facturaLabel } from "../../lib/labels.ts";
import { sortRecords } from "../../lib/sort.ts";

export function MonthlyReportListPage() {
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<MonthlyReport>>({
    columnAccessor: "month",
    direction: "desc",
  });
  const query = useMonthlyReports();

  const monthlyReports = useMemo(
    () => sortRecords([...(query.data ?? [])], sortStatus),
    [query.data, sortStatus],
  );

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
                width: 170,
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
                accessor: "nrFacturi",
                title: "Facturi",
                width: 90,
                sortable: true,
                render: (m) => m.nrFacturi,
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
            ]}
          />
        }
      </QueryBoundary>
    </>
  );
}
