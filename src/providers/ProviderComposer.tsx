'use client';

import React, { ComponentType, ReactNode, useMemo } from 'react';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/AppContext';

/**
 * Provider configuration interface
 */
export interface ProviderConfig {
  component: ComponentType<any>;
  props?: Record<string, any>;
  condition?: () => boolean;
  priority?: number;
}

/**
 * Provider Composer for combining multiple providers
 */
export class ProviderComposer {
  private providers: ProviderConfig[] = [];

  /**
   * Add a provider to the composition
   */
  add(config: ProviderConfig): this {
    this.providers.push(config);
    return this;
  }

  /**
   * Add multiple providers
   */
  addMany(configs: ProviderConfig[]): this {
    this.providers.push(...configs);
    return this;
  }

  /**
   * Add a provider conditionally
   */
  addIf(condition: boolean | (() => boolean), config: ProviderConfig): this {
    const shouldAdd = typeof condition === 'function' ? condition() : condition;
    if (shouldAdd) {
      this.add(config);
    }
    return this;
  }

  /**
   * Remove a provider by component
   */
  remove(component: ComponentType<any>): this {
    this.providers = this.providers.filter(p => p.component !== component);
    return this;
  }

  /**
   * Clear all providers
   */
  clear(): this {
    this.providers = [];
    return this;
  }

  /**
   * Sort providers by priority (higher priority = outer wrapper)
   */
  private sortByPriority(): ProviderConfig[] {
    return [...this.providers].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Build the composed provider component
   */
  build(): ComponentType<{ children: ReactNode }> {
    const sortedProviders = this.sortByPriority();

    return function ComposedProvider({ children }: { children: ReactNode }) {
      return sortedProviders.reduce(
        (acc, { component: Provider, props = {}, condition }) => {
          // Check condition if provided
          if (condition && !condition()) {
            return acc;
          }

          return React.createElement(Provider, props, acc);
        },
        children
      );
    };
  }

  /**
   * Create a hook to access all provider contexts
   */
  createContextHook<T extends Record<string, any>>(): () => T {
    return () => {
      // This would need to be implemented based on specific provider contexts
      // For now, return empty object
      return {} as T;
    };
  }
}

/**
 * Common Provider Configurations
 */
export const CommonProviders = {
  /**
   * Session Provider configuration
   */
  session: (session?: any): ProviderConfig => ({
    component: SessionProvider,
    props: { session },
    priority: 100 // High priority (outer)
  }),

  /**
   * React Query Provider configuration
   */
  reactQuery: (client?: QueryClient): ProviderConfig => ({
    component: QueryClientProvider,
    props: {
      client: client || new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 3,
            refetchOnWindowFocus: false
          }
        }
      })
    },
    priority: 90
  }),

  /**
   * App Context Provider configuration
   */
  appContext: (initialState?: any): ProviderConfig => ({
    component: AppProvider,
    props: { initialState },
    priority: 80
  }),

  /**
   * Theme Provider configuration (placeholder)
   */
  theme: (theme?: string): ProviderConfig => ({
    component: ({ children }: { children: ReactNode }) => {
      const themeClass = theme === 'dark' ? 'dark' : '';
      return <div className={themeClass}>{children}</div>;
    },
    props: {},
    priority: 70
  }),

  /**
   * Error Boundary Provider
   */
  errorBoundary: (): ProviderConfig => ({
    component: ErrorBoundaryProvider,
    props: {},
    priority: 95
  }),

  /**
   * Loading Provider
   */
  loading: (): ProviderConfig => ({
    component: LoadingProvider,
    props: {},
    priority: 60
  })
};

/**
 * Error Boundary Provider Component
 */
class ErrorBoundaryProvider extends React.Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Provider Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              An unexpected error occurred. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Loading Provider Component
 */
function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Provider Factory for creating specialized provider compositions
 */
export class ProviderFactory {
  /**
   * Create a standard app provider composition
   */
  static createAppProviders(session?: any, queryClient?: QueryClient): ComponentType<{ children: ReactNode }> {
    return new ProviderComposer()
      .add(CommonProviders.errorBoundary())
      .add(CommonProviders.session(session))
      .add(CommonProviders.reactQuery(queryClient))
      .add(CommonProviders.appContext())
      .add(CommonProviders.theme())
      .build();
  }

  /**
   * Create a minimal provider composition (for testing)
   */
  static createMinimalProviders(): ComponentType<{ children: ReactNode }> {
    return new ProviderComposer()
      .add(CommonProviders.appContext())
      .build();
  }

  /**
   * Create a development provider composition with extra tools
   */
  static createDevProviders(session?: any): ComponentType<{ children: ReactNode }> {
    return new ProviderComposer()
      .add(CommonProviders.errorBoundary())
      .add(CommonProviders.loading())
      .add(CommonProviders.session(session))
      .add(CommonProviders.reactQuery())
      .add(CommonProviders.appContext())
      .add(CommonProviders.theme())
      .addIf(
        process.env.NODE_ENV === 'development',
        {
          component: ({ children }: { children: ReactNode }) => {
            // Development-only provider (React Query Devtools, etc.)
            return <div data-dev-mode="true">{children}</div>;
          },
          priority: 50
        }
      )
      .build();
  }

  /**
   * Create a custom provider composition
   */
  static createCustomProviders(configs: ProviderConfig[]): ComponentType<{ children: ReactNode }> {
    return new ProviderComposer()
      .addMany(configs)
      .build();
  }
}

/**
 * Provider Context Registry for dynamic provider management
 */
export class ProviderRegistry {
  private static providers = new Map<string, ProviderConfig>();

  /**
   * Register a provider configuration
   */
  static register(name: string, config: ProviderConfig): void {
    this.providers.set(name, config);
  }

  /**
   * Get a registered provider
   */
  static get(name: string): ProviderConfig | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all registered providers
   */
  static getAll(): ProviderConfig[] {
    return Array.from(this.providers.values());
  }

  /**
   * Create a provider composition from registered providers
   */
  static createFromRegistry(names: string[]): ComponentType<{ children: ReactNode }> {
    const configs = names
      .map(name => this.get(name))
      .filter((config): config is ProviderConfig => config !== undefined);

    return new ProviderComposer()
      .addMany(configs)
      .build();
  }

  /**
   * List all registered provider names
   */
  static list(): string[] {
    return Array.from(this.providers.keys());
  }
}

/**
 * HOC for adding providers to components
 */
export function withProviders<P extends object>(
  Component: ComponentType<P>,
  providerConfigs: ProviderConfig[]
): ComponentType<P> {
  const ProvidersWrapper = new ProviderComposer()
    .addMany(providerConfigs)
    .build();

  return function WithProvidersComponent(props: P) {
    return (
      <ProvidersWrapper>
        <Component {...props} />
      </ProvidersWrapper>
    );
  };
}

/**
 * Hook for conditionally using providers
 */
export function useConditionalProviders(
  conditions: Record<string, boolean>,
  configs: Record<string, ProviderConfig>
): ComponentType<{ children: ReactNode }> {
  return useMemo(() => {
    const composer = new ProviderComposer();

    Object.entries(conditions).forEach(([key, condition]) => {
      if (condition && configs[key]) {
        composer.add(configs[key]);
      }
    });

    return composer.build();
  }, [conditions, configs]);
}

// Register common providers
ProviderRegistry.register('session', CommonProviders.session());
ProviderRegistry.register('reactQuery', CommonProviders.reactQuery());
ProviderRegistry.register('appContext', CommonProviders.appContext());
ProviderRegistry.register('theme', CommonProviders.theme());
ProviderRegistry.register('errorBoundary', CommonProviders.errorBoundary());
ProviderRegistry.register('loading', CommonProviders.loading());