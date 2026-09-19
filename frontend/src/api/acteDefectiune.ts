import type {
  ActDefectiuneCreateBody,
  ActDefectiuneDetail,
  ActDefectiuneListItem,
  ActDefectiuneUpdateBody,
} from "@canalcik/server/api-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { actDefectiuneKeys } from "./keys.ts";

/**
 * Nothing outside the act points at it — the vehicul it names is a plain
 * reference, and its pieces are catalogue products rather than MaterialeIntretinere
 * rows — so unlike a bon or a factura, saving one invalidates nothing else.
 */
function useActInvalidation() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: actDefectiuneKeys.all });
  };
}

export function useActeDefectiune() {
  return useQuery({
    queryKey: actDefectiuneKeys.list,
    queryFn: () => api.get<ActDefectiuneListItem[]>("/acte-defectiune"),
  });
}

export function useActDefectiune(id: number) {
  return useQuery({
    queryKey: actDefectiuneKeys.detail(id),
    queryFn: () => api.get<ActDefectiuneDetail>(`/acte-defectiune/${id}`),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreateActDefectiune() {
  const invalidate = useActInvalidation();
  return useMutation({
    mutationFn: (body: ActDefectiuneCreateBody) =>
      api.post<ActDefectiuneDetail>("/acte-defectiune", body),
    onSuccess: invalidate,
  });
}

/** PUT, not PATCH: the act is one form and is saved whole. */
export function useUpdateActDefectiune(id: number) {
  const invalidate = useActInvalidation();
  return useMutation({
    mutationFn: (body: ActDefectiuneUpdateBody) =>
      api.put<ActDefectiuneDetail>(`/acte-defectiune/${id}`, body),
    onSuccess: invalidate,
  });
}

export function useGenerateActDefectiune(id: number) {
  const invalidate = useActInvalidation();
  return useMutation({
    mutationFn: () => api.post<ActDefectiuneDetail>(`/acte-defectiune/${id}/generate`, {}),
    onSuccess: invalidate,
  });
}

export function useDeleteActDefectiune(id: number) {
  const invalidate = useActInvalidation();
  return useMutation({
    mutationFn: () => api.del(`/acte-defectiune/${id}`),
    onSuccess: invalidate,
  });
}
