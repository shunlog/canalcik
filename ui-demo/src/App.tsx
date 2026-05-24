import { Controller, useFieldArray, useForm } from 'react-hook-form';
import {
  ActionIcon,
  Autocomplete,
  Button,
  Card,
  Container,
  Group,
  NumberInput,
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

export function App() {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { items: [emptyItem] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSubmit = (data: FormValues) => {
    console.log('Form submitted:', data);
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <Container size="md" py="xl">
      <Title order={2} mb="xs">
        Comandă materiale
      </Title>
      <Text c="dimmed" mb="lg">
        Prototip UI — adaugă articole în comandă.
      </Text>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          {fields.map((field, index) => (
            <Card key={field.id} withBorder padding="md" radius="md">
              <Group justify="space-between" mb="sm">
                <Text fw={600}>Articol {index + 1}</Text>
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

              <Stack gap="sm">
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
    </Container>
  );
}
