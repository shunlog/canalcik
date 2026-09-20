import type { BonRef } from "@canalcik/server/api-types";
import { Anchor, Table } from "@mantine/core";
import { Link } from "react-router";
import { formatIsoDate } from "../lib/forms.ts";
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
    <Table.ScrollContainer minWidth={520}>
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
                <Anchor component={Link} to={`/bonuri/${b.id}`}>
                  {formatIsoDate(b.data)}
                </Anchor>
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
