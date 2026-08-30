import { Anchor, Button, Fieldset, Group, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  useActDefectiune,
  useDeleteActDefectiune,
  useGenerateActDefectiune,
  useUpdateActDefectiune,
} from "../../api/acteDefectiune.ts";
import { useProduse } from "../../api/produse.ts";
import { DeleteButton } from "../../components/DeleteButton.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { ApiError } from "../../lib/api.ts";
import { showError, notifyIncomplete, showSaved } from "../../lib/feedback.ts";
import { formatIsoDate, formatTimestamp } from "../../lib/forms.ts";
import { vehiculLabel } from "../../lib/labels.ts";
import { aplatizeaza } from "../../lib/produse.tsx";
import { ActFields } from "./ActFields.tsx";
import {
  actValidation,
  emptyActForm,
  fromActForm,
  toActForm,
  type ActFormValues,
} from "./actForm.ts";

export function ActDefectiuneDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();

  const query = useActDefectiune(id);
  const update = useUpdateActDefectiune(id);
  const remove = useDeleteActDefectiune(id);
  const gen = useGenerateActDefectiune(id);
  const produse = useProduse();

  const form = useForm<ActFormValues>({
    initialValues: emptyActForm(),
    validate: actValidation,
  });

  const produseIndexate = useMemo(
    () => (produse.data ?? []).flatMap((c) => aplatizeaza(c, [])),
    [produse.data],
  );

  const act = query.data;
  useEffect(() => {
    if (act) form.setValues(toActForm(act));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [act]);

  const submit = (values: ActFormValues) => {
    update.mutate(fromActForm(values), {
      onSuccess: () => showSaved("Modificări salvate"),
      onError: (err) => {
        if (err instanceof ApiError && err.fields) form.setErrors(err.fields);
        showError(err, "Salvarea a eșuat");
      },
    });
  };

  const generate = () => {
    gen.mutate(undefined, {
      onSuccess: () => showSaved("Act de defecțiune generat"),
      onError: (err) => showError(err, "Generarea a eșuat"),
    });
  };

  return (
    <QueryBoundary query={query}>
      {(a) => (
        <>
          <PageHeader
            title={`Act de defecțiune din ${formatIsoDate(a.data)}`}
            subtitle={`${vehiculLabel(a.vehicul)} · modificat ${formatTimestamp(a.updatedAt)}`}
            actions={
              <>
                <Button variant="default" onClick={() => void navigate("/act-defectiune")}>
                  Înapoi
                </Button>
                <DeleteButton
                  confirmText={`Ștergeți actul din ${formatIsoDate(a.data)}?`}
                  backTo="/act-defectiune"
                  loading={remove.isPending}
                  onDelete={() => remove.mutateAsync()}
                />
              </>
            }
          />

          <Fieldset legend="Document generat" mb="md">
            <Stack gap="sm" align="flex-start">
              <Group gap="xl">
                {a.document ? (
                  <>
                    <Group gap="xs">
                      <Text size="sm" c="dimmed">
                        Fișier
                      </Text>
                      <Anchor href={a.document.driveUrl} target="_blank" rel="noreferrer" size="sm">
                        {a.document.nume}
                      </Anchor>
                    </Group>
                    <Group gap="xs">
                      <Text size="sm" c="dimmed">
                        Data
                      </Text>
                      <Text size="sm">{new Date(a.document.createdAt).toLocaleString("ro-RO")}</Text>
                    </Group>
                  </>
                ) : (
                  <Text size="sm">{formatIsoDate(null)}</Text>
                )}
              </Group>

              <Group gap="md">
                <Button size="sm" loading={gen.isPending} onClick={generate}>
                  {a.document ? "Re-generează" : "Generează"}
                </Button>
                <Anchor component={Link} to="/setari" size="sm">
                  Vezi șablonul
                </Anchor>
              </Group>
            </Stack>
          </Fieldset>

          <form onSubmit={form.onSubmit(submit, notifyIncomplete)}>
            <ActFields form={form} produse={produseIndexate} />
            <Group mt="md">
              <Button type="submit" loading={update.isPending}>
                Salvează
              </Button>
              <Button
                variant="subtle"
                onClick={() => form.setValues(toActForm(a))}
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
