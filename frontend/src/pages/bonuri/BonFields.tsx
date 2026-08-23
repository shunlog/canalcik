import { Fieldset, Select, SimpleGrid } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import type { UseFormReturnType } from "@mantine/form";
import { useSoferi } from "../../api/soferi.ts";
import { useVehicule } from "../../api/vehicule.ts";
import { soferLabel, vehiculLabel } from "../../lib/labels.ts";
import { fuzzyOptionsFilter } from "../../lib/search.ts";
import { MaterialeEditor } from "./MaterialeEditor.tsx";
import type { BonFormValues } from "./bonForm.ts";

export function BonFields({ form }: { form: UseFormReturnType<BonFormValues> }) {
  const soferi = useSoferi();
  const vehicule = useVehicule();

  return (
    <>
      <Fieldset legend="Bon">
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <DateInput
            label="Data"
            valueFormat="DD.MM.YYYY"
            placeholder="ZZ.LL.AAAA"
            withAsterisk
            {...form.getInputProps("data")}
          />
          <Select
            label="Șofer"
            placeholder="Alegeți un șofer"
            withAsterisk
            searchable
            filter={fuzzyOptionsFilter}
            nothingFoundMessage="Niciun rezultat"
            data={(soferi.data ?? []).map((s) => ({ value: String(s.id), label: soferLabel(s) }))}
            {...form.getInputProps("soferId")}
          />
          <Select
            label="Vehicul"
            placeholder="Alegeți un vehicul"
            withAsterisk
            searchable
            filter={fuzzyOptionsFilter}
            nothingFoundMessage="Niciun rezultat"
            data={(vehicule.data ?? []).map((v) => ({ value: String(v.id), label: vehiculLabel(v) }))}
            {...form.getInputProps("vehiculId")}
          />
        </SimpleGrid>
      </Fieldset>

      <Fieldset legend="Materiale" mt="md">
        <MaterialeEditor form={form} />
      </Fieldset>
    </>
  );
}
