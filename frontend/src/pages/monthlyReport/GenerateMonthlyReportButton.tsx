import type { MonthlyReport } from "@canalcik/server/api-types";
import { Button, Group, Tooltip } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { HelpTooltip } from "../../components/HelpTooltip.tsx";

export const INCONSISTENT_MESSAGE =
  "Datele din bonuri nu coincid cu datele din Factura de Expediție";

/**
 * Why the month cannot be generated at all — missing data, not disagreeing
 * data. A totals mismatch no longer blocks generation, so it isn't reported
 * here; see `isInconsistent` for that warning instead.
 */
export function generateBlock(m: MonthlyReport): { reason: string | null } {
  if (m.nrBonuri === 0) return { reason: "Luna nu are bonuri" };
  if (m.nrFacturi === 0) return { reason: "Luna nu are factură de expediție" };
  return { reason: null };
}

export function isInconsistent(m: MonthlyReport): boolean {
  return !!m.nrDiferente;
}

/**
 * The "Generează" action, shared by the month list and one month's own page so
 * the two cannot disagree about when a report may be produced. The mutation
 * stays with the caller: the list drives one mutation for every row and tells
 * them apart by `gen.variables`. A totals mismatch doesn't block generation —
 * it's only flagged with a warning icon next to the button.
 */
export function GenerateMonthlyReportButton({
  report,
  loading,
  onGenerate,
  size = "xs",
}: {
  report: MonthlyReport;
  loading: boolean;
  onGenerate: () => void;
  size?: string;
}) {
  const { reason } = generateBlock(report);

  return (
    <Group gap="xs">
      <Tooltip label={reason} disabled={!reason} multiline w={260}>
        <Button
          size={size}
          loading={loading}
          data-disabled={!!reason}
          onClick={(e) => {
            if (reason) {
              e.preventDefault();
              return;
            }
            onGenerate();
          }}
        >
          {report.document ? "Re-generează" : "Generează"}
        </Button>
      </Tooltip>
      {isInconsistent(report) && (
        <HelpTooltip label={INCONSISTENT_MESSAGE} icon={IconAlertTriangle} color="red" />
      )}
    </Group>
  );
}
