import type { MonthlyReport } from "@canalcik/server/api-types";
import { Button, Tooltip } from "@mantine/core";
import type { CSSProperties } from "react";

export const INCONSISTENT_MESSAGE =
  "Datele din bonuri nu coincid cu datele din Factura de Expediție";

/**
 * Why the month cannot be generated, and whether the cause is wrong data rather
 * than missing data — the two block generation but read very differently, so
 * they get different colours.
 */
export function generateBlock(m: MonthlyReport): { reason: string | null; inconsistent: boolean } {
  if (m.nrBonuri === 0) return { reason: "Luna nu are bonuri", inconsistent: false };
  if (m.facturi.length === 0)
    return { reason: "Luna nu are factură de expediție", inconsistent: false };
  if (m.nrDiferente) return { reason: INCONSISTENT_MESSAGE, inconsistent: true };
  return { reason: null, inconsistent: false };
}

// Mantine's `data-disabled` rule paints the gray "disabled" tokens onto
// background/color/border directly — not through the --button-* variables, so
// overriding those has no effect and `color="red"` loses to it. An inline
// declaration does win, so the inconsistent state keeps the disabled behaviour
// and repaints it red.
const INCONSISTENT_STYLE: CSSProperties = {
  backgroundColor: "var(--mantine-color-red-1)",
  color: "var(--mantine-color-red-9)",
  borderColor: "var(--mantine-color-red-3)",
};

/**
 * The "Generează" action, shared by the month list and one month's own page so
 * the two cannot disagree about when a report may be produced. The mutation
 * stays with the caller: the list drives one mutation for every row and tells
 * them apart by `gen.variables`.
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
  const { reason, inconsistent } = generateBlock(report);

  return (
    <Tooltip label={reason} disabled={!reason} multiline w={260}>
      <Button
        size={size}
        loading={loading}
        data-disabled={!!reason}
        style={inconsistent ? INCONSISTENT_STYLE : undefined}
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
  );
}
