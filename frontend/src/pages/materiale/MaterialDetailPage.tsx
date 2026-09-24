import type { MaterialUsage } from "@canalcik/server/api-types";
import { Anchor, Button, Fieldset, Group, Table, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useDeleteMaterial, useMaterial, useUpdateMaterial } from "../../api/materiale.ts";
import { BonLink } from "../../components/BonLink.tsx";
import { DeleteButton } from "../../components/DeleteButton.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { SoferLink } from "../../components/SoferLink.tsx";
import { VehiculShortLink } from "../../components/VehiculLink.tsx";
import { ApiError } from "../../lib/api.ts";
import { showError, notifyIncomplete, showSaved } from "../../lib/feedback.ts";
import { requiredText } from "../../lib/forms.ts";

/**
 * One material, and every bon line that names it. The listing is per line
 * rather than per bon: the same material can appear twice on one bon under two
 * nomenclature codes, and both are worth seeing.
 */
export function MaterialDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();

  const query = useMaterial(id);
  const update = useUpdateMaterial(id);
  const remove = useDeleteMaterial(id);

  const form = useForm({
    initialValues: { nume: "" },
    validate: { nume: requiredText("Denumirea materialului") },
  });

  const material = query.data;
  useEffect(() => {
    if (material) form.setValues({ nume: material.nume });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material]);

  const submit = ({ nume }: { nume: string }) => {
    update.mutate(
      { nume: nume.trim() },
      {
        onSuccess: () => showSaved("Modificări salvate"),
        onError: (err) => {
          if (err instanceof ApiError && err.fields) form.setErrors(err.fields);
          showError(err, "Salvarea a eșuat");
        },
      },
    );
  };

  return (
    <QueryBoundary query={query}>
      {(m) => (
        <>
          <PageHeader
            title={m.nume}
            subtitle={`${describeUsage(m.utilizari)} · modificat ${new Date(m.updatedAt).toLocaleString("ro-RO")}`}
            actions={
              <>
                <Button variant="default" onClick={() => void navigate("/materiale")}>
                  Înapoi
                </Button>
                <DeleteButton
                  confirmText={`Ștergeți materialul „${m.nume}”? Se poate șterge doar dacă nu apare pe niciun bon și pe nicio factură.`}
                  backTo="/materiale"
                  loading={remove.isPending}
                  onDelete={() => remove.mutateAsync()}
                />
              </>
            }
          />

          <form onSubmit={form.onSubmit(submit, notifyIncomplete)}>
            <Fieldset legend="Material" maw={480}>
              <TextInput
                label="Denumire"
                description="Redenumirea se vede pe toate bonurile care folosesc materialul."
                withAsterisk
                maw={480}
                {...form.getInputProps("nume")}
              />
            </Fieldset>
            <Group mt="md">
              <Button type="submit" loading={update.isPending}>
                Salvează
              </Button>
              <Button
                variant="subtle"
                onClick={() => form.setValues({ nume: m.nume })}
                disabled={update.isPending}
              >
                Resetează
              </Button>
            </Group>
          </form>

          <Fieldset legend="Bonuri de eliberare" mt="xl" maw={850}>
            {m.utilizari.length === 0 ? (
              <Text size="sm" c="dimmed">
                Acest material nu apare pe niciun bon.
              </Text>
            ) : (
              <UtilizariTable utilizari={m.utilizari} />
            )}
          </Fieldset>
        </>
      )}
    </QueryBoundary>
  );
}

function UtilizariTable({ utilizari }: { utilizari: MaterialUsage[] }) {
  return (
    <Table.ScrollContainer minWidth={720} maw={850}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Data</Table.Th>
            <Table.Th>Șofer</Table.Th>
            <Table.Th>Vehicul</Table.Th>
            <Table.Th>Cantitate</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {utilizari.map((u) => (
            <Table.Tr key={u.lineId}>
              <Table.Td>
                <BonLink bon={u.bon} />
              </Table.Td>
              <Table.Td>
                <SoferLink sofer={u.bon.sofer} />
              </Table.Td>
              <Table.Td>
                <VehiculShortLink vehicul={u.bon.vehicul} />
              </Table.Td>
              <Table.Td>
                {u.cantitate} {u.um}
              </Table.Td>
              <Table.Td>
                <Anchor component={Link} to={`/bonuri/${u.bon.id}`} size="sm">
                  Deschide
                </Anchor>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

/**
 * "3 linii pe 3 bonuri · 43 L" — totals are per unit of measure, since a
 * material can be issued in more than one (litres on one bon, kilos on another)
 * and adding those together would be meaningless.
 */
function describeUsage(utilizari: MaterialUsage[]): string {
  if (utilizari.length === 0) return "Nefolosit pe niciun bon";

  const bonuri = new Set(utilizari.map((u) => u.bon.id)).size;
  const totals = new Map<string, number>();
  for (const u of utilizari) totals.set(u.um, (totals.get(u.um) ?? 0) + u.cantitate);

  const linii = `${utilizari.length} ${utilizari.length === 1 ? "linie" : "linii"}`;
  const peBonuri = `${bonuri} ${bonuri === 1 ? "bon" : "bonuri"}`;
  // Sums of floats, so trim the noise a repeated 0.1 would leave behind.
  const cantitati = [...totals]
    .map(([um, total]) => `${Number(total.toFixed(3))} ${um}`)
    .join(", ");

  return `${linii} pe ${peBonuri} · ${cantitati}`;
}
