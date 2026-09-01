import { Button, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router";
import { useCreateActDefectiune } from "../../api/acteDefectiune.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { ApiError } from "../../lib/api.ts";
import { showError, notifyIncomplete, showSaved } from "../../lib/feedback.ts";
import { ActFields } from "./ActFields.tsx";
import {
  actValidation,
  emptyActForm,
  fromActForm,
  type ActFormValues,
} from "./actForm.ts";

export function ActDefectiuneCreatePage() {
  const navigate = useNavigate();
  const create = useCreateActDefectiune();

  const form = useForm<ActFormValues>({
    initialValues: emptyActForm(),
    validate: actValidation,
  });

  const submit = (values: ActFormValues) => {
    create.mutate(fromActForm(values), {
      onSuccess: (act) => {
        showSaved("Act creat");
        void navigate(`/act-defectiune/${act.id}`);
      },
      onError: (err) => {
        if (err instanceof ApiError && err.fields) form.setErrors(err.fields);
        showError(err, "Crearea a eșuat");
      },
    });
  };

  return (
    <form onSubmit={form.onSubmit(submit, notifyIncomplete)}>
      <PageHeader title="Act de defecțiune nou" />
      <ActFields form={form} />
      <Group mt="md">
        <Button type="submit" loading={create.isPending}>
          Salvează
        </Button>
        <Button variant="subtle" onClick={() => void navigate("/act-defectiune")}>
          Anulează
        </Button>
      </Group>
    </form>
  );
}
