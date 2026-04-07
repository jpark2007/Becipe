import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,        // 30s — data stays fresh briefly, then refetches
      retry: 2,                     // retry twice on failure (covers token-refresh race)
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
      refetchOnWindowFocus: true,   // refetch when user returns to tab/app
      refetchOnReconnect: true,     // refetch when network recovers
    },
  },
});
