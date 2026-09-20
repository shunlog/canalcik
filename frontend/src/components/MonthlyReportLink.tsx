import type { MonthlyReport } from "@canalcik/server/api-types";
import { Anchor, type AnchorProps } from "@mantine/core";
import { Link } from "react-router";
import { monthlyReportLabel } from "../lib/labels.ts";

export function MonthlyReportLink({
  report,
  ...rest
}: { report: Pick<MonthlyReport, "month"> } & AnchorProps) {
  return (
    <Anchor component={Link} to={`/monthly-report/${report.month}`} {...rest}>
      {monthlyReportLabel(report)}
    </Anchor>
  );
}
