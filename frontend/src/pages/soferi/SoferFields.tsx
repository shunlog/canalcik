import { Fieldset, NumberInput, SimpleGrid, Stack, Table, Textarea, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import type { UseFormReturnType } from "@mantine/form";
import { eipExpiryDate, type EipEquipmentField } from "@canalcik/server/derived";
import { formatIsoDate, todayLocalIso } from "../../lib/forms.ts";
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
    <Stack maw={720}>
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
        <Table.ScrollContainer minWidth={480} maw={620}>
          <Table withTableBorder verticalSpacing="sm" w="auto">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Echipament</Table.Th>
                <Table.Th w={165}>Data eliberării</Table.Th>
                <Table.Th w={135}>Data expirării</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {EIP_FIELDS.map(([name, label]) => {
                const expiryDate = eipExpiryDate(
                  form.getValues()[name],
                  name as EipEquipmentField,
                );
                const expired = expiryDate !== null && expiryDate < todayLocalIso();

                return (
                  <Table.Tr
                    key={name}
                  >
                    <Table.Td>{label}</Table.Td>
                    <Table.Td>
                      <DateInput
                        aria-label={`Data eliberării pentru ${label}`}
                        // Mantine 8 values are "YYYY-MM-DD" strings; valueFormat only
                        // changes what is displayed, so the Romanian reading never
                        // reaches the API.
                        valueFormat="DD.MM.YYYY"
                        placeholder="ZZ.LL.AAAA"
                        clearable
                        w={155}
                        {...form.getInputProps(name)}
                      />
                    </Table.Td>
                    <Table.Td>
                      {expired ? (
                        <>⚠️ {formatIsoDate(expiryDate)}</>
                      ) : (
                        formatIsoDate(expiryDate)
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Fieldset>
    </Stack>
  );
}
