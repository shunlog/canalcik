import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import type { MaterialListItem } from "@canalcik/server/api-types";
import { useCreateMaterial } from "../../api/materiale.ts";
import { showError } from "../../lib/feedback.ts";

interface NouMaterialValues {
  nume: string;
  nrCart: string;
  um: string;
}

const emptyValues = (): NouMaterialValues => ({ nume: "", nrCart: "", um: "" });

/**
 * One modal per table, tracked by the row that opened it — same convention as
 * CautaProdus. Creates the material immediately (POST /materiale) instead of
 * deferring to the factura's own save, so the row's Select and the catalogue
 * agree on a real material from the moment it's picked.
 */
export function NouMaterialModal({
  rand,
  onInchide,
  onCreat,
}: {
  rand: number | null;
  onInchide: () => void;
  onCreat: (material: MaterialListItem, rand: number) => void;
}) {
  const create = useCreateMaterial();
  const form = useForm<NouMaterialValues>({
    initialValues: emptyValues(),
    validate: {
      nume: (v) => (v.trim() === "" ? "Obligatoriu" : null),
      nrCart: (v) => (v.trim() === "" ? "Obligatoriu" : null),
      um: (v) => (v.trim() === "" ? "Obligatoriu" : null),
    },
  });

  const inchide = () => {
    form.setValues(emptyValues());
    form.resetDirty();
    onInchide();
  };

  const submit = form.onSubmit((values) => {
    if (rand === null) return;
    create.mutate(
      { nume: values.nume.trim(), nrCart: values.nrCart.trim(), um: values.um.trim() },
      {
        onSuccess: (material) => {
          onCreat(material, rand);
          inchide();
        },
        onError: (err) => showError(err, "Adăugarea materialului a eșuat"),
      },
    );
  });

  return (
    <Modal opened={rand !== null} onClose={inchide} title="Material nou" size="sm">
      {/* stopPropagation: this modal sits inside FacturaCreatePage/FacturaDetailPage's
          <form> in the React tree (Mantine portals it elsewhere in the DOM),
          so without it a submit here would bubble up through React's synthetic
          events and submit the factura form too. */}
      <form
        onSubmit={(e) => {
          e.stopPropagation();
          submit(e);
        }}
      >
        <Stack gap="sm">
          <TextInput
            data-autofocus
            label="Denumire"
            placeholder="ULEI MOTOR 10W40"
            withAsterisk
            {...form.getInputProps("nume")}
          />
          <TextInput
            label="Cod nomenclator"
            placeholder="2111121795"
            withAsterisk
            {...form.getInputProps("nrCart")}
          />
          <TextInput label="UM" placeholder="L" withAsterisk {...form.getInputProps("um")} />
          <Group justify="flex-end">
            <Button variant="default" onClick={inchide}>
              Anulează
            </Button>
            <Button type="submit" loading={create.isPending}>
              Adaugă
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
