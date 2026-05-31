import { useState } from 'react';
import { ActionIcon, Container, Group, Title } from '@mantine/core';
import { HomePage } from './pages/HomePage';
import { ComandaMaterialeForm } from './pages/ComandaMaterialeForm';

type View = 'home' | 'comanda_materiale';

const TITLE: Record<View, string> = {
  home: 'Canalcik',
  comanda_materiale: 'Comandă de materiale',
};

export function App() {
  const [view, setView] = useState<View>('home');

  return (
    <Container size="md" py="xl">
      <Group gap="sm" align="center" mb="lg">
        {view !== 'home' && (
          <ActionIcon
            variant="subtle"
            size="lg"
            aria-label="Înapoi"
            onClick={() => setView('home')}
          >
            ←
          </ActionIcon>
        )}
        <Title order={2}>{TITLE[view]}</Title>
      </Group>

      {view === 'home' && <HomePage onPick={setView} />}
      {view === 'comanda_materiale' && <ComandaMaterialeForm />}
    </Container>
  );
}
