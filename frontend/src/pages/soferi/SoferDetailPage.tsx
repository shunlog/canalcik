import { Button, Divider, Group, Stack, Text, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useDeleteSofer, useSetVehicule, useSofer, useUpdateSofer } from "../../api/soferi.ts";
import { useVehicule } from "../../api/vehicule.ts";
import { BonuriTable } from "../../components/BonuriTable.tsx";
import { DeleteButton } from "../../components/DeleteButton.tsx";
import { LinkEditor } from "../../components/LinkEditor.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { RefLinkList } from "../../components/RefLinkList.tsx";
import { ApiError } from "../../lib/api.ts";
import { showError, notifyIncomplete, showSaved } from "../../lib/feedback.ts";
import { requiredNum, requiredText } from "../../lib/forms.ts";
import { vehiculLabel } from "../../lib/labels.ts";
import { SoferFields } from "./SoferFields.tsx";
import { emptySoferForm, fromSoferForm, toSoferForm, type SoferFormValues } from "./soferForm.ts";

export function SoferDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();

  const query = useSofer(id);
  const vehicule = useVehicule();
  const update = useUpdateSofer(id);
  const setVehicule = useSetVehicule(id);
  const remove = useDeleteSofer(id);

  const form = useForm<SoferFormValues>({
    initialValues: emptySoferForm,
    validate: { cod: requiredNum("Nr. de pontaj"), nume: requiredText("Numele") },
  });

  // Reset the form whenever the server's copy changes (first load, or a refetch
  // after this sofer was touched from a vehicle page).
  const sofer = query.data;
  useEffect(() => {
    if (sofer) form.setValues(toSoferForm(sofer));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sofer]);

  const submit = (values: SoferFormValues) => {
    update.mutate(fromSoferForm(values), {
      onSuccess: () => showSaved("Modificări salvate"),
      onError: (err) => {
        if (err instanceof ApiError && err.fields) form.setErrors(err.fields);
        showError(err, "Salvarea a eșuat");
      },
    });
  };

  return (
    <QueryBoundary query={query}>
      {(s) => (
        <>
          <PageHeader
            title={s.nume}
            subtitle={`Nr. de pontaj ${s.cod} · modificat ${new Date(s.updatedAt).toLocaleString("ro-RO")}`}
            actions={
              <>
                <Button variant="default" onClick={() => void navigate("/soferi")}>
                  Înapoi
                </Button>
                <DeleteButton
                  confirmText={`Ștergeți șoferul „${s.nume}”? Acțiunea nu poate fi anulată.`}
                  backTo="/soferi"
                  loading={remove.isPending}
                  onDelete={() => remove.mutateAsync()}
                />
              </>
            }
          />

          <form onSubmit={form.onSubmit(submit, notifyIncomplete)}>
            <SoferFields form={form} />
            <Group mt="md">
              <Button type="submit" loading={update.isPending}>
                Salvează
              </Button>
              <Button
                variant="subtle"
                onClick={() => form.setValues(toSoferForm(s))}
                disabled={update.isPending}
              >
                Resetează
              </Button>
            </Group>
          </form>

          <Divider my="xl" />

          <Stack gap="md" maw={500}>
            <Title order={3}>Vehicule atribuite</Title>
            <RefLinkList
              items={s.vehicule.map((v) => ({
                id: v.id,
                label: vehiculLabel(v),
                to: `/vehicule/${v.id}`,
              }))}
              empty="Niciun vehicul atribuit."
            />
            <LinkEditor
              label="Modifică atribuirile"
              placeholder="Alegeți vehicule"
              options={(vehicule.data ?? []).map((v) => ({
                value: String(v.id),
                label: vehiculLabel(v),
              }))}
              value={s.vehicule.map((v) => v.id)}
              loading={vehicule.isPending}
              saving={setVehicule.isPending}
              onSave={(ids) =>
                setVehicule.mutate(
                  { vehiculIds: ids },
                  {
                    onSuccess: () => showSaved("Atribuiri salvate"),
                    onError: (err) => showError(err, "Salvarea atribuirilor a eșuat"),
                  },
                )
              }
            />
          </Stack>

          <Stack gap="sm" mt="xl" maw={650}>
            <Title order={3}>Bonuri de eliberare</Title>
            {s.bonuri.length === 0 ? (
              <Text size="sm" c="dimmed">
                Niciun bon pentru acest șofer.
              </Text>
            ) : (
              <BonuriTable bonuri={s.bonuri} hideSofer />
            )}
          </Stack>
        </>
      )}
    </QueryBoundary>
  );
}
