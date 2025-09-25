'use client';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/libs/authOptions';

/**
 * Interceptor Types
 */
export type InterceptorType =
  | 'request'
  | 'response'
  | 'error'
  | 'auth'
  | 'cache'
  | 'logging'
  | 'metrics';

export type InterceptorPriority = 'high' | 'medium' | 'low';

/**
 * Interceptor Context
 */
export interface InterceptorContext {
  request: NextRequest;
  response?: NextResponse;
  error?: Error;
  user?: {
    id: string;
    rol: 'admin' | 'profe' | 'dueño de academia' | 'alumno';
    email: string;
    firstname: string;
    lastname: string;
  };
  startTime: number;
  metadata: Record<string, any>;
}

/**
 * Interceptor Function
 */
export type InterceptorFunction = (
  context: InterceptorContext,
  next: () => Promise<InterceptorContext>
) => Promise<InterceptorContext>;

/**
 * Interceptor Configuration
 */
export interface InterceptorConfig {
  name: string;
  type: InterceptorType;
  priority: InterceptorPriority;
  enabled: boolean;
  condition?: (context: InterceptorContext) => boolean;
  interceptor: InterceptorFunction;
  metadata?: Record<string, any>;
}

/**
 * Advanced Interceptor System
 */
export class InterceptorSystem {
  private interceptors: Map<string, InterceptorConfig> = new Map();
  private typeGroups: Map<InterceptorType, string[]> = new Map();
  private priorityOrder: Record<InterceptorPriority, number> = {
    high: 3,
    medium: 2,
    low: 1
  };

  /**
   * Register an interceptor
   */
  register(config: InterceptorConfig): void {
    this.interceptors.set(config.name, config);

    // Group by type
    if (!this.typeGroups.has(config.type)) {
      this.typeGroups.set(config.type, []);
    }
    this.typeGroups.get(config.type)!.push(config.name);

    // Sort by priority
    this.sortInterceptorsByPriority(config.type);
  }

  /**
   * Unregister an interceptor
   */
  unregister(name: string): boolean {
    const config = this.interceptors.get(name);
    if (!config) return false;

    this.interceptors.delete(name);

    // Remove from type group
    const typeGroup = this.typeGroups.get(config.type);
    if (typeGroup) {
      const index = typeGroup.indexOf(name);
      if (index > -1) {
        typeGroup.splice(index, 1);
      }
    }

    return true;
  }

  /**
   * Execute interceptors of a specific type
   */
  async execute(
    type: InterceptorType,
    initialContext: Partial<InterceptorContext>
  ): Promise<InterceptorContext> {
    const context: InterceptorContext = {
      startTime: Date.now(),
      metadata: {},
      ...initialContext
    } as InterceptorContext;

    const interceptorNames = this.typeGroups.get(type) || [];
    const enabledInterceptors = interceptorNames
      .map(name => this.interceptors.get(name)!)
      .filter(config => config.enabled && this.shouldExecute(config, context));

    // Create execution chain
    let index = 0;
    const next = async (): Promise<InterceptorContext> => {
      if (index >= enabledInterceptors.length) {
        return context;
      }

      const interceptor = enabledInterceptors[index++];
      try {
        return await interceptor.interceptor(context, next);
      } catch (error) {
        console.error(`Interceptor ${interceptor.name} failed:`, error);
        throw error;
      }
    };

    return next();
  }

  /**
   * Get all interceptors of a type
   */
  getByType(type: InterceptorType): InterceptorConfig[] {
    const names = this.typeGroups.get(type) || [];
    return names.map(name => this.interceptors.get(name)!);
  }

  /**
   * Enable/disable interceptor
   */
  toggle(name: string, enabled: boolean): boolean {
    const config = this.interceptors.get(name);
    if (!config) return false;

    config.enabled = enabled;
    return true;
  }

  /**
   * Get interceptor by name
   */
  get(name: string): InterceptorConfig | undefined {
    return this.interceptors.get(name);
  }

  /**
   * List all interceptors
   */
  list(): InterceptorConfig[] {
    return Array.from(this.interceptors.values());
  }

  /**
   * Clear all interceptors
   */
  clear(): void {
    this.interceptors.clear();
    this.typeGroups.clear();
  }

  /**
   * Sort interceptors by priority
   */
  private sortInterceptorsByPriority(type: InterceptorType): void {
    const typeGroup = this.typeGroups.get(type);
    if (!typeGroup) return;

    typeGroup.sort((a, b) => {
      const configA = this.interceptors.get(a)!;
      const configB = this.interceptors.get(b)!;
      return this.priorityOrder[configB.priority] - this.priorityOrder[configA.priority];
    });
  }

  /**
   * Check if interceptor should execute
   */
  private shouldExecute(config: InterceptorConfig, context: InterceptorContext): boolean {
    if (!config.condition) return true;
    return config.condition(context);
  }
}

/**
 * Built-in Interceptors
 */
export const BuiltInInterceptors = {
  /**
   * Authentication Interceptor
   */
  authentication: (): InterceptorConfig => ({
    name: 'authentication',
    type: 'auth',
    priority: 'high',
    enabled: true,
    async interceptor(context, next) {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user) {
          context.user = {
            id: session.user.id,
            rol: session.user.rol as any,
            email: session.user.email || '',
            firstname: session.user.firstname || '',
            lastname: session.user.lastname || ''
          };
        }
      } catch (error) {
        console.warn('Authentication interceptor failed:', error);
      }
      return next();
    }
  }),

  /**
   * Request Logging Interceptor
   */
  requestLogging: (): InterceptorConfig => ({
    name: 'request-logging',
    type: 'request',
    priority: 'medium',
    enabled: true,
    async interceptor(context, next) {
      const { request } = context;
      console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`);

      context.metadata.requestLogged = true;
      context.metadata.method = request.method;
      context.metadata.url = request.url;

      return next();
    }
  }),

  /**
   * Response Time Interceptor
   */
  responseTime: (): InterceptorConfig => ({
    name: 'response-time',
    type: 'response',
    priority: 'low',
    enabled: true,
    async interceptor(context, next) {
      const result = await next();

      const duration = Date.now() - context.startTime;
      result.metadata.responseTime = duration;

      if (result.response) {
        result.response.headers.set('X-Response-Time', `${duration}ms`);
      }

      console.log(`Request completed in ${duration}ms`);
      return result;
    }
  }),

  /**
   * Error Handling Interceptor
   */
  errorHandling: (): InterceptorConfig => ({
    name: 'error-handling',
    type: 'error',
    priority: 'high',
    enabled: true,
    async interceptor(context, next) {
      try {
        return await next();
      } catch (error) {
        console.error('Request error:', error);

        context.error = error as Error;
        context.metadata.hasError = true;
        context.metadata.errorMessage = (error as Error).message;

        // Create error response
        context.response = NextResponse.json(
          {
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Something went wrong'
          },
          { status: 500 }
        );

        return context;
      }
    }
  }),

  /**
   * Rate Limiting Interceptor
   */
  rateLimiting: (options: { maxRequests: number; windowMs: number } = { maxRequests: 100, windowMs: 60000 }): InterceptorConfig => {
    const requestCounts = new Map<string, { count: number; resetTime: number }>();

    return {
      name: 'rate-limiting',
      type: 'request',
      priority: 'high',
      enabled: true,
      async interceptor(context, next) {
        const clientIP = context.request.headers.get('x-forwarded-for') ||
                        context.request.headers.get('x-real-ip') ||
                        'unknown';

        const now = Date.now();
        const windowStart = now - options.windowMs;

        // Clean old entries
        for (const [ip, data] of Array.from(requestCounts.entries())) {
          if (data.resetTime < windowStart) {
            requestCounts.delete(ip);
          }
        }

        // Check current count
        const current = requestCounts.get(clientIP) || { count: 0, resetTime: now + options.windowMs };

        if (current.count >= options.maxRequests) {
          context.response = NextResponse.json(
            { error: 'Too Many Requests' },
            {
              status: 429,
              headers: {
                'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString()
              }
            }
          );
          return context;
        }

        // Increment count
        current.count++;
        requestCounts.set(clientIP, current);

        context.metadata.rateLimitCount = current.count;
        context.metadata.rateLimitRemaining = options.maxRequests - current.count;

        return next();
      }
    };
  },

  /**
   * CORS Interceptor
   */
  cors: (options: {
    origins?: string[];
    methods?: string[];
    headers?: string[];
  } = {}): InterceptorConfig => ({
    name: 'cors',
    type: 'response',
    priority: 'high',
    enabled: true,
    async interceptor(context, next) {
      const result = await next();

      if (result.response) {
        const origin = context.request.headers.get('origin');
        const allowedOrigins = options.origins || ['*'];

        if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
          result.response.headers.set('Access-Control-Allow-Origin', origin || '*');
        }

        result.response.headers.set(
          'Access-Control-Allow-Methods',
          options.methods?.join(', ') || 'GET, POST, PUT, DELETE, OPTIONS'
        );

        result.response.headers.set(
          'Access-Control-Allow-Headers',
          options.headers?.join(', ') || 'Content-Type, Authorization'
        );
      }

      return result;
    }
  }),

  /**
   * Cache Control Interceptor
   */
  cacheControl: (options: {
    maxAge?: number;
    staleWhileRevalidate?: number;
    mustRevalidate?: boolean;
  } = {}): InterceptorConfig => ({
    name: 'cache-control',
    type: 'response',
    priority: 'medium',
    enabled: true,
    async interceptor(context, next) {
      const result = await next();

      if (result.response && context.request.method === 'GET') {
        const cacheDirectives = [];

        if (options.maxAge !== undefined) {
          cacheDirectives.push(`max-age=${options.maxAge}`);
        }

        if (options.staleWhileRevalidate !== undefined) {
          cacheDirectives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
        }

        if (options.mustRevalidate) {
          cacheDirectives.push('must-revalidate');
        }

        if (cacheDirectives.length > 0) {
          result.response.headers.set('Cache-Control', cacheDirectives.join(', '));
        }
      }

      return result;
    }
  }),

  /**
   * Security Headers Interceptor
   */
  securityHeaders: (): InterceptorConfig => ({
    name: 'security-headers',
    type: 'response',
    priority: 'high',
    enabled: true,
    async interceptor(context, next) {
      const result = await next();

      if (result.response) {
        // Security headers
        result.response.headers.set('X-Content-Type-Options', 'nosniff');
        result.response.headers.set('X-Frame-Options', 'DENY');
        result.response.headers.set('X-XSS-Protection', '1; mode=block');
        result.response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        result.response.headers.set(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains'
        );
        result.response.headers.set(
          'Content-Security-Policy',
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
        );
      }

      return result;
    }
  })
};

/**
 * Global Interceptor System Instance
 */
export const interceptorSystem = new InterceptorSystem();

// Register built-in interceptors
interceptorSystem.register(BuiltInInterceptors.authentication());
interceptorSystem.register(BuiltInInterceptors.requestLogging());
interceptorSystem.register(BuiltInInterceptors.responseTime());
interceptorSystem.register(BuiltInInterceptors.errorHandling());
interceptorSystem.register(BuiltInInterceptors.rateLimiting());
interceptorSystem.register(BuiltInInterceptors.cors());
interceptorSystem.register(BuiltInInterceptors.cacheControl({ maxAge: 300 })); // 5 minutes
interceptorSystem.register(BuiltInInterceptors.securityHeaders());

/**
 * Middleware function for Next.js API routes
 */
export function withInterceptors(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  types: InterceptorType[] = ['request', 'auth', 'response', 'error']
) {
  return async (request: NextRequest, routeContext?: any): Promise<NextResponse> => {
    let context: InterceptorContext = {
      request,
      startTime: Date.now(),
      metadata: {}
    };

    try {
      // Execute request interceptors
      if (types.includes('request')) {
        context = await interceptorSystem.execute('request', context);
        if (context.response) return context.response;
      }

      // Execute auth interceptors
      if (types.includes('auth')) {
        context = await interceptorSystem.execute('auth', context);
        if (context.response) return context.response;
      }

      // Execute main handler
      context.response = await handler(request, routeContext);

      // Execute response interceptors
      if (types.includes('response')) {
        context = await interceptorSystem.execute('response', context);
      }

      return context.response;

    } catch (error) {
      // Execute error interceptors
      if (types.includes('error')) {
        context.error = error as Error;
        context = await interceptorSystem.execute('error', context);
        if (context.response) return context.response;
      }

      // Fallback error response
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}

/**
 * React Hook for Interceptor Management
 */
export function useInterceptors() {
  return {
    register: interceptorSystem.register.bind(interceptorSystem),
    unregister: interceptorSystem.unregister.bind(interceptorSystem),
    execute: interceptorSystem.execute.bind(interceptorSystem),
    toggle: interceptorSystem.toggle.bind(interceptorSystem),
    get: interceptorSystem.get.bind(interceptorSystem),
    list: interceptorSystem.list.bind(interceptorSystem),
    getByType: interceptorSystem.getByType.bind(interceptorSystem)
  };
}