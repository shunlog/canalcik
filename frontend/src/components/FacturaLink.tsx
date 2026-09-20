import type { FacturaRef } from "@canalcik/server/api-types";
import { Anchor, type AnchorProps } from "@mantine/core";
import { Link } from "react-router";
import { facturaLabel } from "../lib/labels.ts";

export function FacturaLink({
  factura,
  ...rest
}: { factura: Pick<FacturaRef, "id" | "data"> } & AnchorProps) {
  return (
    <Anchor component={Link} to={`/facturi/${factura.id}`} {...rest}>
      {facturaLabel(factura)}
    </Anchor>
  );
}
