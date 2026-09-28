import type { MaterialRef } from "@canalcik/server/api-types";
import { Anchor, type AnchorProps } from "@mantine/core";
import { Link } from "react-router";
import { materialLabel, materialShortLabel } from "../lib/labels.ts";

export function MaterialLink({ material, ...rest }: { material: MaterialRef } & AnchorProps) {
  return (
    <Anchor component={Link} to={`/materiale/${material.id}`} {...rest}>
      {materialLabel(material)}
    </Anchor>
  );
}

/** Same link, but showing only the name — for tables/forms that already show the nrCart. */
export function MaterialShortLink({
  material,
  ...rest
}: { material: Pick<MaterialRef, "id" | "nume"> } & AnchorProps) {
  return (
    <Anchor component={Link} to={`/materiale/${material.id}`} {...rest}>
      {materialShortLabel(material)}
    </Anchor>
  );
}
