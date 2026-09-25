import { Select, Stack, Title } from "@mantine/core";
import type { InfoVehicul } from "@canalcik/server/api-types";
import { infoVehicul } from "@canalcik/server/derived";
import type { UseFormReturnType } from "@mantine/form";
import { useVehicule } from "../../api/vehicule.ts";
import { vehiculLabel } from "../../lib/labels.ts";
import { fuzzyOptionsFilter } from "../../lib/search.ts";
import { RezumatCampuri } from "./RezumatCampuri.tsx";
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
  const info = ales && infoVehicul(ales);

  return (
    <Stack gap="xs" maw={480}>
      <Title order={3}>Vehicul</Title>
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

      {info && (
        <RezumatCampuri
          campuri={CAMPURI_VEHICUL.map((c) => ({ label: c.label, value: info[c.key] }))}
        />
      )}
    </Stack>
  );
}
