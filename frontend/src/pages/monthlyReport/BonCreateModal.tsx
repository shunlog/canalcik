import type { MonthlyReportLine } from "@canalcik/server/api-types";
import { Button, Group, Modal, NumberInput, Select, Stack, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useCreateBon } from "../../api/bonuri.ts";
import { useSoferVehiculCoupling } from "../../api/coupling.ts";
import { showError, showSaved } from "../../lib/feedback.ts";
import { numOrZero, todayLocalIso } from "../../lib/forms.ts";
import { fuzzyOptionsFilter } from "../../lib/search.ts";

interface NouBonValues {
  data: string;
  soferId: string | null;
  vehiculId: string | null;
  cantitate: number | string;
}

const emptyValues = (): NouBonValues => ({
  data: todayLocalIso(),
  soferId: null,
  vehiculId: null,
  cantitate: "",
});

/**
 * Creates a bon straight from a monthly-report row, so a difference can be
 * corrected without leaving the report. The material is fixed by the row that
 * opened the modal, hence the reduced field set: date, sofer, vehicul,
 * cantitate.
 */
export function BonCreateModal({
  linie,
  onInchide,
}: {
  linie: MonthlyReportLine | null;
  onInchide: () => void;
}) {
  const create = useCreateBon();

  const form = useForm<NouBonValues>({
    initialValues: emptyValues(),
    validate: {
      data: (v) => (v ? null : "Data este obligatorie"),
      soferId: (v) => (v ? null : "Șoferul este obligatoriu"),
      vehiculId: (v) => (v ? null : "Vehiculul este obligatoriu"),
      cantitate: (v) =>
        v === "" || Number(v) <= 0 || Number.isNaN(Number(v)) ? "Cantitate invalidă" : null,
    },
  });

  const { soferId, vehiculId } = form.getValues();
  const { sofer, vehicul } = useSoferVehiculCoupling({ soferId, vehiculId });

  const inchide = () => {
    form.setValues(emptyValues());
    form.resetDirty();
    onInchide();
  };

  const submit = form.onSubmit((values) => {
    if (linie === null || linie.materialId === null) return;
    create.mutate(
      {
        data: values.data,
        soferId: Number(values.soferId),
        vehiculId: Number(values.vehiculId),
        materiale: [{ materialId: linie.materialId, cantitate: numOrZero(values.cantitate) }],
      },
      {
        onSuccess: () => {
          showSaved("Bon creat");
          inchide();
        },
        onError: (err) => showError(err, "Crearea bonului a eșuat"),
      },
    );
  });

  return (
    <Modal opened={linie !== null} onClose={inchide} title="Bon nou" size="md">
      <form onSubmit={submit}>
        <Stack gap="sm">
          {linie && (
            <Text size="sm" c="dimmed">
              Material: {linie.nume}
              {linie.nrCart ? ` (${linie.nrCart})` : ""}, {linie.um}
            </Text>
          )}
          <DateInput
            label="Data"
            valueFormat="DD.MM.YYYY"
            placeholder="ZZ.LL.AAAA"
            withAsterisk
            w={155}
            {...form.getInputProps("data")}
          />
          <Select
            label="Șofer"
            placeholder="Alegeți un șofer"
            withAsterisk
            searchable
            filter={fuzzyOptionsFilter}
            data={sofer.options}
            description={sofer.description}
            nothingFoundMessage={sofer.nothingFoundMessage}
            {...form.getInputProps("soferId")}
          />
          <Select
            label="Vehicul"
            placeholder="Alegeți un vehicul"
            withAsterisk
            searchable
            filter={fuzzyOptionsFilter}
            data={vehicul.options}
            description={vehicul.description}
            nothingFoundMessage={vehicul.nothingFoundMessage}
            {...form.getInputProps("vehiculId")}
          />
          <NumberInput
            label={linie ? `Cantitate (${linie.um})` : "Cantitate"}
            min={0}
            decimalScale={3}
            placeholder="12.5"
            withAsterisk
            w={155}
            {...form.getInputProps("cantitate")}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={inchide}>
              Anulează
            </Button>
            <Button type="submit" loading={create.isPending}>
              Adaugă
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
