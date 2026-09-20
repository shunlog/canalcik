import { Button, Fieldset, Group, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useBon, useDeleteBon, useUpdateBon } from "../../api/bonuri.ts";
import { DeleteButton } from "../../components/DeleteButton.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { SoferLink } from "../../components/SoferLink.tsx";
import { VehiculLink } from "../../components/VehiculLink.tsx";
import { ApiError } from "../../lib/api.ts";
import { showError, notifyIncomplete, showSaved } from "../../lib/feedback.ts";
import { formatIsoDate } from "../../lib/forms.ts";
import { BonFields } from "./BonFields.tsx";
import { bonValidation, emptyBonForm, fromBonForm, toBonForm, type BonFormValues } from "./bonForm.ts";

export function BonDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();

  const query = useBon(id);
  const update = useUpdateBon(id);
  const remove = useDeleteBon(id);

  const form = useForm<BonFormValues>({
    initialValues: emptyBonForm(),
    validate: bonValidation,
  });

  const bon = query.data;
  useEffect(() => {
    if (bon) form.setValues(toBonForm(bon));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bon]);

  const submit = (values: BonFormValues) => {
    // `materiale` is always sent, so the server replaces the whole set with
    // exactly what is on screen — added, edited and removed lines in one go.
    update.mutate(fromBonForm(values), {
      onSuccess: () => showSaved("Modificări salvate"),
      onError: (err) => {
        if (err instanceof ApiError && err.fields) form.setErrors(err.fields);
        showError(err, "Salvarea a eșuat");
      },
    });
  };

  return (
    <QueryBoundary query={query}>
      {(b) => (
        <>
          <PageHeader
            title={`Bon din ${formatIsoDate(b.data)}`}
            subtitle={`${b.materiale.length} ${b.materiale.length === 1 ? "linie" : "linii"} · modificat ${new Date(b.updatedAt).toLocaleString("ro-RO")}`}
            actions={
              <>
                <Button variant="default" onClick={() => void navigate("/bonuri")}>
                  Înapoi
                </Button>
                <DeleteButton
                  confirmText={`Ștergeți bonul din ${formatIsoDate(b.data)}? Liniile de materiale se șterg odată cu el.`}
                  backTo="/bonuri"
                  loading={remove.isPending}
                  onDelete={() => remove.mutateAsync()}
                />
              </>
            }
          />

          <Fieldset legend="Legături" mb="md">
            <Group gap="xl">
              <Text size="sm">
                Șofer: <SoferLink sofer={b.sofer} />
              </Text>
              <Text size="sm">
                Vehicul: <VehiculLink vehicul={b.vehicul} />
              </Text>
            </Group>
          </Fieldset>

          <form onSubmit={form.onSubmit(submit, notifyIncomplete)}>
            <BonFields form={form} />
            <Group mt="md">
              <Button type="submit" loading={update.isPending}>
                Salvează
              </Button>
              <Button
                variant="subtle"
                onClick={() => form.setValues(toBonForm(b))}
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
