"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { ThemeProvider as CustomThemeProvider } from "@/providers/ThemeProvider";
import { NotificationProvider } from "@/components/NotificationProvider";
import MixpanelProvider from "@/components/MixpanelProvider";
import { ConfirmacionAsistenciaProvider } from "@/components/club-trekking/ConfirmacionAsistenciaProvider";
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
            staleTime: 60 * 1000, // 1 minute
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
              {/* Sistema de confirmación de asistencia para Club del Trekking */}
              <ConfirmacionAsistenciaProvider>
                {children}
              </ConfirmacionAsistenciaProvider>
            </MixpanelProvider>
          </CustomThemeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
