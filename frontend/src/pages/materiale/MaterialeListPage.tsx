import { ActionIcon, Button, Group, Text, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import type { MaterialListItem } from "@canalcik/server/api-types";
import { IconCheck, IconPencil, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import { useMemo, useState } from "react";
import {
  useCreateMaterial,
  useDeleteMaterial,
  useMateriale,
  useUpdateMaterial,
} from "../../api/materiale.ts";
import { textFilterColumn } from "../../components/DataTableFilters.tsx";
import { MaterialLink } from "../../components/MaterialLink.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { ApiError } from "../../lib/api.ts";
import { showError, showSaved } from "../../lib/feedback.ts";
import { fuzzySearch } from "../../lib/search.ts";
import { sortRecords } from "../../lib/sort.ts";

/**
 * The catalogue of materials a bon line can point at. There is only one
 * editable field, so rows are renamed in place here as well as on the detail
 * page; a rename shows up on every bon that ever named the material.
 */
export function MaterialeListPage() {
  const [numeFilter, setNumeFilter] = useState("");
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<MaterialListItem>>({
    columnAccessor: "nume",
    direction: "asc",
  });
  const query = useMateriale();
  const materiale = useMemo(() => {
    const filtered = fuzzySearch(query.data ?? [], numeFilter, [(m) => m.nume]);
    return sortRecords(filtered, sortStatus);
  }, [query.data, numeFilter, sortStatus]);

  const [nume, setNume] = useState("");
  const create = useCreateMaterial();

  const submitNew = () => {
    const trimmed = nume.trim();
    if (trimmed === "") return;
    create.mutate(
      { nume: trimmed },
      {
        onSuccess: () => {
          showSaved("Material adăugat");
          setNume("");
        },
        onError: (err) => showError(err, "Adăugarea a eșuat"),
      },
    );
  };

  return (
    <>
      <PageHeader
        title="Materiale de întreținere"
        subtitle={query.data ? `${materiale.length} materiale` : undefined}
      />

      <Group align="flex-end" mb="md">
        <TextInput
          label="Material nou"
          placeholder="ULEI MOTOR 10W40"
          value={nume}
          onChange={(e) => setNume(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitNew();
            }
          }}
          w={360}
        />
        <Button
          leftSection={<IconPlus size={16} />}
          loading={create.isPending}
          disabled={nume.trim() === ""}
          onClick={submitNew}
        >
          Adaugă
        </Button>
      </Group>

      <QueryBoundary query={query}>
        {() =>
          <DataTable
            records={materiale}
            idAccessor="id"
            striped
            highlightOnHover
            minHeight={materiale.length === 0 ? 150 : undefined}
            noRecordsText="Niciun material găsit."
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            scrollAreaProps={{ type: "auto" }}
            columns={[
              {
                accessor: "nume",
                title: "Denumire",
                sortable: true,
                render: (m) => <MaterialNameCell material={m} />,
                ...textFilterColumn({
                  label: "Caută după denumire",
                  placeholder: "Denumire",
                  value: numeFilter,
                  onChange: setNumeFilter,
                }),
              },
              {
                accessor: "nrLinii",
                title: "Linii de bon",
                width: 130,
                sortable: true,
                render: (m) => m.nrLinii,
              },
            ]}
          />
        }
      </QueryBoundary>
    </>
  );
}

function MaterialNameCell({ material }: { material: MaterialListItem }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(material.nume);
  const update = useUpdateMaterial(material.id);
  const remove = useDeleteMaterial(material.id);

  const startEditing = () => {
    // Seeded on every entry, so a rename made elsewhere isn't overwritten by a
    // stale draft left behind from a cancelled edit.
    setDraft(material.nume);
    setEditing(true);
  };

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed === "" || trimmed === material.nume) {
      setEditing(false);
      return;
    }
    update.mutate(
      { nume: trimmed },
      {
        onSuccess: () => {
          showSaved("Material redenumit");
          setEditing(false);
        },
        onError: (err) => showError(err, "Redenumirea a eșuat"),
      },
    );
  };

  const confirmDelete = () =>
    modals.openConfirmModal({
      title: "Confirmați ștergerea",
      children: <Text size="sm">Ștergeți materialul „{material.nume}”?</Text>,
      labels: { confirm: "Șterge", cancel: "Anulează" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        remove.mutate(undefined, {
          onSuccess: () => showSaved("Material șters"),
          // A 409 means bon lines still point here; the server's message names
          // how many, and showError renders it as "Operație blocată".
          onError: (err) => showError(err, "Ștergerea a eșuat"),
        });
      },
    });

  if (editing) {
    return (
      <Group gap={4} wrap="nowrap">
        <TextInput
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
            if (e.key === "Escape") setEditing(false);
          }}
          error={update.error instanceof ApiError ? update.error.message : undefined}
          style={{ flex: 1 }}
        />
        <ActionIcon variant="subtle" aria-label="Salvează denumirea" loading={update.isPending} onClick={save}>
          <IconCheck size={16} />
        </ActionIcon>
        <ActionIcon variant="subtle" color="gray" aria-label="Anulează" onClick={() => setEditing(false)}>
          <IconX size={16} />
        </ActionIcon>
      </Group>
    );
  }

  return (
    <Group gap={4} wrap="nowrap" justify="space-between">
      <MaterialLink material={material} />
      <Group gap={4} wrap="nowrap">
        <ActionIcon variant="subtle" aria-label="Redenumește" onClick={startEditing}>
          <IconPencil size={16} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="red"
          aria-label="Șterge materialul"
          loading={remove.isPending}
          onClick={confirmDelete}
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    </Group>
  );
}
