import type { MaterialRef } from "@canalcik/server/api-types";
import { Anchor, type AnchorProps } from "@mantine/core";
import { Link } from "react-router";
import { materialLabel } from "../lib/labels.ts";

export function MaterialLink({ material, ...rest }: { material: MaterialRef } & AnchorProps) {
  return (
    <Anchor component={Link} to={`/materiale/${material.id}`} {...rest}>
      {materialLabel(material)}
    </Anchor>
  );
}
