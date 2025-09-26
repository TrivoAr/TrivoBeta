// API Handler presets with AuthorizationManager integration

import {
  createApiHandler,
  ApiHandlerConfig,
  UserRole,
  Resource,
  Permission,
  ApiContext,
} from "./ApiHandler.standalone";
import { NextRequest } from "next/server";

/**
 * Create auth handler that uses AuthorizationManager
 */
const createAuthHandler = () => {
  return async () => {
    // Dynamic import to avoid circular dependencies
    const { AuthorizationManager } = await import(
      "@/libs/auth/AuthorizationManager"
    );
    return await AuthorizationManager.requireAuth();
  };
};

/**
 * Create authorize handler that uses AuthorizationManager
 */
const createAuthorizeHandler = () => {
  return async (
    user: NonNullable<ApiContext["user"]>,
    resource: Resource,
    permission: Permission,
    resourceOwnerId?: string
  ): Promise<boolean> => {
    try {
      // Dynamic import to avoid circular dependencies
      const { AuthorizationManager } = await import(
        "@/libs/auth/AuthorizationManager"
      );

      const context = {
        user,
        resource,
        permission,
        resourceOwnerId,
      };

      return AuthorizationManager.authorize(context);
    } catch {
      return false;
    }
  };
};

/**
 * Pre-configured handlers for common scenarios
 */
export const ApiHandlerPresets = {
  /**
   * Public API handler (no authentication required)
   */
  public: (
    config: Omit<
      ApiHandlerConfig,
      "requireAuth" | "authHandler" | "authorizeHandler"
    > = {}
  ) =>
    createApiHandler({
      ...config,
      requireAuth: false,
    }),

  /**
   * Authenticated API handler (requires login)
   */
  authenticated: (
    config: Omit<
      ApiHandlerConfig,
      "requireAuth" | "authHandler" | "authorizeHandler"
    > = {}
  ) =>
    createApiHandler({
      ...config,
      requireAuth: true,
      authHandler: createAuthHandler(),
      authorizeHandler: createAuthorizeHandler(),
    }),

  /**
   * Admin-only API handler
   */
  adminOnly: (
    config: Omit<
      ApiHandlerConfig,
      "requireAuth" | "requiredRoles" | "authHandler" | "authorizeHandler"
    > = {}
  ) =>
    createApiHandler({
      ...config,
      requireAuth: true,
      requiredRoles: ["admin"],
      authHandler: createAuthHandler(),
      authorizeHandler: createAuthorizeHandler(),
    }),

  /**
   * Trainer or admin API handler
   */
  trainerOrAdmin: (
    config: Omit<
      ApiHandlerConfig,
      "requireAuth" | "requiredRoles" | "authHandler" | "authorizeHandler"
    > = {}
  ) =>
    createApiHandler({
      ...config,
      requireAuth: true,
      requiredRoles: ["admin", "trainer"],
      authHandler: createAuthHandler(),
      authorizeHandler: createAuthorizeHandler(),
    }),

  /**
   * Resource owner or admin API handler
   */
  ownerOrAdmin: (
    resource: Resource,
    permission: Permission,
    getResourceOwnerId: (
      req: NextRequest,
      context: ApiContext
    ) => Promise<string | undefined>,
    config: Omit<
      ApiHandlerConfig,
      "requireAuth" | "requiredPermission" | "authHandler" | "authorizeHandler"
    > = {}
  ) =>
    createApiHandler({
      ...config,
      requireAuth: true,
      requiredPermission: {
        resource,
        permission,
        getResourceOwnerId,
      },
      authHandler: createAuthHandler(),
      authorizeHandler: createAuthorizeHandler(),
    }),
} as const;
