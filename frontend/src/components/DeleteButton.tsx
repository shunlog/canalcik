import { Button, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconTrash } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { showError } from "../lib/feedback.ts";

/**
 * Confirms, then deletes. A 409 (the entity still has bonuri) is shown as a red
 * notification with the server's message, which names the exact count.
 */
export function DeleteButton({
  confirmText,
  backTo,
  onDelete,
  loading,
}: {
  confirmText: string;
  backTo: string;
  onDelete: () => Promise<unknown>;
  loading?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <Button
      color="red"
      variant="light"
      loading={loading}
      leftSection={<IconTrash size={16} />}
      onClick={() =>
        modals.openConfirmModal({
          title: "Confirmați ștergerea",
          children: <Text size="sm">{confirmText}</Text>,
          labels: { confirm: "Șterge", cancel: "Anulează" },
          confirmProps: { color: "red" },
          onConfirm: () => {
            onDelete()
              .then(() => void navigate(backTo))
              .catch((err: unknown) => showError(err, "Ștergerea a eșuat"));
          },
        })
      }
    >
      Șterge
    </Button>
  );
}
