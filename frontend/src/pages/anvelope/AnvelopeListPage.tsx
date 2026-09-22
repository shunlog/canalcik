import type { AnvelopaKmRef, AnvelopaLuniRef, IsoDate } from "@canalcik/server/api-types";
import { ActionIcon, Button, Group, Popover, SegmentedControl, Stack, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconPencil } from "@tabler/icons-react";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import { useMemo, useState } from "react";
import { useAnvelope } from "../../api/anvelope.ts";
import { useUpdateAnvelope } from "../../api/vehicule.ts";
import { textFilterColumn } from "../../components/DataTableFilters.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { VehiculLink } from "../../components/VehiculLink.tsx";
import { showError, showSaved } from "../../lib/feedback.ts";
import { formatIsoDate, todayLocalIso } from "../../lib/forms.ts";
import { vehiculLabel } from "../../lib/labels.ts";
import { fuzzySearch } from "../../lib/search.ts";
import { sortRecords } from "../../lib/sort.ts";

type Kind = "luni" | "km";

interface LuniRecord extends AnvelopaLuniRef {
  vehiculLabel: string;
  expired: boolean;
}

interface KmRecord extends AnvelopaKmRef {
  vehiculLabel: string;
  expired: boolean;
}

export function AnvelopeListPage() {
  const [kind, setKind] = useState<Kind>("luni");
  const [vehiculFilter, setVehiculFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [luniSort, setLuniSort] = useState<DataTableSortStatus<LuniRecord>>({
    columnAccessor: "vehiculLabel",
    direction: "asc",
  });
  const [kmSort, setKmSort] = useState<DataTableSortStatus<KmRecord>>({
    columnAccessor: "vehiculLabel",
    direction: "asc",
  });

  const query = useAnvelope();

  const luniRecords = useMemo(() => {
    let records: LuniRecord[] = (query.data?.luni ?? []).map((a) => ({
      ...a,
      vehiculLabel: vehiculLabel(a.vehicul),
      expired: a.luniRamase < 0,
    }));

    if (vehiculFilter.trim()) records = fuzzySearch(records, vehiculFilter, [(r) => r.vehiculLabel]);
    if (modelFilter.trim()) records = fuzzySearch(records, modelFilter, [(r) => r.model]);

    return sortRecords(records, luniSort);
  }, [query.data, vehiculFilter, modelFilter, luniSort]);

  const kmRecords = useMemo(() => {
    let records: KmRecord[] = (query.data?.km ?? []).map((a) => ({
      ...a,
      vehiculLabel: vehiculLabel(a.vehicul),
      expired: a.kmRamasi !== null && a.kmRamasi < 0,
    }));

    if (vehiculFilter.trim()) records = fuzzySearch(records, vehiculFilter, [(r) => r.vehiculLabel]);
    if (modelFilter.trim()) records = fuzzySearch(records, modelFilter, [(r) => r.model]);

    return sortRecords(records, kmSort);
  }, [query.data, vehiculFilter, modelFilter, kmSort]);

  return (
    <>
      <PageHeader title="Anvelope" />

      <SegmentedControl
        value={kind}
        onChange={(value) => setKind(value as Kind)}
        data={[
          { label: "Normă în luni", value: "luni" },
          { label: "Normă în km", value: "km" },
        ]}
        mb="md"
      />

      <QueryBoundary query={query}>
        {() =>
          kind === "luni" ? (
            <DataTable
              records={luniRecords}
              idAccessor="id"
              striped
              highlightOnHover
              minHeight={luniRecords.length === 0 ? 150 : undefined}
              noRecordsText="Nicio anvelopă găsită."
              sortStatus={luniSort}
              onSortStatusChange={setLuniSort}
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
                  title: "Model anvelopă",
                  sortable: true,
                  render: (r) => r.model ?? "—",
                  ...textFilterColumn({
                    label: "Caută după model",
                    placeholder: "Model anvelopă",
                    value: modelFilter,
                    onChange: setModelFilter,
                  }),
                },
                {
                  accessor: "dataInstalarii",
                  title: "Data instalării",
                  sortable: true,
                  render: (r) => (
                    <DataInstalariiCell
                      id={r.id}
                      vehiculId={r.vehicul.id}
                      kind="luni"
                      value={r.dataInstalarii}
                    />
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
          ) : (
            <DataTable
              records={kmRecords}
              idAccessor="id"
              striped
              highlightOnHover
              minHeight={kmRecords.length === 0 ? 150 : undefined}
              noRecordsText="Nicio anvelopă găsită."
              sortStatus={kmSort}
              onSortStatusChange={setKmSort}
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
                  title: "Model anvelopă",
                  sortable: true,
                  render: (r) => r.model ?? "—",
                  ...textFilterColumn({
                    label: "Caută după model",
                    placeholder: "Model anvelopă",
                    value: modelFilter,
                    onChange: setModelFilter,
                  }),
                },
                {
                  accessor: "dataInstalarii",
                  title: "Data instalării",
                  sortable: true,
                  render: (r) => (
                    <DataInstalariiCell
                      id={r.id}
                      vehiculId={r.vehicul.id}
                      kind="km"
                      value={r.dataInstalarii}
                    />
                  ),
                },
                { accessor: "kmInstalare", title: "Km la instalare", sortable: true },
                { accessor: "normaKm", title: "Normă (km)", sortable: true },
                {
                  accessor: "kmRamasi",
                  title: "Km rămași",
                  sortable: true,
                  render: (r) =>
                    r.kmRamasi === null ? (
                      "—"
                    ) : r.expired ? (
                      <Text c="red" span>
                        ⚠️ {r.kmRamasi}
                      </Text>
                    ) : (
                      r.kmRamasi
                    ),
                },
                {
                  accessor: "procenteUzura",
                  title: "Uzură",
                  sortable: true,
                  render: (r) => (r.procenteUzura === null ? "—" : `${r.procenteUzura}%`),
                },
              ]}
            />
          )
        }
      </QueryBoundary>
    </>
  );
}

/**
 * The "data instalarii" cell — edits save immediately (unlike the vehicul
 * detail page's own tire tables, which batch edits behind a page save
 * button): this page lists tires across the whole fleet, one row at a time,
 * so there is no single "save" scope to batch into. Mirrors
 * EchipamentListPage's EliberatLaCell: opening the editor defaults to today.
 */
function DataInstalariiCell({
  id,
  vehiculId,
  kind,
  value,
}: {
  id: number;
  vehiculId: number;
  kind: Kind;
  value: IsoDate;
}) {
  const [opened, setOpened] = useState(false);
  const [draft, setDraft] = useState<string | null>(value);
  const update = useUpdateAnvelope();

  const open = () => {
    setDraft(todayLocalIso());
    setOpened(true);
  };

  const save = () => {
    if (!draft) return;
    update.mutate(
      {
        vehiculId,
        ...(kind === "luni"
          ? { anvelopeLuni: [{ id, dataInstalarii: draft }] }
          : { anvelopeKm: [{ id, dataInstalarii: draft }] }),
      },
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
