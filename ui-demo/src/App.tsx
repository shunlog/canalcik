import { useState } from 'react';
import {
  ActionIcon,
  Container,
  Group,
  Select,
  Text,
  Title,
} from '@mantine/core';
import { PRIMARY_COLORS, type PrimaryColor } from './main';
import { HomePage } from './pages/HomePage';
import { ComandaMaterialeForm } from './pages/ComandaMaterialeForm';
import { ActDefectiuneForm } from './pages/ActDefectiuneForm';
import type { DocKind } from './types';

type View =
  | { name: 'home' }
  | { name: 'form'; kind: DocKind };

const FORM_TITLE: Record<DocKind, string> = {
  comanda_materiale: 'Comandă de materiale',
  act_defectiune: 'Act de constatare a defecțiunilor',
};

type AppProps = {
  primaryColor: PrimaryColor;
  onPrimaryColorChange: (color: PrimaryColor) => void;
};

export function App({ primaryColor, onPrimaryColorChange }: AppProps) {
  const [view, setView] = useState<View>({ name: 'home' });

  const goHome = () => setView({ name: 'home' });

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" align="center" mb="lg">
        <Group gap="sm" align="center">
          {view.name !== 'home' && (
            <ActionIcon
              variant="subtle"
              size="lg"
              aria-label="Înapoi la documente"
              onClick={goHome}
            >
              ←
            </ActionIcon>
          )}
          <Title order={2}>
            {view.name === 'home' ? 'DEMO' : FORM_TITLE[view.kind]}
          </Title>
        </Group>
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

      {view.name === 'home' && (
        <HomePage
          onOpenDoc={(doc) => setView({ name: 'form', kind: doc.kind })}
          onCreate={(kind) => setView({ name: 'form', kind })}
        />
      )}

      {view.name === 'form' && view.kind === 'comanda_materiale' && (
        <>
          <Text c="dimmed" mb="lg">
            Prototip UI — adaugă articole în comandă.
          </Text>
          <ComandaMaterialeForm />
        </>
      )}

      {view.name === 'form' && view.kind === 'act_defectiune' && (
        <>
          <Text c="dimmed" mb="lg">
            Prototip UI — descrie defecțiunea constatată.
          </Text>
          <ActDefectiuneForm />
        </>
      )}
    </Container>
  );
}
