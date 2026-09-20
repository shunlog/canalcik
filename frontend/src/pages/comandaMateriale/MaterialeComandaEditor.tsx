import {
  ActionIcon,
  Button,
  Fieldset,
  Group,
  NumberInput,
  MultiSelect,
  Select,
  Stack,
  Table,
  TextInput,
  Title,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useActeDefectiune } from "../../api/acteDefectiune.ts";
import { useVehicule } from "../../api/vehicule.ts";
import { ButonCautaProdus, CautaProdus } from "../../components/CautaProdus.tsx";
import { RefLinkList } from "../../components/RefLinkList.tsx";
import { usePulse, type PulseProps } from "../../components/usePulse.ts";
import { actDefectiuneLabel, vehiculLabel } from "../../lib/labels.ts";
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
  const acte = useActeDefectiune();
  const [randCautat, setRandCautat] = useState<number | null>(null);
  const { pulse, pulseProps } = usePulse<number>();

  const optiuniVehicul = useMemo(
    () => (vehicule.data ?? []).map((v) => ({ value: String(v.id), label: vehiculLabel(v) })),
    [vehicule.data],
  );

  const optiuniActe = useMemo(
    () =>
      (acte.data ?? []).map((a) => ({
        value: String(a.id),
        label: actDefectiuneLabel(a),
      })),
    [acte.data],
  );

  // This is deliberately calculated from the selection rather than from the
  // saved comanda. A newly picked act is visible immediately, before Save.
  const materialeDinActe = useMemo(() => {
    const selectate = new Set(form.getValues().acteDefectiuneIds);
    return (acte.data ?? [])
      .filter((a) => selectate.has(String(a.id)))
      .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id)
      .flatMap((a) =>
        a.pieseSchimb.map((piesa) => ({
          key: `${a.id}-${piesa.nr}`,
          nume: piesa.piesaSchimb,
          spec: a.vehicul.nrInmatriculare,
          um: piesa.um,
          cantitate: piesa.cantitate,
          cod: piesa.nrNomenclator,
        })),
      );
  }, [acte.data, form.values.acteDefectiuneIds]);

  const acteSelectate = useMemo(() => {
    const selectate = new Set(form.getValues().acteDefectiuneIds);
    return (acte.data ?? [])
      .filter((a) => selectate.has(String(a.id)))
      .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id);
  }, [acte.data, form.values.acteDefectiuneIds]);

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
      
      <Stack gap="s">
        <Title order={4} size="h5">
          Acte de Defecțiune legate
        </Title>
        <RefLinkList
          items={acteSelectate.map((act) => ({
            id: act.id,
            label: actDefectiuneLabel(act),
            to: `/act-defectiune/${act.id}`,
          }))}
          empty="Niciun act de defecțiune selectat."
        />
        <MultiSelect
          label="Modifică legăturile"
          placeholder="Selectează actele de defecțiune"
          searchable
          clearable
          hidePickedOptions
          filter={fuzzyOptionsFilter}
          nothingFoundMessage="Niciun rezultat"
          data={optiuniActe}
          {...form.getInputProps("acteDefectiuneIds")}
        />

        <Table.ScrollContainer minWidth={1100} maw={1150}>
          <Table withTableBorder verticalSpacing="xs">
            <MaterialeTableHeader />
            <Table.Tbody>
              {materialeDinActe.map((row, i) => (
                <Table.Tr key={row.key}>
                  <Table.Td>{i + 1}</Table.Td>
                  <Table.Td>{row.nume}</Table.Td>
                  <Table.Td>{row.cod}</Table.Td>
                  <Table.Td>{row.spec}</Table.Td>
                  <Table.Td>{row.um}</Table.Td>
                  <Table.Td>{row.cantitate}</Table.Td>
                  <Table.Td />
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <Title order={4} size="h5">
          Materiale adăugate manual
        </Title>
        <Table.ScrollContainer minWidth={1100} maw={1150}>
          <Table withTableBorder verticalSpacing="xs">
            <MaterialeTableHeader />
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

function MaterialeTableHeader() {
  return (
    <Table.Thead>
      <Table.Tr>
        <Table.Th w={50}>Nr.</Table.Th>
        <Table.Th miw={280}>Denumirea materialului</Table.Th>
        <Table.Th w={150}>Nr. nomenclator</Table.Th>
        <Table.Th w={280}>Specificația (vehicul)</Table.Th>
        <Table.Th w={100}>UM</Table.Th>
        <Table.Th w={120}>Cantitate</Table.Th>
        <Table.Th w={50} />
      </Table.Tr>
    </Table.Thead>
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
        <TextInput
          placeholder="120673"
          {...form.getInputProps(`materiale.${i}.cod`)}
          {...pulseProps}
        />
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
