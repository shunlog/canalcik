import type { IsoDate, VehiculRef } from "@canalcik/server/api-types";
import { Anchor, type AnchorProps } from "@mantine/core";
import { Link } from "react-router";
import { actDefectiuneLabel } from "../lib/labels.ts";

export function ActDefectiuneLink({
  act,
  ...rest
}: { act: { id: number; data: IsoDate; vehicul: VehiculRef } } & AnchorProps) {
  return (
    <Anchor component={Link} to={`/act-defectiune/${act.id}`} {...rest}>
      {actDefectiuneLabel(act)}
    </Anchor>
  );
}
