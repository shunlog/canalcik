import { ActionIcon, Group, Tooltip } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import type { ReactNode } from "react";

/**
 * An info icon explaining `label` — or, with `icon`/`color`, some other small
 * annotation icon that shares its tooltip behaviour (e.g. a warning). With
 * children, renders them followed by the icon; without, just the icon.
 */
export function HelpTooltip({
  label,
  children,
  icon: Icon = IconInfoCircle,
  color = "gray",
}: {
  label: string;
  children?: ReactNode;
  icon?: typeof IconInfoCircle;
  color?: string;
}) {
  const icon = (
    <Tooltip
      label={label}
      multiline
      w={200}
      withArrow
      // Without touch, the tooltip is unreachable on a phone.
      events={{ hover: true, focus: true, touch: true }}
    >
      <ActionIcon variant="subtle" color={color} size="sm" aria-label={label}>
        <Icon size={14} />
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
