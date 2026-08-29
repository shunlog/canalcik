import { Anchor, Badge, Button, Group, Table, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router";
import { useFacturi } from "../../api/facturi.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { formatIsoDate, formatMoney } from "../../lib/forms.ts";

export function FacturiListPage() {
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);

  const query = useFacturi({ from: from ?? undefined, to: to ?? undefined });

  const clearFilters = () => {
    setFrom(null);
    setTo(null);
  };

  return (
    <>
      <PageHeader
        title="Facturi de expediție"
        subtitle={query.data ? `${query.data.length} facturi` : undefined}
        actions={
          <Button component={Link} to="/facturi/nou" leftSection={<IconPlus size={16} />}>
            Factură nouă
          </Button>
        }
      />

      <Group align="flex-end" mb="md">
        <DateInput
          label="De la"
          valueFormat="DD.MM.YYYY"
          clearable
          w={150}
          value={from}
          onChange={setFrom}
        />
        <DateInput
          label="Până la"
          valueFormat="DD.MM.YYYY"
          clearable
          w={150}
          value={to}
          onChange={setTo}
        />
        <Button variant="subtle" onClick={clearFilters}>
          Resetează filtrele
        </Button>
      </Group>

      <QueryBoundary query={query}>
        {(facturi) =>
          facturi.length === 0 ? (
            <Text c="dimmed">Nicio factură găsită.</Text>
          ) : (
            <Table.ScrollContainer minWidth={520}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Data</Table.Th>
                    <Table.Th w={130}>Materiale</Table.Th>
                    <Table.Th w={160}>Valoare (lei)</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {facturi.map((f) => (
                    <Table.Tr key={f.id}>
                      <Table.Td>
                        <Anchor component={Link} to={`/facturi/${f.id}`}>
                          {formatIsoDate(f.data)}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light">
                          {f.nrLinii}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{formatMoney(f.total)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )
        }
      </QueryBoundary>
    </>
  );
}
