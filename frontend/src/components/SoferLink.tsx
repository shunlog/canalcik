import type { SoferRef } from "@canalcik/server/api-types";
import { Anchor, type AnchorProps } from "@mantine/core";
import { Link } from "react-router";
import { soferLabel } from "../lib/labels.ts";

export function SoferLink({ sofer, ...rest }: { sofer: SoferRef } & AnchorProps) {
  return (
    <Anchor component={Link} to={`/soferi/${sofer.id}`} {...rest}>
      {soferLabel(sofer)}
    </Anchor>
  );
}
