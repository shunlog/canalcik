import { Button, Group } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconPlus } from "@tabler/icons-react";
import type { FacturaListItem } from "@canalcik/server/api-types";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useFacturi } from "../../api/facturi.ts";
import { FacturaLink } from "../../components/FacturaLink.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { formatMoney } from "../../lib/forms.ts";
import { sortRecords } from "../../lib/sort.ts";

export function FacturiListPage() {
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<FacturaListItem>>({
    columnAccessor: "data",
    direction: "desc",
  });

  const query = useFacturi();

  const clearFilters = () => {
    setFrom(null);
    setTo(null);
  };

  const facturi = useMemo(() => {
    const records = (query.data ?? []).filter((f) => (!from || f.data >= from) && (!to || f.data <= to));
    return sortRecords(records, sortStatus);
  }, [from, query.data, sortStatus, to]);

  return (
    <>
      <PageHeader
        title="Facturi de expediție"
        subtitle={query.data ? `${facturi.length} facturi` : undefined}
        actions={
          <Button component={Link} to="/facturi/nou" leftSection={<IconPlus size={16} />}>
            Factură nouă
          </Button>
        }
      />

      <Group align="flex-end" mb="md">
        <DateInput label="De la" valueFormat="DD.MM.YYYY" clearable w={150} value={from} onChange={setFrom} />
        <DateInput label="Până la" valueFormat="DD.MM.YYYY" clearable w={150} value={to} onChange={setTo} />
        <Button variant="subtle" onClick={clearFilters}>
          Resetează filtrele
        </Button>
      </Group>

      <QueryBoundary query={query}>
        {() =>
          <DataTable
            records={facturi}
            idAccessor="id"
            striped
            highlightOnHover
            minHeight={facturi.length === 0 ? 150 : undefined}
            noRecordsText="Nicio factură găsită."
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            scrollAreaProps={{ type: "auto" }}
            columns={[
              {
                accessor: "data",
                title: "Data",
                sortable: true,
                render: (f) => <FacturaLink factura={f} />,
              },
              {
                accessor: "nrLinii",
                title: "Materiale",
                width: 130,
                sortable: true,
                render: (f) => f.nrLinii,
              },
              {
                accessor: "total",
                title: "Valoare (lei)",
                width: 160,
                sortable: true,
                render: (f) => formatMoney(f.total),
              },
            ]}
          />
        }
      </QueryBoundary>
    </>
  );
}
