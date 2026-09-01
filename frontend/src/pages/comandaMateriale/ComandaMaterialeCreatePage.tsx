import { Button, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router";
import { useCreateComandaMateriale } from "../../api/comenziMateriale.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { ApiError } from "../../lib/api.ts";
import { showError, notifyIncomplete, showSaved } from "../../lib/feedback.ts";
import { ComandaFields } from "./ComandaFields.tsx";
import {
  comandaValidation,
  emptyComandaForm,
  fromComandaForm,
  type ComandaFormValues,
} from "./comandaForm.ts";

export function ComandaMaterialeCreatePage() {
  const navigate = useNavigate();
  const create = useCreateComandaMateriale();

  const form = useForm<ComandaFormValues>({
    initialValues: emptyComandaForm(),
    validate: comandaValidation,
  });

  const submit = (values: ComandaFormValues) => {
    create.mutate(fromComandaForm(values), {
      onSuccess: (comanda) => {
        showSaved("Comandă creată");
        void navigate(`/comanda-materiale/${comanda.id}`);
      },
      onError: (err) => {
        if (err instanceof ApiError && err.fields) form.setErrors(err.fields);
        showError(err, "Crearea a eșuat");
      },
    });
  };

  return (
    <form onSubmit={form.onSubmit(submit, notifyIncomplete)}>
      <PageHeader title="Comandă de materiale nouă" />
      <ComandaFields form={form} />
      <Group mt="md">
        <Button type="submit" loading={create.isPending}>
          Salvează
        </Button>
        <Button variant="subtle" onClick={() => void navigate("/comanda-materiale")}>
          Anulează
        </Button>
      </Group>
    </form>
  );
}
