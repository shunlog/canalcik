import { Anchor, Badge, Button, Group, Select, Table, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router";
import { useActeDefectiune } from "../../api/acteDefectiune.ts";
import { useSoferi } from "../../api/soferi.ts";
import { useVehicule } from "../../api/vehicule.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { formatIsoDate, formatTimestamp } from "../../lib/forms.ts";
import { soferLabel, vehiculLabel } from "../../lib/labels.ts";
import { fuzzyOptionsFilter } from "../../lib/search.ts";

export function ActDefectiuneListPage() {
  const [vehiculId, setVehiculId] = useState<string | null>(null);
  const [soferId, setSoferId] = useState<string | null>(null);
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);

  const vehicule = useVehicule();
  const soferi = useSoferi();
  const query = useActeDefectiune({
    vehiculId: vehiculId ? Number(vehiculId) : undefined,
    soferId: soferId ? Number(soferId) : undefined,
    from: from ?? undefined,
    to: to ?? undefined,
  });

  const clearFilters = () => {
    setVehiculId(null);
    setSoferId(null);
    setFrom(null);
    setTo(null);
  };

  return (
    <>
      <PageHeader
        title="Acte de defecțiune"
        subtitle={query.data ? `${query.data.length} acte` : undefined}
        actions={
          <Button component={Link} to="/act-defectiune/nou" leftSection={<IconPlus size={16} />}>
            Act nou
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
        <Select
          label="Șofer"
          placeholder="Toți"
          searchable
          clearable
          filter={fuzzyOptionsFilter}
          w={260}
          data={(soferi.data ?? []).map((s) => ({ value: String(s.id), label: soferLabel(s) }))}
          value={soferId}
          onChange={setSoferId}
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
        {(acte) =>
          acte.length === 0 ? (
            <Text c="dimmed">Niciun act găsit.</Text>
          ) : (
            <Table.ScrollContainer minWidth={950}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={140}>Data</Table.Th>
                    <Table.Th>Vehicul</Table.Th>
                    <Table.Th>Șofer</Table.Th>
                    <Table.Th w={130}>Defecțiuni</Table.Th>
                    <Table.Th w={150}>Piese de schimb</Table.Th>
                    <Table.Th w={180}>Document</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {acte.map((a) => (
                    <Table.Tr key={a.id}>
                      <Table.Td>
                        <Anchor component={Link} to={`/act-defectiune/${a.id}`}>
                          {formatIsoDate(a.data)}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>
                        <Anchor component={Link} to={`/vehicule/${a.vehicul.id}`}>
                          {vehiculLabel(a.vehicul)}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>
                        <Anchor component={Link} to={`/soferi/${a.sofer.id}`}>
                          {soferLabel(a.sofer)}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light">{a.nrDefectiuni}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light">{a.nrPieseSchimb}</Badge>
                      </Table.Td>
                      <Table.Td>
                        {a.document ? (
                          <Anchor
                            href={a.document.driveUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {formatTimestamp(a.document.createdAt)}
                          </Anchor>
                        ) : (
                          formatTimestamp(null)
                        )}
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
