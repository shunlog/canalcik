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

declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__: QueryClient;
  }
}

// Lets the TanStack Query browser extension (Chrome/Firefox) attach to this app.
if (import.meta.env.DEV) {
  window.__TANSTACK_QUERY_CLIENT__ = queryClient;
}
