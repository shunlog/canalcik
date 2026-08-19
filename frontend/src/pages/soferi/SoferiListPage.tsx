import { Anchor, Badge, Button, Table, Text, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router";
import { useSoferi } from "../../api/soferi.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { formatIsoDate } from "../../lib/forms.ts";

export function SoferiListPage() {
  const [search, setSearch] = useState("");
  const [debounced] = useDebouncedValue(search, 250);
  const query = useSoferi(debounced);

  return (
    <>
      <PageHeader
        title="Șoferi"
        subtitle={query.data ? `${query.data.length} înregistrări` : undefined}
        actions={
          <Button component={Link} to="/soferi/nou" leftSection={<IconPlus size={16} />}>
            Șofer nou
          </Button>
        }
      />

      <TextInput
        placeholder="Caută după nume sau nr. de pontaj"
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        mb="md"
        maw={420}
      />

      <QueryBoundary query={query}>
        {(soferi) =>
          soferi.length === 0 ? (
            <Text c="dimmed">Niciun șofer găsit.</Text>
          ) : (
            <Table.ScrollContainer minWidth={760}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Pontaj</Table.Th>
                    <Table.Th>Nume</Table.Th>
                    <Table.Th>Funcție</Table.Th>
                    <Table.Th>Sector</Table.Th>
                    <Table.Th>Telefon</Table.Th>
                    <Table.Th>Scurtă</Table.Th>
                    <Table.Th>Vehicule</Table.Th>
                    <Table.Th>Bonuri</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {soferi.map((s) => (
                    <Table.Tr key={s.id}>
                      <Table.Td>{s.cod}</Table.Td>
                      <Table.Td>
                        <Anchor component={Link} to={`/soferi/${s.id}`}>
                          {s.nume}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>{s.functie ?? "—"}</Table.Td>
                      <Table.Td>{s.sector ?? "—"}</Table.Td>
                      <Table.Td>{s.telefon ?? "—"}</Table.Td>
                      <Table.Td>{formatIsoDate(s.eipScurta)}</Table.Td>
                      <Table.Td>
                        <Badge variant="light">{s.nrVehicule}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="gray">
                          {s.nrBonuri}
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
