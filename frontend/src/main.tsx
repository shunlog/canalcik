import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "mantine-datatable/styles.css";
import "./global.css";

import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/ro";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { queryClient } from "./lib/queryClient.ts";
import { router } from "./router.tsx";
import { theme } from "./theme.ts";

// @mantine/dates parses typed input with `dayjs(value, valueFormat, locale)`,
// and dayjs ignores the format argument unless this plugin is registered — so
// without it, typing "15.03.2026" into a DateInput silently becomes 2001-01-01.
// Loading the "ro" locale is what makes DatesProvider's locale take effect on
// the calendar's month and weekday names.
dayjs.extend(customParseFormat);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <DatesProvider settings={{ locale: "ro", firstDayOfWeek: 1 }}>
        <Notifications position="top-right" />
        <ModalsProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </ModalsProvider>
      </DatesProvider>
    </MantineProvider>
  </StrictMode>,
);
