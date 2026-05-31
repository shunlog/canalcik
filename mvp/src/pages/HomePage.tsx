import { useState } from 'react';
import { Button, Card, Group, Stack, Text } from '@mantine/core';
import { syncMasterData, type SyncResult } from '../api';

type Props = {
  onPick: (view: 'comanda_materiale') => void;
};

export function HomePage({ onPick }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const onSync = async () => {
    setSyncing(true);
    try {
      const r = await syncMasterData();
      setSyncResult(r);
    } catch (err) {
      setSyncResult({ ok: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Stack gap="xl">
      <Stack gap="md">
        <FormButton
          emoji="📦"
          title="Comandă de materiale"
          description="Comandă pentru aprovizionare cu materiale."
          onClick={() => onPick('comanda_materiale')}
        />
        <FormButton
          emoji="🛠️"
          title="Act de constatare a defecțiunilor"
          description="În curând."
          disabled
        />
      </Stack>

      <Card withBorder radius="md" padding="md" shadow="sm">
        <Group justify="space-between" align="center">
          <div>
            <Text fw={600}>Sincronizare date</Text>
            <Text size="sm" c="dimmed">
              {syncResult?.ok
                ? `Sincronizat: ${syncResult.materials} materiale, ${syncResult.vehicles} vehicule, ${syncResult.drivers} șoferi (${syncResult.durationMs}ms)`
                : syncResult?.error
                  ? `Eroare: ${syncResult.error}`
                  : 'Recitește CSV-urile din sources/ și actualizează baza de date.'}
            </Text>
          </div>
          <Button variant="default" onClick={onSync} loading={syncing}>
            Sincronizează
          </Button>
        </Group>
      </Card>
    </Stack>
  );
}

function FormButton({
  emoji,
  title,
  description,
  onClick,
  disabled,
}: {
  emoji: string;
  title: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <Card
      withBorder
      radius="md"
      padding="lg"
      shadow={disabled ? undefined : 'sm'}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
      onClick={disabled ? undefined : onClick}
    >
      <Group gap="md" wrap="nowrap" align="flex-start">
        <div style={{ fontSize: 36, lineHeight: 1 }}>{emoji}</div>
        <div style={{ flex: 1 }}>
          <Text fw={700} size="lg">
            {title}
          </Text>
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        </div>
      </Group>
    </Card>
  );
}
