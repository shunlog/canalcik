import { Button, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router";
import { useCreateFactura } from "../../api/facturi.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { ApiError } from "../../lib/api.ts";
import { showError, showSaved } from "../../lib/feedback.ts";
import { FacturaFields } from "./FacturaFields.tsx";
import {
  emptyFacturaForm,
  facturaValidation,
  fromFacturaForm,
  type FacturaFormValues,
} from "./facturaForm.ts";

export function FacturaCreatePage() {
  const navigate = useNavigate();
  const create = useCreateFactura();
  const form = useForm<FacturaFormValues>({
    initialValues: emptyFacturaForm(),
    validate: facturaValidation,
  });

  const submit = (values: FacturaFormValues) => {
    create.mutate(fromFacturaForm(values), {
      onSuccess: (factura) => {
        showSaved("Factură creată");
        void navigate(`/facturi/${factura.id}`);
      },
      onError: (err) => {
        if (err instanceof ApiError && err.fields) form.setErrors(err.fields);
        showError(err, "Crearea a eșuat");
      },
    });
  };

  return (
    <form onSubmit={form.onSubmit(submit)}>
      <PageHeader title="Factură nouă" />
      <FacturaFields form={form} />
      <Group mt="md">
        <Button type="submit" loading={create.isPending}>
          Creează
        </Button>
        <Button variant="subtle" onClick={() => void navigate("/facturi")}>
          Anulează
        </Button>
      </Group>
    </form>
  );
}
