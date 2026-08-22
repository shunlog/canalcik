import { Anchor, Badge, Button, Loader, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBrandGoogleDrive, IconCheck } from "@tabler/icons-react";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useDriveStatus } from "../api/drive.ts";

// Messages for the ?drive=… flag that server/src/routes/drive.ts sets when the
// OAuth callback sends the browser back here.
const CALLBACK_MESSAGE: Record<string, { color: string; message: string }> = {
  ok: { color: "green", message: "Conectat la Google Drive" },
  error: { color: "red", message: "Autorizarea Google Drive a fost refuzată" },
  state: { color: "red", message: "Autorizare expirată — încearcă din nou" },
};

export function DriveStatus() {
  const status = useDriveStatus();
  const [params, setParams] = useSearchParams();
  const callback = params.get("drive");
  // StrictMode runs effects twice in dev, and both runs still see the flag
  // (setParams hasn't re-rendered yet), so remember what we already announced.
  const announced = useRef<string | null>(null);

  useEffect(() => {
    if (!callback || announced.current === callback) return;
    announced.current = callback;
    const feedback = CALLBACK_MESSAGE[callback];
    if (feedback) notifications.show(feedback);
    // Drop the flag so a reload doesn't re-announce it.
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("drive");
        return next;
      },
      { replace: true },
    );
  }, [callback, setParams]);

  if (status.isPending) return <Loader size="xs" ml="auto" />;

  if (status.isError || !status.data?.connected) {
    return (
      <Button
        component="a"
        // A real link, not fetch: Google's consent screen needs a full-page
        // navigation, and it must not be an XHR.
        href="/api/drive/auth"
        ml="auto"
        size="xs"
        variant="light"
        leftSection={<IconBrandGoogleDrive size={16} />}
      >
        Conectează Drive
      </Button>
    );
  }

  const { email, folder } = status.data;
  return (
    <Tooltip label={email ? `Autorizat ca ${email}` : "Autorizat"} withArrow>
      <Anchor
        href={folder?.webViewLink}
        target="_blank"
        rel="noreferrer"
        ml="auto"
        underline="never"
      >
        <Badge
          color="green"
          variant="light"
          size="lg"
          leftSection={<IconCheck size={12} />}
          style={{ cursor: "pointer" }}
        >
          Drive: {folder?.name ?? "conectat"}
        </Badge>
      </Anchor>
    </Tooltip>
  );
}
