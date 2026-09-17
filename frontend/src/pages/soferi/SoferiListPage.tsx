import { Anchor, Badge, Button, Group, MultiSelect, TextInput } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import type { SoferListItem } from "@canalcik/server/api-types";
import { eipExpiryDate, type EipEquipmentField } from "@canalcik/server/derived";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useSoferi } from "../../api/soferi.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { todayLocalIso } from "../../lib/forms.ts";
import { fuzzyOptionsFilter, fuzzySearch } from "../../lib/search.ts";

const EIP_FIELDS: EipEquipmentField[] = [
  "eipScurta",
  "eipIncaltaminte",
  "eipCostum",
  "eipPantaloni",
  "eipVestaAvertizare",
];

type SoferRecord = SoferListItem & { expiredEquipment: number };

function sortValue(sofer: SoferRecord, accessor: string): string | number {
  switch (accessor) {
    case "cod":
      return sofer.cod;
    case "nume":
      return sofer.nume;
    case "functie":
      return sofer.functie ?? "";
    case "sector":
      return sofer.sector ?? "";
    case "telefon":
      return sofer.telefon ?? "";
    case "expiredEquipment":
      return sofer.expiredEquipment;
    case "nrVehicule":
      return sofer.nrVehicule;
    case "nrBonuri":
      return sofer.nrBonuri;
    default:
      return "";
  }
}

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
    () =>
      [...new Set((query.data ?? []).flatMap((s) => (s.functie ? [s.functie] : [])))].sort((a, b) =>
        a.localeCompare(b, "ro"),
      ),
    [query.data],
  );
  const sectorOptions = useMemo(
    () =>
      [...new Set((query.data ?? []).flatMap((s) => (s.sector ? [s.sector] : [])))].sort((a, b) =>
        a.localeCompare(b, "ro"),
      ),
    [query.data],
  );
  const soferi = useMemo(() => {
    let records = (query.data ?? []).map(
      (s): SoferRecord => ({
        ...s,
        expiredEquipment: EIP_FIELDS.filter((field) => {
          const expiryDate = eipExpiryDate(s[field], field);
          return expiryDate !== null && expiryDate < today;
        }).length,
      }),
    );

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

    return records.sort((a, b) => {
      const aValue = sortValue(a, String(sortStatus.columnAccessor));
      const bValue = sortValue(b, String(sortStatus.columnAccessor));
      const result =
        typeof aValue === "number" && typeof bValue === "number"
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue), "ro", { numeric: true, sensitivity: "base" });
      return sortStatus.direction === "asc" ? result : -result;
    });
  }, [
    functieFilter,
    numeFilter,
    pontajFilter,
    query.data,
    sectorFilter,
    sortStatus,
    today,
  ]);

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
                filter: (
                  <TextInput
                    label="Caută după pontaj"
                    placeholder="Nr. pontaj"
                    value={pontajFilter}
                    onChange={(event) => setPontajFilter(event.currentTarget.value)}
                  />
                ),
                filtering: pontajFilter.trim() !== "",
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
                filter: (
                  <TextInput
                    label="Caută după nume"
                    placeholder="Nume"
                    value={numeFilter}
                    onChange={(event) => setNumeFilter(event.currentTarget.value)}
                  />
                ),
                filtering: numeFilter.trim() !== "",
              },
              {
                accessor: "functie",
                title: "Funcție",
                sortable: true,
                render: (s) => s.functie ?? "—",
                filter: (
                  <MultiSelect
                    label="Funcții"
                    placeholder="Toate"
                    searchable
                    clearable
                    filter={fuzzyOptionsFilter}
                    data={functieOptions}
                    value={functieFilter}
                    onChange={setFunctieFilter}
                    comboboxProps={{ withinPortal: false }}
                  />
                ),
                filtering: functieFilter.length > 0,
              },
              {
                accessor: "sector",
                title: "Sector",
                sortable: true,
                render: (s) => s.sector ?? "—",
                filter: (
                  <MultiSelect
                    label="Sectoare"
                    placeholder="Toate"
                    searchable
                    clearable
                    filter={fuzzyOptionsFilter}
                    data={sectorOptions}
                    value={sectorFilter}
                    onChange={setSectorFilter}
                    comboboxProps={{ withinPortal: false }}
                  />
                ),
                filtering: sectorFilter.length > 0,
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
