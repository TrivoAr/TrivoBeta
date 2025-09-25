// Standalone API handler utilities (no external dependencies)

import { NextRequest, NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';

/**
 * User roles in the system
 */
export type UserRole = 'admin' | 'trainer' | 'user' | 'alumno';

/**
 * Permission types for different resources
 */
export type Permission = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'approve' | 'export';

/**
 * Resource types in the system
 */
export type Resource = 'social-events' | 'team-events' | 'academias' | 'users' | 'payments' | 'sponsors' | 'members';

/**
 * Standard API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: Record<string, any>;
}

/**
 * API context passed to handlers
 */
export interface ApiContext {
  user?: {
    id: string;
    role: UserRole;
    email?: string;
  };
  session?: any;
  params?: Record<string, string>;
  validatedData?: {
    body?: any;
    query?: any;
    params?: any;
  };
  meta?: Record<string, any>;
}

/**
 * API method handler type
 */
export type ApiMethodHandler<T = any> = (
  req: NextRequest,
  context: ApiContext
) => Promise<T>;

/**
 * Authentication handler type
 */
export type AuthHandler = () => Promise<{ session: any; user: ApiContext['user'] }>;

/**
 * Authorization handler type
 */
export type AuthorizeHandler = (
  user: ApiContext['user'],
  resource: Resource,
  permission: Permission,
  resourceOwnerId?: string
) => Promise<boolean>;

/**
 * API handler configuration
 */
export interface ApiHandlerConfig {
  requireAuth?: boolean;
  requiredRoles?: UserRole[];
  requiredPermission?: {
    resource: Resource;
    permission: Permission;
    getResourceOwnerId?: (req: NextRequest, context: ApiContext) => Promise<string | undefined>;
  };
  validation?: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
  };
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  cors?: {
    origin?: string | string[];
    methods?: string[];
    credentials?: boolean;
  };
  // External handlers
  authHandler?: AuthHandler;
  authorizeHandler?: AuthorizeHandler;
}

/**
 * Error classes
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string, code: 'UNAUTHORIZED' | 'FORBIDDEN' = 'FORBIDDEN') {
    super(message, code === 'UNAUTHORIZED' ? 401 : 403, code);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Rate limiting store
 */
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  check(key: string, windowMs: number, maxRequests: number): boolean {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of Array.from(this.store.entries())) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const rateLimitStore = new RateLimitStore();

/**
 * ApiHandler - Unified API route handler with middleware support
 */
export class ApiHandler {
  private config: ApiHandlerConfig;
  private handlers: Map<string, ApiMethodHandler> = new Map();

  constructor(config: ApiHandlerConfig = {}) {
    this.config = config;
  }

  /**
   * Register HTTP method handlers
   */
  get(handler: ApiMethodHandler): this {
    this.handlers.set('GET', handler);
    return this;
  }

  post(handler: ApiMethodHandler): this {
    this.handlers.set('POST', handler);
    return this;
  }

  put(handler: ApiMethodHandler): this {
    this.handlers.set('PUT', handler);
    return this;
  }

  patch(handler: ApiMethodHandler): this {
    this.handlers.set('PATCH', handler);
    return this;
  }

  delete(handler: ApiMethodHandler): this {
    this.handlers.set('DELETE', handler);
    return this;
  }

  options(handler: ApiMethodHandler): this {
    this.handlers.set('OPTIONS', handler);
    return this;
  }

  /**
   * Build the actual Next.js API route handler
   */
  build() {
    return async (req: NextRequest, routeContext?: { params: Record<string, string> }) => {
      try {
        // Apply CORS headers if configured
        const corsHeaders = this.applyCors(req);

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
          return new NextResponse(null, { status: 200, headers: corsHeaders });
        }

        // Check if method is supported
        const handler = this.handlers.get(req.method || 'GET');
        if (!handler) {
          return this.errorResponse(
            `Method ${req.method} not allowed`,
            405,
            'METHOD_NOT_ALLOWED',
            corsHeaders
          );
        }

        // Apply rate limiting
        if (this.config.rateLimit) {
          const allowed = this.checkRateLimit(req);
          if (!allowed) {
            return this.errorResponse(
              'Rate limit exceeded',
              429,
              'RATE_LIMIT_EXCEEDED',
              corsHeaders
            );
          }
        }

        // Build context
        const context: ApiContext = {
          params: routeContext?.params || {}
        };

        // Apply authentication middleware
        if (this.config.requireAuth) {
          if (!this.config.authHandler) {
            throw new AuthorizationError('Auth handler not configured', 'UNAUTHORIZED');
          }

          const { session, user } = await this.config.authHandler();
          context.session = session;
          context.user = user;
        }

        // Apply role-based authorization
        if (this.config.requiredRoles && context.user) {
          if (!this.config.requiredRoles.includes(context.user.role)) {
            return this.errorResponse(
              `Access denied. Required roles: ${this.config.requiredRoles.join(', ')}`,
              403,
              'INSUFFICIENT_ROLE',
              corsHeaders
            );
          }
        }

        // Apply permission-based authorization
        if (this.config.requiredPermission && context.user) {
          const { resource, permission, getResourceOwnerId } = this.config.requiredPermission;

          let resourceOwnerId: string | undefined;
          if (getResourceOwnerId) {
            resourceOwnerId = await getResourceOwnerId(req, context);
          }

          if (this.config.authorizeHandler) {
            const authorized = await this.config.authorizeHandler(
              context.user,
              resource,
              permission,
              resourceOwnerId
            );

            if (!authorized) {
              throw new AuthorizationError('Permission denied', 'FORBIDDEN');
            }
          }
        }

        // Apply validation
        if (this.config.validation) {
          context.validatedData = await this.validateRequest(req, context);
        }

        // Execute handler
        const result = await handler(req, context);

        // Return success response
        return this.successResponse(result, corsHeaders);

      } catch (error) {
        console.error('API Handler Error:', error);
        return this.handleError(error, this.applyCors(req));
      }
    };
  }

  /**
   * Apply CORS headers
   */
  private applyCors(req: NextRequest): Headers {
    const headers = new Headers();

    if (this.config.cors) {
      const { origin, methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], credentials = true } = this.config.cors;

      const requestOrigin = req.headers.get('origin');

      if (origin) {
        if (Array.isArray(origin)) {
          if (origin.includes(requestOrigin || '')) {
            headers.set('Access-Control-Allow-Origin', requestOrigin || '');
          }
        } else if (origin === '*' || origin === requestOrigin) {
          headers.set('Access-Control-Allow-Origin', origin);
        }
      }

      headers.set('Access-Control-Allow-Methods', methods.join(', '));
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

      if (credentials) {
        headers.set('Access-Control-Allow-Credentials', 'true');
      }
    }

    return headers;
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(req: NextRequest): boolean {
    if (!this.config.rateLimit) return true;

    const { windowMs, maxRequests } = this.config.rateLimit;
    const clientIp = req.headers.get('x-forwarded-for') ||
                     req.headers.get('x-real-ip') ||
                     'unknown';

    return rateLimitStore.check(clientIp, windowMs, maxRequests);
  }

  /**
   * Validate request data
   */
  private async validateRequest(req: NextRequest, context: ApiContext): Promise<any> {
    const validatedData: any = {};

    // Validate body
    if (this.config.validation?.body && ['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
      try {
        const body = await req.json();
        validatedData.body = this.config.validation.body.parse(body);
      } catch (error) {
        if (error instanceof ZodError) {
          throw new ValidationError('Invalid request body', error.errors);
        }
        throw new ValidationError('Invalid JSON in request body');
      }
    }

    // Validate query parameters
    if (this.config.validation?.query) {
      const url = new URL(req.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      validatedData.query = this.config.validation.query.parse(queryParams);
    }

    // Validate route parameters
    if (this.config.validation?.params) {
      validatedData.params = this.config.validation.params.parse(context.params);
    }

    return validatedData;
  }

  /**
   * Handle errors and return appropriate responses
   */
  private handleError(error: unknown, corsHeaders: Headers): NextResponse {
    // API errors
    if (error instanceof ApiError) {
      return this.errorResponse(error.message, error.statusCode, error.code, corsHeaders, error.details);
    }

    // Zod validation errors
    if (error instanceof ZodError) {
      return this.errorResponse(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        corsHeaders,
        error.errors
      );
    }

    // Generic errors
    const message = error instanceof Error ? error.message : 'Internal server error';
    return this.errorResponse(message, 500, 'INTERNAL_ERROR', corsHeaders);
  }

  /**
   * Create success response
   */
  private successResponse<T>(data: T, corsHeaders: Headers): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      data
    };

    return NextResponse.json(response, {
      status: 200,
      headers: corsHeaders
    });
  }

  /**
   * Create error response
   */
  private errorResponse(
    message: string,
    status: number,
    code?: string,
    corsHeaders?: Headers,
    details?: any
  ): NextResponse {
    const response: ApiResponse = {
      success: false,
      error: {
        message,
        code,
        details
      }
    };

    return NextResponse.json(response, {
      status,
      headers: corsHeaders
    });
  }
}

/**
 * Helper function to create API handlers
 */
export const createApiHandler = (config: ApiHandlerConfig = {}) => {
  return new ApiHandler(config);
};

/**
 * Utility functions for common API operations
 */
export const ApiUtils = {
  /**
   * Extract pagination parameters from query string
   */
  extractPagination: (url: string, defaultLimit = 10, maxLimit = 100) => {
    const searchParams = new URL(url).searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(maxLimit, Math.max(1, parseInt(searchParams.get('limit') || defaultLimit.toString())));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  },

  /**
   * Create pagination response
   */
  createPaginatedResponse: <T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): ApiResponse<T[]> => {
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  },

  /**
   * Parse and validate ObjectId from string
   */
  validateObjectId: (id: string): boolean => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  },

  /**
   * Extract user ID from session or throw error
   */
  requireUserId: (context: ApiContext): string => {
    if (!context.user?.id) {
      throw new AuthorizationError('User ID is required', 'UNAUTHORIZED');
    }
    return context.user.id;
  }
} as const;