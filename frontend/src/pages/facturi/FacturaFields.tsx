import { Fieldset } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import type { UseFormReturnType } from "@mantine/form";
import { MaterialeFacturaEditor } from "./MaterialeFacturaEditor.tsx";
import type { FacturaFormValues } from "./facturaForm.ts";

export function FacturaFields({ form }: { form: UseFormReturnType<FacturaFormValues> }) {
  return (
    <>
      <Fieldset legend="Factură" maw={250}>
        <DateInput
          label="Data"
          valueFormat="DD.MM.YYYY"
          placeholder="ZZ.LL.AAAA"
          withAsterisk
          w={155}
          {...form.getInputProps("data")}
        />
      </Fieldset>

      <Fieldset legend="Materiale" mt="md" maw={960}>
        <MaterialeFacturaEditor form={form} />
      </Fieldset>
    </>
  );
}
