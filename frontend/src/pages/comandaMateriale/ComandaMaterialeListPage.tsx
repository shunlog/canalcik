import { Anchor, Button, Group, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconPlus } from "@tabler/icons-react";
import type { ComandaMaterialeListItem } from "@canalcik/server/api-types";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router";
import { useComenziMateriale } from "../../api/comenziMateriale.ts";
import { ActDefectiuneLink } from "../../components/ActDefectiuneLink.tsx";
import { ComandaMaterialeLink } from "../../components/ComandaMaterialeLink.tsx";
import { multiSelectFilterColumn } from "../../components/DataTableFilters.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { VehiculShortLink } from "../../components/VehiculLink.tsx";
import { formatTimestamp } from "../../lib/forms.ts";
import { sortRecords, uniqueSortedOptions } from "../../lib/sort.ts";

export function ComandaMaterialeListPage() {
  const [vehiculFilter, setVehiculFilter] = useState<string[]>([]);
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<ComandaMaterialeListItem>>({
    columnAccessor: "data",
    direction: "desc",
  });

  const query = useComenziMateriale();

  const vehiculOptions = useMemo(
    () => uniqueSortedOptions((query.data ?? []).flatMap((c) => c.vehicule), (v) => v.nrInmatriculare),
    [query.data],
  );

  const clearFilters = () => {
    setVehiculFilter([]);
    setFrom(null);
    setTo(null);
  };

  const comenzi = useMemo(() => {
    let records = query.data ?? [];

    records = records.filter(
      (c) =>
        (vehiculFilter.length === 0 ||
          c.vehicule.some((v) => vehiculFilter.includes(v.nrInmatriculare))) &&
        (!from || c.data >= from) &&
        (!to || c.data <= to),
    );

    return sortRecords(records, sortStatus);
  }, [from, query.data, sortStatus, to, vehiculFilter]);

  return (
    <>
      <PageHeader
        title="Comenzi de materiale"
        subtitle={query.data ? `${comenzi.length} comenzi` : undefined}
        actions={
          <Button component={Link} to="/comanda-materiale/nou" leftSection={<IconPlus size={16} />}>
            Comandă nouă
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
            records={comenzi}
            idAccessor="id"
            striped
            highlightOnHover
            minHeight={comenzi.length === 0 ? 150 : undefined}
            noRecordsText="Nicio comandă găsită."
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            scrollAreaProps={{ type: "auto" }}
            columns={[
              {
                accessor: "data",
                title: "Data",
                width: 140,
                sortable: true,
                render: (c) => <ComandaMaterialeLink comanda={c} />,
              },
              {
                accessor: "vehicule",
                title: "Vehicule",
                render: (c) => (
                  <Text size="sm">
                    {c.vehicule.map((v, i) => (
                      <Fragment key={v.id}>
                        {i > 0 && ", "}
                        <VehiculShortLink vehicul={v} size="sm" />
                      </Fragment>
                    ))}
                  </Text>
                ),
                ...multiSelectFilterColumn({
                  label: "Vehicule",
                  data: vehiculOptions,
                  value: vehiculFilter,
                  onChange: setVehiculFilter,
                }),
              },
              {
                accessor: "acteDefectiune",
                title: "Acte Defecțiune",
                render: (c) => (
                  <Text size="sm">
                    {c.acteDefectiune.map((act, i) => (
                      <Fragment key={act.id}>
                        {i > 0 && ", "}
                        <ActDefectiuneLink act={act} size="sm" />
                      </Fragment>
                    ))}
                  </Text>
                ),
              },
              {
                accessor: "nrMateriale",
                title: "Materiale",
                width: 130,
                sortable: true,
                render: (c) => c.nrMateriale,
              },
              {
                accessor: "document",
                title: "Document",
                width: 180,
                render: (c) =>
                  c.document ? (
                    <Anchor href={c.document.driveUrl} target="_blank" rel="noreferrer">
                      {formatTimestamp(c.document.createdAt)}
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
