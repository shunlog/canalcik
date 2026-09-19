import type {
  BonCreateBody,
  BonDetail,
  BonListItem,
  BonUpdateBody,
} from "@canalcik/server/api-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { bonKeys, materialKeys, soferKeys, vehiculKeys } from "./keys.ts";

/**
 * A bon write changes the `bonuri` list and counters on the sofer and vehicul
 * it points at — including the ones it used to point at, which we no longer
 * know here. Invalidating both entities wholesale is cheap at this data size
 * and cannot go stale. Its lines can also add materials to the catalogue and
 * always change their line counts, so that list goes too.
 */
function useBonInvalidation() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: bonKeys.all });
    void qc.invalidateQueries({ queryKey: soferKeys.all });
    void qc.invalidateQueries({ queryKey: vehiculKeys.all });
    void qc.invalidateQueries({ queryKey: materialKeys.all });
  };
}

export function useBonuri() {
  return useQuery({
    queryKey: bonKeys.list,
    queryFn: () => api.get<BonListItem[]>("/bonuri"),
  });
}

export function useBon(id: number) {
  return useQuery({
    queryKey: bonKeys.detail(id),
    queryFn: () => api.get<BonDetail>(`/bonuri/${id}`),
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useCreateBon() {
  const invalidate = useBonInvalidation();
  return useMutation({
    mutationFn: (body: BonCreateBody) => api.post<BonDetail>("/bonuri", body),
    onSuccess: invalidate,
  });
}

export function useUpdateBon(id: number) {
  const invalidate = useBonInvalidation();
  return useMutation({
    mutationFn: (body: BonUpdateBody) => api.patch<BonDetail>(`/bonuri/${id}`, body),
    onSuccess: invalidate,
  });
}

export function useDeleteBon(id: number) {
  const invalidate = useBonInvalidation();
  return useMutation({
    mutationFn: () => api.del(`/bonuri/${id}`),
    onSuccess: invalidate,
  });
}
