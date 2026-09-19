import { Anchor, Badge, Button, Group } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import type { SoferListItem } from "@canalcik/server/api-types";
import { EIP_EQUIPMENT_FIELDS, eipExpiryDate } from "@canalcik/server/derived";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useSoferi } from "../../api/soferi.ts";
import { multiSelectFilterColumn, textFilterColumn } from "../../components/DataTableFilters.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { todayLocalIso } from "../../lib/forms.ts";
import { fuzzySearch } from "../../lib/search.ts";
import { sortRecords, uniqueSortedOptions } from "../../lib/sort.ts";

type SoferRecord = SoferListItem & { expiredEquipment: number };

export function SoferiListPage() {
  const [pontajFilter, setPontajFilter] = useState("");
  const [numeFilter, setNumeFilter] = useState("");
  const [functieFilter, setFunctieFilter] = useState<string[]>([]);
  const [sectorFilter, setSectorFilter] = useState<string[]>([]);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<SoferRecord>>({
    columnAccessor: "cod",
    direction: "asc",
  });
  const query = useSoferi();
  const today = todayLocalIso();
  const functieOptions = useMemo(
    () => uniqueSortedOptions(query.data ?? [], (s) => s.functie),
    [query.data],
  );
  const sectorOptions = useMemo(
    () => uniqueSortedOptions(query.data ?? [], (s) => s.sector),
    [query.data],
  );
  const soferiWithExpiry = useMemo(
    () =>
      (query.data ?? []).map(
        (s): SoferRecord => ({
          ...s,
          expiredEquipment: EIP_EQUIPMENT_FIELDS.filter((field) => {
            const expiryDate = eipExpiryDate(s[field], field);
            return expiryDate !== null && expiryDate < today;
          }).length,
        }),
      ),
    [query.data, today],
  );
  const soferi = useMemo(() => {
    let records = soferiWithExpiry;

    if (pontajFilter.trim()) {
      records = fuzzySearch(records, pontajFilter, [(s) => s.cod]);
    }

    if (numeFilter.trim()) {
      records = fuzzySearch(records, numeFilter, [(s) => s.nume]);
    }

    records = records.filter(
      (s) =>
        (functieFilter.length === 0 || (s.functie !== null && functieFilter.includes(s.functie))) &&
        (sectorFilter.length === 0 || (s.sector !== null && sectorFilter.includes(s.sector))),
    );

    return sortRecords(records, sortStatus);
  }, [functieFilter, numeFilter, pontajFilter, sectorFilter, sortStatus, soferiWithExpiry]);

  return (
    <>
      <PageHeader
        title="Șoferi"
        subtitle={query.data ? `${soferi.length} înregistrări` : undefined}
        actions={
          <Button component={Link} to="/soferi/nou" leftSection={<IconPlus size={16} />}>
            Șofer nou
          </Button>
        }
      />

      <QueryBoundary query={query}>
        {() =>
          <DataTable
            records={soferi}
            idAccessor="id"
            striped
            highlightOnHover
            minHeight={soferi.length === 0 ? 150 : undefined}
            noRecordsText="Niciun șofer găsit."
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            scrollAreaProps={{ type: "auto" }}
            columns={[
              {
                accessor: "cod",
                title: "Pontaj",
                sortable: true,
                ...textFilterColumn({
                  label: "Caută după pontaj",
                  placeholder: "Nr. pontaj",
                  value: pontajFilter,
                  onChange: setPontajFilter,
                }),
              },
              {
                accessor: "nume",
                title: "Nume",
                sortable: true,
                render: (s) => (
                  <Anchor component={Link} to={`/soferi/${s.id}`}>
                    {s.nume}
                  </Anchor>
                ),
                ...textFilterColumn({
                  label: "Caută după nume",
                  placeholder: "Nume",
                  value: numeFilter,
                  onChange: setNumeFilter,
                }),
              },
              {
                accessor: "functie",
                title: "Funcție",
                sortable: true,
                render: (s) => s.functie ?? "—",
                ...multiSelectFilterColumn({
                  label: "Funcții",
                  data: functieOptions,
                  value: functieFilter,
                  onChange: setFunctieFilter,
                }),
              },
              {
                accessor: "sector",
                title: "Sector",
                sortable: true,
                render: (s) => s.sector ?? "—",
                ...multiSelectFilterColumn({
                  label: "Sectoare",
                  data: sectorOptions,
                  value: sectorFilter,
                  onChange: setSectorFilter,
                }),
              },
              { accessor: "telefon", title: "Telefon", sortable: true, render: (s) => s.telefon ?? "—" },
              {
                accessor: "expiredEquipment",
                title: "Echipament expirat",
                width: 130,
                sortable: true,
                render: (s) =>
                  s.expiredEquipment === 0 ? (
                    <Badge color="gray" variant="light">
                      0
                    </Badge>
                  ) : (
                    <Group gap={4} wrap="nowrap">
                      <span aria-label="Echipament expirat">⚠️</span>
                      <Badge color="yellow" variant="light">
                        {s.expiredEquipment}
                      </Badge>
                    </Group>
                  ),
              },
              {
                accessor: "nrVehicule",
                title: "Vehicule",
                sortable: true,
                render: (s) => <Badge variant="light">{s.nrVehicule}</Badge>,
              },
              {
                accessor: "nrBonuri",
                title: "Bonuri",
                sortable: true,
                render: (s) => <Badge variant="light">{s.nrBonuri}</Badge>,
              },
            ]}
          />
        }
      </QueryBoundary>
    </>
  );
}
