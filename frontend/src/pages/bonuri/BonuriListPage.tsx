import { Badge, Button, Group } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconPlus } from "@tabler/icons-react";
import type { BonListItem } from "@canalcik/server/api-types";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useBonuri } from "../../api/bonuri.ts";
import { BonLink } from "../../components/BonLink.tsx";
import { multiSelectFilterColumn } from "../../components/DataTableFilters.tsx";
import { HelpTooltip } from "../../components/HelpTooltip.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { SoferLink } from "../../components/SoferLink.tsx";
import { VehiculLink } from "../../components/VehiculLink.tsx";
import { sortRecords, uniqueSortedOptions } from "../../lib/sort.ts";

type BonRecord = BonListItem & { soferNume: string; vehiculNrInmatriculare: string };

export function BonuriListPage() {
  const [soferFilter, setSoferFilter] = useState<string[]>([]);
  const [vehiculFilter, setVehiculFilter] = useState<string[]>([]);
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<BonRecord>>({
    columnAccessor: "data",
    direction: "desc",
  });

  const query = useBonuri();

  const bonuriWithLabels = useMemo(
    () =>
      (query.data ?? []).map(
        (b): BonRecord => ({
          ...b,
          soferNume: b.sofer.nume,
          vehiculNrInmatriculare: b.vehicul.nrInmatriculare,
        }),
      ),
    [query.data],
  );

  const soferOptions = useMemo(
    () => uniqueSortedOptions(bonuriWithLabels, (b) => b.soferNume),
    [bonuriWithLabels],
  );
  const vehiculOptions = useMemo(
    () => uniqueSortedOptions(bonuriWithLabels, (b) => b.vehiculNrInmatriculare),
    [bonuriWithLabels],
  );

  const clearFilters = () => {
    setSoferFilter([]);
    setVehiculFilter([]);
    setFrom(null);
    setTo(null);
  };

  const bonuri = useMemo(() => {
    let records = bonuriWithLabels;

    records = records.filter(
      (b) =>
        (soferFilter.length === 0 || soferFilter.includes(b.soferNume)) &&
        (vehiculFilter.length === 0 || vehiculFilter.includes(b.vehiculNrInmatriculare)) &&
        (!from || b.data >= from) &&
        (!to || b.data <= to),
    );

    return sortRecords(records, sortStatus);
  }, [bonuriWithLabels, from, soferFilter, sortStatus, to, vehiculFilter]);

  return (
    <>
      <PageHeader
        title="Bonuri de eliberare"
        subtitle={query.data ? `${bonuri.length} bonuri` : undefined}
        actions={
          <Button component={Link} to="/bonuri/nou" leftSection={<IconPlus size={16} />}>
            Bon nou
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
            records={bonuri}
            idAccessor="id"
            striped
            highlightOnHover
            minHeight={bonuri.length === 0 ? 150 : undefined}
            noRecordsText="Niciun bon găsit."
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            scrollAreaProps={{ type: "auto" }}
            columns={[
              {
                accessor: "data",
                title: "Data",
                sortable: true,
                render: (b) => <BonLink bon={b} />,
              },
              {
                accessor: "soferNume",
                title: "Șofer",
                sortable: true,
                render: (b) => <SoferLink sofer={b.sofer} />,
                ...multiSelectFilterColumn({
                  label: "Șoferi",
                  data: soferOptions,
                  value: soferFilter,
                  onChange: setSoferFilter,
                }),
              },
              {
                accessor: "vehiculNrInmatriculare",
                title: "Vehicul",
                sortable: true,
                render: (b) => <VehiculLink vehicul={b.vehicul} />,
                ...multiSelectFilterColumn({
                  label: "Vehicule",
                  data: vehiculOptions,
                  value: vehiculFilter,
                  onChange: setVehiculFilter,
                }),
              },
              {
                accessor: "nrLinii",
                title: "Materiale",
                sortable: true,
                render: (b) => b.nrLinii,
              },
              {
                accessor: "nrLiniiFaraLegatura",
                title: (
                  <HelpTooltip label="Numarul de randuri care nu sunt legate de materiale, ci doar notate">
                    Fara legatura
                  </HelpTooltip>
                ),
                sortable: true,
                render: (b) =>
                  b.nrLiniiFaraLegatura === 0 ? (
                    <Badge color="green" variant="light">
                      0<span aria-label="Toate liniile sunt legate de materiale"> ✓</span>
                    </Badge>
                  ) : (
                    <Badge color="yellow" variant="light">
                      {b.nrLiniiFaraLegatura}
                      <span aria-label="Randuri fara legatura la materiale"> ⚠️</span>
                    </Badge>
                  ),
              },
            ]}
          />
        }
      </QueryBoundary>
    </>
  );
}
