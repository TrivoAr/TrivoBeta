"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

export interface Member {
  _id: string;
  firstname: string;
  lastname: string;
  imagen: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  pago_id?: {
    comprobanteUrl: string;
    estado: "pendiente" | "aprobado" | "rechazado";
    salidaId: string;
    userId: string;
    _id: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface UseMembersOptions {
  /**
   * Filter to only show approved members
   * @default true
   */
  onlyApproved?: boolean;
  /**
   * Auto-refresh interval in milliseconds
   * @default null (no auto-refresh)
   */
  refreshInterval?: number;
  /**
   * Custom error handler
   */
  onError?: (error: string) => void;
  /**
   * Custom success handler for member updates
   */
  onMemberUpdate?: (members: Member[]) => void;
}

export interface UseMembersReturn {
  members: Member[];
  allMembers: Member[];
  approvedMembers: Member[];
  pendingMembers: Member[];
  isLoading: boolean;
  error: string | null;
  memberCount: number;
  availableSpots: (totalSpots: number) => number;
  refetch: () => Promise<void>;
  refreshMembers: () => Promise<void>;
}

/**
 * Custom hook for managing event members
 * Handles fetching, filtering, and real-time updates of event participants
 *
 * @param eventId - ID of the event
 * @param eventType - Type of event: 'social' | 'team-social'
 * @param options - Additional options for customization
 *
 * @example
 * ```tsx
 * const {
 *   members,
 *   isLoading,
 *   memberCount,
 *   availableSpots,
 *   refetch
 * } = useMembers(eventId, 'social', {
 *   onlyApproved: true,
 *   refreshInterval: 30000, // 30 seconds
 *   onError: (error) => console.error('Members error:', error)
 * });
 *
 * const spots = availableSpots(20); // Calculate available spots from total of 20
 * ```
 */
export function useMembers(
  eventId: string,
  eventType: "social" | "team-social",
  options: UseMembersOptions = {}
): UseMembersReturn {
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    onlyApproved = true,
    refreshInterval = null,
    onError,
    onMemberUpdate,
  } = options;

  /**
   * Fetch members from API
   */
  const fetchMembers = useCallback(async (): Promise<Member[]> => {
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    const response = await fetch(`/api/${eventType}/miembros/${eventId}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${text || "Error fetching members"}`
      );
    }

    return response.json();
  }, [eventId, eventType]);

  /**
   * Load members with error handling
   */
  const loadMembers = useCallback(async () => {
    if (!eventId) return;

    try {
      setError(null);
      const data = await fetchMembers();

      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error("Invalid members data format");
      }

      setAllMembers(data);
      onMemberUpdate?.(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los miembros";
      setError(errorMessage);
      onError?.(errorMessage);

      // Only show toast if no custom error handler
      if (!onError) {
        toast.error(errorMessage);
      }

      console.error("[useMembers] Load failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, fetchMembers, onError, onMemberUpdate]);

  /**
   * Refresh members (public method)
   */
  const refetch = useCallback(async () => {
    setIsLoading(true);
    await loadMembers();
  }, [loadMembers]);

  /**
   * Refresh members without showing loading state (for auto-refresh)
   */
  const refreshMembers = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchMembers();
      setAllMembers(data);
      onMemberUpdate?.(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al actualizar miembros";
      setError(errorMessage);
      console.warn("[useMembers] Refresh failed:", err);
    }
  }, [fetchMembers, onMemberUpdate]);

  // Computed values
  const approvedMembers = allMembers.filter(
    (member) =>
      member.estado === "aprobado" || member.pago_id?.estado === "aprobado"
  );

  const pendingMembers = allMembers.filter(
    (member) =>
      member.estado === "pendiente" || member.pago_id?.estado === "pendiente"
  );

  const members = onlyApproved ? approvedMembers : allMembers;
  const memberCount = members.length;

  /**
   * Calculate available spots
   */
  const availableSpots = useCallback(
    (totalSpots: number): number => {
      if (totalSpots <= 0) return 0;
      const available = totalSpots - memberCount;
      return Math.max(0, available);
    },
    [memberCount]
  );

  // Initial load
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Auto-refresh setup
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const interval = setInterval(refreshMembers, refreshInterval);

    return () => {
      clearInterval(interval);
    };
  }, [refreshInterval, refreshMembers]);

  // Reset state when eventId changes
  useEffect(() => {
    if (eventId) {
      setAllMembers([]);
      setError(null);
      setIsLoading(true);
    }
  }, [eventId]);

  return {
    members,
    allMembers,
    approvedMembers,
    pendingMembers,
    isLoading,
    error,
    memberCount,
    availableSpots,
    refetch,
    refreshMembers,
  };
}

/**
 * Hook for managing member status updates
 * Useful for admin/organizer views where member approval is needed
 */
export function useMemberManagement(
  eventId: string,
  eventType: "social" | "team-social"
) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  /**
   * Update member status
   */
  const updateMemberStatus = useCallback(
    async (
      memberId: string,
      newStatus: "aprobado" | "rechazado"
    ): Promise<boolean> => {
      if (!eventId || !memberId) {
        toast.error("IDs de evento y miembro son requeridos");
        return false;
      }

      setIsUpdating(memberId);

      try {
        const response = await fetch(
          `/api/${eventType}/miembros/${eventId}/${memberId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ estado: newStatus }),
          }
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `HTTP ${response.status}: ${text || "Error updating member"}`
          );
        }

        const statusText = newStatus === "aprobado" ? "aprobado" : "rechazado";
        toast.success(`Miembro ${statusText} correctamente`);

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al actualizar miembro";
        toast.error(errorMessage);
        console.error("[useMemberManagement] Update failed:", err);
        return false;
      } finally {
        setIsUpdating(null);
      }
    },
    [eventId, eventType]
  );

  /**
   * Bulk update multiple members
   */
  const bulkUpdateMembers = useCallback(
    async (
      memberIds: string[],
      newStatus: "aprobado" | "rechazado"
    ): Promise<{ success: string[]; failed: string[] }> => {
      const results = { success: [] as string[], failed: [] as string[] };

      setIsUpdating("bulk");

      try {
        const promises = memberIds.map(async (memberId) => {
          try {
            const success = await updateMemberStatus(memberId, newStatus);
            if (success) {
              results.success.push(memberId);
            } else {
              results.failed.push(memberId);
            }
          } catch (err) {
            results.failed.push(memberId);
          }
        });

        await Promise.all(promises);

        const statusText =
          newStatus === "aprobado" ? "aprobados" : "rechazados";
        if (results.success.length > 0) {
          toast.success(`${results.success.length} miembros ${statusText}`);
        }
        if (results.failed.length > 0) {
          toast.error(
            `${results.failed.length} miembros no pudieron ser actualizados`
          );
        }
      } catch (err) {
        toast.error("Error en actualización masiva");
        console.error("[useMemberManagement] Bulk update failed:", err);
      } finally {
        setIsUpdating(null);
      }

      return results;
    },
    [updateMemberStatus]
  );

  return {
    updateMemberStatus,
    bulkUpdateMembers,
    isUpdating,
  };
}

/**
 * Hook for member statistics
 * Provides analytics and insights about event participation
 */
export function useMemberStats(members: Member[]) {
  const stats = {
    total: members.length,
    approved: members.filter(
      (m) => m.estado === "aprobado" || m.pago_id?.estado === "aprobado"
    ).length,
    pending: members.filter(
      (m) => m.estado === "pendiente" || m.pago_id?.estado === "pendiente"
    ).length,
    rejected: members.filter(
      (m) => m.estado === "rechazado" || m.pago_id?.estado === "rechazado"
    ).length,
    withPayment: members.filter((m) => m.pago_id).length,
    approvalRate: 0,
    completionRate: 0,
  };

  // Calculate rates
  if (stats.total > 0) {
    stats.approvalRate = (stats.approved / stats.total) * 100;
    stats.completionRate =
      ((stats.approved + stats.rejected) / stats.total) * 100;
  }

  return stats;
}
