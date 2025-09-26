// No directive needed for server-side utilities

import { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/authOptions";

/**
 * User roles in the system
 */
export type UserRole = "admin" | "trainer" | "user" | "alumno";

/**
 * Permission types for different resources
 */
export type Permission =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage"
  | "approve"
  | "export";

/**
 * Resource types in the system
 */
export type Resource =
  | "social-events"
  | "team-events"
  | "academias"
  | "users"
  | "payments"
  | "sponsors"
  | "members";

/**
 * Authorization context for permission checks
 */
export interface AuthContext {
  user: {
    id: string;
    role: UserRole;
    email?: string;
  };
  resource: Resource;
  permission: Permission;
  resourceOwnerId?: string;
  resourceData?: any;
}

/**
 * Custom authorization errors
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHORIZED" | "FORBIDDEN" | "INVALID_SESSION" = "FORBIDDEN"
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Role-based permission matrix
 */
const PERMISSIONS_MATRIX: Record<UserRole, Record<Resource, Permission[]>> = {
  admin: {
    "social-events": [
      "create",
      "read",
      "update",
      "delete",
      "manage",
      "approve",
      "export",
    ],
    "team-events": [
      "create",
      "read",
      "update",
      "delete",
      "manage",
      "approve",
      "export",
    ],
    academias: [
      "create",
      "read",
      "update",
      "delete",
      "manage",
      "approve",
      "export",
    ],
    users: ["create", "read", "update", "delete", "manage"],
    payments: ["read", "update", "approve", "export"],
    sponsors: ["create", "read", "update", "delete", "manage"],
    members: ["read", "update", "delete", "manage", "approve"],
  },
  trainer: {
    "social-events": ["create", "read", "update", "delete"],
    "team-events": ["create", "read", "update", "delete"],
    academias: ["create", "read", "update"],
    users: ["read"],
    payments: ["read", "approve"],
    sponsors: ["read"],
    members: ["read", "update", "approve"],
  },
  user: {
    "social-events": ["read"],
    "team-events": ["read"],
    academias: ["read"],
    users: ["read"],
    payments: ["read"],
    sponsors: ["read"],
    members: ["read"],
  },
  alumno: {
    "social-events": ["read"],
    "team-events": ["read"],
    academias: ["read"],
    users: ["read"],
    payments: ["read"],
    sponsors: ["read"],
    members: ["read"],
  },
};

/**
 * Authorization Manager - Central class for handling permissions
 */
export class AuthorizationManager {
  /**
   * Check if user has permission for a specific resource
   */
  static hasPermission(
    userRole: UserRole,
    resource: Resource,
    permission: Permission
  ): boolean {
    const rolePermissions = PERMISSIONS_MATRIX[userRole]?.[resource] || [];
    return (
      rolePermissions.includes(permission) || rolePermissions.includes("manage")
    );
  }

  /**
   * Check ownership permissions (user can modify their own resources)
   */
  static hasOwnershipPermission(
    userId: string,
    resourceOwnerId: string,
    permission: Permission
  ): boolean {
    if (userId === resourceOwnerId) {
      return ["read", "update", "delete"].includes(permission);
    }
    return false;
  }

  /**
   * Comprehensive authorization check
   */
  static authorize(context: AuthContext): boolean {
    const { user, resource, permission, resourceOwnerId } = context;

    // Check role-based permissions
    const hasRolePermission = this.hasPermission(
      user.role,
      resource,
      permission
    );

    // Check ownership permissions if applicable
    const hasOwnershipPermission = resourceOwnerId
      ? this.hasOwnershipPermission(user.id, resourceOwnerId, permission)
      : false;

    return hasRolePermission || hasOwnershipPermission;
  }

  /**
   * Authorize or throw error
   */
  static authorizeOrThrow(context: AuthContext): void {
    if (!this.authorize(context)) {
      throw new AuthorizationError(
        `User ${context.user.id} does not have permission ${context.permission} for ${context.resource}`,
        "FORBIDDEN"
      );
    }
  }

  /**
   * Get user session and validate
   */
  static async getValidatedSession(): Promise<Session> {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new AuthorizationError("No valid session found", "UNAUTHORIZED");
    }

    return session;
  }

  /**
   * Get user context from session
   */
  static getUserContext(session: Session): AuthContext["user"] {
    if (!session.user?.id) {
      throw new AuthorizationError(
        "Invalid session: missing user data",
        "INVALID_SESSION"
      );
    }

    return {
      id: session.user.id,
      role: (session.user.rol as UserRole) || "user",
      email: session.user.email || undefined,
    };
  }

  /**
   * Middleware helper for route protection
   */
  static async requireAuth(): Promise<{
    session: Session;
    user: AuthContext["user"];
  }> {
    const session = await this.getValidatedSession();
    const user = this.getUserContext(session);

    return { session, user };
  }

  /**
   * Middleware helper for role-based protection
   */
  static async requireRole(
    allowedRoles: UserRole[]
  ): Promise<{ session: Session; user: AuthContext["user"] }> {
    const { session, user } = await this.requireAuth();

    if (!allowedRoles.includes(user.role)) {
      throw new AuthorizationError(
        `Access denied. Required roles: ${allowedRoles.join(", ")}. User role: ${user.role}`,
        "FORBIDDEN"
      );
    }

    return { session, user };
  }

  /**
   * Middleware helper for permission-based protection
   */
  static async requirePermission(
    resource: Resource,
    permission: Permission,
    resourceOwnerId?: string
  ): Promise<{ session: Session; user: AuthContext["user"] }> {
    const { session, user } = await this.requireAuth();

    const context: AuthContext = {
      user,
      resource,
      permission,
      resourceOwnerId,
    };

    this.authorizeOrThrow(context);

    return { session, user };
  }
}

/**
 * Decorator for protecting API routes with authentication
 */
export function RequireAuth<T extends any[], R>(
  target: any,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
) {
  const originalMethod = descriptor.value!;

  descriptor.value = async function (...args: T): Promise<R> {
    try {
      await AuthorizationManager.requireAuth();
      return await originalMethod.apply(this, args);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        throw error;
      }
      throw new AuthorizationError("Authentication failed", "UNAUTHORIZED");
    }
  };

  return descriptor;
}

/**
 * Decorator for protecting API routes with role-based access
 */
export function RequireRole(roles: UserRole[]) {
  return function <T extends any[], R>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: T): Promise<R> {
      try {
        await AuthorizationManager.requireRole(roles);
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (error instanceof AuthorizationError) {
          throw error;
        }
        throw new AuthorizationError("Role authorization failed", "FORBIDDEN");
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for protecting API routes with permission-based access
 */
export function RequirePermission(resource: Resource, permission: Permission) {
  return function <T extends any[], R>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: T): Promise<R> {
      try {
        await AuthorizationManager.requirePermission(resource, permission);
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (error instanceof AuthorizationError) {
          throw error;
        }
        throw new AuthorizationError(
          "Permission authorization failed",
          "FORBIDDEN"
        );
      }
    };

    return descriptor;
  };
}

/**
 * Type guards for better TypeScript support
 */
export const AuthGuards = {
  isAdmin: (role: UserRole): boolean => role === "admin",
  isTrainer: (role: UserRole): boolean => role === "trainer",
  isUser: (role: UserRole): boolean => ["user", "alumno"].includes(role),

  canManageEvents: (role: UserRole): boolean =>
    ["admin", "trainer"].includes(role),

  canApprovePayments: (role: UserRole): boolean =>
    ["admin", "trainer"].includes(role),

  canManageUsers: (role: UserRole): boolean => role === "admin",

  canExportData: (role: UserRole): boolean =>
    ["admin", "trainer"].includes(role),
} as const;

/**
 * Utility functions for common authorization patterns
 */
export const AuthUtils = {
  /**
   * Check if user can access resource based on ownership or role
   */
  canAccessResource: (
    userRole: UserRole,
    userId: string,
    resourceOwnerId: string,
    requiredPermission: Permission = "read"
  ): boolean => {
    return (
      userId === resourceOwnerId ||
      AuthorizationManager.hasPermission(
        userRole,
        "social-events",
        requiredPermission
      )
    );
  },

  /**
   * Get filtered permissions for a user role
   */
  getPermissionsForRole: (role: UserRole, resource: Resource): Permission[] => {
    return PERMISSIONS_MATRIX[role]?.[resource] || [];
  },

  /**
   * Check multiple permissions at once
   */
  hasAnyPermission: (
    userRole: UserRole,
    resource: Resource,
    permissions: Permission[]
  ): boolean => {
    return permissions.some((permission) =>
      AuthorizationManager.hasPermission(userRole, resource, permission)
    );
  },
} as const;
