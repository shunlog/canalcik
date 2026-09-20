import type { BonRef } from "@canalcik/server/api-types";
import { Anchor, type AnchorProps } from "@mantine/core";
import { Link } from "react-router";
import { bonLabel } from "../lib/labels.ts";

export function BonLink({ bon, ...rest }: { bon: Pick<BonRef, "id" | "data"> } & AnchorProps) {
  return (
    <Anchor component={Link} to={`/bonuri/${bon.id}`} {...rest}>
      {bonLabel(bon)}
    </Anchor>
  );
}
