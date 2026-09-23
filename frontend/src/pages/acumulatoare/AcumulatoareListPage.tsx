import type { AcumulatorRef, IsoDate } from "@canalcik/server/api-types";
import { acumulatorExpiryDate } from "@canalcik/server/derived";
import { ActionIcon, Button, Checkbox, Group, Popover, Stack, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconPencil } from "@tabler/icons-react";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import { useMemo, useState } from "react";
import { useAcumulatoare } from "../../api/acumulatoare.ts";
import { useUpdateAcumulatoare } from "../../api/vehicule.ts";
import { textFilterColumn } from "../../components/DataTableFilters.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { VehiculLink } from "../../components/VehiculLink.tsx";
import { showError, showSaved } from "../../lib/feedback.ts";
import { formatIsoDate, todayLocalIso } from "../../lib/forms.ts";
import { vehiculLabel } from "../../lib/labels.ts";
import { fuzzySearch } from "../../lib/search.ts";
import { sortRecords } from "../../lib/sort.ts";

interface AcumulatorRecord extends AcumulatorRef {
  vehiculLabel: string;
  expired: boolean;
  dataExpirarii: IsoDate;
  expiredDate: boolean;
}

export function AcumulatoareListPage() {
  const [vehiculFilter, setVehiculFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [onlyExpired, setOnlyExpired] = useState(false);
  const [sort, setSort] = useState<DataTableSortStatus<AcumulatorRecord>>({
    columnAccessor: "vehiculLabel",
    direction: "asc",
  });

  const query = useAcumulatoare();
  const today = todayLocalIso();

  const records = useMemo(() => {
    let records: AcumulatorRecord[] = (query.data ?? []).map((a) => {
      const dataExpirarii = acumulatorExpiryDate(a.dataInstalarii, a.normaLuni);
      return {
        ...a,
        vehiculLabel: vehiculLabel(a.vehicul),
        expired: a.luniRamase < 0,
        dataExpirarii,
        expiredDate: dataExpirarii <= today,
      };
    });

    if (vehiculFilter.trim()) records = fuzzySearch(records, vehiculFilter, [(r) => r.vehiculLabel]);
    if (modelFilter.trim()) records = fuzzySearch(records, modelFilter, [(r) => r.model]);
    if (onlyExpired) records = records.filter((r) => r.expired);

    return sortRecords(records, sort);
  }, [query.data, vehiculFilter, modelFilter, onlyExpired, sort, today]);

  return (
    <>
      <PageHeader title="Acumulatoare" />

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
            noRecordsText="Niciun acumulator găsit."
            sortStatus={sort}
            onSortStatusChange={setSort}
            scrollAreaProps={{ type: "auto" }}
            columns={[
              {
                accessor: "vehiculLabel",
                title: "Vehicul",
                sortable: true,
                render: (r) => <VehiculLink vehicul={r.vehicul} />,
                ...textFilterColumn({
                  label: "Caută după vehicul",
                  placeholder: "Nr. înmatriculare / model",
                  value: vehiculFilter,
                  onChange: setVehiculFilter,
                }),
              },
              {
                accessor: "model",
                title: "Model acumulator",
                sortable: true,
                render: (r) => r.model ?? "—",
                ...textFilterColumn({
                  label: "Caută după model",
                  placeholder: "Model acumulator",
                  value: modelFilter,
                  onChange: setModelFilter,
                }),
              },
              {
                accessor: "dataInstalarii",
                title: "Data instalării",
                sortable: true,
                render: (r) => (
                  <DataInstalariiCell id={r.id} vehiculId={r.vehicul.id} value={r.dataInstalarii} />
                ),
              },
              {
                accessor: "dataExpirarii",
                title: "Data expirării",
                sortable: true,
                render: (r) =>
                  r.expiredDate ? (
                    <Text c="red" span>
                      ⚠️ {formatIsoDate(r.dataExpirarii)}
                    </Text>
                  ) : (
                    formatIsoDate(r.dataExpirarii)
                  ),
              },
              { accessor: "normaLuni", title: "Normă (luni)", sortable: true },
              {
                accessor: "luniRamase",
                title: "Luni rămase",
                sortable: true,
                render: (r) =>
                  r.expired ? (
                    <Text c="red" span>
                      ⚠️ {r.luniRamase}
                    </Text>
                  ) : (
                    r.luniRamase
                  ),
              },
            ]}
          />
        )}
      </QueryBoundary>
    </>
  );
}

/**
 * The "data instalarii" cell — edits save immediately (unlike the vehicul
 * detail page's own accumulator table, which batches edits behind a page save
 * button): this page lists accumulators across the whole fleet, one row at a
 * time, so there is no single "save" scope to batch into. Mirrors
 * AnvelopeListPage's DataInstalariiCell.
 */
function DataInstalariiCell({
  id,
  vehiculId,
  value,
}: {
  id: number;
  vehiculId: number;
  value: IsoDate;
}) {
  const [opened, setOpened] = useState(false);
  const [draft, setDraft] = useState<string | null>(value);
  const update = useUpdateAcumulatoare();

  const open = () => {
    setDraft(todayLocalIso());
    setOpened(true);
  };

  const save = () => {
    if (!draft) return;
    update.mutate(
      { vehiculId, acumulatoare: { update: [{ id, dataInstalarii: draft }] } },
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
      <Text size="sm">{formatIsoDate(value)}</Text>
      <Popover opened={opened} onChange={setOpened} withArrow position="bottom-start">
        <Popover.Target>
          <ActionIcon
            variant="subtle"
            aria-label="Editează data instalării"
            onClick={() => (opened ? setOpened(false) : open())}
          >
            <IconPencil size={16} />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs">
            <DateInput
              label="Data instalării"
              valueFormat="DD.MM.YYYY"
              placeholder="ZZ.LL.AAAA"
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
