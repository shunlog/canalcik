import { Anchor, Group, Text } from "@mantine/core";
import { Link } from "react-router";

/** Renders foreign-key targets as links to their own pages. */
export function RefLinkList({
  items,
  empty,
}: {
  items: { id: number; label: string; to: string }[];
  empty: string;
}) {
  if (items.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        {empty}
      </Text>
    );
  }
  return (
    <Group gap="xs">
      {items.map((item, i) => (
        <Text key={item.id} size="sm" span>
          <Anchor component={Link} to={item.to}>
            {item.label}
          </Anchor>
          {i < items.length - 1 ? "," : ""}
        </Text>
      ))}
    </Group>
  );
}
