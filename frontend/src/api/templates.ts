import type { TemplateInfo } from "@canalcik/server/api-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { templateKeys } from "./keys.ts";

// The list is the only endpoint; one template is selected out of it client-side
// so both views share a single cache entry and a single sync refreshes them.
const templatesQuery = {
  queryKey: templateKeys.list,
  queryFn: () => api.get<TemplateInfo[]>("/templates"),
};

export function useTemplates() {
  return useQuery(templatesQuery);
}

/** One template by its manifest key, e.g. "fisaLimita". */
export function useTemplate(key: string) {
  return useQuery({
    ...templatesQuery,
    select: (list: TemplateInfo[]) => list.find((t) => t.key === key) ?? null,
  });
}

export function useSyncTemplates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<TemplateInfo[]>("/templates/sync", {}),
    // The sync answers with the refreshed list, so it seeds the cache directly
    // instead of invalidating and fetching the same thing again.
    onSuccess: (data) => qc.setQueryData(templateKeys.list, data),
  });
}
