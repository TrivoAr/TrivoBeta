'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Global application state interface
 */
export interface AppState {
  // User state
  user: {
    id?: string;
    rol?: 'admin' | 'profe' | 'dueño de academia' | 'alumno';
    email?: string;
    firstname?: string;
    lastname?: string;
    imagen?: string;
    preferences: {
      theme: 'light' | 'dark';
      language: 'es' | 'en';
      notifications: boolean;
    };
  };

  // UI state
  ui: {
    sidebarOpen: boolean;
    loading: boolean;
    notifications: Array<{
      id: string;
      type: 'success' | 'error' | 'warning' | 'info';
      message: string;
      timestamp: number;
    }>;
    modals: {
      login: boolean;
      profile: boolean;
      settings: boolean;
    };
  };

  // Data state
  data: {
    favoritos: {
      salidas: string[];
      academias: string[];
      teamSocial: string[];
    };
    cache: Map<string, {
      data: any;
      timestamp: number;
      ttl: number;
    }>;
    lastUpdated: number;
  };

  // Connection state
  connection: {
    online: boolean;
    syncing: boolean;
    lastSync: number;
  };
}

/**
 * Application actions
 */
export type AppAction =
  // User actions
  | { type: 'SET_USER'; payload: Partial<AppState['user']> }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<AppState['user']['preferences']> }
  | { type: 'LOGOUT' }

  // UI actions
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<AppState['ui']['notifications'][0], 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'TOGGLE_MODAL'; payload: { modal: keyof AppState['ui']['modals']; open?: boolean } }

  // Data actions
  | { type: 'ADD_FAVORITE'; payload: { type: keyof AppState['data']['favoritos']; id: string } }
  | { type: 'REMOVE_FAVORITE'; payload: { type: keyof AppState['data']['favoritos']; id: string } }
  | { type: 'SET_FAVORITES'; payload: { type: keyof AppState['data']['favoritos']; ids: string[] } }
  | { type: 'SET_CACHE'; payload: { key: string; data: any; ttl?: number } }
  | { type: 'CLEAR_CACHE'; payload?: string }
  | { type: 'UPDATE_DATA_TIMESTAMP' }

  // Connection actions
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SET_SYNCING'; payload: boolean }
  | { type: 'UPDATE_SYNC_TIMESTAMP' };

/**
 * Initial application state
 */
const initialState: AppState = {
  user: {
    preferences: {
      theme: 'light',
      language: 'es',
      notifications: true
    }
  },
  ui: {
    sidebarOpen: false,
    loading: false,
    notifications: [],
    modals: {
      login: false,
      profile: false,
      settings: false
    }
  },
  data: {
    favoritos: {
      salidas: [],
      academias: [],
      teamSocial: []
    },
    cache: new Map(),
    lastUpdated: Date.now()
  },
  connection: {
    online: true,
    syncing: false,
    lastSync: Date.now()
  }
};

/**
 * Application state reducer
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // User actions
    case 'SET_USER':
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload
        }
      };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            ...action.payload
          }
        }
      };

    case 'LOGOUT':
      return {
        ...state,
        user: {
          preferences: state.user.preferences // Keep preferences
        },
        data: {
          ...state.data,
          favoritos: {
            salidas: [],
            academias: [],
            teamSocial: []
          }
        }
      };

    // UI actions
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarOpen: !state.ui.sidebarOpen
        }
      };

    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: action.payload
        }
      };

    case 'ADD_NOTIFICATION':
      const newNotification = {
        ...action.payload,
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [...state.ui.notifications, newNotification]
        }
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(n => n.id !== action.payload)
        }
      };

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: []
        }
      };

    case 'TOGGLE_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modals: {
            ...state.ui.modals,
            [action.payload.modal]: action.payload.open ?? !state.ui.modals[action.payload.modal]
          }
        }
      };

    // Data actions
    case 'ADD_FAVORITE':
      const currentFavoritos = state.data.favoritos[action.payload.type];
      if (currentFavoritos.includes(action.payload.id)) {
        return state; // Already favorite
      }
      return {
        ...state,
        data: {
          ...state.data,
          favoritos: {
            ...state.data.favoritos,
            [action.payload.type]: [...currentFavoritos, action.payload.id]
          },
          lastUpdated: Date.now()
        }
      };

    case 'REMOVE_FAVORITE':
      return {
        ...state,
        data: {
          ...state.data,
          favoritos: {
            ...state.data.favoritos,
            [action.payload.type]: state.data.favoritos[action.payload.type].filter(id => id !== action.payload.id)
          },
          lastUpdated: Date.now()
        }
      };

    case 'SET_FAVORITES':
      return {
        ...state,
        data: {
          ...state.data,
          favoritos: {
            ...state.data.favoritos,
            [action.payload.type]: action.payload.ids
          },
          lastUpdated: Date.now()
        }
      };

    case 'SET_CACHE':
      const newCache = new Map(state.data.cache);
      newCache.set(action.payload.key, {
        data: action.payload.data,
        timestamp: Date.now(),
        ttl: action.payload.ttl || 5 * 60 * 1000 // Default 5 minutes
      });
      return {
        ...state,
        data: {
          ...state.data,
          cache: newCache
        }
      };

    case 'CLEAR_CACHE':
      if (action.payload) {
        const clearedCache = new Map(state.data.cache);
        clearedCache.delete(action.payload);
        return {
          ...state,
          data: {
            ...state.data,
            cache: clearedCache
          }
        };
      }
      return {
        ...state,
        data: {
          ...state.data,
          cache: new Map()
        }
      };

    case 'UPDATE_DATA_TIMESTAMP':
      return {
        ...state,
        data: {
          ...state.data,
          lastUpdated: Date.now()
        }
      };

    // Connection actions
    case 'SET_ONLINE':
      return {
        ...state,
        connection: {
          ...state.connection,
          online: action.payload
        }
      };

    case 'SET_SYNCING':
      return {
        ...state,
        connection: {
          ...state.connection,
          syncing: action.payload
        }
      };

    case 'UPDATE_SYNC_TIMESTAMP':
      return {
        ...state,
        connection: {
          ...state.connection,
          lastSync: Date.now()
        }
      };

    default:
      return state;
  }
}

/**
 * Context interface
 */
export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;

  // Computed values
  isAuthenticated: boolean;
  isAdmin: boolean;
  isProfe: boolean;
  favoritoCount: number;

  // Action creators
  actions: {
    // User actions
    setUser: (user: Partial<AppState['user']>) => void;
    updatePreferences: (preferences: Partial<AppState['user']['preferences']>) => void;
    logout: () => void;

    // UI actions
    toggleSidebar: () => void;
    setLoading: (loading: boolean) => void;
    showNotification: (notification: Omit<AppState['ui']['notifications'][0], 'id' | 'timestamp'>) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
    toggleModal: (modal: keyof AppState['ui']['modals'], open?: boolean) => void;

    // Data actions
    addFavorito: (type: keyof AppState['data']['favoritos'], id: string) => void;
    removeFavorito: (type: keyof AppState['data']['favoritos'], id: string) => void;
    setFavoritos: (type: keyof AppState['data']['favoritos'], ids: string[]) => void;
    setCache: (key: string, data: any, ttl?: number) => void;
    getCache: (key: string) => any | null;
    clearCache: (key?: string) => void;

    // Connection actions
    setOnline: (online: boolean) => void;
    setSyncing: (syncing: boolean) => void;
    updateSyncTimestamp: () => void;
  };
}

/**
 * Application Context
 */
const AppContext = createContext<AppContextValue | null>(null);

/**
 * Application Context Provider
 */
export interface AppProviderProps {
  children: ReactNode;
  initialState?: Partial<AppState>;
}

export function AppProvider({ children, initialState: customInitialState }: AppProviderProps) {
  // Merge custom initial state
  const mergedInitialState = useMemo(() => ({
    ...initialState,
    ...customInitialState
  }), [customInitialState]);

  const [state, dispatch] = useReducer(appReducer, mergedInitialState);
  const { data: session } = useSession();

  // Sync session with app state
  React.useEffect(() => {
    if (session?.user) {
      dispatch({
        type: 'SET_USER',
        payload: {
          id: session.user.id,
          rol: session.user.rol as any,
          email: session.user.email || undefined,
          firstname: session.user.firstname || undefined,
          lastname: session.user.lastname || undefined,
          imagen: session.user.imagen || undefined
        }
      });
    } else {
      dispatch({ type: 'LOGOUT' });
    }
  }, [session]);

  // Monitor online status
  React.useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE', payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Computed values
  const isAuthenticated = useMemo(() => Boolean(state.user.id), [state.user.id]);
  const isAdmin = useMemo(() => state.user.rol === 'admin', [state.user.rol]);
  const isProfe = useMemo(() => ['admin', 'profe', 'dueño de academia'].includes(state.user.rol || ''), [state.user.rol]);
  const favoritoCount = useMemo(() =>
    Object.values(state.data.favoritos).reduce((sum, arr) => sum + arr.length, 0),
    [state.data.favoritos]
  );

  // Action creators
  const actions = useMemo(() => ({
    // User actions
    setUser: (user: Partial<AppState['user']>) =>
      dispatch({ type: 'SET_USER', payload: user }),
    updatePreferences: (preferences: Partial<AppState['user']['preferences']>) =>
      dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences }),
    logout: () => dispatch({ type: 'LOGOUT' }),

    // UI actions
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    setLoading: (loading: boolean) =>
      dispatch({ type: 'SET_LOADING', payload: loading }),
    showNotification: (notification: Omit<AppState['ui']['notifications'][0], 'id' | 'timestamp'>) =>
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
    removeNotification: (id: string) =>
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }),
    clearNotifications: () => dispatch({ type: 'CLEAR_NOTIFICATIONS' }),
    toggleModal: (modal: keyof AppState['ui']['modals'], open?: boolean) =>
      dispatch({ type: 'TOGGLE_MODAL', payload: { modal, open } }),

    // Data actions
    addFavorito: (type: keyof AppState['data']['favoritos'], id: string) =>
      dispatch({ type: 'ADD_FAVORITE', payload: { type, id } }),
    removeFavorito: (type: keyof AppState['data']['favoritos'], id: string) =>
      dispatch({ type: 'REMOVE_FAVORITE', payload: { type, id } }),
    setFavoritos: (type: keyof AppState['data']['favoritos'], ids: string[]) =>
      dispatch({ type: 'SET_FAVORITES', payload: { type, ids } }),
    setCache: (key: string, data: any, ttl?: number) =>
      dispatch({ type: 'SET_CACHE', payload: { key, data, ttl } }),
    getCache: (key: string) => {
      const cached = state.data.cache.get(key);
      if (!cached) return null;

      const now = Date.now();
      if (now - cached.timestamp > cached.ttl) {
        // Expired, remove from cache
        dispatch({ type: 'CLEAR_CACHE', payload: key });
        return null;
      }

      return cached.data;
    },
    clearCache: (key?: string) =>
      dispatch({ type: 'CLEAR_CACHE', payload: key }),

    // Connection actions
    setOnline: (online: boolean) =>
      dispatch({ type: 'SET_ONLINE', payload: online }),
    setSyncing: (syncing: boolean) =>
      dispatch({ type: 'SET_SYNCING', payload: syncing }),
    updateSyncTimestamp: () =>
      dispatch({ type: 'UPDATE_SYNC_TIMESTAMP' })
  }), [state.data.cache]);

  // Context value
  const value = useMemo(() => ({
    state,
    dispatch,
    isAuthenticated,
    isAdmin,
    isProfe,
    favoritoCount,
    actions
  }), [state, isAuthenticated, isAdmin, isProfe, favoritoCount, actions]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to use Application Context
 */
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

/**
 * Hook to use specific parts of Application State
 */
export function useAppState<T>(selector: (state: AppState) => T): T {
  const { state } = useAppContext();
  return useMemo(() => selector(state), [state, selector]);
}

/**
 * Hook to use Application Actions
 */
export function useAppActions() {
  const { actions } = useAppContext();
  return actions;
}