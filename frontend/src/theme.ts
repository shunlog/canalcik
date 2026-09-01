import { createTheme, NumberInput } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "indigo",
  defaultRadius: "md",
  cursorType: "pointer",
  components: {
    NumberInput: NumberInput.extend({
      defaultProps: {
        step: 1,
        startValue: 1,
      },
    }),
  },
});
