import { Controller, useFieldArray, useForm } from 'react-hook-form';
import {
  ActionIcon,
  Autocomplete,
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  codProdusOptions,
  denumireProdusOptions,
  nrInmatriculareOptions,
  umOptions,
} from './suggestions';
import { PRIMARY_COLORS, type PrimaryColor } from './main';
import previewImg from '../img/preview/comanda_materiale.png';

type Item = {
  denumire: string;
  specificatie: string;
  um: string;
  cantitate: number | '';
  nomenclator: string;
};

type FormValues = {
  items: Item[];
};

const emptyItem: Item = {
  denumire: '',
  specificatie: '',
  um: '',
  cantitate: '',
  nomenclator: '',
};

type AppProps = {
  primaryColor: PrimaryColor;
  onPrimaryColorChange: (color: PrimaryColor) => void;
};

export function App({ primaryColor, onPrimaryColorChange }: AppProps) {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { items: [emptyItem] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = (data: FormValues) => {
    console.log('Form submitted:', data);
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" align="flex-start" mb="xs">
        <Title order={2}>Comandă de materiale</Title>
        <Select
          aria-label="Schemă de culori"
          w={140}
          value={primaryColor}
          onChange={(v) => v && onPrimaryColorChange(v as PrimaryColor)}
          data={PRIMARY_COLORS.map((c) => ({ value: c, label: c }))}
          allowDeselect={false}
          checkIconPosition="right"
        />
      </Group>
      <Text c="dimmed" mb="lg">
        Prototip UI — adaugă articole în comandă.
      </Text>

      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="xl">
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
                      {...f}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name={`items.${index}.specificatie`}
                  render={({ field: f }) => (
                    <Autocomplete
                      label="Specificația materialului"
                      placeholder="Nr. înmatriculare"
                      data={nrInmatriculareOptions}
                      {...f}
                    />
                  )}
                />

                <Group grow align="flex-start">
                  <Controller
                    control={control}
                    name={`items.${index}.um`}
                    render={({ field: f }) => (
                      <Autocomplete
                        label="UM"
                        placeholder="buc, set, l..."
                        data={umOptions}
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
    </Container>
  );
}
