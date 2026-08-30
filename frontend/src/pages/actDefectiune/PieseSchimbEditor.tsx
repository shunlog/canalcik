import {
  ActionIcon,
  Button,
  Fieldset,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  type ComboboxItem,
  type ComboboxParsedItem,
} from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useCallback, useMemo } from "react";
import type { ProdusIndexat } from "../../lib/produse.tsx";
import { fuzzySearch } from "../../lib/search.ts";
import { newPiesaRow, type ActFormValues } from "./actForm.ts";

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
  const filtreaza = useCallback(
    (args: { options: ComboboxParsedItem[]; search: string; limit: number }) => {
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
              {rows.map((row, i) => {
                const produs = dupaCod.get(row.nrNomenclator);
                // A saved act can name a part the catalogue has since dropped.
                // Its code is all that is left of it, so that is what shows.
                const optiuniRand =
                  row.nrNomenclator !== "" && !produs
                    ? [...optiuni, { value: row.nrNomenclator, label: row.nrNomenclator }]
                    : optiuni;

                return (
                  <Table.Tr key={row.key}>
                    <Table.Td>{i + 1}</Table.Td>
                    <Table.Td>
                      <Select
                        placeholder="Caută un produs după denumire, categorie sau cod"
                        searchable
                        clearable
                        limit={50}
                        data={optiuniRand}
                        filter={filtreaza}
                        nothingFoundMessage="Niciun produs găsit"
                        comboboxProps={{ width: 420, position: "bottom-start" }}
                        renderOption={({ option }) => (
                          <OptiuneProdus option={option} produs={dupaCod.get(option.value)} />
                        )}
                        value={row.nrNomenclator || null}
                        error={form.errors[`pieseSchimb.${i}.nrNomenclator`]}
                        onChange={(cod) =>
                          form.setFieldValue(`pieseSchimb.${i}.nrNomenclator`, cod ?? "")
                        }
                      />
                    </Table.Td>
                    <Table.Td style={{ verticalAlign: "middle" }}>
                      <CelulaDinCatalog value={row.nrNomenclator} />
                    </Table.Td>
                    <Table.Td style={{ verticalAlign: "middle" }}>
                      <CelulaDinCatalog value={produs?.unitate ?? ""} />
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
                        value={row.necesitaInlocuire}
                        onChange={(v) =>
                          form.setFieldValue(
                            `pieseSchimb.${i}.necesitaInlocuire`,
                            v === "nu" ? "nu" : "da",
                          )
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
              })}
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

/** A cell the catalogue answers for: shown, not typed, not stored. */
function CelulaDinCatalog({ value }: { value: string }) {
  return (
    <Text size="sm">
      {value.trim() || (
        <Text span c="dimmed" inherit>
          —
        </Text>
      )}
    </Text>
  );
}
