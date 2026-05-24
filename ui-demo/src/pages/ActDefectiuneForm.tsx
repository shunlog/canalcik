import { Controller, useForm } from 'react-hook-form';
import {
  Button,
  Card,
  Grid,
  Group,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';

type FormValues = {
  echipament: string;
  nrInventar: string;
  dataConstatare: string;
  descriere: string;
  cauzaProbabila: string;
  masuriPropuse: string;
  constatator: string;
};

const defaults: FormValues = {
  echipament: '',
  nrInventar: '',
  dataConstatare: '',
  descriere: '',
  cauzaProbabila: '',
  masuriPropuse: '',
  constatator: '',
};

export function ActDefectiuneForm() {
  const { control, handleSubmit } = useForm<FormValues>({ defaultValues: defaults });

  const onSubmit = (data: FormValues) => {
    console.log('Form submitted:', data);
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <Grid gutter="xl">
      <Grid.Col span={{ base: 12, md: 8 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
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
              <Text fw={600}>Detalii act de constatare</Text>
            </Card.Section>

            <Stack gap="sm" p="md">
              <Group grow align="flex-start">
                <Controller
                  control={control}
                  name="echipament"
                  render={({ field: f }) => (
                    <TextInput
                      label="Echipament / utilaj"
                      placeholder="Denumire echipament"
                      {...f}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="nrInventar"
                  render={({ field: f }) => (
                    <TextInput
                      label="Nr. inventar / serie"
                      placeholder="INV-0000"
                      {...f}
                    />
                  )}
                />
              </Group>

              <Controller
                control={control}
                name="dataConstatare"
                render={({ field: f }) => (
                  <TextInput
                    label="Data constatării"
                    placeholder="zz.ll.aaaa"
                    type="date"
                    {...f}
                  />
                )}
              />

              <Controller
                control={control}
                name="descriere"
                render={({ field: f }) => (
                  <Textarea
                    label="Descrierea defecțiunii"
                    placeholder="Detalii despre defecțiune"
                    minRows={3}
                    autosize
                    {...f}
                  />
                )}
              />

              <Controller
                control={control}
                name="cauzaProbabila"
                render={({ field: f }) => (
                  <Textarea
                    label="Cauza probabilă"
                    placeholder="Cauza presupusă a defecțiunii"
                    minRows={2}
                    autosize
                    {...f}
                  />
                )}
              />

              <Controller
                control={control}
                name="masuriPropuse"
                render={({ field: f }) => (
                  <Textarea
                    label="Măsuri propuse"
                    placeholder="Reparație, înlocuire, etc."
                    minRows={2}
                    autosize
                    {...f}
                  />
                )}
              />

              <Controller
                control={control}
                name="constatator"
                render={({ field: f }) => (
                  <TextInput
                    label="Constatator"
                    placeholder="Nume și prenume"
                    {...f}
                  />
                )}
              />
            </Stack>
          </Card>

          <Group justify="flex-end" mt="xl">
            <Button type="submit">Generează</Button>
          </Group>
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
