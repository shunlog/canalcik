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
import { useMemo, useState } from "react";
import { useVehicule } from "../../api/vehicule.ts";
import { ButonCautaProdus, CautaProdus } from "../../components/CautaProdus.tsx";
import { usePulse, type PulseProps } from "../../components/usePulse.ts";
import { vehiculLabel } from "../../lib/labels.ts";
import type { ProdusIndexat } from "../../lib/produse.tsx";
import { fuzzyOptionsFilter } from "../../lib/search.ts";
import { newMaterialRow, type ComandaFormValues } from "./comandaForm.ts";

export function MaterialeComandaEditor({
  form,
}: {
  form: UseFormReturnType<ComandaFormValues>;
}) {
  const rows = form.getValues().materiale;
  const vehicule = useVehicule();
  const [randCautat, setRandCautat] = useState<number | null>(null);
  const { pulse, pulseProps } = usePulse<number>();

  const optiuniVehicul = useMemo(
    () => (vehicule.data ?? []).map((v) => ({ value: String(v.id), label: vehiculLabel(v) })),
    [vehicule.data],
  );

  // Picking a catalogue product prefills the three fields; they stay ordinary
  // editable text afterward, so a picked product can still be hand-corrected
  // and a material the catalogue doesn't carry can be typed in from scratch.
  const alege = (produs: ProdusIndexat, i: number) => {
    form.setFieldValue(`materiale.${i}.cod`, produs.cod);
    form.setFieldValue(`materiale.${i}.nume`, produs.nume);
    form.setFieldValue(`materiale.${i}.um`, produs.unitate);
    pulse(i);
  };

  return (
    <Fieldset legend="Lista materialelor" maw={1150}>
      <Stack gap="xs">
        <Table.ScrollContainer minWidth={1100} maw={1150}>
          <Table withTableBorder verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={50}>Nr.</Table.Th>
                <Table.Th miw={280}>Denumirea materialului</Table.Th>
                <Table.Th w={280}>Specificația (vehicul)</Table.Th>
                <Table.Th w={100}>UM</Table.Th>
                <Table.Th w={120}>Cantitate</Table.Th>
                <Table.Th w={150}>Nomenclator D365</Table.Th>
                <Table.Th w={50} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row, i) => (
                <RandMaterial
                  key={row.key}
                  nr={i + 1}
                  index={i}
                  form={form}
                  optiuniVehicul={optiuniVehicul}
                  onCauta={() => setRandCautat(i)}
                  pulseProps={pulseProps(i)}
                />
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <Button
          variant="light"
          w="fit-content"
          leftSection={<IconPlus size={16} />}
          onClick={() =>
            form.insertListItem("materiale", newMaterialRow(rows.at(-1)?.vehiculId ?? null))
          }
        >
          Adaugă linie
        </Button>
      </Stack>

      <CautaProdus rand={randCautat} onInchide={() => setRandCautat(null)} onAlege={alege} />
    </Fieldset>
  );
}

function RandMaterial({
  nr,
  index: i,
  form,
  optiuniVehicul,
  onCauta,
  pulseProps,
}: {
  nr: number;
  index: number;
  form: UseFormReturnType<ComandaFormValues>;
  optiuniVehicul: { value: string; label: string }[];
  onCauta: () => void;
  pulseProps: PulseProps;
}) {
  return (
    <Table.Tr>
      <Table.Td>{nr}</Table.Td>
      <Table.Td>
        <Group gap={4} wrap="nowrap">
          <TextInput
            style={{ flex: 1 }}
            placeholder="Denumirea materialului"
            {...form.getInputProps(`materiale.${i}.nume`)}
            {...pulseProps}
          />
          <ButonCautaProdus onClick={onCauta} />
        </Group>
      </Table.Td>
      <Table.Td>
        {/* The document prints this vehicul's plate — see derived.ts. */}
        <Select
          placeholder="Caută un vehicul"
          searchable
          clearable
          filter={fuzzyOptionsFilter}
          nothingFoundMessage="Niciun rezultat"
          data={optiuniVehicul}
          {...form.getInputProps(`materiale.${i}.vehiculId`)}
        />
      </Table.Td>
      <Table.Td>
        <TextInput placeholder="buc" {...form.getInputProps(`materiale.${i}.um`)} {...pulseProps} />
      </Table.Td>
      <Table.Td>
        <NumberInput
          min={0}
          decimalScale={3}
          placeholder="2"
          {...form.getInputProps(`materiale.${i}.cantitate`)}
        />
      </Table.Td>
      <Table.Td>
        <TextInput
          placeholder="120673"
          {...form.getInputProps(`materiale.${i}.cod`)}
          {...pulseProps}
        />
      </Table.Td>
      <Table.Td>
        <ActionIcon
          color="red"
          variant="subtle"
          aria-label="Șterge linia"
          onClick={() => form.removeListItem("materiale", i)}
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  );
}
