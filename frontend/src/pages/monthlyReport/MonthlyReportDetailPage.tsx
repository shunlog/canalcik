import type { MonthlyReportDetail, MonthlyReportLine } from "@canalcik/server/api-types";
import { ActionIcon, Anchor, Badge, Button, Group, Stack, Table, Text, Title } from "@mantine/core";
import { IconCheck, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useGenerateMonthlyReport, useMonthlyReport } from "../../api/monthlyReport.ts";
import { MaterialShortLink } from "../../components/MaterialLink.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { RefLinkList } from "../../components/RefLinkList.tsx";
import { showError, showSaved } from "../../lib/feedback.ts";
import { formatMonth, formatQty, formatTimestamp } from "../../lib/forms.ts";
import { bonLabel, facturaLabel } from "../../lib/labels.ts";
import { GenerateMonthlyReportButton } from "./GenerateMonthlyReportButton.tsx";
import { HelpTooltip } from "../../components/HelpTooltip.tsx";
import { BonCreateModal } from "./BonCreateModal.tsx";

/**
 * One month's report: what the factura says against what our bonuri say, per
 * nomenclature code. The factura comes from the partner business and cannot be
 * edited, so every non-zero difference here is a bon of ours to go and correct —
 * which is why each row links to the bonuri that produced it.
 */
export function MonthlyReportDetailPage() {
  const month = useParams().month ?? "";
  const navigate = useNavigate();

  const query = useMonthlyReport(month);
  const gen = useGenerateMonthlyReport();

  const generate = () => {
    gen.mutate(month, {
      onSuccess: () => showSaved("Fișă limită generată"),
      onError: (err) => showError(err, "Generarea a eșuat"),
    });
  };

  return (
    <QueryBoundary query={query}>
      {(m) => (
        <>
          <PageHeader
            title={formatMonth(m.month)}
            subtitle={describeMonth(m)}
            actions={
              <Button variant="default" onClick={() => void navigate("/monthly-report")}>
                Înapoi
              </Button>
            }
          />

          <Stack gap="sm" align="flex-start" mb="md" maw={560}>
            <Title order={3}>Document generat</Title>
            <Group gap="xl">
              {m.document ? (
                <>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Fișier
                    </Text>
                    <Anchor href={m.document.driveUrl} target="_blank" rel="noreferrer" size="sm">
                      {m.document.nume}
                    </Anchor>
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      Data
                    </Text>
                    <Text size="sm">{formatTimestamp(m.document.createdAt)}</Text>
                  </Group>
                </>
              ) : (
                <Text size="sm">{formatTimestamp(null)}</Text>
              )}
            </Group>

            <Group gap="md">
              <GenerateMonthlyReportButton
                report={m}
                loading={gen.isPending}
                onGenerate={generate}
                size="sm"
              />
              <Anchor component={Link} to="/setari" size="sm">
                Vezi șablonul
              </Anchor>
            </Group>
          </Stack>

          <Stack gap="sm" mb="md" maw={560}>
            <Title order={3}>Date lunare</Title>
            <Group gap="xl">
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  Bonuri
                </Text>
                <Text>{m.nrBonuri}</Text>
              </Group>
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  Factură
                </Text>
                <RefLinkList
                  items={m.facturi.map((f) => ({
                    id: f.id,
                    label: facturaLabel(f),
                    to: `/facturi/${f.id}`,
                  }))}
                  empty="—"
                />
              </Group>
            </Group>
          </Stack>

          {m.linii.length === 0 ? (
            <Text size="sm" c="dimmed">
              {m.nrBonuri === 0
                ? "Luna nu are bonuri de eliberare."
                : "Luna nu are factură de expediție, deci nu există cu ce compara bonurile."}
            </Text>
          ) : (
            <LiniiTables linii={m.linii} />
          )}
        </>
      )}
    </QueryBoundary>
  );
}

/**
 * Split in two: materiale livrate în luna curentă, and materiale rămase la
 * depozit de lunile precedente (factura's `ramas` flag) — the two shouldn't
 * be compared as one list, since a "ramas" row was never expected to arrive
 * that month.
 */
function LiniiTables({ linii }: { linii: MonthlyReportLine[] }) {
  const luaLunaAsta = linii.filter((l) => !l.ramas);
  const ramase = linii.filter((l) => l.ramas);

  return (
    <Stack gap="lg">
      {luaLunaAsta.length > 0 && (
        <Stack gap="sm">
          <Title order={3}>Luna asta</Title>
          <LiniiTable linii={luaLunaAsta} />
        </Stack>
      )}
      {ramase.length > 0 && (
        <Stack gap="sm">
          <Title order={3}>Rămase la depozit din lunile precedente</Title>
          <LiniiTable linii={ramase} />
        </Stack>
      )}
    </Stack>
  );
}

function LiniiTable({ linii }: { linii: MonthlyReportLine[] }) {
  const [linieNoua, setLinieNoua] = useState<MonthlyReportLine | null>(null);

  return (
    <>
      <Table.ScrollContainer minWidth={1130} maw={1280}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={120}>Cod nomenclator</Table.Th>
              <Table.Th>Denumire</Table.Th>
              <Table.Th w={80}>Suma din facturi</Table.Th>
              <Table.Th w={80}>Suma din bonuri</Table.Th>
              <Table.Th w={150}>Diferență <HelpTooltip label="Cat nu ajunge in bonuri" /></Table.Th>
              <Table.Th w={190}>Bonuri</Table.Th>
              <Table.Th w={190}>Facturi</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {/* materialId is null for a scratchpad-note row (nrCart is then
                always null too — see buildReconciliere), so nume disambiguates
                those; a real materialId already disambiguates everything else,
                even between two rows that happen to share the same nume. */}
            {linii.map((l) => (
              <Table.Tr key={`${l.materialId ?? "note"}|${l.nrCart ?? ""}|${l.nume}`}>
                <Table.Td>{l.nrCart ?? "—"}</Table.Td>
                <Table.Td>
                  {l.materialId === null ? (
                    l.nume
                  ) : (
                    <MaterialShortLink material={{ id: l.materialId, nume: l.nume }} />
                  )}
                </Table.Td>
                <Table.Td>
                  {l.cantitateFactura === null
                    ? "—"
                    : `${formatQty(l.cantitateFactura)} ${l.um}`}
                </Table.Td>
                <Table.Td>{`${formatQty(l.cantitateBonuri)} ${l.um}`}</Table.Td>
                <Table.Td>
                  <DiferentaBadge linie={l} />
                </Table.Td>
                <Table.Td>
                  <Stack gap={4} align="flex-start">
                    <RefLinkList
                      items={l.bonuri.map((b) => ({
                        id: b.id,
                        label: bonLabel(b),
                        to: `/bonuri/${b.id}`,
                      }))}
                      empty="—"
                    />
                    {/* Only a real material has a materialId to pre-fill; a
                        scratchpad-note row has no catalogue material yet. */}
                    {l.materialId !== null && (
                      <ActionIcon
                        variant="light"
                        aria-label="Adaugă bon nou"
                        onClick={() => setLinieNoua(l)}
                      >
                        <IconPlus size={16} />
                      </ActionIcon>
                    )}
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <RefLinkList
                    items={l.facturi.map((f) => ({
                      id: f.id,
                      label: facturaLabel(f),
                      to: `/facturi/${f.id}`,
                    }))}
                    empty="—"
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <BonCreateModal linie={linieNoua} onInchide={() => setLinieNoua(null)} />
    </>
  );
}

// Zero is the goal, so it reads as a checkmark rather than as a number
function DiferentaBadge({ linie }: { linie: MonthlyReportLine }) {
  const diferenta = (linie.cantitateFactura ?? 0) - linie.cantitateBonuri;
  if (diferenta === 0) {
    return (
      <Badge color="green" variant="light" leftSection={<IconCheck size={12} />}>
        0
      </Badge>
    );
  }
  const suffix = diferenta > 0 ? 
  (diferenta == 1 ? "nu ajunge" : "nu ajung") : "prea mult";
  return (
    <Badge color="red" variant="light">
        {formatQty(Math.abs(diferenta))} {linie.um} {suffix}
      </Badge>
  );
}

/** "8 bonuri · 11 diferențe" — or the reason there is nothing to compare. */
function describeMonth(m: MonthlyReportDetail): string {
  const bonuri = `${m.nrBonuri} ${m.nrBonuri === 1 ? "bon" : "bonuri"}`;
  if (m.nrDiferente === null) return bonuri;
  if (m.nrDiferente === 0) return `${bonuri} · datele coincid cu factura`;
  return `${bonuri} · ${m.nrDiferente} ${m.nrDiferente === 1 ? "diferență" : "diferențe"}`;
}
