import { Anchor, Badge, Button, Group, Table, Text, TextInput } from "@mantine/core";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { eipExpiryDate, type EipEquipmentField } from "@canalcik/server/derived";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useSoferi } from "../../api/soferi.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { todayLocalIso } from "../../lib/forms.ts";
import { fuzzySearch } from "../../lib/search.ts";

const EIP_FIELDS: EipEquipmentField[] = [
  "eipScurta",
  "eipIncaltaminte",
  "eipCostum",
  "eipPantaloni",
  "eipVestaAvertizare",
];

export function SoferiListPage() {
  const [search, setSearch] = useState("");
  const query = useSoferi();
  const soferi = useMemo(
    () => fuzzySearch(query.data ?? [], search, [(s) => s.nume, (s) => s.cod]),
    [query.data, search],
  );
  const today = todayLocalIso();

  return (
    <>
      <PageHeader
        title="Șoferi"
        subtitle={query.data ? `${soferi.length} înregistrări` : undefined}
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
        {() =>
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
                    <Table.Th w={130}>Echipament expirat</Table.Th>
                    <Table.Th>Vehicule</Table.Th>
                    <Table.Th>Bonuri</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {soferi.map((s) => {
                    const expiredEquipment = EIP_FIELDS.filter((field) => {
                      const expiryDate = eipExpiryDate(s[field], field);
                      return expiryDate !== null && expiryDate < today;
                    }).length;

                    return (
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
                        <Table.Td w={130}>
                          {expiredEquipment === 0 ? (
                            <Badge color="gray" variant="light">
                              0
                            </Badge>
                          ) : (
                            <Group gap={4} wrap="nowrap">
                              <span aria-label="Echipament expirat">⚠️</span>
                              <Badge color="yellow" variant="light">
                                {expiredEquipment}
                              </Badge>
                            </Group>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light">
                            {s.nrVehicule}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light">
                            {s.nrBonuri}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )
        }
      </QueryBoundary>
    </>
  );
}
