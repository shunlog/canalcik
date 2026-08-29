import { Button, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMemo } from "react";
import { useProduse } from "../../api/produse.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { aplatizeaza } from "../../lib/produse.tsx";
import { ActFields } from "./ActFields.tsx";
import { actValidation, emptyActForm, fromActForm, type ActFormValues } from "./actForm.ts";

export function ActDefectiunePage() {
  const produse = useProduse();
  const form = useForm<ActFormValues>({
    initialValues: emptyActForm(),
    validate: actValidation,
  });

  const produseIndexate = useMemo(
    () => (produse.data ?? []).flatMap((c) => aplatizeaza(c, [])),
    [produse.data],
  );

  const submit = (values: ActFormValues) => {
    const data = fromActForm(values);
    // TODO: POST to a render endpoint — `data` is the DataActDefectiune that
    // renderActDefectiune() takes, and docxtemplater only runs on the server.
    console.log(data);
  };

  return (
    <form onSubmit={form.onSubmit(submit)}>
      <PageHeader title="Act defecțiune" />
      <ActFields form={form} produse={produseIndexate} />
      <Group mt="md">
        <Button type="submit">Generează documentul</Button>
      </Group>
    </form>
  );
}
