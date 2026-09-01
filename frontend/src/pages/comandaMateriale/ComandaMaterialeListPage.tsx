import { Anchor, Badge, Button, Group, Select, Table, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router";
import { useComenziMateriale } from "../../api/comenziMateriale.ts";
import { useVehicule } from "../../api/vehicule.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { formatIsoDate } from "../../lib/forms.ts";
import { plate, vehiculLabel } from "../../lib/labels.ts";
import { fuzzyOptionsFilter } from "../../lib/search.ts";

export function ComandaMaterialeListPage() {
  const [vehiculId, setVehiculId] = useState<string | null>(null);
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);

  const vehicule = useVehicule();
  const query = useComenziMateriale({
    vehiculId: vehiculId ? Number(vehiculId) : undefined,
    from: from ?? undefined,
    to: to ?? undefined,
  });

  const clearFilters = () => {
    setVehiculId(null);
    setFrom(null);
    setTo(null);
  };

  return (
    <>
      <PageHeader
        title="Comenzi de materiale"
        subtitle={query.data ? `${query.data.length} comenzi` : undefined}
        actions={
          <Button component={Link} to="/comanda-materiale/nou" leftSection={<IconPlus size={16} />}>
            Comandă nouă
          </Button>
        }
      />

      <Group align="flex-end" mb="md">
        <Select
          label="Vehicul"
          placeholder="Toate"
          searchable
          clearable
          filter={fuzzyOptionsFilter}
          w={280}
          data={(vehicule.data ?? []).map((v) => ({ value: String(v.id), label: vehiculLabel(v) }))}
          value={vehiculId}
          onChange={setVehiculId}
        />
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
        {(comenzi) =>
          comenzi.length === 0 ? (
            <Text c="dimmed">Nicio comandă găsită.</Text>
          ) : (
            <Table.ScrollContainer minWidth={620}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={140}>Data</Table.Th>
                    <Table.Th>Vehicule</Table.Th>
                    <Table.Th w={130}>Materiale</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {comenzi.map((c) => (
                    <Table.Tr key={c.id}>
                      <Table.Td>
                        <Anchor component={Link} to={`/comanda-materiale/${c.id}`}>
                          {formatIsoDate(c.data)}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {c.vehicule.map((v) => (
                            <Anchor key={v.id} component={Link} to={`/vehicule/${v.id}`} size="sm">
                              {plate(v)}
                            </Anchor>
                          ))}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light">{c.nrMateriale}</Badge>
                      </Table.Td>
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
