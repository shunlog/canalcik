import type { Acumulator, AcumulatorWrite } from "@canalcik/server/api-types";
import { acumulatorExpiryDate, luniRamase } from "@canalcik/server/derived";
import { ActionIcon, Button, Group, NumberInput, Stack, Table, Text, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { randomId } from "@mantine/hooks";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useUpdateAcumulatoare } from "../../api/vehicule.ts";
import { showError, showSaved } from "../../lib/feedback.ts";
import { formatIsoDate, numOrZero, todayLocalIso } from "../../lib/forms.ts";

interface Row {
  /** Client-side only — see the same comment in AnvelopeLuniTable's Row. */
  key: string;
  id: number | null;
  model: string;
  dataInstalarii: string;
  normaLuni: number | string;
}

interface FormValues {
  rows: Row[];
}

const newRow = (): Row => ({
  key: randomId(),
  id: null,
  model: "",
  dataInstalarii: todayLocalIso(),
  normaLuni: 24,
});

const toRows = (acumulatoare: Acumulator[]): Row[] =>
  acumulatoare.map((a) => ({
    key: randomId(),
    id: a.id,
    model: a.model ?? "",
    dataInstalarii: a.dataInstalarii,
    normaLuni: a.normaLuni,
  }));

const toWrite = (r: Row): AcumulatorWrite => ({
  model: r.model.trim() === "" ? null : r.model.trim(),
  dataInstalarii: r.dataInstalarii,
  normaLuni: numOrZero(r.normaLuni),
});

/** The vehicul's accumulators — one row per physical accumulator, fully editable. */
export function AcumulatoareTable({
  vehiculId,
  acumulatoare,
}: {
  vehiculId: number;
  acumulatoare: Acumulator[];
}) {
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const update = useUpdateAcumulatoare();

  const form = useForm<FormValues>({ initialValues: { rows: toRows(acumulatoare) } });

  useEffect(() => {
    const rows = toRows(acumulatoare);
    form.setValues({ rows });
    form.resetDirty({ rows });
    setDeletedIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acumulatoare]);

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
        acumulatoare: {
          update: rows.filter((r) => r.id !== null).map((r) => ({ id: r.id!, ...toWrite(r) })),
          create: rows.filter((r) => r.id === null).map(toWrite),
          delete: deletedIds,
        },
      },
      {
        onSuccess: () => showSaved("Acumulatoare salvate"),
        onError: (err) => showError(err, "Salvarea acumulatoarelor a eșuat"),
      },
    );
  };

  const today = todayLocalIso();
  const rows = form.getValues().rows;

  return (
    <Stack gap="xs">
      <Table.ScrollContainer minWidth={780}>
        <Table withTableBorder verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Model</Table.Th>
              <Table.Th w={170}>Data instalării</Table.Th>
              <Table.Th>Data expirării</Table.Th>
              <Table.Th w={140}>Normă (luni)</Table.Th>
              <Table.Th>Luni rămase</Table.Th>
              <Table.Th w={50} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row, i) => {
              const normaLuni = numOrZero(row.normaLuni);
              const dataExpirarii = acumulatorExpiryDate(row.dataInstalarii, normaLuni);
              const expired = dataExpirarii <= today;
              const ramase = luniRamase(row.dataInstalarii, normaLuni, today);
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
                    {expired ? (
                      <Text c="red" span>
                        ⚠️ {formatIsoDate(dataExpirarii)}
                      </Text>
                    ) : (
                      formatIsoDate(dataExpirarii)
                    )}
                  </Table.Td>
                  <Table.Td>
                    <NumberInput min={1} {...form.getInputProps(`rows.${i}.normaLuni`)} />
                  </Table.Td>
                  <Table.Td c={ramase < 0 ? "red" : undefined}>{ramase}</Table.Td>
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      aria-label="Șterge acumulatorul"
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
          Niciun acumulator pentru acest vehicul.
        </Text>
      )}

      <Group>
        <Button
          variant="light"
          leftSection={<IconPlus size={16} />}
          onClick={() => form.insertListItem("rows", newRow())}
        >
          Adaugă acumulator
        </Button>
        <Button onClick={save} loading={update.isPending} disabled={!dirty}>
          Salvează acumulatoare
        </Button>
      </Group>
    </Stack>
  );
}
