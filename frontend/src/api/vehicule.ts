import type {
  SetSoferiBody,
  VehiculCreateBody,
  VehiculDetail,
  VehiculListItem,
  VehiculUpdateBody,
} from "@canalcik/server/api-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { soferKeys, vehiculKeys } from "./keys.ts";

export function useVehicule() {
  return useQuery({
    queryKey: vehiculKeys.list,
    queryFn: () => api.get<VehiculListItem[]>("/vehicule"),
  });
}

export function useVehicul(id: number) {
  return useQuery({
    queryKey: vehiculKeys.detail(id),
    queryFn: () => api.get<VehiculDetail>(`/vehicule/${id}`),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreateVehicul() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: VehiculCreateBody) => api.post<VehiculDetail>("/vehicule", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehiculKeys.all }),
  });
}

export function useUpdateVehicul(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: VehiculUpdateBody) => api.patch<VehiculDetail>(`/vehicule/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehiculKeys.all }),
  });
}

export function useDeleteVehicul(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.del(`/vehicule/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: vehiculKeys.all }),
  });
}

export function useSetSoferi(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SetSoferiBody) => api.put<VehiculDetail>(`/vehicule/${id}/soferi`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiculKeys.all });
      void qc.invalidateQueries({ queryKey: soferKeys.all });
    },
  });
}
