import { Anchor, Badge, Button, Table, Text, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router";
import { useVehicule } from "../../api/vehicule.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { plate } from "../../lib/labels.ts";

export function VehiculeListPage() {
  const [search, setSearch] = useState("");
  const [debounced] = useDebouncedValue(search, 250);
  const query = useVehicule(debounced);

  return (
    <>
      <PageHeader
        title="Vehicule"
        subtitle={query.data ? `${query.data.length} înregistrări` : undefined}
        actions={
          <Button component={Link} to="/vehicule/nou" leftSection={<IconPlus size={16} />}>
            Vehicul nou
          </Button>
        }
      />

      <TextInput
        placeholder="Caută după plăcuță, model, destinație sau nr. inventar"
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        mb="md"
        maw={480}
      />

      <QueryBoundary query={query}>
        {(vehicule) =>
          vehicule.length === 0 ? (
            <Text c="dimmed">Niciun vehicul găsit.</Text>
          ) : (
            <Table.ScrollContainer minWidth={820}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Nr. înmatriculare</Table.Th>
                    <Table.Th>Destinația</Table.Th>
                    <Table.Th>Marcă / Model</Table.Th>
                    <Table.Th>An</Table.Th>
                    <Table.Th>Inventar</Table.Th>
                    <Table.Th>Garaj</Table.Th>
                    <Table.Th>Sector</Table.Th>
                    <Table.Th>Șoferi</Table.Th>
                    <Table.Th>Bonuri</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {vehicule.map((v) => (
                    <Table.Tr key={v.id}>
                      <Table.Td>
                        <Anchor component={Link} to={`/vehicule/${v.id}`}>
                          {plate(v)}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>{v.tip}</Table.Td>
                      <Table.Td>{v.model}</Table.Td>
                      <Table.Td>{v.anProducere ?? "—"}</Table.Td>
                      <Table.Td>{v.nrInventar}</Table.Td>
                      <Table.Td>{v.nrGaraj}</Table.Td>
                      <Table.Td>{v.sector ?? "—"}</Table.Td>
                      <Table.Td>
                        <Badge variant="light">
                          {v.nrSoferi}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light">
                          {v.nrBonuri}
                        </Badge>
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
