import { useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Menu,
  Popover,
  Stack,
  Table,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import type { DocKind, DocumentRow } from '../types';

const KIND_LABEL: Record<DocKind, string> = {
  comanda_materiale: 'Comandă de materiale',
  act_defectiune: 'Act de constatare a defecțiunilor',
};

const KIND_COLOR: Record<DocKind, string> = {
  comanda_materiale: 'blue',
  act_defectiune: 'orange',
};

const KIND_EMOJI: Record<DocKind, string> = {
  comanda_materiale: '📦',
  act_defectiune: '🛠️',
};

const MOCK_DOCS: DocumentRow[] = [
  {
    id: '1',
    kind: 'comanda_materiale',
    title: 'Comandă cablu electric — șantier Pipera',
    createdAt: '2026-05-22T10:14:00',
  },
  {
    id: '2',
    kind: 'act_defectiune',
    title: 'Defecțiune excavator CAT-320 (INV-1042)',
    createdAt: '2026-05-21T16:30:00',
  },
  {
    id: '3',
    kind: 'comanda_materiale',
    title: 'Comandă țevi PVC — depozit central',
    createdAt: '2026-05-19T09:02:00',
  },
  {
    id: '4',
    kind: 'act_defectiune',
    title: 'Pompă hidraulică — pierdere ulei',
    createdAt: '2026-05-15T14:48:00',
  },
  {
    id: '5',
    kind: 'comanda_materiale',
    title: 'Comandă consumabile întreținere',
    createdAt: '2026-05-12T11:25:00',
  },
  {
    id: '6',
    kind: 'act_defectiune',
    title: 'Generator diesel — pornire defectuoasă',
    createdAt: '2026-05-08T08:10:00',
  },
  {
    id: '7',
    kind: 'comanda_materiale',
    title: 'Comandă urgent: garnituri pompă',
    createdAt: '2026-05-03T17:55:00',
  },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ro-RO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type SortDir = 'desc' | 'asc';

type Props = {
  onOpenDoc: (doc: DocumentRow) => void;
  onCreate: (kind: DocKind) => void;
};

export function HomePage({ onOpenDoc, onCreate }: Props) {
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<DocKind | 'all'>('all');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = MOCK_DOCS.filter((d) => {
    if (kindFilter !== 'all' && d.kind !== kindFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      if (!d.title.toLowerCase().includes(s)) return false;
    }
    return true;
  }).sort((a, b) => {
    const cmp = a.createdAt.localeCompare(b.createdAt);
    return sortDir === 'desc' ? -cmp : cmp;
  });

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <div>
          <Text size="xl" fw={700}>
            Documente
          </Text>
          <Text c="dimmed" size="sm">
            Caută, filtrează sau creează un document nou.
          </Text>
        </div>

        <Popover
          opened={createOpen}
          onChange={setCreateOpen}
          position="bottom-end"
          shadow="md"
          width={320}
          withArrow
        >
          <Popover.Target>
            <ActionIcon
              size={44}
              radius="xl"
              variant="filled"
              aria-label="Document nou"
              onClick={() => setCreateOpen((o) => !o)}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown p="xs">
            <Text size="xs" c="dimmed" px="xs" pt="xs" pb={4}>
              Alege tipul documentului
            </Text>
            <Stack gap={4}>
              <DocKindOption
                emoji="📦"
                title={KIND_LABEL.comanda_materiale}
                description="Comandă pentru aprovizionare cu materiale."
                onClick={() => {
                  setCreateOpen(false);
                  onCreate('comanda_materiale');
                }}
              />
              <DocKindOption
                emoji="🛠️"
                title={KIND_LABEL.act_defectiune}
                description="Raport de defecțiune pentru un echipament."
                onClick={() => {
                  setCreateOpen(false);
                  onCreate('act_defectiune');
                }}
              />
            </Stack>
          </Popover.Dropdown>
        </Popover>
      </Group>

      <Card withBorder radius="md" padding="sm" shadow="sm">
        <Group gap="xs" wrap="wrap">
          <TextInput
            placeholder="Caută după titlu..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            leftSection={<span aria-hidden>🔍</span>}
            style={{ flex: 1, minWidth: 220 }}
          />

          <Menu shadow="md" position="bottom-start">
            <Menu.Target>
              <Button variant="default" leftSection="📅">
                Perioadă
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Filtrează după dată</Menu.Label>
              <Menu.Item>Astăzi</Menu.Item>
              <Menu.Item>Ultimele 7 zile</Menu.Item>
              <Menu.Item>Ultimele 30 zile</Menu.Item>
              <Menu.Item>Interval personalizat...</Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <Menu shadow="md" position="bottom-start">
            <Menu.Target>
              <Button variant="default" leftSection="🗂️">
                Tip
                {kindFilter !== 'all' && (
                  <Badge ml={6} size="sm" variant="light">
                    1
                  </Badge>
                )}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Tip document</Menu.Label>
              <Menu.Item onClick={() => setKindFilter('all')}>
                Toate
              </Menu.Item>
              <Menu.Item
                leftSection={<span aria-hidden>{KIND_EMOJI.comanda_materiale}</span>}
                onClick={() => setKindFilter('comanda_materiale')}
              >
                {KIND_LABEL.comanda_materiale}
              </Menu.Item>
              <Menu.Item
                leftSection={<span aria-hidden>{KIND_EMOJI.act_defectiune}</span>}
                onClick={() => setKindFilter('act_defectiune')}
              >
                {KIND_LABEL.act_defectiune}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <Button
            variant="default"
            onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
            leftSection={sortDir === 'desc' ? '↓' : '↑'}
          >
            Dată
          </Button>
        </Group>
      </Card>

      <Card withBorder radius="md" padding={0} shadow="sm">
        <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Dată</Table.Th>
              <Table.Th>Tip</Table.Th>
              <Table.Th>Descriere</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((doc) => (
              <Table.Tr
                key={doc.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onOpenDoc(doc)}
              >
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {formatDate(doc.createdAt)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    color={KIND_COLOR[doc.kind]}
                    variant="light"
                    radius="sm"
                    leftSection={<span aria-hidden>{KIND_EMOJI[doc.kind]}</span>}
                  >
                    {KIND_LABEL[doc.kind]}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text fw={500}>{doc.title}</Text>
                </Table.Td>
              </Table.Tr>
            ))}
            {filtered.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text c="dimmed" ta="center" py="lg">
                    Niciun document găsit.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}

function DocKindOption({
  emoji,
  title,
  description,
  onClick,
}: {
  emoji: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <UnstyledButton
      onClick={onClick}
      p="xs"
      style={{ borderRadius: 6 }}
      className="doc-kind-option"
    >
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <div style={{ fontSize: 22, lineHeight: 1, marginTop: 2 }}>{emoji}</div>
        <div style={{ flex: 1 }}>
          <Text fw={600} size="sm">
            {title}
          </Text>
          <Text size="xs" c="dimmed">
            {description}
          </Text>
        </div>
      </Group>
    </UnstyledButton>
  );
}
