import { Fieldset, Paper, Select, Table, Text } from "@mantine/core";
import type { InfoVehicul, VehiculListItem } from "@canalcik/server/api-types";
import { infoVehicul } from "@canalcik/server/derived";
import type { UseFormReturnType } from "@mantine/form";
import { useVehicule } from "../../api/vehicule.ts";
import { vehiculLabel } from "../../lib/labels.ts";
import { fuzzyOptionsFilter } from "../../lib/search.ts";
import type { ActFormValues } from "./actForm.ts";

/** The vehicle rows of the act, in the order and wording the template prints them. */
const CAMPURI_VEHICUL: { key: keyof InfoVehicul; label: string }[] = [
  { key: "nrInventar", label: "Nr. inventar" },
  { key: "nrInregistrare", label: "Nr. de înregistrare" },
  { key: "denumireVehicul", label: "Denumire conform datelor contabile" },
  { key: "anProducerii", label: "Anul producerii" },
];

export function VehiculSection({ form }: { form: UseFormReturnType<ActFormValues> }) {
  const vehicule = useVehicule();
  const { vehiculId } = form.getValues();
  const ales = (vehicule.data ?? []).find((v) => String(v.id) === vehiculId);

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
        value={vehiculId}
        error={form.errors.vehiculId}
        onChange={(id) => form.setFieldValue("vehiculId", id)}
      />

      {ales && <RezumatVehicul vehicul={ales} />}
    </Fieldset>
  );
}

/**
 * What the act will print for this vehicul. Read-only and never stored: it is
 * the fleet record, so a wrong value is fixed in Vehicule, not here.
 */
function RezumatVehicul({ vehicul }: { vehicul: VehiculListItem }) {
  const info = infoVehicul(vehicul);

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
                {info[c.key].trim() || (
                  <Text span c="dimmed" inherit>
                    —
                  </Text>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
