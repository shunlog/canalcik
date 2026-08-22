import type { DriveStatusBody } from "@canalcik/server/api-types";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.ts";
import { driveKeys } from "./keys.ts";

export function useDriveStatus() {
  return useQuery({
    queryKey: driveKeys.status,
    queryFn: () => api.get<DriveStatusBody>("/drive/status"),
    // Every call round-trips to Google, and the answer only changes when the
    // user authorizes (which is a full page load anyway).
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
