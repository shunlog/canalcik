import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import {
  ActionIcon,
  Autocomplete,
  Badge,
  Button,
  Card,
  Grid,
  Group,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import {
  codProdusOptions,
  denumireProdusOptions,
  nrInmatriculareOptions,
  umOptions,
} from '../suggestions';

type Defect = {
  defectiunea: string;
  cauzeProbabile: string;
};

type Piesa = {
  nomenclator: string;
  piesa: string;
  um: string;
  cantitate: number | '';
  cauzaRand: string;
  necesitaInlocuire: 'da' | 'nu';
};

type Lucrare = {
  denumire: string;
  um: string;
  cantitate: number | '';
  cauzaRand: string;
};

type FormValues = {
  date: string;
  activ: {
    nrInventar: string;
    nrInregistrare: string;
    denumireContabila: string;
    anulProducerii: number | '';
  };
  defectiuni: Defect[];
  piese: Piesa[];
  lucrari: Lucrare[];
};

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const emptyDefect: Defect = { defectiunea: '', cauzeProbabile: '' };
const emptyPiesa: Piesa = {
  nomenclator: '',
  piesa: '',
  um: '',
  cantitate: '',
  cauzaRand: '',
  necesitaInlocuire: 'nu',
};
const emptyLucrare: Lucrare = {
  denumire: '',
  um: '',
  cantitate: '',
  cauzaRand: '',
};

const defaults: FormValues = {
  date: todayISO(),
  activ: {
    nrInventar: '',
    nrInregistrare: '',
    denumireContabila: '',
    anulProducerii: '',
  },
  defectiuni: [emptyDefect],
  piese: [emptyPiesa],
  lucrari: [emptyLucrare],
};

export function ActDefectiuneForm() {
  const { control, handleSubmit } = useForm<FormValues>({ defaultValues: defaults });

  const defectiuniArr = useFieldArray({ control, name: 'defectiuni' });
  const pieseArr = useFieldArray({ control, name: 'piese' });
  const lucrariArr = useFieldArray({ control, name: 'lucrari' });

  const onSubmit = (data: FormValues) => {
    console.log('Form submitted:', data);
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <Grid gutter="xl">
      <Grid.Col span={{ base: 12, md: 8 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="xl">
            <Controller
              control={control}
              name="date"
              render={({ field: f }) => (
                <TextInput label="Data" type="date" w={180} {...f} />
              )}
            />

            <SectionCard title="Informație activ">
              <Stack gap="sm" p="md">
                <Group align="flex-start" gap="sm">
                  <Controller
                    control={control}
                    name="activ.nrInventar"
                    render={({ field: f }) => (
                      <TextInput
                        label="Nr. inventar"
                        placeholder="ex. 42691696"
                        w={180}
                        {...f}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="activ.nrInregistrare"
                    render={({ field: f }) => (
                      <Autocomplete
                        label="Nr. de înregistrare"
                        placeholder="ex. CA 786"
                        data={nrInmatriculareOptions}
                        w={180}
                        {...f}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="activ.anulProducerii"
                    render={({ field: f }) => (
                      <NumberInput
                        label="Anul producerii"
                        placeholder="ex. 1998"
                        min={1900}
                        max={2100}
                        w={140}
                        value={f.value}
                        onChange={f.onChange}
                        onBlur={f.onBlur}
                      />
                    )}
                  />
                </Group>
                <Controller
                  control={control}
                  name="activ.denumireContabila"
                  render={({ field: f }) => (
                    <TextInput
                      label="Denumire conform datelor contabile"
                      placeholder="ex. Tractor MTZ-82"
                      maw={400}
                      {...f}
                    />
                  )}
                />
              </Stack>
            </SectionCard>

            <SectionCard title="Lista defecțiunilor">
              <Stack gap="md" p="md">
                {defectiuniArr.fields.map((field, index) => (
                  <RowCard
                    key={field.id}
                    label="Defecțiune"
                    index={index}
                    onRemove={() => defectiuniArr.remove(index)}
                    canRemove={defectiuniArr.fields.length > 1}
                  >
                    <Stack gap="sm">
                      <Controller
                        control={control}
                        name={`defectiuni.${index}.defectiunea`}
                        render={({ field: f }) => (
                          <Textarea
                            label="Defecțiunea"
                            placeholder="Descrierea defecțiunii"
                            minRows={2}
                            autosize
                            {...f}
                          />
                        )}
                      />
                      <Controller
                        control={control}
                        name={`defectiuni.${index}.cauzeProbabile`}
                        render={({ field: f }) => (
                          <Textarea
                            label="Cauzele probabile ale defecțiunilor"
                            placeholder="Cauza presupusă"
                            minRows={2}
                            autosize
                            {...f}
                          />
                        )}
                      />
                    </Stack>
                  </RowCard>
                ))}
                <Button
                  variant="light"
                  leftSection="+"
                  onClick={() => defectiuniArr.append(emptyDefect)}
                >
                  Adaugă defecțiune
                </Button>
              </Stack>
            </SectionCard>

            <SectionCard title="Lista pieselor de schimb">
              <Stack gap="md" p="md">
                {pieseArr.fields.map((field, index) => (
                  <RowCard
                    key={field.id}
                    label="Piesă"
                    index={index}
                    onRemove={() => pieseArr.remove(index)}
                    canRemove={pieseArr.fields.length > 1}
                  >
                    <Stack gap="sm">
                      <Group align="flex-start" gap="sm">
                        <Controller
                          control={control}
                          name={`piese.${index}.nomenclator`}
                          render={({ field: f }) => (
                            <Autocomplete
                              label="Nr. nomenclator"
                              placeholder="Cod produs"
                              data={codProdusOptions}
                              w={220}
                              {...f}
                            />
                          )}
                        />
                        <Controller
                          control={control}
                          name={`piese.${index}.piesa`}
                          render={({ field: f }) => (
                            <Autocomplete
                              label="Piesa de schimb / ansamblul component"
                              placeholder="Denumire piesă"
                              data={denumireProdusOptions}
                              w={360}
                              {...f}
                            />
                          )}
                        />
                      </Group>
                      <Group align="flex-start" gap="sm">
                        <Controller
                          control={control}
                          name={`piese.${index}.um`}
                          render={({ field: f }) => (
                            <Autocomplete
                              label="UM"
                              placeholder="buc, set..."
                              data={umOptions}
                              w={110}
                              {...f}
                            />
                          )}
                        />
                        <Controller
                          control={control}
                          name={`piese.${index}.cantitate`}
                          render={({ field: f }) => (
                            <NumberInput
                              label="Cantitate"
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
                        <CauzaSelect
                          control={control}
                          name={`piese.${index}.cauzaRand`}
                          width={140}
                        />
                        <Controller
                          control={control}
                          name={`piese.${index}.necesitaInlocuire`}
                          render={({ field: f }) => (
                            <div>
                              <Text size="sm" fw={500} mb={4}>
                                Necesită înlocuire
                              </Text>
                              <SegmentedControl
                                value={f.value}
                                onChange={(v) => f.onChange(v)}
                                data={[
                                  { value: 'da', label: 'Da' },
                                  { value: 'nu', label: 'Nu' },
                                ]}
                              />
                            </div>
                          )}
                        />
                      </Group>
                    </Stack>
                  </RowCard>
                ))}
                <Button
                  variant="light"
                  leftSection="+"
                  onClick={() => pieseArr.append(emptyPiesa)}
                >
                  Adaugă piesă
                </Button>
              </Stack>
            </SectionCard>

            <SectionCard title="Lista lucrărilor de reparații necesare">
              <Stack gap="md" p="md">
                {lucrariArr.fields.map((field, index) => (
                  <RowCard
                    key={field.id}
                    label="Lucrare"
                    index={index}
                    onRemove={() => lucrariArr.remove(index)}
                    canRemove={lucrariArr.fields.length > 1}
                  >
                    <Stack gap="sm">
                      <Controller
                        control={control}
                        name={`lucrari.${index}.denumire`}
                        render={({ field: f }) => (
                          <TextInput
                            label="Denumirea lucrărilor"
                            placeholder="ex. de înlocuit ..."
                            maw={400}
                            {...f}
                          />
                        )}
                      />
                      <Group align="flex-start" gap="sm">
                        <Controller
                          control={control}
                          name={`lucrari.${index}.um`}
                          render={({ field: f }) => (
                            <Autocomplete
                              label="UM"
                              placeholder="buc, set..."
                              data={umOptions}
                              w={110}
                              {...f}
                            />
                          )}
                        />
                        <Controller
                          control={control}
                          name={`lucrari.${index}.cantitate`}
                          render={({ field: f }) => (
                            <NumberInput
                              label="Cantitate"
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
                        <CauzaSelect
                          control={control}
                          name={`lucrari.${index}.cauzaRand`}
                          width={140}
                        />
                      </Group>
                    </Stack>
                  </RowCard>
                ))}
                <Button
                  variant="light"
                  leftSection="+"
                  onClick={() => lucrariArr.append(emptyLucrare)}
                >
                  Adaugă lucrare
                </Button>
              </Stack>
            </SectionCard>

            <Group justify="flex-end">
              <Button type="submit">Generează</Button>
            </Group>
          </Stack>
        </form>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }} visibleFrom="md">
        <Card
          withBorder
          radius="md"
          padding="md"
          shadow="sm"
          style={{ position: 'sticky', top: 16 }}
        >
          <Text size="xs" c="dimmed" mb="xs" ta="center">
            Previzualizare document
          </Text>
          <div
            style={{
              aspectRatio: '1 / 1.4',
              background:
                'repeating-linear-gradient(0deg, var(--mantine-color-gray-1) 0 24px, var(--mantine-color-gray-2) 24px 25px)',
              borderRadius: 4,
            }}
          />
        </Card>
      </Grid.Col>
    </Grid>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card
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
        <Text fw={600}>{title}</Text>
      </Card.Section>
      {children}
    </Card>
  );
}

function RowCard({
  label,
  index,
  onRemove,
  canRemove,
  children,
}: {
  label: string;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card withBorder padding={0} radius="md">
      <Card.Section withBorder inheritPadding py="xs" bg="var(--mantine-color-gray-0)">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Badge size="md" radius="sm" variant="filled">
              {index + 1}
            </Badge>
            <Text fw={500} size="sm">
              {label}
            </Text>
          </Group>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={onRemove}
            disabled={!canRemove}
            aria-label={`Șterge ${label.toLowerCase()}`}
          >
            ✕
          </ActionIcon>
        </Group>
      </Card.Section>
      <div style={{ padding: 'var(--mantine-spacing-md)' }}>{children}</div>
    </Card>
  );
}

function CauzaSelect({
  control,
  name,
  width,
}: {
  control: Control<FormValues>;
  // any path that resolves to the cauzaRand field
  name: `piese.${number}.cauzaRand` | `lucrari.${number}.cauzaRand`;
  width?: number;
}) {
  const defectiuni = useWatch({ control, name: 'defectiuni' }) ?? [];
  const options = defectiuni.map((_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: f }) => (
        <Select
          label="Cauza (rând din tab. 1)"
          placeholder="Alege rând"
          data={options}
          value={f.value || null}
          onChange={(v) => f.onChange(v ?? '')}
          onBlur={f.onBlur}
          clearable
          w={width}
        />
      )}
    />
  );
}
