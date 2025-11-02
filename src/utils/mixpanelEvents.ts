/**
 * Utilidades para eventos de Mixpanel específicos de Trivo
 * Este archivo centraliza los nombres de eventos y proporciona funciones helper
 * para trackear eventos comunes en la aplicación
 */

import { trackEvent, trackCharge, timeEvent } from '@/libs/mixpanel';
import type { Dict } from 'mixpanel-browser';

// ==================== NOMBRES DE EVENTOS ====================

export const EVENTS = {
  // Autenticación
  AUTH: {
    LOGIN: 'User Login',
    LOGOUT: 'User Logout',
    SIGNUP: 'User Signup',
    GOOGLE_LOGIN: 'Google Login',
    PASSWORD_RESET: 'Password Reset',
  },

  // Salidas Sociales
  SALIDA_SOCIAL: {
    VIEWED: 'Salida Social Viewed',
    CREATED: 'Salida Social Created',
    UPDATED: 'Salida Social Updated',
    DELETED: 'Salida Social Deleted',
    JOINED: 'Salida Social Joined',
    LEFT: 'Salida Social Left',
    SHARED: 'Salida Social Shared',
    FAVORITED: 'Salida Social Favorited',
    UNFAVORITED: 'Salida Social Unfavorited',
  },

  // Team Social
  TEAM_SOCIAL: {
    VIEWED: 'Team Social Viewed',
    CREATED: 'Team Social Created',
    UPDATED: 'Team Social Updated',
    DELETED: 'Team Social Deleted',
    JOINED: 'Team Social Joined',
    LEFT: 'Team Social Left',
    SHARED: 'Team Social Shared',
    FAVORITED: 'Team Social Favorited',
    UNFAVORITED: 'Team Social Unfavorited',
  },

  // Academias
  ACADEMIA: {
    VIEWED: 'Academia Viewed',
    CREATED: 'Academia Created',
    UPDATED: 'Academia Updated',
    DELETED: 'Academia Deleted',
    JOINED: 'Academia Joined',
    LEFT: 'Academia Left',
    FAVORITED: 'Academia Favorited',
    UNFAVORITED: 'Academia Unfavorited',
  },

  // Pagos
  PAYMENTS: {
    INITIATED: 'Payment Initiated',
    COMPLETED: 'Payment Completed',
    FAILED: 'Payment Failed',
    APPROVED: 'Payment Approved',
    REJECTED: 'Payment Rejected',
  },

  // Perfil
  PROFILE: {
    VIEWED: 'Profile Viewed',
    UPDATED: 'Profile Updated',
    IMAGE_UPLOADED: 'Profile Image Uploaded',
  },

  // Strava
  STRAVA: {
    CONNECTED: 'Strava Connected',
    DISCONNECTED: 'Strava Disconnected',
    ROUTE_IMPORTED: 'Strava Route Imported',
    ACTIVITY_SYNCED: 'Strava Activity Synced',
  },

  // Navegación
  NAVIGATION: {
    TAB_CLICKED: 'Tab Clicked',
    MENU_OPENED: 'Menu Opened',
    SEARCH_PERFORMED: 'Search Performed',
  },

  // Sponsors y Bares
  SPONSOR: {
    VIEWED: 'Sponsor Viewed',
    CLICKED: 'Sponsor Clicked',
  },

  BAR: {
    VIEWED: 'Bar Viewed',
    CLICKED: 'Bar Clicked',
  },

  // Descubrimiento y Navegación
  DISCOVERY: {
    FEED_VIEWED: 'Events Feed Viewed',
    FILTERS_APPLIED: 'Filters Applied',
    FILTERS_CLEARED: 'Filters Cleared',
  },

  // Onboarding
  ONBOARDING: {
    STEP_COMPLETED: 'Onboarding Step Completed',
    COMPLETED: 'Onboarding Completed',
    SKIPPED: 'Onboarding Skipped',
  },

  // Errores
  ERROR: {
    OCCURRED: 'Error Occurred',
    FORM_VALIDATION: 'Form Validation Error',
    API_ERROR: 'API Error',
  },

  // Notificaciones
  NOTIFICATION: {
    PERMISSION_REQUESTED: 'Notification Permission Requested',
    PERMISSION_GRANTED: 'Notification Permission Granted',
    PERMISSION_DENIED: 'Notification Permission Denied',
    CLICKED: 'Notification Clicked',
    RECEIVED: 'Notification Received',
    SENT: 'Notification Sent',
    FAILED: 'Notification Failed',
    TOKEN_ACTIVATED: 'Notification Token Activated',
    TOKEN_DEACTIVATED: 'Notification Token Deactivated',
  },

  // Club del Trekking
  CLUB_TREKKING: {
    SUBSCRIBED: 'Club Trekking - Subscribed',
    CANCELLED: 'Club Trekking - Cancelled',
    PAUSED: 'Club Trekking - Paused',
    REACTIVATED: 'Club Trekking - Reactivated',
    SALIDA_RESERVED: 'Club Trekking - Salida Reserved',
    CHECK_IN: 'Club Trekking - Check In',
    WEEKLY_LIMIT_REACHED: 'Club Trekking - Weekly Limit Reached',
    MONTHLY_SUMMARY: 'Club Trekking - Monthly Summary',
    PAYMENT_RENEWED: 'Club Trekking - Payment Renewed',
    PAYMENT_FAILED: 'Club Trekking - Payment Failed',
    BADGE_EARNED: 'Club Trekking - Badge Earned',
  },
} as const;

// ==================== FUNCIONES HELPER ====================

/**
 * Trackea evento de login
 */
export const trackLogin = (method: 'credentials' | 'google', userId?: string) => {
  const eventName = method === 'google' ? EVENTS.AUTH.GOOGLE_LOGIN : EVENTS.AUTH.LOGIN;
  trackEvent(eventName, {
    method,
    user_id: userId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea evento de logout
 */
export const trackLogout = () => {
  trackEvent(EVENTS.AUTH.LOGOUT, {
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea evento de signup
 */
export const trackSignup = (method: 'credentials' | 'google', userId?: string) => {
  trackEvent(EVENTS.AUTH.SIGNUP, {
    method,
    user_id: userId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando un usuario visualiza una salida social
 */
export const trackSalidaSocialViewed = (salidaId: string, properties?: Dict) => {
  trackEvent(EVENTS.SALIDA_SOCIAL.VIEWED, {
    salida_id: salidaId,
    timestamp: new Date().toISOString(),
    ...properties,
  });
};

/**
 * Trackea cuando un usuario crea una salida social
 */
export const trackSalidaSocialCreated = (salidaId: string, properties?: Dict) => {
  trackEvent(EVENTS.SALIDA_SOCIAL.CREATED, {
    salida_id: salidaId,
    timestamp: new Date().toISOString(),
    ...properties,
  });
};

/**
 * Trackea cuando un usuario se une a una salida social
 */
export const trackSalidaSocialJoined = (salidaId: string, properties?: Dict) => {
  trackEvent(EVENTS.SALIDA_SOCIAL.JOINED, {
    salida_id: salidaId,
    timestamp: new Date().toISOString(),
    ...properties,
  });
};

/**
 * Trackea cuando un usuario visualiza un team social
 */
export const trackTeamSocialViewed = (teamId: string, properties?: Dict) => {
  trackEvent(EVENTS.TEAM_SOCIAL.VIEWED, {
    team_id: teamId,
    timestamp: new Date().toISOString(),
    ...properties,
  });
};

/**
 * Trackea cuando un usuario crea un team social
 */
export const trackTeamSocialCreated = (teamId: string, properties?: Dict) => {
  trackEvent(EVENTS.TEAM_SOCIAL.CREATED, {
    team_id: teamId,
    timestamp: new Date().toISOString(),
    ...properties,
  });
};

/**
 * Trackea cuando un usuario se une a un team social
 */
export const trackTeamSocialJoined = (teamId: string, properties?: Dict) => {
  trackEvent(EVENTS.TEAM_SOCIAL.JOINED, {
    team_id: teamId,
    timestamp: new Date().toISOString(),
    ...properties,
  });
};

/**
 * Trackea cuando un usuario visualiza una academia
 */
export const trackAcademiaViewed = (academiaId: string, properties?: Dict) => {
  trackEvent(EVENTS.ACADEMIA.VIEWED, {
    academia_id: academiaId,
    timestamp: new Date().toISOString(),
    ...properties,
  });
};

/**
 * Trackea inicio de pago
 */
export const trackPaymentInitiated = (amount: number, eventId: string, eventType: string) => {
  // Iniciar cronómetro para el evento de pago
  timeEvent(EVENTS.PAYMENTS.COMPLETED);

  trackEvent(EVENTS.PAYMENTS.INITIATED, {
    amount,
    event_id: eventId,
    event_type: eventType,
    currency: 'ARS',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea pago completado
 */
export const trackPaymentCompleted = (
  amount: number,
  eventId: string,
  eventType: string,
  paymentId?: string
) => {
  // El timeEvent que se inició en trackPaymentInitiated
  // automáticamente calculará la duración
  trackEvent(EVENTS.PAYMENTS.COMPLETED, {
    amount,
    event_id: eventId,
    event_type: eventType,
    payment_id: paymentId,
    currency: 'ARS',
    timestamp: new Date().toISOString(),
  });

  // Registrar el cargo en el perfil del usuario
  trackCharge(amount, {
    event_id: eventId,
    event_type: eventType,
    payment_id: paymentId,
  });
};

/**
 * Trackea pago fallido
 */
export const trackPaymentFailed = (
  amount: number,
  eventId: string,
  eventType: string,
  reason?: string
) => {
  trackEvent(EVENTS.PAYMENTS.FAILED, {
    amount,
    event_id: eventId,
    event_type: eventType,
    reason,
    currency: 'ARS',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando se actualiza el perfil
 */
export const trackProfileUpdated = (fields: string[]) => {
  trackEvent(EVENTS.PROFILE.UPDATED, {
    fields_updated: fields,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando se visualiza un perfil
 */
export const trackProfileViewed = (userId: string, isOwnProfile: boolean) => {
  trackEvent(EVENTS.PROFILE.VIEWED, {
    viewed_user_id: userId,
    is_own_profile: isOwnProfile,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea conexión con Strava
 */
export const trackStravaConnected = () => {
  trackEvent(EVENTS.STRAVA.CONNECTED, {
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea búsqueda
 */
export const trackSearch = (query: string, category?: string, resultsCount?: number) => {
  trackEvent(EVENTS.NAVIGATION.SEARCH_PERFORMED, {
    query,
    category,
    results_count: resultsCount,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea click en tab de navegación
 */
export const trackTabClick = (tabName: string) => {
  trackEvent(EVENTS.NAVIGATION.TAB_CLICKED, {
    tab_name: tabName,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando se marca/desmarca como favorito
 */
export const trackFavorite = (
  action: 'favorited' | 'unfavorited',
  itemType: 'salida_social' | 'team_social' | 'academia',
  itemId: string
) => {
  let eventName: string;

  switch (itemType) {
    case 'salida_social':
      eventName = action === 'favorited'
        ? EVENTS.SALIDA_SOCIAL.FAVORITED
        : EVENTS.SALIDA_SOCIAL.UNFAVORITED;
      break;
    case 'team_social':
      eventName = action === 'favorited'
        ? EVENTS.TEAM_SOCIAL.FAVORITED
        : EVENTS.TEAM_SOCIAL.UNFAVORITED;
      break;
    case 'academia':
      eventName = action === 'favorited'
        ? EVENTS.ACADEMIA.FAVORITED
        : EVENTS.ACADEMIA.UNFAVORITED;
      break;
  }

  trackEvent(eventName, {
    item_id: itemId,
    item_type: itemType,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando se comparte contenido
 */
export const trackShare = (
  itemType: 'salida_social' | 'team_social',
  itemId: string,
  method?: string
) => {
  const eventName = itemType === 'salida_social'
    ? EVENTS.SALIDA_SOCIAL.SHARED
    : EVENTS.TEAM_SOCIAL.SHARED;

  trackEvent(eventName, {
    item_id: itemId,
    item_type: itemType,
    share_method: method,
    timestamp: new Date().toISOString(),
  });
};

// ==================== NUEVOS EVENTOS CRÍTICOS ====================

/**
 * Trackea cuando un usuario visualiza el feed de eventos
 */
export const trackEventsFeedViewed = (filters?: Dict) => {
  trackEvent(EVENTS.DISCOVERY.FEED_VIEWED, {
    filters_applied: filters ? Object.keys(filters) : [],
    filter_count: filters ? Object.keys(filters).length : 0,
    ...filters,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando se aplican filtros
 */
export const trackFiltersApplied = (filters: Dict) => {
  trackEvent(EVENTS.DISCOVERY.FILTERS_APPLIED, {
    filter_types: Object.keys(filters),
    filter_count: Object.keys(filters).length,
    ...filters,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando se limpian los filtros
 */
export const trackFiltersCleared = () => {
  trackEvent(EVENTS.DISCOVERY.FILTERS_CLEARED, {
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea paso completado del onboarding
 */
export const trackOnboardingStep = (step: number, stepName: string) => {
  trackEvent(EVENTS.ONBOARDING.STEP_COMPLETED, {
    step_number: step,
    step_name: stepName,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando se completa el onboarding
 */
export const trackOnboardingCompleted = (totalSteps?: number) => {
  trackEvent(EVENTS.ONBOARDING.COMPLETED, {
    total_steps: totalSteps,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando se salta el onboarding
 */
export const trackOnboardingSkipped = (atStep?: number) => {
  trackEvent(EVENTS.ONBOARDING.SKIPPED, {
    skipped_at_step: atStep,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea errores en la aplicación
 */
export const trackError = (errorType: string, errorMessage: string, context?: Dict) => {
  trackEvent(EVENTS.ERROR.OCCURRED, {
    error_type: errorType,
    error_message: errorMessage,
    page: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...context,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea errores de validación de formularios
 */
export const trackFormError = (formName: string, errors: string[]) => {
  trackEvent(EVENTS.ERROR.FORM_VALIDATION, {
    form_name: formName,
    error_fields: errors,
    error_count: errors.length,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea errores de API
 */
export const trackApiError = (endpoint: string, statusCode: number, errorMessage?: string) => {
  trackEvent(EVENTS.ERROR.API_ERROR, {
    endpoint,
    status_code: statusCode,
    error_message: errorMessage,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando se solicita permiso de notificaciones
 */
export const trackNotificationPermissionRequested = () => {
  trackEvent(EVENTS.NOTIFICATION.PERMISSION_REQUESTED, {
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando se concede/deniega permiso de notificaciones
 */
export const trackNotificationPermission = (granted: boolean) => {
  const eventName = granted
    ? EVENTS.NOTIFICATION.PERMISSION_GRANTED
    : EVENTS.NOTIFICATION.PERMISSION_DENIED;

  trackEvent(eventName, {
    permission_granted: granted,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando se hace click en una notificación
 */
export const trackNotificationClick = (notificationType: string, notificationId?: string) => {
  trackEvent(EVENTS.NOTIFICATION.CLICKED, {
    notification_type: notificationType,
    notification_id: notificationId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando se recibe una notificación
 */
export const trackNotificationReceived = (notificationType: string, notificationId?: string) => {
  trackEvent(EVENTS.NOTIFICATION.RECEIVED, {
    notification_type: notificationType,
    notification_id: notificationId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando se envía una notificación (backend)
 */
export const trackNotificationSent = (
  notificationType: string,
  recipientId: string,
  notificationId?: string,
  deviceCount?: number
) => {
  trackEvent(EVENTS.NOTIFICATION.SENT, {
    notification_type: notificationType,
    notification_id: notificationId,
    recipient_id: recipientId,
    device_count: deviceCount,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando falla el envío de una notificación
 */
export const trackNotificationFailed = (
  notificationType: string,
  recipientId: string,
  reason: string
) => {
  trackEvent(EVENTS.NOTIFICATION.FAILED, {
    notification_type: notificationType,
    recipient_id: recipientId,
    reason,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando se activa un token FCM
 */
export const trackNotificationTokenActivated = (userId: string, deviceInfo?: any) => {
  trackEvent(EVENTS.NOTIFICATION.TOKEN_ACTIVATED, {
    user_id: userId,
    device_platform: deviceInfo?.platform,
    device_user_agent: deviceInfo?.userAgent?.substring(0, 100),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando se desactiva un token FCM
 */
export const trackNotificationTokenDeactivated = (userId: string, reason: string) => {
  trackEvent(EVENTS.NOTIFICATION.TOKEN_DEACTIVATED, {
    user_id: userId,
    reason,
    timestamp: new Date().toISOString(),
  });
};

// ==================== CLUB DEL TREKKING ====================

/**
 * Trackea cuando un usuario se suscribe al Club del Trekking
 */
export const trackClubTrekkingSubscribed = (membershipId: string, userId: string) => {
  trackEvent(EVENTS.CLUB_TREKKING.SUBSCRIBED, {
    membership_id: membershipId,
    user_id: userId,
    plan: 'monthly',
    price: 25000,
    currency: 'ARS',
    timestamp: new Date().toISOString(),
  });

  // Registrar el cargo inicial
  trackCharge(25000, {
    membership_id: membershipId,
    plan: 'monthly',
  });
};

/**
 * Trackea cuando un usuario cancela su membresía
 */
export const trackClubTrekkingCancelled = (
  membershipId: string,
  reason: string,
  monthsActive?: number
) => {
  trackEvent(EVENTS.CLUB_TREKKING.CANCELLED, {
    membership_id: membershipId,
    reason,
    months_active: monthsActive,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando un usuario pausa su membresía
 */
export const trackClubTrekkingPaused = (membershipId: string) => {
  trackEvent(EVENTS.CLUB_TREKKING.PAUSED, {
    membership_id: membershipId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando un usuario reactiva su membresía
 */
export const trackClubTrekkingReactivated = (membershipId: string) => {
  trackEvent(EVENTS.CLUB_TREKKING.REACTIVATED, {
    membership_id: membershipId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando un usuario reserva una salida con su membresía
 */
export const trackClubTrekkingSalidaReserved = (
  membershipId: string,
  salidaId: string,
  salidasUsadasSemana: number,
  properties?: Dict
) => {
  trackEvent(EVENTS.CLUB_TREKKING.SALIDA_RESERVED, {
    membership_id: membershipId,
    salida_id: salidaId,
    salidas_usadas_semana: salidasUsadasSemana,
    timestamp: new Date().toISOString(),
    ...properties,
  });
};

/**
 * Trackea cuando un usuario hace check-in en una salida
 */
export const trackClubTrekkingCheckIn = (
  membershipId: string,
  salidaId: string,
  onTime: boolean,
  properties?: Dict
) => {
  trackEvent(EVENTS.CLUB_TREKKING.CHECK_IN, {
    membership_id: membershipId,
    salida_id: salidaId,
    on_time: onTime,
    timestamp: new Date().toISOString(),
    ...properties,
  });
};

/**
 * Trackea cuando un usuario alcanza el límite semanal
 */
export const trackClubTrekkingWeeklyLimitReached = (membershipId: string) => {
  trackEvent(EVENTS.CLUB_TREKKING.WEEKLY_LIMIT_REACHED, {
    membership_id: membershipId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea resumen mensual de uso
 */
export const trackClubTrekkingMonthlySummary = (
  membershipId: string,
  stats: {
    totalSalidas: number;
    kmRecorridos?: number;
    lugaresVisitados?: number;
  }
) => {
  trackEvent(EVENTS.CLUB_TREKKING.MONTHLY_SUMMARY, {
    membership_id: membershipId,
    total_salidas: stats.totalSalidas,
    km_recorridos: stats.kmRecorridos,
    lugares_visitados: stats.lugaresVisitados,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea renovación exitosa de pago
 */
export const trackClubTrekkingPaymentRenewed = (
  membershipId: string,
  paymentId: string
) => {
  trackEvent(EVENTS.CLUB_TREKKING.PAYMENT_RENEWED, {
    membership_id: membershipId,
    payment_id: paymentId,
    amount: 25000,
    currency: 'ARS',
    timestamp: new Date().toISOString(),
  });

  // Registrar el cargo
  trackCharge(25000, {
    membership_id: membershipId,
    payment_id: paymentId,
    type: 'renewal',
  });
};

/**
 * Trackea fallo en renovación de pago
 */
export const trackClubTrekkingPaymentFailed = (
  membershipId: string,
  reason?: string
) => {
  trackEvent(EVENTS.CLUB_TREKKING.PAYMENT_FAILED, {
    membership_id: membershipId,
    reason,
    amount: 25000,
    currency: 'ARS',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando un usuario obtiene un nuevo badge
 */
export const trackClubTrekkingBadgeEarned = (
  membershipId: string,
  badgeType: 'bronce' | 'plata' | 'oro',
  totalSalidas: number
) => {
  trackEvent(EVENTS.CLUB_TREKKING.BADGE_EARNED, {
    membership_id: membershipId,
    badge_type: badgeType,
    total_salidas: totalSalidas,
    timestamp: new Date().toISOString(),
  });
};
