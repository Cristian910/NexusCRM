"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { getQueryClient } from "@/lib/query-client";
import { AuthInitializer } from "./auth-initializer";
import { RealtimeInitializer } from "./realtime-initializer";
import { Toaster } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n/context";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <AuthInitializer />
          <RealtimeInitializer />
          {children}
          <Toaster />
          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
          )}
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
