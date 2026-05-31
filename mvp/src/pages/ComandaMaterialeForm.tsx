import { Controller, useFieldArray, useForm } from 'react-hook-form';
import {
  ActionIcon,
  Autocomplete,
  Badge,
  Button,
  Card,
  Grid,
  Group,
  NumberInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import {
  codProdusOptions,
  denumireProdusOptions,
  nrInmatriculareOptions,
  umOptions,
} from '../suggestions';
import previewImg from '../../img/preview/comanda_materiale.png';

type Item = {
  denumire: string;
  specificatie: string;
  um: string;
  cantitate: number | '';
  nomenclator: string;
};

type FormValues = {
  date: string;
  items: Item[];
};

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const emptyItem: Item = {
  denumire: '',
  specificatie: '',
  um: '',
  cantitate: '',
  nomenclator: '',
};

export function ComandaMaterialeForm() {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { date: todayISO(), items: [emptyItem] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

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
                <TextInput
                  label="Data"
                  type="date"
                  w={180}
                  {...f}
                />
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
                    name={`items.${index}.denumire`}
                    render={({ field: f }) => (
                      <Autocomplete
                        label="Denumirea materialului"
                        placeholder="Denumire produs"
                        data={denumireProdusOptions}
                        maw={400}
                        {...f}
                      />
                    )}
                  />

                  <Group align="flex-start" gap="sm">
                    <Controller
                      control={control}
                      name={`items.${index}.specificatie`}
                      render={({ field: f }) => (
                        <Autocomplete
                          label="Specificația materialului"
                          placeholder="Nr. înmatriculare"
                          data={nrInmatriculareOptions}
                          w={200}
                          {...f}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name={`items.${index}.um`}
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
                      name={`items.${index}.cantitate`}
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

                  <Controller
                    control={control}
                    name={`items.${index}.nomenclator`}
                    render={({ field: f }) => (
                      <Autocomplete
                        label="Nomenclator D365"
                        placeholder="Cod produs"
                        data={codProdusOptions}
                        w={220}
                        {...f}
                      />
                    )}
                  />
                </Stack>
              </Card>
            ))}

            <Group justify="space-between">
              <Button
                variant="light"
                onClick={() => append(emptyItem)}
                leftSection="+"
              >
                Adaugă articol
              </Button>
              <Button type="submit">Generează</Button>
            </Group>
          </Stack>
        </form>
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 4 }} visibleFrom="md">
        <Card
          withBorder
          radius="md"
          padding="xs"
          shadow="sm"
          style={{ position: 'sticky', top: 16 }}
        >
          <Text size="xs" c="dimmed" mb="xs" ta="center">
            Previzualizare document
          </Text>
          <img
            src={previewImg}
            alt="Previzualizare Comandă de materiale"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              borderRadius: 4,
            }}
          />
        </Card>
      </Grid.Col>
    </Grid>
  );
}
