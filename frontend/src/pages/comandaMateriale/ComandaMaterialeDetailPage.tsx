import { Anchor, Button, Fieldset, Group, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  useComandaMateriale,
  useDeleteComandaMateriale,
  useGenerateComandaMateriale,
  useUpdateComandaMateriale,
} from "../../api/comenziMateriale.ts";
import { DeleteButton } from "../../components/DeleteButton.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { ApiError } from "../../lib/api.ts";
import { showError, notifyIncomplete, showSaved } from "../../lib/feedback.ts";
import { formatIsoDate, formatTimestamp } from "../../lib/forms.ts";
import { ComandaFields } from "./ComandaFields.tsx";
import {
  comandaValidation,
  emptyComandaForm,
  fromComandaForm,
  toComandaForm,
  type ComandaFormValues,
} from "./comandaForm.ts";

export function ComandaMaterialeDetailPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();

  const query = useComandaMateriale(id);
  const update = useUpdateComandaMateriale(id);
  const remove = useDeleteComandaMateriale(id);
  const gen = useGenerateComandaMateriale(id);

  const form = useForm<ComandaFormValues>({
    initialValues: emptyComandaForm(),
    validate: comandaValidation,
  });

  const comanda = query.data;
  useEffect(() => {
    if (comanda) form.setValues(toComandaForm(comanda));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comanda]);

  const submit = (values: ComandaFormValues) => {
    update.mutate(fromComandaForm(values), {
      onSuccess: () => showSaved("Modificări salvate"),
      onError: (err) => {
        if (err instanceof ApiError && err.fields) form.setErrors(err.fields);
        showError(err, "Salvarea a eșuat");
      },
    });
  };

  const generate = () => {
    gen.mutate(undefined, {
      onSuccess: () => showSaved("Comandă de materiale generată"),
      onError: (err) => showError(err, "Generarea a eșuat"),
    });
  };

  return (
    <QueryBoundary query={query}>
      {(c) => (
        <>
          <PageHeader
            title={`Comandă de materiale din ${formatIsoDate(c.data)}`}
            subtitle={`${c.nrMateriale} materiale · modificat ${formatTimestamp(c.updatedAt)}`}
            actions={
              <>
                <Button variant="default" onClick={() => void navigate("/comanda-materiale")}>
                  Înapoi
                </Button>
                <DeleteButton
                  confirmText={`Ștergeți comanda din ${formatIsoDate(c.data)}?`}
                  backTo="/comanda-materiale"
                  loading={remove.isPending}
                  onDelete={() => remove.mutateAsync()}
                />
              </>
            }
          />

          <Fieldset legend="Document generat" mb="md" maw={560}>
            <Stack gap="sm" align="flex-start">
              <Group gap="xl">
                {c.document ? (
                  <>
                    <Group gap="xs">
                      <Text size="sm" c="dimmed">
                        Fișier
                      </Text>
                      <Anchor href={c.document.driveUrl} target="_blank" rel="noreferrer" size="sm">
                        {c.document.nume}
                      </Anchor>
                    </Group>
                    <Group gap="xs">
                      <Text size="sm" c="dimmed">
                        Data
                      </Text>
                      <Text size="sm">{formatTimestamp(c.document.createdAt)}</Text>
                    </Group>
                  </>
                ) : (
                  <Text size="sm">{formatTimestamp(null)}</Text>
                )}
              </Group>

              <Group gap="md">
                <Button size="sm" loading={gen.isPending} onClick={generate}>
                  {c.document ? "Re-generează" : "Generează"}
                </Button>
                <Anchor component={Link} to="/setari" size="sm">
                  Vezi șablonul
                </Anchor>
              </Group>
            </Stack>
          </Fieldset>

          <form onSubmit={form.onSubmit(submit, notifyIncomplete)}>
            <ComandaFields form={form} />
            <Group mt="md">
              <Button type="submit" loading={update.isPending}>
                Salvează
              </Button>
              <Button
                variant="subtle"
                onClick={() => form.setValues(toComandaForm(c))}
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
