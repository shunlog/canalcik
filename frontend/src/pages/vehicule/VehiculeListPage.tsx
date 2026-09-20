import { Anchor, Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import type { VehiculListItem } from "@canalcik/server/api-types";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useVehicule } from "../../api/vehicule.ts";
import { multiSelectFilterColumn, textFilterColumn } from "../../components/DataTableFilters.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { fuzzySearch } from "../../lib/search.ts";
import { sortRecords, uniqueSortedOptions } from "../../lib/sort.ts";

export function VehiculeListPage() {
  const [registrationFilter, setRegistrationFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState<string[]>([]);
  const [sectorFilter, setSectorFilter] = useState<string[]>([]);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<VehiculListItem>>({
    columnAccessor: "nrInmatriculare",
    direction: "asc",
  });
  const query = useVehicule();
  const destinationOptions = useMemo(
    () => uniqueSortedOptions(query.data ?? [], (v) => v.tip),
    [query.data],
  );
  const sectorOptions = useMemo(
    () => uniqueSortedOptions(query.data ?? [], (v) => v.sector),
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

    return sortRecords(records, sortStatus);
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
                accessor: "nrInmatriculare",
                title: "Nr. înmatriculare",
                sortable: true,
                render: (v) => (
                  <Anchor component={Link} to={`/vehicule/${v.id}`}>
                    {v.nrInmatriculare}
                  </Anchor>
                ),
                ...textFilterColumn({
                  label: "Caută după înmatriculare",
                  placeholder: "Nr. înmatriculare",
                  value: registrationFilter,
                  onChange: setRegistrationFilter,
                }),
              },
              {
                accessor: "tip",
                title: "Destinația",
                sortable: true,
                ...multiSelectFilterColumn({
                  label: "Destinații",
                  data: destinationOptions,
                  value: destinationFilter,
                  onChange: setDestinationFilter,
                }),
              },
              {
                accessor: "model",
                title: "Marcă / Model",
                sortable: true,
                ...textFilterColumn({
                  label: "Caută după marcă / model",
                  placeholder: "Marcă / Model",
                  value: modelFilter,
                  onChange: setModelFilter,
                }),
              },
              { accessor: "anProducere", title: "An", sortable: true, render: (v) => v.anProducere ?? "—" },
              { accessor: "nrInventar", title: "Inventar", sortable: true },
              { accessor: "nrGaraj", title: "Garaj", sortable: true },
              {
                accessor: "sector",
                title: "Sector",
                sortable: true,
                render: (v) => v.sector ?? "—",
                ...multiSelectFilterColumn({
                  label: "Sectoare",
                  data: sectorOptions,
                  value: sectorFilter,
                  onChange: setSectorFilter,
                }),
              },
              {
                accessor: "nrSoferi",
                title: "Șoferi",
                sortable: true,
                render: (v) => v.nrSoferi,
              },
              {
                accessor: "nrBonuri",
                title: "Bonuri",
                sortable: true,
                render: (v) => v.nrBonuri,
              },
            ]}
          />
        }
      </QueryBoundary>
    </>
  );
}
