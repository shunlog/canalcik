import type { MonthlyReport } from "@canalcik/server/api-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { monthlyReportKeys } from "./keys.ts";

export function useMonthlyReports() {
  return useQuery({
    queryKey: monthlyReportKeys.all,
    queryFn: () => api.get<MonthlyReport[]>("/monthly-report"),
  });
}

export function useGenerateMonthlyReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (month: string) =>
      api.post<MonthlyReport>(`/monthly-report/${month}/generate`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: monthlyReportKeys.all });
    },
  });
}
