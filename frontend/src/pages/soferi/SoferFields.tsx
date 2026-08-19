import { Fieldset, NumberInput, SimpleGrid, Stack, Textarea, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import type { UseFormReturnType } from "@mantine/form";
import type { SoferFormValues } from "./soferForm.ts";

const EIP_FIELDS = [
  ["eipScurta", "Scurtă"],
  ["eipIncaltaminte", "Încălțăminte"],
  ["eipCostum", "Costum"],
  ["eipPantaloni", "Pantaloni"],
  ["eipVestaAvertizare", "Vestă avertizare"],
] as const;

export function SoferFields({ form }: { form: UseFormReturnType<SoferFormValues> }) {
  return (
    <Stack>
      <Fieldset legend="Date personale">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <NumberInput
            label="Nr. de pontaj"
            placeholder="6832"
            allowDecimal={false}
            withAsterisk
            {...form.getInputProps("cod")}
          />
          <TextInput label="Nume Prenume" withAsterisk {...form.getInputProps("nume")} />
          <TextInput label="Funcție" {...form.getInputProps("functie")} />
          <TextInput label="Telefon" {...form.getInputProps("telefon")} />
          <TextInput label="Sector" {...form.getInputProps("sector")} />
          <TextInput label="Mărime haină" placeholder="52-53" {...form.getInputProps("marimeHaina")} />
          <TextInput label="Mărime încălțăminte" {...form.getInputProps("marimeIncaltaminte")} />
        </SimpleGrid>
        <Textarea label="Observații" mt="sm" autosize minRows={2} {...form.getInputProps("observatii")} />
      </Fieldset>

      <Fieldset legend="Date eliberare EIP">
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          {EIP_FIELDS.map(([name, label]) => (
            <DateInput
              key={name}
              label={label}
              // Mantine 8 values are "YYYY-MM-DD" strings; valueFormat only
              // changes what is displayed, so the Romanian reading never
              // reaches the API.
              valueFormat="DD.MM.YYYY"
              placeholder="ZZ.LL.AAAA"
              clearable
              {...form.getInputProps(name)}
            />
          ))}
        </SimpleGrid>
      </Fieldset>
    </Stack>
  );
}
