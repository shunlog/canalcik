import { Stack } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import type { UseFormReturnType } from "@mantine/form";
import type { ProdusIndexat } from "../../lib/produse.tsx";
import { DefectiuniEditor } from "./DefectiuniEditor.tsx";
import { LucrariEditor } from "./LucrariEditor.tsx";
import { PieseSchimbEditor } from "./PieseSchimbEditor.tsx";
import { VehiculSection } from "./VehiculSection.tsx";
import type { ActFormValues } from "./actForm.ts";

export function ActFields({
  form,
  produse,
}: {
  form: UseFormReturnType<ActFormValues>;
  produse: ProdusIndexat[];
}) {
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
      <VehiculSection form={form} />
      <DefectiuniEditor form={form} />
      <PieseSchimbEditor form={form} produse={produse} />
      <LucrariEditor form={form} />
    </Stack>
  );
}
