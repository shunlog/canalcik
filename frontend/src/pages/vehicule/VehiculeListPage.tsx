import { Anchor, Badge, Button, MultiSelect, TextInput } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import type { VehiculListItem } from "@canalcik/server/api-types";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useVehicule } from "../../api/vehicule.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { fuzzyOptionsFilter, fuzzySearch } from "../../lib/search.ts";

function sortValue(vehicul: VehiculListItem, accessor: string): string | number {
  switch (accessor) {
    case "registration":
      return vehicul.nrInmatriculare;
    case "tip":
      return vehicul.tip;
    case "model":
      return vehicul.model;
    case "anProducere":
      return vehicul.anProducere ?? 0;
    case "nrInventar":
      return vehicul.nrInventar;
    case "nrGaraj":
      return vehicul.nrGaraj;
    case "sector":
      return vehicul.sector ?? "";
    case "nrSoferi":
      return vehicul.nrSoferi;
    case "nrBonuri":
      return vehicul.nrBonuri;
    default:
      return "";
  }
}

export function VehiculeListPage() {
  const [registrationFilter, setRegistrationFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState<string[]>([]);
  const [sectorFilter, setSectorFilter] = useState<string[]>([]);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<VehiculListItem>>({
    columnAccessor: "registration",
    direction: "asc",
  });
  const query = useVehicule();
  const destinationOptions = useMemo(
    () => [...new Set((query.data ?? []).map((v) => v.tip))].sort((a, b) => a.localeCompare(b, "ro")),
    [query.data],
  );
  const sectorOptions = useMemo(
    () =>
      [...new Set((query.data ?? []).flatMap((v) => (v.sector ? [v.sector] : [])))].sort((a, b) =>
        a.localeCompare(b, "ro"),
      ),
    [query.data],
  );
  const vehicule = useMemo(() => {
    let records = query.data ?? [];

    if (registrationFilter.trim()) {
      records = fuzzySearch(records, registrationFilter, [(v) => v.nrInmatriculare]);
    }

    if (modelFilter.trim()) {
      records = fuzzySearch(records, modelFilter, [(v) => v.model]);
    }

    records = records.filter(
      (v) =>
        (destinationFilter.length === 0 || destinationFilter.includes(v.tip)) &&
        (sectorFilter.length === 0 || (v.sector !== null && sectorFilter.includes(v.sector))),
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
  }, [destinationFilter, modelFilter, query.data, registrationFilter, sectorFilter, sortStatus]);

  return (
    <>
      <PageHeader
        title="Vehicule"
        subtitle={query.data ? `${vehicule.length} înregistrări` : undefined}
        actions={
          <Button component={Link} to="/vehicule/nou" leftSection={<IconPlus size={16} />}>
            Vehicul nou
          </Button>
        }
      />

      <QueryBoundary query={query}>
        {() =>
          <DataTable
            records={vehicule}
            idAccessor="id"
            striped
            highlightOnHover
            minHeight={vehicule.length === 0 ? 150 : undefined}
            noRecordsText="Niciun vehicul găsit."
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            scrollAreaProps={{ type: "auto" }}
            columns={[
              {
                accessor: "registration",
                title: "Nr. înmatriculare",
                sortable: true,
                render: (v) => (
                  <Anchor component={Link} to={`/vehicule/${v.id}`}>
                    {v.nrInmatriculare}
                  </Anchor>
                ),
                filter: (
                  <TextInput
                    label="Caută după înmatriculare"
                    placeholder="Nr. înmatriculare"
                    value={registrationFilter}
                    onChange={(event) => setRegistrationFilter(event.currentTarget.value)}
                  />
                ),
                filtering: registrationFilter.trim() !== "",
              },
              {
                accessor: "tip",
                title: "Destinația",
                sortable: true,
                filter: (
                  <MultiSelect
                    label="Destinații"
                    placeholder="Toate"
                    searchable
                    clearable
                    filter={fuzzyOptionsFilter}
                    data={destinationOptions}
                    value={destinationFilter}
                    onChange={setDestinationFilter}
                    comboboxProps={{ withinPortal: false }}
                  />
                ),
                filtering: destinationFilter.length > 0,
              },
              {
                accessor: "model",
                title: "Marcă / Model",
                sortable: true,
                filter: (
                  <TextInput
                    label="Caută după marcă / model"
                    placeholder="Marcă / Model"
                    value={modelFilter}
                    onChange={(event) => setModelFilter(event.currentTarget.value)}
                  />
                ),
                filtering: modelFilter.trim() !== "",
              },
              { accessor: "anProducere", title: "An", sortable: true, render: (v) => v.anProducere ?? "—" },
              { accessor: "nrInventar", title: "Inventar", sortable: true },
              { accessor: "nrGaraj", title: "Garaj", sortable: true },
              {
                accessor: "sector",
                title: "Sector",
                sortable: true,
                render: (v) => v.sector ?? "—",
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
              {
                accessor: "nrSoferi",
                title: "Șoferi",
                sortable: true,
                render: (v) => <Badge variant="light">{v.nrSoferi}</Badge>,
              },
              {
                accessor: "nrBonuri",
                title: "Bonuri",
                sortable: true,
                render: (v) => <Badge variant="light">{v.nrBonuri}</Badge>,
              },
            ]}
          />
        }
      </QueryBoundary>
    </>
  );
}
