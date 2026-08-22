import type { FisaLimitaMonth } from "@canalcik/server/api-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { fisaLimitaKeys } from "./keys.ts";

export function useFisaLimitaMonths() {
  return useQuery({
    queryKey: fisaLimitaKeys.all,
    queryFn: () => api.get<FisaLimitaMonth[]>("/fisa-limita"),
  });
}

export function useGenereazaFisaLimita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (luna: string) =>
      api.post<FisaLimitaMonth>(`/fisa-limita/${luna}/genereaza`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: fisaLimitaKeys.all });
    },
  });
}
