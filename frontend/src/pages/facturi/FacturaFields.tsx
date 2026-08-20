import { Fieldset, SimpleGrid } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import type { UseFormReturnType } from "@mantine/form";
import { MaterialeFacturaEditor } from "./MaterialeFacturaEditor.tsx";
import type { FacturaFormValues } from "./facturaForm.ts";

export function FacturaFields({ form }: { form: UseFormReturnType<FacturaFormValues> }) {
  return (
    <>
      <Fieldset legend="Factură">
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <DateInput
            label="Data"
            valueFormat="DD.MM.YYYY"
            placeholder="ZZ.LL.AAAA"
            withAsterisk
            {...form.getInputProps("data")}
          />
        </SimpleGrid>
      </Fieldset>

      <Fieldset legend="Materiale" mt="md">
        <MaterialeFacturaEditor form={form} />
      </Fieldset>
    </>
  );
}
