import type { MaterialFacturaUsage, MaterialUsage } from "@canalcik/server/api-types";
import { Button, Group, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useDeleteMaterial, useMaterial, useUpdateMaterial } from "../../api/materiale.ts";
import { BonLink } from "../../components/BonLink.tsx";
import { DeleteButton } from "../../components/DeleteButton.tsx";
import { FacturaLink } from "../../components/FacturaLink.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { SoferLink } from "../../components/SoferLink.tsx";
import { VehiculShortLink } from "../../components/VehiculLink.tsx";
import { ApiError } from "../../lib/api.ts";
import { showError, notifyIncomplete, showSaved } from "../../lib/feedback.ts";
import { requiredText } from "../../lib/forms.ts";

/**
 * One material, and every bon and factura line that names it. The bon listing
 * is per line rather than per bon: the same material can appear twice on one
 * bon under two nomenclature codes, and both are worth seeing.
 */
export function MaterialDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();

  const query = useMaterial(id);
  const update = useUpdateMaterial(id);
  const remove = useDeleteMaterial(id);

  const form = useForm({
    initialValues: { nume: "", nrCart: "", um: "" },
    validate: {
      nume: requiredText("Denumirea materialului"),
      nrCart: requiredText("Codul nomenclator"),
      um: requiredText("Unitatea de măsură"),
    },
  });

  const material = query.data;
  useEffect(() => {
    if (material) form.setValues({ nume: material.nume, nrCart: material.nrCart, um: material.um });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material]);

  const submit = ({ nume, nrCart, um }: { nume: string; nrCart: string; um: string }) => {
    update.mutate(
      { nume: nume.trim(), nrCart: nrCart.trim(), um: um.trim().toUpperCase() },
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
            subtitle={`${describeUsage(m.utilizari, m.um)} · modificat ${new Date(m.updatedAt).toLocaleString("ro-RO")}`}
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
            <TextInput
              label="Cod nomenclator"
              description="Codul e ceea ce leagă materialul de bonuri și facturi."
              withAsterisk
              maw={280}
              {...form.getInputProps("nrCart")}
            />
            <TextInput
              mt="sm"
              label="Denumire"
              description="Redenumirea se vede pe toate bonurile care folosesc materialul."
              withAsterisk
              maw={480}
              {...form.getInputProps("nume")}
            />
            <TextInput
              mt="sm"
              label="Unitate de măsură"
              description="Unitatea folosită de fiecare bon și factură care leagă acest material."
              withAsterisk
              maw={160}
              {...form.getInputProps("um")}
            />
            <Group mt="md">
              <Button type="submit" loading={update.isPending}>
                Salvează
              </Button>
              <Button
                variant="subtle"
                onClick={() => form.setValues({ nume: m.nume, nrCart: m.nrCart, um: m.um })}
                disabled={update.isPending}
              >
                Resetează
              </Button>
            </Group>
          </form>

          <Stack gap="sm" mt="xl" maw={850}>
            <Title order={3}>Bonuri de eliberare</Title>
            {m.utilizari.length === 0 ? (
              <Text size="sm" c="dimmed">
                Acest material nu apare pe niciun bon.
              </Text>
            ) : (
              <UtilizariTable utilizari={m.utilizari} um={m.um} />
            )}
          </Stack>

          <Stack gap="sm" mt="xl" maw={850}>
            <Title order={3}>Facturi</Title>
            {m.facturi.length === 0 ? (
              <Text size="sm" c="dimmed">
                Acest material nu apare pe nicio factură.
              </Text>
            ) : (
              <FacturiTable facturi={m.facturi} um={m.um} />
            )}
          </Stack>
        </>
      )}
    </QueryBoundary>
  );
}

function UtilizariTable({ utilizari, um }: { utilizari: MaterialUsage[]; um: string }) {
  return (
    <Table.ScrollContainer minWidth={600} maw={850}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Data</Table.Th>
            <Table.Th>Șofer</Table.Th>
            <Table.Th>Vehicul</Table.Th>
            <Table.Th>Cantitate</Table.Th>
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
                {u.cantitate} {um}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

function FacturiTable({ facturi, um }: { facturi: MaterialFacturaUsage[]; um: string }) {
  return (
    <Table.ScrollContainer minWidth={400} maw={850}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Data</Table.Th>
            <Table.Th>Cantitate</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {facturi.map((f) => (
            <Table.Tr key={f.lineId}>
              <Table.Td>
                <FacturaLink factura={f.factura} />
              </Table.Td>
              <Table.Td>
                {f.cantitate} {um}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

/**
 * "3 linii pe 3 bonuri · 43 L" — every usage is of this one material, so its
 * quantities all share the material's own unit and can be summed directly.
 */
function describeUsage(utilizari: MaterialUsage[], um: string): string {
  if (utilizari.length === 0) return "Nefolosit pe niciun bon";

  const bonuri = new Set(utilizari.map((u) => u.bon.id)).size;
  // Sum of floats, so trim the noise a repeated 0.1 would leave behind.
  const total = utilizari.reduce((sum, u) => sum + u.cantitate, 0);

  const linii = `${utilizari.length} ${utilizari.length === 1 ? "linie" : "linii"}`;
  const peBonuri = `${bonuri} ${bonuri === 1 ? "bon" : "bonuri"}`;

  return `${linii} pe ${peBonuri} · ${Number(total.toFixed(3))} ${um}`;
}
