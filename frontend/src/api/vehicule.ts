import type {
  AnvelopeUpdateBody,
  SetSoferiBody,
  VehiculCreateBody,
  VehiculDetail,
  VehiculListItem,
  VehiculUpdateBody,
} from "@canalcik/server/api-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { anvelopeKeys, soferKeys, vehiculKeys } from "./keys.ts";

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

/**
 * Not bound to one vehicul — the fleet-wide "Anvelope" page edits rows across
 * many vehicule from a single hook instance, so `vehiculId` travels with each
 * call instead of being fixed at hook creation like `useUpdateVehicul`.
 */
export function useUpdateAnvelope() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vehiculId, ...body }: AnvelopeUpdateBody & { vehiculId: number }) =>
      api.patch<VehiculDetail>(`/vehicule/${vehiculId}/anvelope`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiculKeys.all });
      void qc.invalidateQueries({ queryKey: anvelopeKeys.all });
    },
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
