import { Checkbox, SegmentedControl, Text } from "@mantine/core";
import type { SoferListItem } from "@canalcik/server/api-types";
import { EIP_EQUIPMENT_FIELDS, eipExpiryDate, type EipEquipmentField } from "@canalcik/server/derived";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import { useMemo, useState } from "react";
import { useSoferi } from "../../api/soferi.ts";
import { textFilterColumn } from "../../components/DataTableFilters.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { SoferLink } from "../../components/SoferLink.tsx";
import { formatIsoDate, todayLocalIso } from "../../lib/forms.ts";
import { EIP_LABELS } from "../../lib/labels.ts";
import { fuzzySearch } from "../../lib/search.ts";
import { sortRecords } from "../../lib/sort.ts";

interface EchipamentRecord {
  id: number;
  sofer: SoferListItem;
  nume: string;
  issueDate: string | null;
  expiryDate: string | null;
  expired: boolean;
}

export function EchipamentListPage() {
  const [equipment, setEquipment] = useState<EipEquipmentField>(EIP_EQUIPMENT_FIELDS[0]);
  const [soferFilter, setSoferFilter] = useState("");
  const [onlyExpired, setOnlyExpired] = useState(false);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<EchipamentRecord>>({
    columnAccessor: "nume",
    direction: "asc",
  });
  const query = useSoferi();
  const today = todayLocalIso();

  const records = useMemo(() => {
    let recs = (query.data ?? []).map((s): EchipamentRecord => {
      const issueDate = s[equipment];
      const expiryDate = eipExpiryDate(issueDate, equipment);
      return {
        id: s.id,
        sofer: s,
        nume: s.nume,
        issueDate,
        expiryDate,
        expired: expiryDate !== null && expiryDate < today,
      };
    });

    if (soferFilter.trim()) {
      recs = fuzzySearch(recs, soferFilter, [(r) => r.nume]);
    }

    if (onlyExpired) {
      recs = recs.filter((r) => r.expired);
    }

    return sortRecords(recs, sortStatus);
  }, [query.data, equipment, soferFilter, onlyExpired, sortStatus, today]);

  return (
    <>
      <PageHeader title="Echipament" />

      <SegmentedControl
        value={equipment}
        onChange={(value) => setEquipment(value as EipEquipmentField)}
        data={EIP_EQUIPMENT_FIELDS.map((field) => ({ label: EIP_LABELS[field], value: field }))}
      />

      <Checkbox
        mt="sm"
        mb="md"
        label="Arată numai expirate"
        checked={onlyExpired}
        onChange={(event) => setOnlyExpired(event.currentTarget.checked)}
      />

      <QueryBoundary query={query}>
        {() => (
          <DataTable
            records={records}
            idAccessor="id"
            striped
            highlightOnHover
            minHeight={records.length === 0 ? 150 : undefined}
            noRecordsText="Niciun echipament găsit."
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            columns={[
              {
                accessor: "nume",
                title: "Șofer",
                sortable: true,
                render: (r) => <SoferLink sofer={r.sofer} />,
                ...textFilterColumn({
                  label: "Caută după nume",
                  placeholder: "Nume",
                  value: soferFilter,
                  onChange: setSoferFilter,
                }),
              },
              {
                accessor: "issueDate",
                title: "Eliberat la",
                sortable: true,
                render: (r) => formatIsoDate(r.issueDate),
              },
              {
                accessor: "expiryDate",
                title: "Expiră la",
                sortable: true,
                render: (r) =>
                  r.expired ? (
                    <Text c="red" span>
                      ⚠️ {formatIsoDate(r.expiryDate)}
                    </Text>
                  ) : (
                    formatIsoDate(r.expiryDate)
                  ),
              },
            ]}
          />
        )}
      </QueryBoundary>
    </>
  );
}
