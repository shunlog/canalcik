import type { MonthlyReport, MonthlyReportDetail } from "@canalcik/server/api-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { monthlyReportKeys } from "./keys.ts";

export function useMonthlyReports() {
  return useQuery({
    queryKey: monthlyReportKeys.all,
    queryFn: () => api.get<MonthlyReport[]>("/monthly-report"),
  });
}

export function useMonthlyReport(month: string) {
  return useQuery({
    queryKey: monthlyReportKeys.detail(month),
    queryFn: () => api.get<MonthlyReportDetail>(`/monthly-report/${month}`),
    enabled: /^\d{4}-\d{2}$/.test(month),
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
