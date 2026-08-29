import { Button, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router";
import { useCreateVehicul } from "../../api/vehicule.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { ApiError } from "../../lib/api.ts";
import { showError, notifyIncomplete, showSaved } from "../../lib/feedback.ts";
import { requiredNum, requiredText } from "../../lib/forms.ts";
import { VehiculFields } from "./VehiculFields.tsx";
import { emptyVehiculForm, fromVehiculForm, type VehiculFormValues } from "./vehiculForm.ts";

export function VehiculCreatePage() {
  const navigate = useNavigate();
  const create = useCreateVehicul();
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

  const submit = (values: VehiculFormValues) => {
    create.mutate(fromVehiculForm(values), {
      onSuccess: (vehicul) => {
        showSaved("Vehicul creat");
        void navigate(`/vehicule/${vehicul.id}`);
      },
      onError: (err) => {
        if (err instanceof ApiError && err.fields) form.setErrors(err.fields);
        showError(err, "Crearea a eșuat");
      },
    });
  };

  return (
    <form onSubmit={form.onSubmit(submit, notifyIncomplete)}>
      <PageHeader title="Vehicul nou" />
      <VehiculFields form={form} />
      <Group mt="md">
        <Button type="submit" loading={create.isPending}>
          Creează
        </Button>
        <Button variant="subtle" onClick={() => void navigate("/vehicule")}>
          Anulează
        </Button>
      </Group>
    </form>
  );
}
