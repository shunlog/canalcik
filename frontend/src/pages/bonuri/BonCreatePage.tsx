import { Button, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router";
import { useCreateBon } from "../../api/bonuri.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { ApiError } from "../../lib/api.ts";
import { showError, notifyIncomplete, showSaved } from "../../lib/feedback.ts";
import { BonFields } from "./BonFields.tsx";
import { bonValidation, emptyBonForm, fromBonForm, type BonFormValues } from "./bonForm.ts";

export function BonCreatePage() {
  const navigate = useNavigate();
  const create = useCreateBon();
  const form = useForm<BonFormValues>({
    initialValues: emptyBonForm(),
    validate: bonValidation,
  });

  const submit = (values: BonFormValues) => {
    create.mutate(fromBonForm(values), {
      onSuccess: (bon) => {
        showSaved("Bon creat");
        void navigate(`/bonuri/${bon.id}`);
      },
      onError: (err) => {
        if (err instanceof ApiError && err.fields) form.setErrors(err.fields);
        showError(err, "Crearea a eșuat");
      },
    });
  };

  return (
    <form onSubmit={form.onSubmit(submit, notifyIncomplete)}>
      <PageHeader title="Bon nou" />
      <BonFields form={form} />
      <Group mt="md">
        <Button type="submit" loading={create.isPending}>
          Creează
        </Button>
        <Button variant="subtle" onClick={() => void navigate("/bonuri")}>
          Anulează
        </Button>
      </Group>
    </form>
  );
}
