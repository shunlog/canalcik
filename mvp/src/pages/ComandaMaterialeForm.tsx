import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import {
  generateComanda,
  searchMaterials,
  searchVehicles,
  type Material,
  type Vehicul,
} from '../api';

type Row = {
  materialId: number | null;
  vehiculId: number | null;
  unitateMasura: string;
  cantitate: number | '';
};

type FormValues = {
  data: string;
  randuri: Row[];
};

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const emptyRow: Row = {
  materialId: null,
  vehiculId: null,
  unitateMasura: '',
  cantitate: '',
};

type GenerateState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; url: string | null; comandaId: number }
  | { kind: 'error'; message: string };

export function ComandaMaterialeForm() {
  const { control, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: { data: todayISO(), randuri: [emptyRow] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'randuri' });
  const [state, setState] = useState<GenerateState>({ kind: 'idle' });

  const randuri = watch('randuri');
  const canSubmit = randuri.every(
    (r) =>
      r.materialId != null &&
      r.vehiculId != null &&
      typeof r.cantitate === 'number' &&
      r.cantitate > 0
  );

  const onSubmit = async (data: FormValues) => {
    setState({ kind: 'submitting' });
    const result = await generateComanda({
      data: data.data,
      randuri: data.randuri.map((r) => ({
        materialId: r.materialId!,
        vehiculId: r.vehiculId!,
        cantitate: r.cantitate as number,
        unitateMasura: r.unitateMasura || null,
      })),
    });
    if (result.ok) {
      setState({ kind: 'success', url: result.driveFileUrl ?? null, comandaId: result.comandaId! });
    } else {
      setState({ kind: 'error', message: result.error ?? 'Eroare necunoscută' });
    }
  };

  if (state.kind === 'success') {
    return (
      <Alert color="green" title="Document generat">
        <Stack gap="sm">
          <Text>Comanda #{state.comandaId} a fost generată și salvată în Google Drive.</Text>
          {state.url && (
            <Anchor href={state.url} target="_blank" rel="noreferrer">
              Deschide documentul
            </Anchor>
          )}
          <Button variant="default" onClick={() => window.location.reload()}>
            Comandă nouă
          </Button>
        </Stack>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="xl">
        <Controller
          control={control}
          name="data"
          render={({ field: f }) => (
            <TextInput label="Data" type="date" w={180} {...f} />
          )}
        />

        {fields.map((field, index) => (
          <Card
            key={field.id}
            withBorder
            padding={0}
            radius="md"
            shadow="sm"
            style={{ borderLeft: '4px solid var(--mantine-primary-color-filled)' }}
          >
            <Card.Section
              withBorder
              inheritPadding
              py="sm"
              bg="var(--mantine-primary-color-light)"
            >
              <Group justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <Badge size="lg" radius="sm" variant="filled">
                    {index + 1}
                  </Badge>
                  <Text fw={600}>Articol</Text>
                </Group>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  aria-label="Șterge articolul"
                >
                  ✕
                </ActionIcon>
              </Group>
            </Card.Section>

            <Stack gap="sm" p="md">
              <Controller
                control={control}
                name={`randuri.${index}.materialId`}
                render={({ field: f }) => (
                  <MaterialPicker
                    value={f.value}
                    onChange={(id, material) => {
                      f.onChange(id);
                      if (material?.unitateMasura) {
                        setValue(
                          `randuri.${index}.unitateMasura`,
                          material.unitateMasura,
                          { shouldDirty: true }
                        );
                      }
                    }}
                  />
                )}
              />

              <Group align="flex-start" gap="sm">
                <Controller
                  control={control}
                  name={`randuri.${index}.vehiculId`}
                  render={({ field: f }) => (
                    <VehiculPicker value={f.value} onChange={f.onChange} />
                  )}
                />
                <Controller
                  control={control}
                  name={`randuri.${index}.unitateMasura`}
                  render={({ field: f }) => (
                    <TextInput label="UM" placeholder="buc, set..." w={110} {...f} />
                  )}
                />
                <Controller
                  control={control}
                  name={`randuri.${index}.cantitate`}
                  render={({ field: f }) => (
                    <NumberInput
                      label="Cantitatea"
                      placeholder="0"
                      decimalScale={3}
                      min={0}
                      w={140}
                      value={f.value}
                      onChange={f.onChange}
                      onBlur={f.onBlur}
                    />
                  )}
                />
              </Group>
            </Stack>
          </Card>
        ))}

        {state.kind === 'error' && (
          <Alert color="red" title="Eroare la generare">
            {state.message}
          </Alert>
        )}

        <Group justify="space-between">
          <Button variant="light" onClick={() => append(emptyRow)} leftSection="+">
            Adaugă articol
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit}
            loading={state.kind === 'submitting'}
          >
            Generează
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

function MaterialPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number | null, material: Material | null) => void;
}) {
  const [search, setSearch] = useState('');
  const [debounced] = useDebouncedValue(search, 200);
  const [items, setItems] = useState<Material[]>([]);
  // Pinned across searches so Mantine can always find the label for `value`.
  const [selected, setSelected] = useState<Material | null>(null);

  useEffect(() => {
    let cancelled = false;
    searchMaterials(debounced).then((r) => {
      if (!cancelled) setItems(r);
    });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  // Merge selected + search results, deduped, with selected first.
  const dataList = mergeOptions(
    selected && {
      value: String(selected.id),
      label: `${selected.denumire} (${selected.cod})`,
    },
    items.map((m) => ({ value: String(m.id), label: `${m.denumire} (${m.cod})` }))
  );

  return (
    <Select
      label="Material"
      placeholder="Caută după denumire sau cod..."
      searchable
      clearable
      onSearchChange={setSearch}
      data={dataList}
      value={value != null ? String(value) : null}
      onChange={(v) => {
        const id = v ? Number(v) : null;
        const match = id != null ? items.find((m) => m.id === id) ?? selected : null;
        setSelected(match);
        onChange(id, match);
      }}
      nothingFoundMessage="Niciun material găsit"
      maxDropdownHeight={300}
      description={selected ? `UM implicită: ${selected.unitateMasura ?? '—'}` : undefined}
    />
  );
}

function VehiculPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const [search, setSearch] = useState('');
  const [debounced] = useDebouncedValue(search, 200);
  const [items, setItems] = useState<Vehicul[]>([]);
  const [selected, setSelected] = useState<Vehicul | null>(null);

  useEffect(() => {
    let cancelled = false;
    searchVehicles(debounced).then((r) => {
      if (!cancelled) setItems(r);
    });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const dataList = mergeOptions(
    selected && {
      value: String(selected.id),
      label: `${selected.nrInmatriculare} — ${selected.model}`,
    },
    items.map((v) => ({
      value: String(v.id),
      label: `${v.nrInmatriculare} — ${v.model}`,
    }))
  );

  return (
    <Select
      label="Specificația materialului (vehicul)"
      placeholder="Nr. înmatriculare"
      searchable
      clearable
      onSearchChange={setSearch}
      data={dataList}
      value={value != null ? String(value) : null}
      onChange={(v) => {
        const id = v ? Number(v) : null;
        const match = id != null ? items.find((x) => x.id === id) ?? selected : null;
        setSelected(match);
        onChange(id);
      }}
      nothingFoundMessage="Niciun vehicul găsit"
      maxDropdownHeight={300}
      w={260}
    />
  );
}

function mergeOptions(
  head: { value: string; label: string } | null | false,
  rest: Array<{ value: string; label: string }>
): Array<{ value: string; label: string }> {
  const out: Array<{ value: string; label: string }> = [];
  const seen = new Set<string>();
  if (head) {
    out.push(head);
    seen.add(head.value);
  }
  for (const o of rest) {
    if (seen.has(o.value)) continue;
    out.push(o);
    seen.add(o.value);
  }
  return out;
}
