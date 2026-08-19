import type {
  SetVehiculeBody,
  SoferCreateBody,
  SoferDetail,
  SoferListItem,
  SoferUpdateBody,
} from "@canalcik/server/api-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, query } from "../lib/api.ts";
import { soferKeys, vehiculKeys } from "./keys.ts";

export function useSoferi(q = "") {
  return useQuery({
    queryKey: soferKeys.list(q),
    queryFn: () => api.get<SoferListItem[]>(`/soferi${query({ q })}`),
  });
}

export function useSofer(id: number) {
  return useQuery({
    queryKey: soferKeys.detail(id),
    queryFn: () => api.get<SoferDetail>(`/soferi/${id}`),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreateSofer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SoferCreateBody) => api.post<SoferDetail>("/soferi", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: soferKeys.all }),
  });
}

export function useUpdateSofer(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SoferUpdateBody) => api.patch<SoferDetail>(`/soferi/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: soferKeys.all }),
  });
}

export function useDeleteSofer(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.del(`/soferi/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: soferKeys.all }),
  });
}

export function useSetVehicule(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SetVehiculeBody) => api.put<SoferDetail>(`/soferi/${id}/vehicule`, body),
    onSuccess: () => {
      // Both sides of the M:N changed, so both caches have to go.
      void qc.invalidateQueries({ queryKey: soferKeys.all });
      void qc.invalidateQueries({ queryKey: vehiculKeys.all });
    },
  });
}
