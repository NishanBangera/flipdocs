'use client';

import { ThemeProvider } from "./theme.provider";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

export function RootProvider({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    </QueryClientProvider>
  );
}
