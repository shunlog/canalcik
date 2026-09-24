import type { BonRef } from "@canalcik/server/api-types";
import { Table } from "@mantine/core";
import { BonLink } from "./BonLink.tsx";
import { SoferLink } from "./SoferLink.tsx";
import { VehiculShortLink } from "./VehiculLink.tsx";

/** The shared bon listing — used by the list page and by both detail pages. */
export function BonuriTable({
  bonuri,
  hideSofer,
  hideVehicul,
}: {
  bonuri: BonRef[];
  hideSofer?: boolean;
  hideVehicul?: boolean;
}) {
  return (
    <Table.ScrollContainer minWidth={520} maw={650}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Data</Table.Th>
            {!hideSofer && <Table.Th>Șofer</Table.Th>}
            {!hideVehicul && <Table.Th>Vehicul</Table.Th>}
            <Table.Th>Materiale</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {bonuri.map((b) => (
            <Table.Tr key={b.id}>
              <Table.Td>
                <BonLink bon={b} />
              </Table.Td>
              {!hideSofer && (
                <Table.Td>
                  <SoferLink sofer={b.sofer} />
                </Table.Td>
              )}
              {!hideVehicul && (
                <Table.Td>
                  <VehiculShortLink vehicul={b.vehicul} />
                </Table.Td>
              )}
              <Table.Td>
                {b.nrLinii}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
