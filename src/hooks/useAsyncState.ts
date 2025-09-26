"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseAsyncStateOptions<T> {
  /**
   * Initial data value
   */
  initialData?: T | null;
  /**
   * Initial loading state
   * @default false
   */
  initialLoading?: boolean;
  /**
   * Callback when data changes successfully
   */
  onSuccess?: (data: T) => void;
  /**
   * Callback when an error occurs
   */
  onError?: (error: string) => void;
  /**
   * Whether to reset error when starting new request
   * @default true
   */
  resetErrorOnRequest?: boolean;
  /**
   * Whether to keep data when loading new data
   * @default false
   */
  keepDataOnReload?: boolean;
}

export interface UseAsyncStateReturn<T> {
  /**
   * Current data
   */
  data: T | null;
  /**
   * Loading state
   */
  loading: boolean;
  /**
   * Error message if any
   */
  error: string | null;
  /**
   * Execute an async operation
   */
  execute: (asyncFn: () => Promise<T>) => Promise<T | null>;
  /**
   * Set data manually
   */
  setData: (data: T | null) => void;
  /**
   * Set loading state manually
   */
  setLoading: (loading: boolean) => void;
  /**
   * Set error manually
   */
  setError: (error: string | null) => void;
  /**
   * Reset all state to initial values
   */
  reset: () => void;
  /**
   * Clear error only
   */
  clearError: () => void;
  /**
   * Whether there's data available
   */
  hasData: boolean;
  /**
   * Whether in error state
   */
  hasError: boolean;
}

/**
 * Custom hook for managing async operations state
 * Provides standardized loading, error, and data states with helpful utilities
 *
 * @example
 * ```tsx
 * const {
 *   data: users,
 *   loading,
 *   error,
 *   execute,
 *   reset
 * } = useAsyncState<User[]>({
 *   onSuccess: (users) => console.log('Loaded users:', users.length),
 *   onError: (error) => toast.error(error)
 * });
 *
 * const fetchUsers = async () => {
 *   await execute(async () => {
 *     const response = await fetch('/api/users');
 *     if (!response.ok) throw new Error('Failed to fetch users');
 *     return response.json();
 *   });
 * };
 * ```
 */
export function useAsyncState<T>(
  options: UseAsyncStateOptions<T> = {}
): UseAsyncStateReturn<T> {
  const {
    initialData = null,
    initialLoading = false,
    onSuccess,
    onError,
    resetErrorOnRequest = true,
    keepDataOnReload = false,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: initialLoading,
    error: null,
  });

  // Use ref to prevent infinite loops in useCallback dependencies
  const optionsRef = useRef({ onSuccess, onError });
  useEffect(() => {
    optionsRef.current = { onSuccess, onError };
  });

  // Track if component is mounted to prevent state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Safe state update that checks if component is still mounted
   */
  const safeSetState = useCallback((newState: Partial<AsyncState<T>>) => {
    if (mountedRef.current) {
      setState((prevState) => ({ ...prevState, ...newState }));
    }
  }, []);

  /**
   * Execute an async operation with proper state management
   */
  const execute = useCallback(
    async (asyncFn: () => Promise<T>): Promise<T | null> => {
      try {
        // Reset error if requested and set loading
        safeSetState({
          loading: true,
          error: resetErrorOnRequest ? null : state.error,
          data: keepDataOnReload ? state.data : null,
        });

        const result = await asyncFn();

        if (mountedRef.current) {
          safeSetState({
            data: result,
            loading: false,
            error: null,
          });

          // Call success callback
          optionsRef.current.onSuccess?.(result);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";

        if (mountedRef.current) {
          safeSetState({
            loading: false,
            error: errorMessage,
            data: keepDataOnReload ? state.data : null,
          });

          // Call error callback
          optionsRef.current.onError?.(errorMessage);
        }

        return null;
      }
    },
    [
      resetErrorOnRequest,
      keepDataOnReload,
      state.error,
      state.data,
      safeSetState,
    ]
  );

  /**
   * Set data manually
   */
  const setData = useCallback(
    (data: T | null) => {
      safeSetState({ data });
    },
    [safeSetState]
  );

  /**
   * Set loading state manually
   */
  const setLoading = useCallback(
    (loading: boolean) => {
      safeSetState({ loading });
    },
    [safeSetState]
  );

  /**
   * Set error manually
   */
  const setError = useCallback(
    (error: string | null) => {
      safeSetState({ error });
    },
    [safeSetState]
  );

  /**
   * Reset all state to initial values
   */
  const reset = useCallback(() => {
    safeSetState({
      data: initialData,
      loading: initialLoading,
      error: null,
    });
  }, [initialData, initialLoading, safeSetState]);

  /**
   * Clear error only
   */
  const clearError = useCallback(() => {
    safeSetState({ error: null });
  }, [safeSetState]);

  // Computed values
  const hasData = state.data !== null;
  const hasError = state.error !== null;

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    setData,
    setLoading,
    setError,
    reset,
    clearError,
    hasData,
    hasError,
  };
}

/**
 * Hook for managing list data with async operations
 * Extends useAsyncState with list-specific utilities
 */
export function useAsyncList<T>(
  options: UseAsyncStateOptions<T[]> = {}
): UseAsyncStateReturn<T[]> & {
  addItem: (item: T) => void;
  removeItem: (predicate: (item: T) => boolean) => void;
  updateItem: (
    predicate: (item: T) => boolean,
    updater: (item: T) => T
  ) => void;
  isEmpty: boolean;
  itemCount: number;
} {
  const asyncState = useAsyncState<T[]>({
    initialData: [],
    ...options,
  });

  /**
   * Add item to the list
   */
  const addItem = useCallback(
    (item: T) => {
      const currentData = asyncState.data || [];
      asyncState.setData([...currentData, item]);
    },
    [asyncState]
  );

  /**
   * Remove item from the list
   */
  const removeItem = useCallback(
    (predicate: (item: T) => boolean) => {
      const currentData = asyncState.data || [];
      const filteredData = currentData.filter((item) => !predicate(item));
      asyncState.setData(filteredData);
    },
    [asyncState]
  );

  /**
   * Update item in the list
   */
  const updateItem = useCallback(
    (predicate: (item: T) => boolean, updater: (item: T) => T) => {
      const currentData = asyncState.data || [];
      const updatedData = currentData.map((item) =>
        predicate(item) ? updater(item) : item
      );
      asyncState.setData(updatedData);
    },
    [asyncState]
  );

  const isEmpty = !asyncState.data || asyncState.data.length === 0;
  const itemCount = asyncState.data?.length || 0;

  return {
    ...asyncState,
    addItem,
    removeItem,
    updateItem,
    isEmpty,
    itemCount,
  };
}

/**
 * Hook for managing pagination with async state
 */
export function useAsyncPagination<T>(
  options: UseAsyncStateOptions<T[]> & {
    itemsPerPage?: number;
    initialPage?: number;
  } = {}
) {
  const { itemsPerPage = 10, initialPage = 1, ...asyncOptions } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);

  const asyncState = useAsyncList<T>({
    ...asyncOptions,
    initialData: [],
  });

  /**
   * Load page data
   */
  const loadPage = useCallback(
    async (
      fetchFn: (
        page: number,
        limit: number
      ) => Promise<{ items: T[]; hasMore: boolean }>,
      page: number = currentPage,
      append = false
    ) => {
      const result = await asyncState.execute(async () => {
        const { items, hasMore: moreAvailable } = await fetchFn(
          page,
          itemsPerPage
        );
        setHasMore(moreAvailable);

        if (append && asyncState.data) {
          return [...asyncState.data, ...items];
        }
        return items;
      });

      if (result && !append) {
        setCurrentPage(page);
      }

      return result;
    },
    [asyncState, currentPage, itemsPerPage]
  );

  /**
   * Load next page and append to current data
   */
  const loadMore = useCallback(
    async (
      fetchFn: (
        page: number,
        limit: number
      ) => Promise<{ items: T[]; hasMore: boolean }>
    ) => {
      if (!hasMore || asyncState.loading) return null;

      return loadPage(fetchFn, currentPage + 1, true);
    },
    [loadPage, currentPage, hasMore, asyncState.loading]
  );

  /**
   * Reset pagination and load first page
   */
  const resetAndLoad = useCallback(
    async (
      fetchFn: (
        page: number,
        limit: number
      ) => Promise<{ items: T[]; hasMore: boolean }>
    ) => {
      setCurrentPage(initialPage);
      setHasMore(true);
      return loadPage(fetchFn, initialPage, false);
    },
    [loadPage, initialPage]
  );

  return {
    ...asyncState,
    currentPage,
    hasMore,
    itemsPerPage,
    loadPage,
    loadMore,
    resetAndLoad,
    setCurrentPage,
  };
}
