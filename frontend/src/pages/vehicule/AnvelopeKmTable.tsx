import type { AnvelopaKm, AnvelopaKmWrite } from "@canalcik/server/api-types";
import { kmRamasi, procenteUzura } from "@canalcik/server/derived";
import { ActionIcon, Button, Group, NumberInput, Stack, Table, Text, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { randomId } from "@mantine/hooks";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useUpdateAnvelope } from "../../api/vehicule.ts";
import { showError, showSaved } from "../../lib/feedback.ts";
import { numOrZero, todayLocalIso } from "../../lib/forms.ts";

const formatKm = (n: number) => n.toLocaleString("ro-RO");

interface Row {
  /** Client-side only — see the same comment in AnvelopeLuniTable's Row. */
  key: string;
  id: number | null;
  model: string;
  dataInstalarii: string;
  kmInstalare: number | string;
  normaKm: number | string;
}

interface FormValues {
  rows: Row[];
}

const newRow = (kmActuali: number | null): Row => ({
  key: randomId(),
  id: null,
  model: "",
  dataInstalarii: todayLocalIso(),
  kmInstalare: kmActuali ?? 0,
  normaKm: 40000,
});

const toRows = (anvelope: AnvelopaKm[]): Row[] =>
  anvelope.map((a) => ({
    key: randomId(),
    id: a.id,
    model: a.model ?? "",
    dataInstalarii: a.dataInstalarii,
    kmInstalare: a.kmInstalare,
    normaKm: a.normaKm,
  }));

const toWrite = (r: Row): AnvelopaKmWrite => ({
  model: r.model.trim() === "" ? null : r.model.trim(),
  dataInstalarii: r.dataInstalarii,
  kmInstalare: numOrZero(r.kmInstalare),
  normaKm: numOrZero(r.normaKm),
});

/** The vehicul's distance-based tires — one row per physical tire, fully editable. */
export function AnvelopeKmTable({
  vehiculId,
  kmActuali,
  anvelope,
}: {
  vehiculId: number;
  kmActuali: number | null;
  anvelope: AnvelopaKm[];
}) {
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const update = useUpdateAnvelope();

  const form = useForm<FormValues>({ initialValues: { rows: toRows(anvelope) } });

  useEffect(() => {
    const rows = toRows(anvelope);
    form.setValues({ rows });
    form.resetDirty({ rows });
    setDeletedIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anvelope]);

  const removeRow = (i: number) => {
    const row = form.getValues().rows[i];
    if (row.id !== null) setDeletedIds((ids) => [...ids, row.id!]);
    form.removeListItem("rows", i);
  };

  const dirty = form.isDirty() || deletedIds.length > 0;

  const save = () => {
    const rows = form.getValues().rows;
    update.mutate(
      {
        vehiculId,
        anvelopeKm: {
          update: rows.filter((r) => r.id !== null).map((r) => ({ id: r.id!, ...toWrite(r) })),
          create: rows.filter((r) => r.id === null).map(toWrite),
          delete: deletedIds,
        },
      },
      {
        onSuccess: () => showSaved("Anvelope salvate"),
        onError: (err) => showError(err, "Salvarea anvelopelor a eșuat"),
      },
    );
  };

  const rows = form.getValues().rows;

  return (
    <Stack gap="xs">
      <Table.ScrollContainer minWidth={860}>
        <Table withTableBorder verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Model</Table.Th>
              <Table.Th w={170}>Data instalării</Table.Th>
              <Table.Th w={140}>Km la instalare</Table.Th>
              <Table.Th w={140}>Normă (km)</Table.Th>
              <Table.Th>Km rămași</Table.Th>
              <Table.Th>Uzură</Table.Th>
              <Table.Th w={50} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row, i) => {
              const kmInstalare = numOrZero(row.kmInstalare);
              const normaKm = numOrZero(row.normaKm);
              const ramasi = kmActuali === null ? null : kmRamasi(kmInstalare, normaKm, kmActuali);
              const uzura = kmActuali === null ? null : procenteUzura(kmInstalare, normaKm, kmActuali);
              return (
                <Table.Tr key={row.key}>
                  <Table.Td>
                    <TextInput placeholder="Model" {...form.getInputProps(`rows.${i}.model`)} />
                  </Table.Td>
                  <Table.Td>
                    <DateInput
                      valueFormat="DD.MM.YYYY"
                      placeholder="ZZ.LL.AAAA"
                      popoverProps={{ withinPortal: false }}
                      {...form.getInputProps(`rows.${i}.dataInstalarii`)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput min={0} {...form.getInputProps(`rows.${i}.kmInstalare`)} />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput min={1} {...form.getInputProps(`rows.${i}.normaKm`)} />
                  </Table.Td>
                  <Table.Td c={ramasi !== null && ramasi < 0 ? "red" : undefined}>
                    {ramasi === null ? "—" : formatKm(ramasi)}
                  </Table.Td>
                  <Table.Td c={uzura !== null && uzura >= 100 ? "red" : undefined}>
                    {uzura === null ? "—" : `${uzura}%`}
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      aria-label="Șterge anvelopa"
                      onClick={() => removeRow(i)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {rows.length === 0 && (
        <Text size="sm" c="dimmed">
          Nicio anvelopă cu normă în km pentru acest vehicul.
        </Text>
      )}

      <Group>
        <Button
          variant="light"
          leftSection={<IconPlus size={16} />}
          onClick={() => form.insertListItem("rows", newRow(kmActuali))}
        >
          Adaugă anvelopă
        </Button>
        <Button onClick={save} loading={update.isPending} disabled={!dirty}>
          Salvează anvelope
        </Button>
      </Group>
    </Stack>
  );
}
