import { ActionIcon, Button, Group, Popover, Stack, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconPencil } from "@tabler/icons-react";
import { useState } from "react";
import { formatIsoDate, todayLocalIso } from "../lib/forms.ts";

/**
 * A tire's "data instalarii" cell. Opening the editor defaults to today —
 * recording a replacement that just happened is the common case — but any
 * date can still be picked. Nothing is sent to the server here; `onChange`
 * only stages the edit for the table's own save button.
 */
export function EditableDataInstalarii({
  value,
  dirty,
  onChange,
}: {
  value: string;
  dirty: boolean;
  onChange: (v: string) => void;
}) {
  const [opened, setOpened] = useState(false);
  const [draft, setDraft] = useState<string | null>(value);

  const open = () => {
    setDraft(todayLocalIso());
    setOpened(true);
  };

  const confirm = () => {
    if (draft) onChange(draft);
    setOpened(false);
  };

  return (
    <Group gap={4} wrap="nowrap">
      <Text size="sm" fw={dirty ? 700 : undefined} c={dirty ? "blue" : undefined}>
        {formatIsoDate(value)}
      </Text>
      <Popover opened={opened} onChange={setOpened} withArrow position="bottom-start">
        <Popover.Target>
          <ActionIcon
            variant="subtle"
            size="sm"
            aria-label="Editează data instalării"
            onClick={() => (opened ? setOpened(false) : open())}
          >
            <IconPencil size={14} />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="xs">
            <DateInput
              label="Data instalării"
              valueFormat="DD.MM.YYYY"
              placeholder="ZZ.LL.AAAA"
              value={draft}
              onChange={setDraft}
              popoverProps={{ withinPortal: false }}
              w={180}
            />
            <Button size="xs" onClick={confirm} disabled={!draft}>
              OK
            </Button>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Group>
  );
}
