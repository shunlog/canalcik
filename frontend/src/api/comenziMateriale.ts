import type {
  ComandaMaterialeCreateBody,
  ComandaMaterialeDetail,
  ComandaMaterialeListItem,
  ComandaMaterialeUpdateBody,
} from "@canalcik/server/api-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { comandaMaterialeKeys } from "./keys.ts";

/**
 * Nothing outside the comanda points at it — the vehicule its lines name are
 * plain references, and the materials are catalogue products rather than
 * MaterialeIntretinere rows — so saving one invalidates nothing else.
 */
function useComandaInvalidation() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: comandaMaterialeKeys.all });
  };
}

export function useComenziMateriale() {
  return useQuery({
    queryKey: comandaMaterialeKeys.list,
    queryFn: () => api.get<ComandaMaterialeListItem[]>("/comenzi-materiale"),
  });
}

export function useComandaMateriale(id: number) {
  return useQuery({
    queryKey: comandaMaterialeKeys.detail(id),
    queryFn: () => api.get<ComandaMaterialeDetail>(`/comenzi-materiale/${id}`),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreateComandaMateriale() {
  const invalidate = useComandaInvalidation();
  return useMutation({
    mutationFn: (body: ComandaMaterialeCreateBody) =>
      api.post<ComandaMaterialeDetail>("/comenzi-materiale", body),
    onSuccess: invalidate,
  });
}

/** PUT, not PATCH: the comanda is one form and is saved whole. */
export function useUpdateComandaMateriale(id: number) {
  const invalidate = useComandaInvalidation();
  return useMutation({
    mutationFn: (body: ComandaMaterialeUpdateBody) =>
      api.put<ComandaMaterialeDetail>(`/comenzi-materiale/${id}`, body),
    onSuccess: invalidate,
  });
}

export function useGenerateComandaMateriale(id: number) {
  const invalidate = useComandaInvalidation();
  return useMutation({
    mutationFn: () => api.post<ComandaMaterialeDetail>(`/comenzi-materiale/${id}/generate`, {}),
    onSuccess: invalidate,
  });
}

export function useDeleteComandaMateriale(id: number) {
  const invalidate = useComandaInvalidation();
  return useMutation({
    mutationFn: () => api.del(`/comenzi-materiale/${id}`),
    onSuccess: invalidate,
  });
}
