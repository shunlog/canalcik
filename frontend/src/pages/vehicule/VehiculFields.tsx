import { Fieldset, NumberInput, SimpleGrid, Stack, Textarea, TextInput } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import type { VehiculFormValues } from "./vehiculForm.ts";

export function VehiculFields({ form }: { form: UseFormReturnType<VehiculFormValues> }) {
  return (
    <Stack>
      <Fieldset legend="Identificare">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput label="Nr. înmatriculare (litere)" placeholder="MRZ" withAsterisk {...form.getInputProps("litere")} />
          {/* Not a NumberInput: values like "f/n" occur in the source sheet. */}
          <TextInput label="Nr. înmatriculare (cifre)" placeholder="40" withAsterisk {...form.getInputProps("cifre")} />
          <NumberInput label="Nr. Inventar" allowDecimal={false} withAsterisk {...form.getInputProps("nrInventar")} />
          <NumberInput label="Nr. Garaj" allowDecimal={false} withAsterisk {...form.getInputProps("nrGaraj")} />
          <TextInput label="Destinația" placeholder="Tractor" withAsterisk {...form.getInputProps("tip")} />
          <TextInput label="Marcă / Model" placeholder="MTZ-82" withAsterisk {...form.getInputProps("model")} />
        </SimpleGrid>
      </Fieldset>

      <Fieldset legend="Exploatare">
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <NumberInput label="An fabricație" allowDecimal={false} {...form.getInputProps("anProducere")} />
          <NumberInput label="Km actuali" allowDecimal={false} thousandSeparator=" " {...form.getInputProps("kmActuali")} />
          <TextInput label="Sector" {...form.getInputProps("sector")} />
        </SimpleGrid>
        <Textarea label="Utilaje auxiliare" mt="sm" autosize minRows={2} {...form.getInputProps("utilajeAuxiliare")} />
        <Textarea
          label="Lucrări necesare luna viitoare"
          mt="sm"
          autosize
          minRows={2}
          {...form.getInputProps("lucrariLunaViitoare")}
        />
      </Fieldset>
    </Stack>
  );
}
