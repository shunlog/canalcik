import {
  Combobox,
  Fieldset,
  Select,
  SimpleGrid,
  Text,
  TextInput,
  Tooltip,
  useCombobox,
} from "@mantine/core";
import { IconAlertTriangle, IconSearch, IconWand } from "@tabler/icons-react";
import fuzzysort from "fuzzysort";
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useProduse } from "../api/produse.ts";
import { useVehicule } from "../api/vehicule.ts";
import { PageHeader } from "../components/PageHeader.tsx";
import { plate, vehiculLabel } from "../lib/labels.ts";
import { aplatizeaza, evidentiaza } from "../lib/produse.tsx";
import { fuzzyOptionsFilter } from "../lib/search.ts";

export interface AutoFillInputHandle {
  setAuto: (value: string) => void;
}

export function ActDefectiunePage() {
  const combobox = useCombobox();
  const [search, setSearch] = useState("");
  const [selectedProdus, setSelectedProdus] = useState<{ cod: string; nume: string } | null>(null);
  const query = useProduse();

  const [vehiculId, setVehiculId] = useState<string | null>(null);
  const vehicule = useVehicule();

  const nrNomenclatorRef = useRef<AutoFillInputHandle>(null);
  const piesaDeSchimbRef = useRef<AutoFillInputHandle>(null);
  const umRef = useRef<AutoFillInputHandle>(null);

  const nrInventarRef = useRef<AutoFillInputHandle>(null);
  const nrInregistrareRef = useRef<AutoFillInputHandle>(null);
  const denumireVehiculRef = useRef<AutoFillInputHandle>(null);
  const anProducereRef = useRef<AutoFillInputHandle>(null);

  const produseIndexate = useMemo(
    () => (query.data ?? []).flatMap((c) => aplatizeaza(c, [])),
    [query.data],
  );

  const rezultate = useMemo(() => {
    const trimmed = search.trim();
    if (trimmed === "") return [];
    return fuzzysort.go(trimmed, produseIndexate, {
      keys: [(p) => p.nume, (p) => p.cale.join(" › "), (p) => p.cod],
      limit: 50,
    });
  }, [search, produseIndexate]);

  return (
    <>
      <PageHeader title="Act defecțiune" />

      <Fieldset legend="Material">
        <Combobox
          store={combobox}
          onOptionSubmit={(cod) => {
            const ales = produseIndexate.find((p) => p.cod === cod);
            if (ales) {
              setSelectedProdus({ cod: ales.cod, nume: ales.nume });
              nrNomenclatorRef.current?.setAuto(ales.cod);
              piesaDeSchimbRef.current?.setAuto(ales.nume);
              umRef.current?.setAuto(ales.unitate);
            }
            combobox.closeDropdown();
          }}
        >
          <Combobox.Target>
            <TextInput
              placeholder="Caută un produs după denumire sau categorie"
              leftSection={<IconSearch size={16} />}
              value={selectedProdus?.nume ?? search}
              onChange={(e) => {
                setSelectedProdus(null);
                setSearch(e.currentTarget.value);
                combobox.openDropdown();
              }}
              onFocus={() => {
                combobox.openDropdown();
                combobox.updateSelectedOptionIndex("active");
              }}
              onBlur={() => combobox.closeDropdown()}
              maw={480}
            />
          </Combobox.Target>

          <Combobox.Dropdown>
            <Combobox.Options mah={320} style={{ overflowY: "auto" }}>
              {search.trim() === "" ? (
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
                      active={r.obj.cod === selectedProdus?.cod}
                      selected={r.obj.cod === selectedProdus?.cod}
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

        <SimpleGrid cols={{ base: 1, sm: 3 }} mt="md">
          <AutoFillTextInput ref={nrNomenclatorRef} label="Nr. nomenclator" />
          <AutoFillTextInput ref={piesaDeSchimbRef} label="Piesa de schimb" />
          <AutoFillTextInput ref={umRef} label="UM" />
        </SimpleGrid>
      </Fieldset>

      <Fieldset legend="Vehicul" mt="md">
        <Select
          placeholder="Caută un vehicul după număr, model sau nr. inventar"
          searchable
          clearable
          filter={fuzzyOptionsFilter}
          maw={480}
          data={(vehicule.data ?? []).map((v) => ({ value: String(v.id), label: vehiculLabel(v) }))}
          value={vehiculId}
          onChange={(id) => {
            setVehiculId(id);
            const ales = (vehicule.data ?? []).find((v) => String(v.id) === id);
            if (ales) {
              nrInventarRef.current?.setAuto(String(ales.nrInventar));
              nrInregistrareRef.current?.setAuto(plate(ales));
              denumireVehiculRef.current?.setAuto(`${ales.tip} ${ales.model}`);
              anProducereRef.current?.setAuto(ales.anProducere?.toString() ?? "");
            }
          }}
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }} mt="md">
          <AutoFillTextInput ref={nrInventarRef} label="Nr. inventar" />
          <AutoFillTextInput ref={nrInregistrareRef} label="Nr. de înregistrare" />
          <AutoFillTextInput ref={denumireVehiculRef} label="Denumire conform datelor contabile" />
          <AutoFillTextInput ref={anProducereRef} label="Anul producerii" />
        </SimpleGrid>
      </Fieldset>
    </>
  );
}

type StatusCamp = "auto" | "manual" | null;

/** A TextInput that shows whether its value came from `setAuto` or was typed by hand since. */
const AutoFillTextInput = forwardRef<AutoFillInputHandle, { label: string }>(
  function AutoFillTextInput({ label }, ref) {
    const [value, setValue] = useState("");
    const [status, setStatus] = useState<StatusCamp>(null);

    useImperativeHandle(ref, () => ({
      setAuto(v: string) {
        setValue(v);
        setStatus("auto");
      },
    }));

    return (
      <TextInput
        label={label}
        value={value}
        onChange={(e) => {
          setValue(e.currentTarget.value);
          setStatus("manual");
        }}
        rightSection={<IndicatorStatus status={status} />}
        rightSectionPointerEvents="auto"
      />
    );
  },
);

function IndicatorStatus({ status }: { status: StatusCamp }) {
  if (status === "auto") {
    return (
      <Tooltip label="Completat automat din produsul selectat">
        <IconWand size={16} color="var(--mantine-color-blue-6)" aria-label="Completat automat" />
      </Tooltip>
    );
  }
  if (status === "manual") {
    return (
      <Tooltip label="Câmpul a fost editat manual">
        <IconAlertTriangle
          size={16}
          color="var(--mantine-color-yellow-6)"
          aria-label="Editat manual"
        />
      </Tooltip>
    );
  }
  return null;
}
