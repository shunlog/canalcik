import type {
  FacturaCreateBody,
  FacturaDetail,
  FacturaListItem,
  FacturaUpdateBody,
} from "@canalcik/server/api-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, query } from "../lib/api.ts";
import { facturaKeys, materialKeys } from "./keys.ts";

export interface FacturaFilters {
  from?: string;
  to?: string;
}

/**
 * A factura's lines can add materials to the catalogue and always change their
 * line counts, so the materiale list goes with the facturi. Nothing else points
 * at a factura, which is why sofer and vehicul are absent here — unlike in
 * useBonInvalidation.
 */
function useFacturaInvalidation() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: facturaKeys.all });
    void qc.invalidateQueries({ queryKey: materialKeys.all });
  };
}

export function useFacturi(filters: FacturaFilters = {}) {
  const qs = query({ ...filters });
  return useQuery({
    queryKey: facturaKeys.list(qs),
    queryFn: () => api.get<FacturaListItem[]>(`/facturi${qs}`),
  });
}

export function useFactura(id: number) {
  return useQuery({
    queryKey: facturaKeys.detail(id),
    queryFn: () => api.get<FacturaDetail>(`/facturi/${id}`),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreateFactura() {
  const invalidate = useFacturaInvalidation();
  return useMutation({
    mutationFn: (body: FacturaCreateBody) => api.post<FacturaDetail>("/facturi", body),
    onSuccess: invalidate,
  });
}

export function useUpdateFactura(id: number) {
  const invalidate = useFacturaInvalidation();
  return useMutation({
    mutationFn: (body: FacturaUpdateBody) => api.patch<FacturaDetail>(`/facturi/${id}`, body),
    onSuccess: invalidate,
  });
}

export function useDeleteFactura(id: number) {
  const invalidate = useFacturaInvalidation();
  return useMutation({
    mutationFn: () => api.del(`/facturi/${id}`),
    onSuccess: invalidate,
  });
}
