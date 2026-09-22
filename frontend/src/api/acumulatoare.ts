import type { AcumulatorRef } from "@canalcik/server/api-types";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { acumulatoareKeys } from "./keys.ts";

export function useAcumulatoare() {
  return useQuery({
    queryKey: acumulatoareKeys.list,
    queryFn: () => api.get<AcumulatorRef[]>("/acumulatoare"),
  });
}
