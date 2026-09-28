import { Select, Stack, Title } from "@mantine/core";
import { infoSofer } from "@canalcik/server/derived";
import type { UseFormReturnType } from "@mantine/form";
import { useSoferVehiculCoupling } from "../../api/coupling.ts";
import { fuzzyOptionsFilter } from "../../lib/search.ts";
import { RezumatCampuri } from "./RezumatCampuri.tsx";
import type { ActFormValues } from "./actForm.ts";

/**
 * The act's "Avizat" line. "Funcția" is not picked but derived from the
 * vehicul's type, so it stays blank until a vehicul is chosen above.
 */
export function SoferSection({ form }: { form: UseFormReturnType<ActFormValues> }) {
  const { soferId, vehiculId } = form.getValues();
  const { soferi, vehicule, sofer } = useSoferVehiculCoupling({ soferId, vehiculId });
  const ales = soferi.find((s) => String(s.id) === soferId);
  const vehicul = vehicule.find((v) => String(v.id) === vehiculId);
  const info = ales && vehicul && infoSofer(ales, vehicul);

  return (
    <Stack gap="xs" maw={480}>
      <Title order={3}>Șofer</Title>
      <Select
        placeholder="Caută un șofer după nume sau nr. de pontaj"
        searchable
        clearable
        filter={fuzzyOptionsFilter}
        data={sofer.options}
        description={sofer.description}
        nothingFoundMessage={sofer.nothingFoundMessage}
        maw={480}
        value={soferId}
        error={form.errors.soferId}
        onChange={(id) => form.setFieldValue("soferId", id)}
      />

      {ales && (
        <RezumatCampuri
          campuri={[
            { label: "Prenume și nume", value: ales.nume },
            { label: "Funcția", value: info ? info.functiaSofer : "" },
          ]}
        />
      )}
    </Stack>
  );
}
