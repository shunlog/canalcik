import { Alert, Fieldset, Paper, Select, Table, Text } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useVehicule } from "../../api/vehicule.ts";
import { vehiculLabel } from "../../lib/labels.ts";
import { fuzzyOptionsFilter } from "../../lib/search.ts";
import { vehiculAuto, vehiculGol, type ActFormValues, type VehiculAuto } from "./actForm.ts";

/** The vehicle rows of the act, in the order and wording the template prints them. */
const CAMPURI_VEHICUL: { key: keyof VehiculAuto; label: string; obligatoriu: boolean }[] = [
  { key: "nrInventar", label: "Nr. inventar", obligatoriu: true },
  { key: "nrInregistrare", label: "Nr. de înregistrare", obligatoriu: true },
  { key: "denumireVehicul", label: "Denumire conform datelor contabile", obligatoriu: true },
  { key: "anProducerii", label: "Anul producerii", obligatoriu: false },
];

export function VehiculSection({ form }: { form: UseFormReturnType<ActFormValues> }) {
  const vehicule = useVehicule();
  const values = form.getValues();

  return (
    <Fieldset legend="Vehicul">
      <Select
        placeholder="Caută un vehicul după număr, model sau nr. inventar"
        searchable
        clearable
        filter={fuzzyOptionsFilter}
        nothingFoundMessage="Niciun rezultat"
        maw={480}
        data={(vehicule.data ?? []).map((v) => ({ value: String(v.id), label: vehiculLabel(v) }))}
        value={values.vehiculId}
        onChange={(id) => {
          const ales = (vehicule.data ?? []).find((v) => String(v.id) === id);
          const campuri = ales ? vehiculAuto(ales) : vehiculGol();
          form.setFieldValue("vehiculId", ales ? id : null);
          form.setFieldValue("nrInventar", campuri.nrInventar);
          form.setFieldValue("nrInregistrare", campuri.nrInregistrare);
          form.setFieldValue("denumireVehicul", campuri.denumireVehicul);
          form.setFieldValue("anProducerii", campuri.anProducerii);
        }}
      />

      {values.vehiculId && <RezumatVehicul values={values} />}
    </Fieldset>
  );
}

/**
 * What the selected vehicle will print into the act. Read-only: the values are the
 * vehicle's record, so a wrong one is fixed in Vehicule, not here.
 */
function RezumatVehicul({ values }: { values: ActFormValues }) {
  const lipsa = CAMPURI_VEHICUL.filter((c) => c.obligatoriu && values[c.key].trim() === "");

  return (
    <Paper withBorder radius="sm" mt="xs" maw={480} style={{ overflow: "hidden" }}>
      <Table variant="vertical" layout="fixed" withRowBorders={false}>
        <Table.Tbody>
          {CAMPURI_VEHICUL.map((c) => (
            <Table.Tr key={c.key}>
              <Table.Th w={210} fz="sm" fw={400} c="dimmed">
                {c.label}
              </Table.Th>
              <Table.Td fz="sm">
                {values[c.key].trim() || (
                  <Text span c="dimmed" inherit>
                    —
                  </Text>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {lipsa.length > 0 && (
        <Alert
          variant="light"
          color="yellow"
          radius={0}
          p="xs"
          icon={<IconAlertTriangle size={16} />}
        >
          <Text size="xs">
            Fișa vehiculului nu conține {lipsa.map((c) => c.label.toLowerCase()).join(", ")}.
            Completați-o în secțiunea Vehicule pentru a putea salva actul.
          </Text>
        </Alert>
      )}
    </Paper>
  );
}
