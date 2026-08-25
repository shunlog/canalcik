import { Anchor, Badge, Loader, Tooltip } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useDriveStatus } from "../api/drive.ts";

// Passive indicator: there is no consent flow in the web app. Authorization is
// `pnpm run auth` on the server, which writes the token.json the server reads.
export function DriveStatus() {
  const status = useDriveStatus();

  if (status.isPending) return <Loader size="xs" ml="auto" />;

  if (status.isError || !status.data?.connected) {
    return (
      <Tooltip label="Rulează `pnpm run auth` pe server" withArrow>
        <Badge color="gray" variant="light" size="lg" ml="auto" leftSection={<IconX size={12} />}>
          Drive neconectat
        </Badge>
      </Tooltip>
    );
  }

  const { folder } = status.data;
  return (
    <Tooltip label="Documentele generate ajung aici" withArrow>
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
