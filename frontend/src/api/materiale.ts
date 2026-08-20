import type {
  MaterialCreateBody,
  MaterialDetail,
  MaterialListItem,
  MaterialUpdateBody,
} from "@canalcik/server/api-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, query } from "../lib/api.ts";
import { bonKeys, facturaKeys, materialKeys } from "./keys.ts";

export function useMateriale(q = "") {
  return useQuery({
    queryKey: materialKeys.list(q),
    queryFn: () => api.get<MaterialListItem[]>(`/materiale${query({ q })}`),
  });
}

export function useMaterial(id: number) {
  return useQuery({
    queryKey: materialKeys.detail(id),
    queryFn: () => api.get<MaterialDetail>(`/materiale/${id}`),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: MaterialCreateBody) => api.post<MaterialListItem>("/materiale", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: materialKeys.all }),
  });
}

export function useUpdateMaterial(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: MaterialUpdateBody) =>
      api.patch<MaterialListItem>(`/materiale/${id}`, body),
    onSuccess: () => {
      // `all` is a prefix of `detail`, so this covers the detail query too.
      void qc.invalidateQueries({ queryKey: materialKeys.all });
      // A rename shows up on every bon and factura line pointing here, so their
      // cached detail responses are now wrong.
      void qc.invalidateQueries({ queryKey: bonKeys.all });
      void qc.invalidateQueries({ queryKey: facturaKeys.all });
    },
  });
}

export function useDeleteMaterial(id: number) {
  const qc = useQueryClient();
  return useMutation({
    // A material still on a bon or factura line is refused with a 409 naming the
    // counts, so no other cache can go stale here — nothing was deleted.
    mutationFn: () => api.del(`/materiale/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: materialKeys.all }),
  });
}
