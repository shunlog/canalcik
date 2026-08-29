import { TextInput, Tooltip, type TextInputProps } from "@mantine/core";
import { IconAlertTriangle, IconWand } from "@tabler/icons-react";
import type { StatusCamp } from "./actForm.ts";

/** A TextInput that shows whether its value came from a search hit or was typed over since. */
export function AutoFillTextInput({
  status,
  ...props
}: TextInputProps & { status: StatusCamp }) {
  return (
    <TextInput
      {...props}
      rightSection={<IndicatorStatus status={status} />}
      rightSectionPointerEvents="auto"
    />
  );
}

export function IndicatorStatus({ status }: { status: StatusCamp }) {
  if (status === "auto") {
    return (
      <Tooltip label="Completat automat din elementul selectat">
        <IconWand size={16} color="var(--mantine-color-blue-6)" aria-label="Completat automat" />
      </Tooltip>
    );
  }
  if (status === "manual") {
    return (
      <Tooltip label="Câmpul a fost editat manual">
        <IconAlertTriangle
          size={16}
          color="var(--mantine-color-yellow-6)"
          aria-label="Editat manual"
        />
      </Tooltip>
    );
  }
  return null;
}
