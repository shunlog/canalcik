import { Button, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router";
import { useCreateSofer } from "../../api/soferi.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { ApiError } from "../../lib/api.ts";
import { showError, showSaved } from "../../lib/feedback.ts";
import { requiredNum, requiredText } from "../../lib/forms.ts";
import { SoferFields } from "./SoferFields.tsx";
import { emptySoferForm, fromSoferForm, type SoferFormValues } from "./soferForm.ts";

export function SoferCreatePage() {
  const navigate = useNavigate();
  const create = useCreateSofer();
  const form = useForm<SoferFormValues>({
    initialValues: emptySoferForm,
    validate: { cod: requiredNum("Nr. de pontaj"), nume: requiredText("Numele") },
  });

  const submit = (values: SoferFormValues) => {
    create.mutate(fromSoferForm(values), {
      onSuccess: (sofer) => {
        showSaved("Șofer creat");
        void navigate(`/soferi/${sofer.id}`);
      },
      onError: (err) => {
        // The server reports zod failures per field; put them on the inputs.
        if (err instanceof ApiError && err.fields) form.setErrors(err.fields);
        showError(err, "Crearea a eșuat");
      },
    });
  };

  return (
    <form onSubmit={form.onSubmit(submit)}>
      <PageHeader title="Șofer nou" />
      <SoferFields form={form} />
      <Group mt="md">
        <Button type="submit" loading={create.isPending}>
          Creează
        </Button>
        <Button variant="subtle" onClick={() => void navigate("/soferi")}>
          Anulează
        </Button>
      </Group>
    </form>
  );
}
