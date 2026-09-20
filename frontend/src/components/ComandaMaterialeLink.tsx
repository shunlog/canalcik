import type { ComandaMaterialeListItem } from "@canalcik/server/api-types";
import { Anchor, type AnchorProps } from "@mantine/core";
import { Link } from "react-router";
import { comandaMaterialeLabel } from "../lib/labels.ts";

export function ComandaMaterialeLink({
  comanda,
  ...rest
}: { comanda: Pick<ComandaMaterialeListItem, "id" | "data"> } & AnchorProps) {
  return (
    <Anchor component={Link} to={`/comanda-materiale/${comanda.id}`} {...rest}>
      {comandaMaterialeLabel(comanda)}
    </Anchor>
  );
}
