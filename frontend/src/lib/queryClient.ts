import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A 400/409 is a verdict, not a hiccup — retrying it just delays the message.
      retry: false,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
