import type { AnvelopeList } from "@canalcik/server/api-types";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { anvelopeKeys } from "./keys.ts";

export function useAnvelope() {
  return useQuery({
    queryKey: anvelopeKeys.list,
    queryFn: () => api.get<AnvelopeList>("/anvelope"),
  });
}
