import { Combobox, Text, TextInput, useCombobox } from "@mantine/core";
import fuzzysort from "fuzzysort";
import { useMemo, type ReactNode } from "react";
import { evidentiaza, type ProdusIndexat } from "../../lib/produse.tsx";
import { IndicatorStatus } from "./AutoFillTextInput.tsx";
import type { StatusCamp } from "./actForm.ts";

/**
 * The "Piesa de schimb" cell: a search over the product catalogue whose text is
 * itself the field's value, so a part the catalogue does not have can still be
 * typed in free-hand. Picking a hit fills the row's code and UM as well.
 */
export function ProdusCombobox({
  produse,
  value,
  codSelectat,
  status,
  error,
  onChange,
  onSelect,
}: {
  produse: ProdusIndexat[];
  value: string;
  codSelectat: string | null;
  status: StatusCamp;
  error?: ReactNode;
  onChange: (nume: string) => void;
  onSelect: (produs: ProdusIndexat) => void;
}) {
  const combobox = useCombobox();

  const rezultate = useMemo(() => {
    const trimmed = value.trim();
    if (trimmed === "") return [];
    return fuzzysort.go(trimmed, produse, {
      keys: [(p) => p.nume, (p) => p.cale.join(" › "), (p) => p.cod],
      limit: 50,
    });
  }, [value, produse]);

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(cod) => {
        const ales = produse.find((p) => p.cod === cod);
        if (ales) onSelect(ales);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <TextInput
          placeholder="Caută un produs după denumire sau categorie"
          value={value}
          error={error}
          onChange={(e) => {
            onChange(e.currentTarget.value);
            combobox.openDropdown();
          }}
          onFocus={() => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex("active");
          }}
          onBlur={() => combobox.closeDropdown()}
          rightSection={<IndicatorStatus status={status} />}
          rightSectionPointerEvents="auto"
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options mah={320} style={{ overflowY: "auto" }}>
          {value.trim() === "" ? (
            <Combobox.Empty>Introduceți un termen de căutare.</Combobox.Empty>
          ) : rezultate.length === 0 ? (
            <Combobox.Empty>Niciun produs găsit.</Combobox.Empty>
          ) : (
            rezultate.map((r) => {
              const [rezNume, rezCale, rezCod] = r;
              return (
                <Combobox.Option
                  value={r.obj.cod}
                  key={r.obj.cod}
                  active={r.obj.cod === codSelectat}
                  selected={r.obj.cod === codSelectat}
                >
                  <Text size="sm" fw={500}>
                    {evidentiaza(rezNume, r.obj.nume)}{" "}
                    <Text span c="dimmed" size="sm">
                      · {r.obj.unitate} · {evidentiaza(rezCod, r.obj.cod)}
                    </Text>
                  </Text>
                  <Text size="xs" c="dimmed">
                    {evidentiaza(rezCale, r.obj.cale.join(" › "))}
                  </Text>
                </Combobox.Option>
              );
            })
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
