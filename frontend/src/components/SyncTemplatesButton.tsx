import { Button } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useSyncTemplates } from "../api/templates.ts";
import { showError, showSaved } from "../lib/feedback.ts";

/**
 * Re-downloads every template from Drive. The mutation lives here rather than
 * with the caller: it takes no arguments and refreshes one shared cache entry,
 * so every copy of the button on screen ends up showing the same result.
 */
export function SyncTemplatesButton({ size }: { size?: string }) {
  const sync = useSyncTemplates();

  return (
    <Button
      size={size}
      leftSection={<IconRefresh size={16} />}
      loading={sync.isPending}
      onClick={() =>
        sync.mutate(undefined, {
          onSuccess: () => showSaved("Șabloane sincronizate"),
          onError: (err) => showError(err, "Sincronizarea a eșuat"),
        })
      }
    >
      Sincronizează
    </Button>
  );
}
