import { ActionIcon, Group, Tooltip } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import type { ReactNode } from "react";

/**
 * An info icon explaining `label`. With children, renders them followed by the
 * icon; without, just the icon.
 */
export function HelpTooltip({ label, children }: { label: string; children?: ReactNode }) {
  const icon = (
    <Tooltip
      label={label}
      multiline
      w={200}
      withArrow
      // Without touch, the tooltip is unreachable on a phone.
      events={{ hover: true, focus: true, touch: true }}
    >
      <ActionIcon variant="subtle" color="gray" size="sm" aria-label={label}>
        <IconInfoCircle size={14} />
      </ActionIcon>
    </Tooltip>
  );

  if (!children) return icon;
  return (
    <Group gap={2} wrap="nowrap">
      {children}
      {icon}
    </Group>
  );
}
