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
import { showError, notifyIncomplete, showSaved } from "../../lib/feedback.ts";
import { requiredNum, requiredText } from "../../lib/forms.ts";
import { soferLabel } from "../../lib/labels.ts";
import { AcumulatoareTable } from "./AcumulatoareTable.tsx";
import { AnvelopeKmTable } from "./AnvelopeKmTable.tsx";
import { AnvelopeLuniTable } from "./AnvelopeLuniTable.tsx";
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
      nrInmatriculare: requiredText("Nr. înmatriculare"),
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
            title={v.nrInmatriculare}
            subtitle={`${v.tip} · ${v.model} · modificat ${new Date(v.updatedAt).toLocaleString("ro-RO")}`}
            actions={
              <>
                <Button variant="default" onClick={() => void navigate("/vehicule")}>
                  Înapoi
                </Button>
                <DeleteButton
                  confirmText={`Ștergeți vehiculul „${v.nrInmatriculare}”? Acțiunea nu poate fi anulată.`}
                  backTo="/vehicule"
                  loading={remove.isPending}
                  onDelete={() => remove.mutateAsync()}
                />
              </>
            }
          />

          <form onSubmit={form.onSubmit(submit, notifyIncomplete)}>
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

          <Fieldset legend="Șoferi atribuiți" maw={500}>
            <Stack gap="md">
              <RefLinkList
                items={v.soferi.map((s) => ({
                  id: s.id,
                  label: soferLabel(s),
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

          <Fieldset legend="Bonuri de eliberare" mt="md" maw={650}>
            {v.bonuri.length === 0 ? (
              <Text size="sm" c="dimmed">
                Niciun bon pentru acest vehicul.
              </Text>
            ) : (
              <BonuriTable bonuri={v.bonuri} hideVehicul />
            )}
          </Fieldset>

          <Fieldset legend="Anvelope — normă în luni" mt="md" maw={860}>
            <AnvelopeLuniTable vehiculId={v.id} anvelope={v.anvelopeLuni} />
          </Fieldset>

          <Fieldset legend="Anvelope — normă în km" mt="md" maw={940}>
            <AnvelopeKmTable vehiculId={v.id} kmActuali={v.kmActuali} anvelope={v.anvelopeKm} />
          </Fieldset>

          <Fieldset legend="Acumulatoare" mt="md" maw={860}>
            <AcumulatoareTable vehiculId={v.id} acumulatoare={v.acumulatoare} />
          </Fieldset>
        </>
      )}
    </QueryBoundary>
  );
}
