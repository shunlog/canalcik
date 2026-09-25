import { Checkbox, Fieldset, Group } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import type { UseFormReturnType } from "@mantine/form";
import { HelpTooltip } from "../../components/HelpTooltip.tsx";
import { MaterialeFacturaEditor } from "./MaterialeFacturaEditor.tsx";
import type { FacturaFormValues } from "./facturaForm.ts";

export function FacturaFields({ form }: { form: UseFormReturnType<FacturaFormValues> }) {
  return (
    <>
      <Group align="flex-end" gap="xl">
        <DateInput
          label="Data"
          valueFormat="DD.MM.YYYY"
          placeholder="ZZ.LL.AAAA"
          withAsterisk
          w={155}
          {...form.getInputProps("data")}
        />

        <HelpTooltip label="Lista de piese ramase la depozit de lunile precedente">
          <Checkbox
            label="Nu din luna asta"
            {...form.getInputProps("ramas", { type: "checkbox" })}
          />
        </HelpTooltip>
      </Group>

      <Fieldset legend="Materiale" mt="md" maw={960}>
        <MaterialeFacturaEditor form={form} />
      </Fieldset>
    </>
  );
}
