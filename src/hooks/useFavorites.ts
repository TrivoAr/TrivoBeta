'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import toast from 'react-hot-toast';

export interface UseFavoritesOptions {
  showLoginModal?: () => void;
  onFavoriteChange?: (isFavorite: boolean, itemId: string) => void;
}

export interface UseFavoritesReturn {
  isFavorite: boolean;
  isLoading: boolean;
  error: string | null;
  toggleFavorite: () => Promise<boolean>;
  checkFavorite: () => Promise<void>;
  refreshFavoriteStatus: () => Promise<void>;
}

/**
 * Custom hook for managing favorites functionality
 * Handles authentication, API calls, and state management for any favoritable item
 *
 * @param itemType - Type of item: 'sociales' | 'academias' | 'teamsocial'
 * @param itemId - ID of the item to manage favorites for
 * @param options - Additional options for customization
 *
 * @example
 * ```tsx
 * const { isFavorite, isLoading, toggleFavorite } = useFavorites(
 *   'sociales',
 *   eventId,
 *   {
 *     showLoginModal: () => setShowLogin(true),
 *     onFavoriteChange: (isFav) => console.log('Favorite changed:', isFav)
 *   }
 * );
 * ```
 */
export function useFavorites(
  itemType: 'sociales' | 'academias' | 'teamsocial',
  itemId: string,
  options: UseFavoritesOptions = {}
): UseFavoritesReturn {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useSession();
  const { showLoginModal, onFavoriteChange } = options;

  /**
   * Check if item is in user's favorites
   */
  const checkFavorite = useCallback(async () => {
    if (!session?.user?.id || !itemId) return;

    try {
      setError(null);
      const response = await fetch(`/api/favoritos/${itemType}/${itemId}`, {
        method: 'GET',
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setIsFavorite(data.favorito || false);
      }
    } catch (err) {
      console.warn('[useFavorites] Failed to check favorite status:', err);
      // Silently fail - favorite check is not critical
    }
  }, [session?.user?.id, itemType, itemId]);

  /**
   * Toggle favorite status
   */
  const toggleFavorite = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) {
      const message = "Debes iniciar sesión para agregar a favoritos.";
      toast.error(message);
      setError(message);
      showLoginModal?.();
      return false;
    }

    if (!itemId) {
      const message = "ID de elemento no válido.";
      toast.error(message);
      setError(message);
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`/api/favoritos/${itemType}/${itemId}`);
      const data = response.data;

      const newFavoriteStatus = data.favorito;
      setIsFavorite(newFavoriteStatus);

      // Show success message
      const itemTypeName = getItemTypeName(itemType);
      const message = newFavoriteStatus
        ? `${itemTypeName} agregado a favoritos`
        : `${itemTypeName} eliminado de favoritos`;

      toast.success(message);

      // Notify parent component
      onFavoriteChange?.(newFavoriteStatus, itemId);

      return newFavoriteStatus;
    } catch (err) {
      const message = "Hubo un error al actualizar favoritos.";
      toast.error(message);
      setError(message);
      console.error('[useFavorites] Toggle failed:', err);
      return isFavorite; // Return current state on error
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, itemType, itemId, isFavorite, showLoginModal, onFavoriteChange]);

  /**
   * Refresh favorite status (useful after login or when needed)
   */
  const refreshFavoriteStatus = useCallback(async () => {
    await checkFavorite();
  }, [checkFavorite]);

  // Check favorite status on mount and when dependencies change
  useEffect(() => {
    checkFavorite();
  }, [checkFavorite]);

  // Reset state when session changes
  useEffect(() => {
    if (!session?.user?.id) {
      setIsFavorite(false);
      setError(null);
    }
  }, [session?.user?.id]);

  return {
    isFavorite,
    isLoading,
    error,
    toggleFavorite,
    checkFavorite,
    refreshFavoriteStatus
  };
}

/**
 * Get user-friendly item type name
 */
function getItemTypeName(itemType: string): string {
  const typeNames = {
    'sociales': 'Evento social',
    'academias': 'Academia',
    'teamsocial': 'Evento de equipo'
  };
  return typeNames[itemType as keyof typeof typeNames] || 'Elemento';
}

/**
 * Hook for managing multiple favorites at once
 * Useful for lists or bulk operations
 */
export function useMultipleFavorites(
  itemType: 'sociales' | 'academias' | 'teamsocial',
  itemIds: string[],
  options: UseFavoritesOptions = {}
) {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useSession();

  /**
   * Check favorite status for multiple items
   */
  const checkMultipleFavorites = useCallback(async () => {
    if (!session?.user?.id || itemIds.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const promises = itemIds.map(async (itemId) => {
        try {
          const response = await fetch(`/api/favoritos/${itemType}/${itemId}`);
          if (response.ok) {
            const data = await response.json();
            return { itemId, isFavorite: data.favorito || false };
          }
          return { itemId, isFavorite: false };
        } catch (err) {
          console.warn(`[useMultipleFavorites] Failed to check favorite for ${itemId}:`, err);
          return { itemId, isFavorite: false };
        }
      });

      const results = await Promise.all(promises);
      const favoritesMap = results.reduce((acc, { itemId, isFavorite }) => {
        acc[itemId] = isFavorite;
        return acc;
      }, {} as Record<string, boolean>);

      setFavorites(favoritesMap);
    } catch (err) {
      const message = "Error al verificar favoritos";
      setError(message);
      console.error('[useMultipleFavorites] Check failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, itemType, itemIds]);

  /**
   * Toggle favorite for a specific item
   */
  const toggleFavorite = useCallback(async (itemId: string): Promise<boolean> => {
    if (!session?.user?.id) {
      const message = "Debes iniciar sesión para agregar a favoritos.";
      toast.error(message);
      setError(message);
      options.showLoginModal?.();
      return false;
    }

    try {
      const response = await axios.post(`/api/favoritos/${itemType}/${itemId}`);
      const data = response.data;
      const newFavoriteStatus = data.favorito;

      setFavorites(prev => ({
        ...prev,
        [itemId]: newFavoriteStatus
      }));

      const itemTypeName = getItemTypeName(itemType);
      const message = newFavoriteStatus
        ? `${itemTypeName} agregado a favoritos`
        : `${itemTypeName} eliminado de favoritos`;

      toast.success(message);

      options.onFavoriteChange?.(newFavoriteStatus, itemId);

      return newFavoriteStatus;
    } catch (err) {
      const message = "Error al actualizar favoritos";
      toast.error(message);
      setError(message);
      console.error('[useMultipleFavorites] Toggle failed:', err);
      return favorites[itemId] || false;
    }
  }, [session?.user?.id, itemType, favorites, options]);

  useEffect(() => {
    checkMultipleFavorites();
  }, [checkMultipleFavorites]);

  useEffect(() => {
    if (!session?.user?.id) {
      setFavorites({});
      setError(null);
    }
  }, [session?.user?.id]);

  return {
    favorites,
    isLoading,
    error,
    toggleFavorite,
    refreshFavorites: checkMultipleFavorites,
    isFavorite: (itemId: string) => favorites[itemId] || false
  };
}