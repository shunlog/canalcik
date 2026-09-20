import type { VehiculRef } from "@canalcik/server/api-types";
import { Anchor, type AnchorProps } from "@mantine/core";
import { Link } from "react-router";
import { vehiculLabel, vehiculShortLabel } from "../lib/labels.ts";

export function VehiculLink({ vehicul, ...rest }: { vehicul: VehiculRef } & AnchorProps) {
  return (
    <Anchor component={Link} to={`/vehicule/${vehicul.id}`} {...rest}>
      {vehiculLabel(vehicul)}
    </Anchor>
  );
}

/** Same link, but showing only the plate number — for compact table columns. */
export function VehiculShortLink({ vehicul, ...rest }: { vehicul: VehiculRef } & AnchorProps) {
  return (
    <Anchor component={Link} to={`/vehicule/${vehicul.id}`} {...rest}>
      {vehiculShortLabel(vehicul)}
    </Anchor>
  );
}
