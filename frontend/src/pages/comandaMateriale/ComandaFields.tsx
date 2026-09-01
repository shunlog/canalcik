import { Stack } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import type { UseFormReturnType } from "@mantine/form";
import { MaterialeComandaEditor } from "./MaterialeComandaEditor.tsx";
import type { ComandaFormValues } from "./comandaForm.ts";

export function ComandaFields({ form }: { form: UseFormReturnType<ComandaFormValues> }) {
  return (
    <Stack gap="md">
      <DateInput
        label="Data"
        valueFormat="DD.MM.YYYY"
        placeholder="ZZ.LL.AAAA"
        withAsterisk
        w={200}
        {...form.getInputProps("data")}
      />
      <MaterialeComandaEditor form={form} />
    </Stack>
  );
}
