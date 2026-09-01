import {
  ActionIcon,
  Button,
  Fieldset,
  Group,
  NumberInput,
  Select,
  Stack,
  Table,
  TextInput,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import {
  CautaProdus,
  useCatalogProduse,
  type CatalogProduse,
} from "../../components/CautaProdus.tsx";
import { usePulse } from "../../components/usePulse.ts";
import type { ProdusIndexat } from "../../lib/produse.tsx";
import { newPiesaRow, type ActFormValues } from "./actForm.ts";

export function PieseSchimbEditor({ form }: { form: UseFormReturnType<ActFormValues> }) {
  const rows = form.getValues().pieseSchimb;
  const catalog = useCatalogProduse();

  return (
    <Fieldset legend="Lista pieselor de schimb">
      <Stack gap="xs">
        <Table.ScrollContainer minWidth={1100}>
          <Table withTableBorder verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={50}>Nr.</Table.Th>
                <Table.Th miw={280}>Piesa de schimb</Table.Th>
                <Table.Th w={140}>Nr. nomenclator</Table.Th>
                <Table.Th w={100}>UM</Table.Th>
                <Table.Th w={120}>Cantitate</Table.Th>
                <Table.Th w={180}>Cauza (rând tab. 1)</Table.Th>
                <Table.Th w={130}>Necesită înlocuire</Table.Th>
                <Table.Th w={50} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row, i) => (
                <RandPiesa key={row.key} nr={i + 1} index={i} form={form} catalog={catalog} />
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <Button
          variant="light"
          w="fit-content"
          leftSection={<IconPlus size={16} />}
          onClick={() => form.insertListItem("pieseSchimb", newPiesaRow())}
        >
          Adaugă linie
        </Button>
      </Stack>
    </Fieldset>
  );
}

function RandPiesa({
  nr,
  index: i,
  form,
  catalog,
}: {
  nr: number;
  index: number;
  form: UseFormReturnType<ActFormValues>;
  catalog: CatalogProduse;
}) {
  const { pulse, pulseProps } = usePulse();

  // Picking a catalogue product prefills the three fields; they stay ordinary
  // editable text afterward, so a picked product can still be hand-corrected
  // and a part the catalogue doesn't carry can be typed in from scratch.
  const alege = (produs: ProdusIndexat) => {
    form.setFieldValue(`pieseSchimb.${i}.nrNomenclator`, produs.cod);
    form.setFieldValue(`pieseSchimb.${i}.piesaSchimb`, produs.nume);
    form.setFieldValue(`pieseSchimb.${i}.um`, produs.unitate);
    pulse();
  };

  return (
    <Table.Tr>
      <Table.Td>{nr}</Table.Td>
      <Table.Td>
        <Group gap={4} wrap="nowrap">
          <TextInput
            style={{ flex: 1 }}
            placeholder="Denumirea piesei"
            {...form.getInputProps(`pieseSchimb.${i}.piesaSchimb`)}
            {...pulseProps}
          />
          <CautaProdus catalog={catalog} onAlege={alege} />
        </Group>
      </Table.Td>
      <Table.Td>
        <TextInput
          placeholder="120673"
          {...form.getInputProps(`pieseSchimb.${i}.nrNomenclator`)}
          {...pulseProps}
        />
      </Table.Td>
      <Table.Td>
        <TextInput
          placeholder="buc"
          {...form.getInputProps(`pieseSchimb.${i}.um`)}
          {...pulseProps}
        />
      </Table.Td>
      <Table.Td>
        <NumberInput
          min={0}
          decimalScale={3}
          placeholder="2"
          {...form.getInputProps(`pieseSchimb.${i}.cantitate`)}
        />
      </Table.Td>
      <Table.Td>
        <NumberInput
          min={1}
          allowDecimal={false}
          placeholder="1"
          {...form.getInputProps(`pieseSchimb.${i}.cauza`)}
        />
      </Table.Td>
      <Table.Td>
        <Select
          data={["da", "nu"]}
          allowDeselect={false}
          value={form.getValues().pieseSchimb[i].necesitaInlocuire}
          onChange={(v) =>
            form.setFieldValue(`pieseSchimb.${i}.necesitaInlocuire`, v === "nu" ? "nu" : "da")
          }
        />
      </Table.Td>
      <Table.Td>
        <ActionIcon
          color="red"
          variant="subtle"
          aria-label="Șterge linia"
          onClick={() => form.removeListItem("pieseSchimb", i)}
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  );
}
