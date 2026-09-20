import { Anchor, Button, Group } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconPlus } from "@tabler/icons-react";
import type { ActDefectiuneListItem } from "@canalcik/server/api-types";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useActeDefectiune } from "../../api/acteDefectiune.ts";
import { multiSelectFilterColumn } from "../../components/DataTableFilters.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { formatIsoDate, formatTimestamp } from "../../lib/forms.ts";
import { soferLabel, vehiculLabel } from "../../lib/labels.ts";
import { sortRecords, uniqueSortedOptions } from "../../lib/sort.ts";

type ActRecord = ActDefectiuneListItem & { vehiculDisplay: string; soferDisplay: string };

export function ActDefectiuneListPage() {
  const [vehiculFilter, setVehiculFilter] = useState<string[]>([]);
  const [soferFilter, setSoferFilter] = useState<string[]>([]);
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<ActRecord>>({
    columnAccessor: "data",
    direction: "desc",
  });

  const query = useActeDefectiune();

  const acteWithLabels = useMemo(
    () =>
      (query.data ?? []).map(
        (a): ActRecord => ({
          ...a,
          vehiculDisplay: vehiculLabel(a.vehicul),
          soferDisplay: soferLabel(a.sofer),
        }),
      ),
    [query.data],
  );

  const vehiculOptions = useMemo(
    () => uniqueSortedOptions(acteWithLabels, (a) => a.vehiculDisplay),
    [acteWithLabels],
  );
  const soferOptions = useMemo(
    () => uniqueSortedOptions(acteWithLabels, (a) => a.soferDisplay),
    [acteWithLabels],
  );

  const clearFilters = () => {
    setVehiculFilter([]);
    setSoferFilter([]);
    setFrom(null);
    setTo(null);
  };

  const acte = useMemo(() => {
    let records = acteWithLabels;

    records = records.filter(
      (a) =>
        (vehiculFilter.length === 0 || vehiculFilter.includes(a.vehiculDisplay)) &&
        (soferFilter.length === 0 || soferFilter.includes(a.soferDisplay)) &&
        (!from || a.data >= from) &&
        (!to || a.data <= to),
    );

    return sortRecords(records, sortStatus);
  }, [acteWithLabels, from, soferFilter, sortStatus, to, vehiculFilter]);

  return (
    <>
      <PageHeader
        title="Acte de defecțiune"
        subtitle={query.data ? `${acte.length} acte` : undefined}
        actions={
          <Button component={Link} to="/act-defectiune/nou" leftSection={<IconPlus size={16} />}>
            Act nou
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
            records={acte}
            idAccessor="id"
            striped
            highlightOnHover
            minHeight={acte.length === 0 ? 150 : undefined}
            noRecordsText="Niciun act găsit."
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            scrollAreaProps={{ type: "auto" }}
            columns={[
              {
                accessor: "data",
                title: "Data",
                width: 140,
                sortable: true,
                render: (a) => (
                  <Anchor component={Link} to={`/act-defectiune/${a.id}`}>
                    {formatIsoDate(a.data)}
                  </Anchor>
                ),
              },
              {
                accessor: "vehiculDisplay",
                title: "Vehicul",
                sortable: true,
                render: (a) => (
                  <Anchor component={Link} to={`/vehicule/${a.vehicul.id}`}>
                    {a.vehiculDisplay}
                  </Anchor>
                ),
                ...multiSelectFilterColumn({
                  label: "Vehicule",
                  data: vehiculOptions,
                  value: vehiculFilter,
                  onChange: setVehiculFilter,
                }),
              },
              {
                accessor: "soferDisplay",
                title: "Șofer",
                sortable: true,
                render: (a) => (
                  <Anchor component={Link} to={`/soferi/${a.sofer.id}`}>
                    {a.soferDisplay}
                  </Anchor>
                ),
                ...multiSelectFilterColumn({
                  label: "Șoferi",
                  data: soferOptions,
                  value: soferFilter,
                  onChange: setSoferFilter,
                }),
              },
              {
                accessor: "nrDefectiuni",
                title: "Defecțiuni",
                width: 130,
                sortable: true,
                render: (a) => a.nrDefectiuni,
              },
              {
                accessor: "nrPieseSchimb",
                title: "Piese de schimb",
                width: 150,
                sortable: true,
                render: (a) => a.nrPieseSchimb,
              },
              {
                accessor: "document",
                title: "Document",
                width: 180,
                render: (a) =>
                  a.document ? (
                    <Anchor href={a.document.driveUrl} target="_blank" rel="noreferrer">
                      {formatTimestamp(a.document.createdAt)}
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
