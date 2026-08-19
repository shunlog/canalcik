import { Button, Divider, Fieldset, Group, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useSoferi } from "../../api/soferi.ts";
import { useDeleteVehicul, useSetSoferi, useUpdateVehicul, useVehicul } from "../../api/vehicule.ts";
import { BonuriTable } from "../../components/BonuriTable.tsx";
import { DeleteButton } from "../../components/DeleteButton.tsx";
import { LinkEditor } from "../../components/LinkEditor.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { RefLinkList } from "../../components/RefLinkList.tsx";
import { ApiError } from "../../lib/api.ts";
import { showError, showSaved } from "../../lib/feedback.ts";
import { requiredNum, requiredText } from "../../lib/forms.ts";
import { plate, soferLabel } from "../../lib/labels.ts";
import { VehiculFields } from "./VehiculFields.tsx";
import {
  emptyVehiculForm,
  fromVehiculForm,
  toVehiculForm,
  type VehiculFormValues,
} from "./vehiculForm.ts";

export function VehiculDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();

  const query = useVehicul(id);
  const soferi = useSoferi();
  const update = useUpdateVehicul(id);
  const setSoferi = useSetSoferi(id);
  const remove = useDeleteVehicul(id);

  const form = useForm<VehiculFormValues>({
    initialValues: emptyVehiculForm,
    validate: {
      litere: requiredText("Seria plăcuței"),
      cifre: requiredText("Numărul plăcuței"),
      nrInventar: requiredNum("Nr. inventar"),
      nrGaraj: requiredNum("Nr. garaj"),
      tip: requiredText("Destinația"),
      model: requiredText("Marca / modelul"),
    },
  });

  const vehicul = query.data;
  useEffect(() => {
    if (vehicul) form.setValues(toVehiculForm(vehicul));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicul]);

  const submit = (values: VehiculFormValues) => {
    update.mutate(fromVehiculForm(values), {
      onSuccess: () => showSaved("Modificări salvate"),
      onError: (err) => {
        if (err instanceof ApiError && err.fields) form.setErrors(err.fields);
        showError(err, "Salvarea a eșuat");
      },
    });
  };

  return (
    <QueryBoundary query={query}>
      {(v) => (
        <>
          <PageHeader
            title={plate(v)}
            subtitle={`${v.tip} · ${v.model} · sincronizat ${new Date(v.syncedAt).toLocaleString("ro-RO")}`}
            actions={
              <>
                <Button variant="default" onClick={() => void navigate("/vehicule")}>
                  Înapoi
                </Button>
                <DeleteButton
                  confirmText={`Ștergeți vehiculul „${plate(v)}”? Acțiunea nu poate fi anulată.`}
                  backTo="/vehicule"
                  loading={remove.isPending}
                  onDelete={() => remove.mutateAsync()}
                />
              </>
            }
          />

          <form onSubmit={form.onSubmit(submit)}>
            <VehiculFields form={form} />
            <Group mt="md">
              <Button type="submit" loading={update.isPending}>
                Salvează
              </Button>
              <Button
                variant="subtle"
                onClick={() => form.setValues(toVehiculForm(v))}
                disabled={update.isPending}
              >
                Resetează
              </Button>
            </Group>
          </form>

          <Divider my="xl" />

          <Fieldset legend="Șoferi atribuiți">
            <Stack gap="md">
              <RefLinkList
                items={v.soferi.map((s) => ({
                  id: s.id,
                  label: `${s.nume} (${s.cod})`,
                  to: `/soferi/${s.id}`,
                }))}
                empty="Niciun șofer atribuit."
              />
              <LinkEditor
                label="Modifică atribuirile"
                placeholder="Alegeți șoferi"
                options={(soferi.data ?? []).map((s) => ({
                  value: String(s.id),
                  label: soferLabel(s),
                }))}
                value={v.soferi.map((s) => s.id)}
                loading={soferi.isPending}
                saving={setSoferi.isPending}
                onSave={(ids) =>
                  setSoferi.mutate(
                    { soferIds: ids },
                    {
                      onSuccess: () => showSaved("Atribuiri salvate"),
                      onError: (err) => showError(err, "Salvarea atribuirilor a eșuat"),
                    },
                  )
                }
              />
            </Stack>
          </Fieldset>

          <Fieldset legend="Bonuri de eliberare" mt="md">
            {v.bonuri.length === 0 ? (
              <Text size="sm" c="dimmed">
                Niciun bon pentru acest vehicul.
              </Text>
            ) : (
              <BonuriTable bonuri={v.bonuri} hideVehicul />
            )}
          </Fieldset>
        </>
      )}
    </QueryBoundary>
  );
}
