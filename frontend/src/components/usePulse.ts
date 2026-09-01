import { useCallback, useState } from "react";
import classes from "./usePulse.module.css";

/**
 * Briefly scales up Mantine inputs to point out that something else — a picker,
 * a paste, a fetched default — just wrote their value.
 *
 * Spread `pulseProps` onto every input the same `pulse()` fills:
 *
 *     const { pulse, pulseProps } = usePulse();
 *     <TextInput {...form.getInputProps("code")} {...pulseProps} />
 */
export function usePulse() {
  const [pulsing, setPulsing] = useState(false);

  return {
    pulse: useCallback(() => setPulsing(true), []),
    pulseProps: {
      classNames: { input: pulsing ? classes.pulse : undefined },
      onAnimationEnd: () => setPulsing(false),
    },
  };
}
