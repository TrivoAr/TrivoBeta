"use client";

import React, { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider, AppState } from "@/context/AppContext";
import { ProviderFactory } from "./ProviderComposer";

/**
 * Unified App Provider Configuration
 */
export interface UnifiedAppProviderProps {
  children: ReactNode;
  session?: any;
  queryClient?: QueryClient;
  initialAppState?: Partial<AppState>;
  theme?: "light" | "dark";
  environment?: "development" | "production" | "test";
}

/**
 * Default Query Client configuration
 */
const createDefaultQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
        retry: (failureCount, error: any) => {
          // Don't retry on 401/403 errors
          if (error?.status === 401 || error?.status === 403) {
            return false;
          }
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
        onError: (error) => {
          console.error("Mutation error:", error);
        },
      },
    },
  });

/**
 * Unified Application Provider that combines all providers in optimal order
 */
export function UnifiedAppProvider({
  children,
  session,
  queryClient,
  initialAppState,
  theme = "light",
  environment = "production",
}: UnifiedAppProviderProps) {
  // Create query client if not provided
  const client = queryClient || createDefaultQueryClient();

  // Enhanced initial app state with passed values
  const enhancedInitialState: Partial<AppState> = {
    ...initialAppState,
    user: {
      ...initialAppState?.user,
      preferences: {
        theme,
        language: "es",
        notifications: true,
        ...initialAppState?.user?.preferences,
      },
    },
  };

  // Environment-specific provider selection
  const _AppProviders = React.useMemo(() => {
    switch (environment) {
      case "development":
        return ProviderFactory.createDevProviders(session);
      case "test":
        return ProviderFactory.createMinimalProviders();
      default:
        return ProviderFactory.createAppProviders(session, client);
    }
  }, [environment, session, client]);

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={client}>
        <AppProvider initialState={enhancedInitialState}>
          <ThemeProvider theme={theme}>
            <GlobalErrorBoundary>
              <NetworkStatusProvider>
                <NotificationProvider>{children}</NotificationProvider>
              </NetworkStatusProvider>
            </GlobalErrorBoundary>
          </ThemeProvider>
        </AppProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

/**
 * Theme Provider Component
 */
function ThemeProvider({
  children,
  theme,
}: {
  children: ReactNode;
  theme: "light" | "dark";
}) {
  React.useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        theme === "dark" ? "#1f2937" : "#ffffff"
      );
    }
  }, [theme]);

  return (
    <div className={`${theme} min-h-screen transition-colors duration-200`}>
      {children}
    </div>
  );
}

/**
 * Global Error Boundary for the entire application
 */
class GlobalErrorBoundary extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error; errorInfo?: React.ErrorInfo }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      console.error("Global Error Boundary:", error, errorInfo);
      // Here you would send to error tracking service like Sentry
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md mx-auto text-center p-6">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ¡Oops! Algo salió mal
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Ocurrió un error inesperado. Por favor, recarga la página o
              intenta más tarde.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Recargar Página
              </button>
              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Ir Atrás
              </button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Detalles del Error (Dev)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Network Status Provider for handling online/offline states
 */
function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [_isOnline, setIsOnline] = React.useState(true);
  const [showOfflineNotice, setShowOfflineNotice] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineNotice(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineNotice(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set initial state
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <>
      {children}
      {showOfflineNotice && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 px-4 z-50">
          <p className="text-sm">
            Sin conexión a internet. Algunas funciones pueden no estar
            disponibles.
          </p>
        </div>
      )}
    </>
  );
}

/**
 * Notification Provider for handling app-wide notifications
 */
function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = React.useState<
    Array<{
      id: string;
      type: "success" | "error" | "warning" | "info";
      message: string;
      timestamp: number;
    }>
  >([]);

  // Auto-remove notifications after 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNotifications((prev) =>
        prev.filter((notification) => now - notification.timestamp < 5000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const removeNotification = React.useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <>
      {children}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 space-y-2 z-50">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRemove={removeNotification}
            />
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Individual Notification Component
 */
function NotificationItem({
  notification,
  onRemove,
}: {
  notification: {
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
  };
  onRemove: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(notification.id), 300);
    }, 4700);

    return () => clearTimeout(timer);
  }, [notification.id, onRemove]);

  const bgColors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div
      className={`
        ${bgColors[notification.type]} text-white px-4 py-3 rounded-lg shadow-lg
        transform transition-all duration-300 max-w-sm
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
    >
      <div className="flex items-center">
        <span className="text-lg mr-2" aria-hidden="true">
          {icons[notification.type]}
        </span>
        <p className="text-sm font-medium flex-1">{notification.message}</p>
        <button
          onClick={() => onRemove(notification.id)}
          className="ml-2 text-white hover:text-gray-200 transition-colors"
          aria-label="Cerrar notificación"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Hook for easy access to all provider contexts
 */
export function useUnifiedApp() {
  // This would combine access to all provider contexts
  // For now, we'll return a placeholder
  return {
    isOnline: navigator.onLine,
    environment: process.env.NODE_ENV,
  };
}

/**
 * Higher-order component for wrapping components with unified providers
 */
export function withUnifiedApp<P extends object>(
  Component: React.ComponentType<P>,
  providerProps?: Partial<UnifiedAppProviderProps>
) {
  return function WrappedComponent(props: P) {
    return (
      <UnifiedAppProvider {...providerProps}>
        <Component {...props} />
      </UnifiedAppProvider>
    );
  };
}
