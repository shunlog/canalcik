import { ActionIcon, Button, Checkbox, Group, Popover, SegmentedControl, Stack, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import type { SoferListItem } from "@canalcik/server/api-types";
import { EIP_EQUIPMENT_FIELDS, eipExpiryDate, type EipEquipmentField } from "@canalcik/server/derived";
import { IconPencil } from "@tabler/icons-react";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import { useMemo, useState } from "react";
import { useSoferi, useUpdateSofer } from "../../api/soferi.ts";
import { textFilterColumn } from "../../components/DataTableFilters.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { SoferLink } from "../../components/SoferLink.tsx";
import { showError, showSaved } from "../../lib/feedback.ts";
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
                render: (r) => <EliberatLaCell record={r} equipment={equipment} />,
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

function EliberatLaCell({
  record,
  equipment,
}: {
  record: EchipamentRecord;
  equipment: EipEquipmentField;
}) {
  const [opened, setOpened] = useState(false);
  const [draft, setDraft] = useState<string | null>(record.issueDate);
  const update = useUpdateSofer(record.sofer.id);

  const open = () => {
    setDraft(todayLocalIso());
    setOpened(true);
  };

  const save = () => {
    update.mutate(
      { [equipment]: draft },
      {
        onSuccess: () => {
          showSaved("Dată actualizată");
          setOpened(false);
        },
        onError: (err) => showError(err, "Actualizarea a eșuat"),
      },
    );
  };

  return (
    <Group gap={4} wrap="nowrap">
      <Text size="sm">{formatIsoDate(record.issueDate)}</Text>
      <Popover opened={opened} onChange={setOpened} withArrow position="bottom-start">
        <Popover.Target>
          <ActionIcon
            variant="subtle"
            aria-label="Editează data eliberării"
            onClick={() => (opened ? setOpened(false) : open())}
          >
            <IconPencil size={16} />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs">
            <DateInput
              label="Data eliberării"
              valueFormat="DD.MM.YYYY"
              placeholder="ZZ.LL.AAAA"
              clearable
              value={draft}
              onChange={setDraft}
              popoverProps={{ withinPortal: false }}
              w={180}
            />
            <Button size="xs" loading={update.isPending} onClick={save}>
              Salvează
            </Button>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Group>
  );
}
