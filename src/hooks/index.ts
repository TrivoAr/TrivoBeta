// Custom hooks exports
export { useFavorites, useMultipleFavorites } from './useFavorites';
export type { UseFavoritesOptions, UseFavoritesReturn } from './useFavorites';

export { useMembers, useMemberManagement, useMemberStats } from './useMembers';
export type { Member, UseMembersOptions, UseMembersReturn } from './useMembers';

export { useAsyncState, useAsyncList, useAsyncPagination } from './useAsyncState';
export type { AsyncState, UseAsyncStateOptions, UseAsyncStateReturn } from './useAsyncState';

export { useForm } from './useForm';
export type { FormState, UseFormOptions, FormHelpers, FieldProps } from './useForm';

// Hook utilities and patterns
// Commented out due to TypeScript compilation issues
// export const HookPatterns = {
//   /**
//    * Data fetching pattern
//    */
//   DataFetching: {
//     useAsyncState,
//     useAsyncList,
//     useAsyncPagination
//   },

//   /**
//    * Form management pattern
//    */
//   Forms: {
//     useForm
//   },

//   /**
//    * User interaction pattern
//    */
//   UserInteraction: {
//     useFavorites,
//     useMultipleFavorites
//   },

//   /**
//    * Content management pattern
//    */
//   ContentManagement: {
//     useMembers,
//     useMemberManagement,
//     useMemberStats
//   }
// } as const;

// Common hook configurations
export const HookConfigurations = {
  /**
   * Standard favorites configuration
   */
  favorites: (itemType: 'sociales' | 'academias' | 'teamsocial', itemId: string) => ({
    itemType,
    itemId,
    showLoginModal: undefined, // To be provided by component
    onFavoriteChange: undefined // To be provided by component
  }),

  /**
   * Standard members configuration
   */
  members: (eventId: string, eventType: 'social' | 'team-social') => ({
    eventId,
    eventType,
    onlyApproved: true,
    refreshInterval: 30000 // 30 seconds
  }),

  /**
   * Standard async state configuration
   */
  asyncState: <T>() => ({
    initialData: null as T | null,
    resetErrorOnRequest: true,
    keepDataOnReload: false
  }),

  /**
   * Standard form configuration
   */
  form: <T extends Record<string, any>>(initialValues: T) => ({
    initialValues,
    validateOnChange: true,
    validateOnBlur: true,
    validateOnMount: false,
    resetOnSubmit: false
  })
} as const;