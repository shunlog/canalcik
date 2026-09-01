import {
  ActionIcon,
  Button,
  Fieldset,
  Group,
  NumberInput,
  Popover,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  type ComboboxItem,
  type ComboboxParsedItem,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconSearch, IconTrash } from "@tabler/icons-react";
import { useCallback, useMemo } from "react";
import { usePulse } from "../../components/usePulse.ts";
import type { ProdusIndexat } from "../../lib/produse.tsx";
import { fuzzySearch } from "../../lib/search.ts";
import { newPiesaRow, type ActFormValues } from "./actForm.ts";

type Filtreaza = (args: {
  options: ComboboxParsedItem[];
  search: string;
  limit: number;
}) => ComboboxParsedItem[];

export function PieseSchimbEditor({
  form,
  produse,
}: {
  form: UseFormReturnType<ActFormValues>;
  produse: ProdusIndexat[];
}) {
  const rows = form.getValues().pieseSchimb;

  const dupaCod = useMemo(() => new Map(produse.map((p) => [p.cod, p])), [produse]);
  const optiuni = useMemo(
    () => produse.map((p) => ({ value: p.cod, label: p.nume })),
    [produse],
  );

  // The dropdown searches the category path and the code too, not just the name.
  const filtreaza: Filtreaza = useCallback(
    (args) => {
      const { options, search, limit } = args;
      const gasite = fuzzySearch(options as ComboboxItem[], search, [
        (o) => o.label,
        (o) => o.value,
        (o) => dupaCod.get(o.value)?.cale.join(" › "),
      ]);
      return Number.isFinite(limit) ? gasite.slice(0, limit) : gasite;
    },
    [dupaCod],
  );

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
                <RandPiesa
                  key={row.key}
                  nr={i + 1}
                  index={i}
                  form={form}
                  optiuni={optiuni}
                  dupaCod={dupaCod}
                  filtreaza={filtreaza}
                />
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
  optiuni,
  dupaCod,
  filtreaza,
}: {
  nr: number;
  index: number;
  form: UseFormReturnType<ActFormValues>;
  optiuni: ComboboxItem[];
  dupaCod: Map<string, ProdusIndexat>;
  filtreaza: Filtreaza;
}) {
  const [cautareDeschisa, cautare] = useDisclosure(false);
  const { pulse, pulseProps } = usePulse();

  // Picking a catalogue product prefills the three fields; they stay ordinary
  // editable text afterward, so a picked product can still be hand-corrected
  // and a part the catalogue doesn't carry can be typed in from scratch.
  const alege = (cod: string | null) => {
    const produs = cod ? dupaCod.get(cod) : undefined;
    cautare.close();
    if (!produs) return;
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
          <Popover
            opened={cautareDeschisa}
            onClose={cautare.close}
            width={420}
            position="bottom-end"
            withinPortal
            trapFocus
          >
            <Popover.Target>
              <ActionIcon
                variant="light"
                aria-label="Caută în catalog"
                onClick={cautare.toggle}
              >
                <IconSearch size={16} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown>
              <Select
                placeholder="Caută un produs după denumire, categorie sau cod"
                searchable
                clearable
                limit={50}
                data={optiuni}
                filter={filtreaza}
                nothingFoundMessage="Niciun produs găsit"
                renderOption={({ option }) => (
                  <OptiuneProdus option={option} produs={dupaCod.get(option.value)} />
                )}
                value={null}
                onChange={alege}
              />
            </Popover.Dropdown>
          </Popover>
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
          step={1}
          decimalScale={3}
          placeholder="2"
          {...form.getInputProps(`pieseSchimb.${i}.cantitate`)}
        />
      </Table.Td>
      <Table.Td>
        <NumberInput
          min={1}
          step={1}
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

function OptiuneProdus({
  option,
  produs,
}: {
  option: ComboboxItem;
  produs: ProdusIndexat | undefined;
}) {
  return (
    <div>
      <Text size="sm" fw={500}>
        {option.label}
        {produs && (
          <Text span c="dimmed" size="sm">
            {" "}
            · {produs.unitate} · {produs.cod}
          </Text>
        )}
      </Text>
      {produs && (
        <Text size="xs" c="dimmed">
          {produs.cale.join(" › ")}
        </Text>
      )}
    </div>
  );
}
