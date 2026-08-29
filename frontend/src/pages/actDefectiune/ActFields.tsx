import { Fieldset, Select, SimpleGrid } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import type { UseFormReturnType } from "@mantine/form";
import { useVehicule } from "../../api/vehicule.ts";
import { vehiculLabel } from "../../lib/labels.ts";
import type { ProdusIndexat } from "../../lib/produse.tsx";
import { fuzzyOptionsFilter } from "../../lib/search.ts";
import { AutoFillTextInput } from "./AutoFillTextInput.tsx";
import { DefectiuniEditor } from "./DefectiuniEditor.tsx";
import { LucrariEditor } from "./LucrariEditor.tsx";
import { PieseSchimbEditor } from "./PieseSchimbEditor.tsx";
import { statusCamp, vehiculAuto, type ActFormValues } from "./actForm.ts";

export function ActFields({
  form,
  produse,
}: {
  form: UseFormReturnType<ActFormValues>;
  produse: ProdusIndexat[];
}) {
  const vehicule = useVehicule();
  const values = form.getValues();
  const auto = values.autoVehicul;

  return (
    <>
      <DateInput
        label="Data"
        valueFormat="DD.MM.YYYY"
        placeholder="ZZ.LL.AAAA"
        withAsterisk
        w={200}
        {...form.getInputProps("data")}
      />

      <Fieldset legend="Vehicul" mt="md">
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
            form.setFieldValue("vehiculId", id);
            const ales = (vehicule.data ?? []).find((v) => String(v.id) === id);
            if (!ales) return;
            const campuri = vehiculAuto(ales);
            form.setFieldValue("autoVehicul", campuri);
            form.setFieldValue("nrInventar", campuri.nrInventar);
            form.setFieldValue("nrInregistrare", campuri.nrInregistrare);
            form.setFieldValue("denumireVehicul", campuri.denumireVehicul);
            form.setFieldValue("anProducerii", campuri.anProducerii);
          }}
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }} mt="md">
          <AutoFillTextInput
            label="Nr. inventar"
            withAsterisk
            status={statusCamp(auto?.nrInventar, values.nrInventar)}
            {...form.getInputProps("nrInventar")}
          />
          <AutoFillTextInput
            label="Nr. de înregistrare"
            withAsterisk
            status={statusCamp(auto?.nrInregistrare, values.nrInregistrare)}
            {...form.getInputProps("nrInregistrare")}
          />
          <AutoFillTextInput
            label="Denumire conform datelor contabile"
            withAsterisk
            status={statusCamp(auto?.denumireVehicul, values.denumireVehicul)}
            {...form.getInputProps("denumireVehicul")}
          />
          <AutoFillTextInput
            label="Anul producerii"
            status={statusCamp(auto?.anProducerii, values.anProducerii)}
            {...form.getInputProps("anProducerii")}
          />
        </SimpleGrid>
      </Fieldset>

      <Fieldset legend="Lista defecțiunilor" mt="md">
        <DefectiuniEditor form={form} />
      </Fieldset>

      <Fieldset legend="Lista pieselor de schimb" mt="md">
        <PieseSchimbEditor form={form} produse={produse} />
      </Fieldset>

      <Fieldset legend="Lista lucrărilor de reparații necesare" mt="md">
        <LucrariEditor form={form} />
      </Fieldset>
    </>
  );
}
