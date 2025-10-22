// Server-side middleware utilities

import { NextRequest } from "next/server";
import { ZodSchema } from "zod";
// Type imports
type UserRole = "admin" | "trainer" | "user" | "alumno";
type Resource =
  | "social-events"
  | "team-events"
  | "academias"
  | "users"
  | "payments"
  | "sponsors"
  | "members";
type Permission =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage"
  | "approve"
  | "export";
import { ApiContext } from "./ApiHandler.standalone";

/**
 * Middleware function type
 */
export type Middleware = (
  req: NextRequest,
  context: ApiContext,
  next: () => Promise<void>
) => Promise<void>;

/**
 * Middleware composer for chaining multiple middlewares
 */
export class MiddlewareComposer {
  private middlewares: Middleware[] = [];

  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  async execute(req: NextRequest, context: ApiContext): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        await middleware(req, context, next);
      }
    };

    await next();
  }
}

/**
 * Common middleware implementations
 */
export const Middlewares = {
  /**
   * Authentication middleware
   */
  requireAuth: (): Middleware => {
    return async (req, context, next) => {
      // Dynamic import to avoid circular dependencies
      const { AuthorizationManager } = await import(
        "@/libs/auth/AuthorizationManager"
      );
      const { session, user } = await AuthorizationManager.requireAuth();
      context.session = session;
      context.user = user;
      await next();
    };
  },

  /**
   * Role-based authorization middleware
   */
  requireRole: (roles: UserRole[]): Middleware => {
    return async (req, context, next) => {
      if (!context.user) {
        throw new Error("Authentication required");
      }

      if (!roles.includes(context.user.role)) {
        throw new Error(
          `Access denied. Required roles: ${roles.join(", ")}. User role: ${context.user.role}`
        );
      }

      await next();
    };
  },

  /**
   * Permission-based authorization middleware
   */
  requirePermission: (
    resource: Resource,
    permission: Permission,
    getResourceOwnerId?: (
      req: NextRequest,
      context: ApiContext
    ) => Promise<string | undefined>
  ): Middleware => {
    return async (req, context, next) => {
      if (!context.user) {
        throw new Error("Authentication required");
      }

      let resourceOwnerId: string | undefined;
      if (getResourceOwnerId) {
        resourceOwnerId = await getResourceOwnerId(req, context);
      }

      // Dynamic import to avoid circular dependencies
      const { AuthorizationManager } = await import(
        "@/libs/auth/AuthorizationManager"
      );
      await AuthorizationManager.requirePermission(
        resource,
        permission,
        resourceOwnerId
      );
      await next();
    };
  },

  /**
   * Request validation middleware
   */
  validateBody: (schema: ZodSchema): Middleware => {
    return async (req, context, next) => {
      if (["POST", "PUT", "PATCH"].includes(req.method || "")) {
        try {
          const body = await req.json();
          const validatedBody = schema.parse(body);

          if (!context.validatedData) {
            context.validatedData = {};
          }
          context.validatedData.body = validatedBody;
        } catch (error) {
          throw new Error(`Body validation failed: ${error}`);
        }
      }
      await next();
    };
  },

  /**
   * Query parameters validation middleware
   */
  validateQuery: (schema: ZodSchema): Middleware => {
    return async (req, context, next) => {
      const url = new URL(req.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());

      try {
        const validatedQuery = schema.parse(queryParams);

        if (!context.validatedData) {
          context.validatedData = {};
        }
        context.validatedData.query = validatedQuery;
      } catch (error) {
        throw new Error(`Query validation failed: ${error}`);
      }

      await next();
    };
  },

  /**
   * Route parameters validation middleware
   */
  validateParams: (schema: ZodSchema): Middleware => {
    return async (req, context, next) => {
      try {
        const validatedParams = schema.parse(context.params);

        if (!context.validatedData) {
          context.validatedData = {};
        }
        context.validatedData.params = validatedParams;
      } catch (error) {
        throw new Error(`Params validation failed: ${error}`);
      }

      await next();
    };
  },

  /**
   * CORS middleware
   */
  cors: (
    options: {
      origin?: string | string[];
      methods?: string[];
      credentials?: boolean;
    } = {}
  ): Middleware => {
    return async (req, context, next) => {
      const {
        origin,
        methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials = true,
      } = options;

      // CORS headers are typically handled at the response level
      // This middleware can be used to set CORS-related context
      if (!context.meta) {
        context.meta = {};
      }

      context.meta.corsOptions = { origin, methods, credentials };
      await next();
    };
  },

  /**
   * Rate limiting middleware
   */
  rateLimit: (options: {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: NextRequest) => string;
  }): Middleware => {
    const store = new Map<string, { count: number; resetTime: number }>();

    return async (req, context, next) => {
      const { windowMs, maxRequests, keyGenerator } = options;

      const key = keyGenerator
        ? keyGenerator(req)
        : req.headers.get("x-forwarded-for") ||
          req.headers.get("x-real-ip") ||
          "unknown";

      const now = Date.now();
      const record = store.get(key);

      if (!record || now > record.resetTime) {
        store.set(key, { count: 1, resetTime: now + windowMs });
      } else if (record.count >= maxRequests) {
        throw new Error("Rate limit exceeded");
      } else {
        record.count++;
      }

      await next();
    };
  },

  /**
   * Logging middleware
   */
  logging: (
    options: {
      logLevel?: "info" | "debug" | "warn" | "error";
      includeBody?: boolean;
      includeHeaders?: boolean;
    } = {}
  ): Middleware => {
    return async (req, context, next) => {
      const {
        logLevel = "info",
        includeBody = false,
        includeHeaders = false,
      } = options;
      const startTime = Date.now();

      const logData: any = {
        method: req.method,
        url: req.url,
        userAgent: req.headers.get("user-agent"),
        ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        userId: context.user?.id,
        timestamp: new Date().toISOString(),
      };

      if (includeHeaders) {
        const headersArray: Array<[string, string]> = [];
        req.headers.forEach((value, key) => {
          headersArray.push([key, value]);
        });
        logData.headers = Object.fromEntries(headersArray);
      }

      if (includeBody && ["POST", "PUT", "PATCH"].includes(req.method || "")) {
        try {
          const body = await req.clone().json();
          logData.body = body;
        } catch {
          // Ignore if body is not JSON
        }
      }

      // Request logged

      try {
        await next();
        const duration = Date.now() - startTime;
        // Request completed
      } catch (error) {
        const duration = Date.now() - startTime;
        // Request failed
        throw error;
      }
    };
  },

  /**
   * Cache middleware (simple in-memory cache)
   */
  cache: (options: {
    ttl: number; // Time to live in milliseconds
    keyGenerator?: (req: NextRequest, context: ApiContext) => string;
    shouldCache?: (req: NextRequest, context: ApiContext) => boolean;
  }): Middleware => {
    const cache = new Map<string, { data: any; expires: number }>();

    return async (req, context, next) => {
      // Only cache GET requests by default
      if (req.method !== "GET") {
        await next();
        return;
      }

      const { ttl, keyGenerator, shouldCache } = options;

      if (shouldCache && !shouldCache(req, context)) {
        await next();
        return;
      }

      const key = keyGenerator
        ? keyGenerator(req, context)
        : `${req.method}:${req.url}:${context.user?.id || "anonymous"}`;

      const now = Date.now();
      const cached = cache.get(key);

      if (cached && now < cached.expires) {
        // Set cached data in context
        if (!context.meta) {
          context.meta = {};
        }
        context.meta.cachedData = cached.data;
        context.meta.fromCache = true;
        return;
      }

      await next();

      // Cache the result if available
      if (context.meta?.responseData) {
        cache.set(key, {
          data: context.meta.responseData,
          expires: now + ttl,
        });
      }
    };
  },
} as const;

/**
 * Helper functions for creating common middleware combinations
 */
export const MiddlewarePresets = {
  /**
   * Standard authenticated API middleware
   */
  authenticated: () =>
    new MiddlewareComposer()
      .use(Middlewares.requireAuth())
      .use(Middlewares.logging()),

  /**
   * Admin-only middleware
   */
  adminOnly: () =>
    new MiddlewareComposer()
      .use(Middlewares.requireAuth())
      .use(Middlewares.requireRole(["admin"]))
      .use(Middlewares.logging()),

  /**
   * Public API with rate limiting
   */
  publicWithRateLimit: (windowMs = 60000, maxRequests = 100) =>
    new MiddlewareComposer()
      .use(Middlewares.rateLimit({ windowMs, maxRequests }))
      .use(Middlewares.logging()),

  /**
   * CRUD operation middleware
   */
  crud: (resource: Resource) => ({
    create: new MiddlewareComposer()
      .use(Middlewares.requireAuth())
      .use(Middlewares.requirePermission(resource, "create"))
      .use(Middlewares.logging()),

    read: new MiddlewareComposer()
      .use(Middlewares.requireAuth())
      .use(Middlewares.requirePermission(resource, "read"))
      .use(Middlewares.cache({ ttl: 5 * 60 * 1000 })) // 5 minutes cache
      .use(Middlewares.logging()),

    update: new MiddlewareComposer()
      .use(Middlewares.requireAuth())
      .use(Middlewares.requirePermission(resource, "update"))
      .use(Middlewares.logging()),

    delete: new MiddlewareComposer()
      .use(Middlewares.requireAuth())
      .use(Middlewares.requirePermission(resource, "delete"))
      .use(Middlewares.logging()),
  }),
} as const;

/**
 * Utility for applying middleware to API handlers
 */
export const withMiddleware = (
  handler: (req: NextRequest, context: ApiContext) => Promise<any>,
  ...middlewares: Middleware[]
) => {
  return async (
    req: NextRequest,
    routeContext?: { params: Record<string, string> }
  ) => {
    const context: ApiContext = {
      params: routeContext?.params || {},
    };

    const composer = new MiddlewareComposer();
    middlewares.forEach((middleware) => composer.use(middleware));

    try {
      await composer.execute(req, context);
      return await handler(req, context);
    } catch (error) {
      // Middleware execution failed
      throw error;
    }
  };
};
