import {
  ActionIcon,
  Popover,
  Select,
  Text,
  type ComboboxItem,
  type ComboboxParsedItem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useCallback, useMemo } from "react";
import { useProduse } from "../api/produse.ts";
import { aplatizeaza, type ProdusIndexat } from "../lib/produse.tsx";
import { fuzzySearch } from "../lib/search.ts";

type Filtreaza = (args: {
  options: ComboboxParsedItem[];
  search: string;
  limit: number;
}) => ComboboxParsedItem[];

export interface CatalogProduse {
  optiuni: ComboboxItem[];
  dupaCod: Map<string, ProdusIndexat>;
  filtreaza: Filtreaza;
}

/**
 * Fetches the produse catalogue and indexes it for the picker below. Call it
 * once per table rather than once per row: the index covers the whole
 * catalogue, so every row of a table shares one.
 */
export function useCatalogProduse(): CatalogProduse {
  const { data } = useProduse();

  const produse = useMemo(() => (data ?? []).flatMap((c) => aplatizeaza(c, [])), [data]);
  const dupaCod = useMemo(() => new Map(produse.map((p) => [p.cod, p])), [produse]);
  const optiuni = useMemo(() => produse.map((p) => ({ value: p.cod, label: p.nume })), [produse]);

  // The dropdown searches the category path and the code too, not just the name.
  const filtreaza: Filtreaza = useCallback(
    ({ options, search, limit }) => {
      const gasite = fuzzySearch(options as ComboboxItem[], search, [
        (o) => o.label,
        (o) => o.value,
        (o) => dupaCod.get(o.value)?.cale.join(" › "),
      ]);
      return Number.isFinite(limit) ? gasite.slice(0, limit) : gasite;
    },
    [dupaCod],
  );

  return { optiuni, dupaCod, filtreaza };
}

/**
 * The magnifier next to a line's name input: opens the catalogue and hands back
 * the product picked. What a caller does with it is its own business — every
 * table prefills its own set of columns, and they stay editable afterward.
 */
export function CautaProdus({
  catalog,
  onAlege,
}: {
  catalog: CatalogProduse;
  onAlege: (produs: ProdusIndexat) => void;
}) {
  const [deschisa, cautare] = useDisclosure(false);

  const alege = (cod: string | null) => {
    const produs = cod ? catalog.dupaCod.get(cod) : undefined;
    cautare.close();
    if (produs) onAlege(produs);
  };

  return (
    <Popover
      opened={deschisa}
      onClose={cautare.close}
      width={420}
      position="bottom-end"
      withinPortal
      trapFocus
    >
      <Popover.Target>
        <ActionIcon variant="light" aria-label="Caută în catalog" onClick={cautare.toggle}>
          <IconSearch size={16} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Select
          placeholder="Caută un produs după denumire, categorie sau cod"
          searchable
          clearable
          limit={50}
          data={catalog.optiuni}
          filter={catalog.filtreaza}
          nothingFoundMessage="Niciun produs găsit"
          renderOption={({ option }) => (
            <OptiuneProdus option={option} produs={catalog.dupaCod.get(option.value)} />
          )}
          value={null}
          onChange={alege}
        />
      </Popover.Dropdown>
    </Popover>
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
