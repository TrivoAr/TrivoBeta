"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { ThemeProvider as CustomThemeProvider } from "@/providers/ThemeProvider";
import { NotificationProvider } from "@/components/NotificationProvider";
import MixpanelProvider from "@/components/MixpanelProvider";
import { useState } from "react";

interface Props {
  children: React.ReactNode;
}

export default function Providers({ children }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos - datos se consideran frescos por más tiempo
            gcTime: 10 * 60 * 1000, // 10 minutos - mantener en cache (antes cacheTime en v4)
            refetchOnWindowFocus: false, // Evitar refetch automático al cambiar de pestaña
            refetchOnReconnect: false, // Evitar refetch automático al reconectar
            refetchOnMount: false, // Evitar refetch si los datos están frescos (staleTime)
            retry: 1, // Solo reintentar una vez en caso de error
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CustomThemeProvider>
            <MixpanelProvider>
              <NotificationProvider />
              {children}
            </MixpanelProvider>
          </CustomThemeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
