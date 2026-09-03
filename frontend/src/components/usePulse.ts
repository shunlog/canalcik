import { useCallback, useState } from "react";
import classes from "./usePulse.module.css";

export interface PulseProps {
  classNames: { input: string | undefined };
  onAnimationEnd: () => void;
}

/**
 * Briefly scales up Mantine inputs to point out that something else — a picker,
 * a paste, a fetched default — just wrote their value.
 *
 * `pulse(cheie)` starts the animation and `pulseProps(cheie)` plays it on every
 * input it is spread onto. The key says which group pulses, so one hook above a
 * table can pulse a single row:
 *
 *     const { pulse, pulseProps } = usePulse<number>();
 *     <TextInput {...form.getInputProps(`randuri.${i}.cod`)} {...pulseProps(i)} />
 */
export function usePulse<K>() {
  const [activa, setActiva] = useState<K | null>(null);
  const opreste = useCallback(() => setActiva(null), []);

  return {
    pulse: useCallback((cheie: K) => setActiva(cheie), []),
    pulseProps: (cheie: K): PulseProps => ({
      classNames: { input: activa === cheie ? classes.pulse : undefined },
      onAnimationEnd: opreste,
    }),
  };
}
