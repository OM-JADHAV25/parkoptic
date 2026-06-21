"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./ThemeProvider";
import { NotificationProvider } from "./NotificationProvider";
import { AIProvider } from "./AIProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  // Create query client inside useState to prevent recreating across re-renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NotificationProvider>
          <AIProvider>
            {children}
          </AIProvider>
        </NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export { useTheme } from "./ThemeProvider";
export { useNotifications } from "./NotificationProvider";
export { useAI } from "./AIProvider";
export type { SystemNotification } from "./NotificationProvider";
export type { AIInsight } from "./AIProvider";
