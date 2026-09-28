import { Fieldset, Select, SimpleGrid } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import type { UseFormReturnType } from "@mantine/form";
import { useSoferVehiculCoupling } from "../../api/coupling.ts";
import { fuzzyOptionsFilter } from "../../lib/search.ts";
import { MaterialeEditor } from "./MaterialeEditor.tsx";
import type { BonFormValues } from "./bonForm.ts";

export function BonFields({ form }: { form: UseFormReturnType<BonFormValues> }) {
  const { soferId, vehiculId } = form.getValues();
  const { sofer, vehicul } = useSoferVehiculCoupling({ soferId, vehiculId });

  return (
    <>
      <Fieldset legend="Bon" maw={800}>
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
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
        </SimpleGrid>
      </Fieldset>

      <Fieldset legend="Materiale" mt="md" maw={800}>
        <MaterialeEditor form={form} />
      </Fieldset>
    </>
  );
}
