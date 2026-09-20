import type { FacturaLineOut } from "@canalcik/server/api-types";
import { Button, Fieldset, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useDeleteFactura, useFactura, useUpdateFactura } from "../../api/facturi.ts";
import { DeleteButton } from "../../components/DeleteButton.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { RefLinkList } from "../../components/RefLinkList.tsx";
import { ApiError } from "../../lib/api.ts";
import { showError, notifyIncomplete, showSaved } from "../../lib/feedback.ts";
import { formatIsoDate, formatMoney } from "../../lib/forms.ts";
import { materialLabel } from "../../lib/labels.ts";
import { FacturaFields } from "./FacturaFields.tsx";
import {
  emptyFacturaForm,
  facturaTotal,
  facturaValidation,
  fromFacturaForm,
  toFacturaForm,
  type FacturaFormValues,
} from "./facturaForm.ts";

export function FacturaDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();

  const query = useFactura(id);
  const update = useUpdateFactura(id);
  const remove = useDeleteFactura(id);

  const form = useForm<FacturaFormValues>({
    initialValues: emptyFacturaForm(),
    validate: facturaValidation,
  });

  const factura = query.data;
  useEffect(() => {
    if (factura) form.setValues(toFacturaForm(factura));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factura]);

  const submit = (values: FacturaFormValues) => {
    // `materiale` is always sent, so the server replaces the whole set with
    // exactly what is on screen — added, edited and removed lines in one go.
    update.mutate(fromFacturaForm(values), {
      onSuccess: () => showSaved("Modificări salvate"),
      onError: (err) => {
        if (err instanceof ApiError && err.fields) form.setErrors(err.fields);
        showError(err, "Salvarea a eșuat");
      },
    });
  };

  return (
    <QueryBoundary query={query}>
      {(f) => (
        <>
          <PageHeader
            title={`Factură din ${formatIsoDate(f.data)}`}
            subtitle={`${f.materiale.length} ${f.materiale.length === 1 ? "linie" : "linii"} · ${formatMoney(facturaTotal(f.materiale))} lei · modificat ${new Date(f.updatedAt).toLocaleString("ro-RO")}`}
            actions={
              <>
                <Button variant="default" onClick={() => void navigate("/facturi")}>
                  Înapoi
                </Button>
                <DeleteButton
                  confirmText={`Ștergeți factura din ${formatIsoDate(f.data)}? Liniile de materiale se șterg odată cu ea.`}
                  backTo="/facturi"
                  loading={remove.isPending}
                  onDelete={() => remove.mutateAsync()}
                />
              </>
            }
          />

          <Fieldset legend="Materiale din catalog" mb="md">
            <RefLinkList
              items={distinctMateriale(f.materiale)}
              empty="Factura nu are nicio linie."
            />
          </Fieldset>

          <form onSubmit={form.onSubmit(submit, notifyIncomplete)}>
            <FacturaFields form={form} />
            <Group mt="md">
              <Button type="submit" loading={update.isPending}>
                Salvează
              </Button>
              <Button
                variant="subtle"
                onClick={() => form.setValues(toFacturaForm(f))}
                disabled={update.isPending}
              >
                Resetează
              </Button>
            </Group>
          </form>
        </>
      )}
    </QueryBoundary>
  );
}

/**
 * The catalogue rows this factura's lines point at, as links to their pages. One
 * entry per material, not per line: the same material can be delivered twice on
 * one factura under two codes, and two identical links would only repeat itself.
 */
function distinctMateriale(lines: FacturaLineOut[]) {
  const byId = new Map(lines.map((m) => [m.materialId, m.nume]));
  return [...byId].map(([materialId, nume]) => ({
    id: materialId,
    label: materialLabel({ id: materialId, nume }),
    to: `/materiale/${materialId}`,
  }));
}
