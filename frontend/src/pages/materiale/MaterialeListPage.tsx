import { ActionIcon, Anchor, Badge, Button, Group, Table, Text, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import type { MaterialListItem } from "@canalcik/server/api-types";
import {
  IconCheck,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router";
import {
  useCreateMaterial,
  useDeleteMaterial,
  useMateriale,
  useUpdateMaterial,
} from "../../api/materiale.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { ApiError } from "../../lib/api.ts";
import { showError, showSaved } from "../../lib/feedback.ts";

/**
 * The catalogue of materials a bon line can point at. There is only one
 * editable field, so rows are renamed in place here as well as on the detail
 * page; a rename shows up on every bon that ever named the material.
 */
export function MaterialeListPage() {
  const [search, setSearch] = useState("");
  const [debounced] = useDebouncedValue(search, 250);
  const query = useMateriale(debounced);

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
        subtitle={query.data ? `${query.data.length} materiale` : undefined}
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

      <TextInput
        placeholder="Caută după denumire"
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        mb="md"
        maw={480}
      />

      <QueryBoundary query={query}>
        {(materiale) =>
          materiale.length === 0 ? (
            <Text c="dimmed">Niciun material găsit.</Text>
          ) : (
            <Table.ScrollContainer minWidth={620}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Denumire</Table.Th>
                    <Table.Th w={130}>Linii de bon</Table.Th>
                    <Table.Th w={110} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {materiale.map((m) => (
                    <MaterialRow key={m.id} material={m} />
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )
        }
      </QueryBoundary>
    </>
  );
}

function MaterialRow({ material }: { material: MaterialListItem }) {
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

  return (
    <Table.Tr>
      <Table.Td>
        {editing ? (
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
          />
        ) : (
          <Anchor component={Link} to={`/materiale/${material.id}`}>
            {material.nume}
          </Anchor>
        )}
      </Table.Td>
      <Table.Td>
        <Badge variant="light" color="gray">
          {material.nrLinii}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap={4} wrap="nowrap">
          {editing ? (
            <>
              <ActionIcon
                variant="subtle"
                aria-label="Salvează denumirea"
                loading={update.isPending}
                onClick={save}
              >
                <IconCheck size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="Anulează"
                onClick={() => setEditing(false)}
              >
                <IconX size={16} />
              </ActionIcon>
            </>
          ) : (
            <>
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
            </>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
