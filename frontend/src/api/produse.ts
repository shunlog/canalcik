import type { CategorieProduse } from "@canalcik/server/api-types";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { produseKeys } from "./keys.ts";

export function useProduse() {
  return useQuery({
    queryKey: produseKeys.list,
    queryFn: () => api.get<CategorieProduse[]>("/produse"),
  });
}
