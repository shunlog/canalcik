import type { TemplateInfo } from "@canalcik/server/api-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { templateKeys } from "./keys.ts";

export function useTemplates() {
  return useQuery({
    queryKey: templateKeys.list,
    queryFn: () => api.get<TemplateInfo[]>("/templates"),
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
