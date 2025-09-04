'use client';

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useMemo } from "react";

// Create a stable QueryClient instance
let globalQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (globalQueryClient) return globalQueryClient;
  
  globalQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: (failureCount, error: unknown) => {
          // Don't retry on 4xx errors except 408, 429
          if (error && typeof error === 'object' && 'response' in error) {
            const response = (error as { response?: { status?: number } }).response;
            if (response?.status && response.status >= 400 && response.status < 500) {
              if (response.status === 408 || response.status === 429) {
                return failureCount < 2;
              }
              return false;
            }
          }
          return failureCount < 3;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
  
  return globalQueryClient;
}

export function RootProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(() => getQueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
