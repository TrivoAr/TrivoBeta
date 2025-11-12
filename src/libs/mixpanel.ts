import mixpanel, { Dict, RequestOptions } from 'mixpanel-browser';

// Inicializar Mixpanel solo en el cliente
const isDevelopment = process.env.NODE_ENV === 'development';
const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '';

// Verificar si estamos en el navegador
const isBrowser = typeof window !== 'undefined';

if (isBrowser && mixpanelToken) {
  mixpanel.init(mixpanelToken, {
    debug: isDevelopment,
    track_pageview: false, // Desactivado - usamos tracking manual con control
    persistence: 'localStorage',
    ignore_dnt: false, // Respetar Do Not Track
    secure_cookie: true,
  });
}

/**
 * Identifica al usuario en Mixpanel
 * @param userId - ID único del usuario
 */
export const identifyUser = (userId: string): void => {
  if (!isBrowser || !mixpanelToken) return;
  mixpanel.identify(userId);
};

/**
 * Establece las propiedades del usuario
 * @param properties - Propiedades del perfil del usuario
 */
export const setUserProperties = (properties: Dict): void => {
  if (!isBrowser || !mixpanelToken) return;
  mixpanel.people.set(properties);
};

/**
 * Trackea un evento personalizado
 * @param eventName - Nombre del evento
 * @param properties - Propiedades del evento (opcional)
 */
export const trackEvent = (
  eventName: string,
  properties?: Dict,
  options?: RequestOptions
): void => {
  if (!isBrowser || !mixpanelToken) {
    if (isDevelopment) {
      console.log('Mixpanel Event:', eventName, properties);
    }
    return;
  }
  mixpanel.track(eventName, properties, options);
};

/**
 * Trackea una página vista
 * @param pageName - Nombre de la página
 * @param properties - Propiedades adicionales (opcional)
 */
export const trackPageView = (pageName?: string, properties?: Dict): void => {
  if (!isBrowser || !mixpanelToken) return;

  if (pageName) {
    mixpanel.track_pageview({ page: pageName, ...properties });
  } else {
    mixpanel.track_pageview(properties);
  }
};

/**
 * Registra propiedades súper (se incluyen automáticamente en todos los eventos)
 * @param properties - Propiedades que se incluirán en todos los eventos
 */
export const registerSuperProperties = (properties: Dict): void => {
  if (!isBrowser || !mixpanelToken) return;
  mixpanel.register(properties);
};

/**
 * Registra propiedades súper solo una vez
 * @param properties - Propiedades que se incluirán en todos los eventos solo si no existen
 */
export const registerSuperPropertiesOnce = (properties: Dict): void => {
  if (!isBrowser || !mixpanelToken) return;
  mixpanel.register_once(properties);
};

/**
 * Incrementa una propiedad numérica del usuario
 * @param property - Nombre de la propiedad
 * @param amount - Cantidad a incrementar (default: 1)
 */
export const incrementUserProperty = (property: string, amount: number = 1): void => {
  if (!isBrowser || !mixpanelToken) return;
  mixpanel.people.increment(property, amount);
};

/**
 * Añade un valor a una propiedad de tipo lista del usuario
 * @param property - Nombre de la propiedad
 * @param value - Valor a añadir
 */
export const appendUserProperty = (property: string, value: any): void => {
  if (!isBrowser || !mixpanelToken) return;
  mixpanel.people.append({ [property]: value });
};

/**
 * Establece propiedades del usuario solo una vez
 * @param properties - Propiedades del usuario
 */
export const setUserPropertiesOnce = (properties: Dict): void => {
  if (!isBrowser || !mixpanelToken) return;
  mixpanel.people.set_once(properties);
};

/**
 * Resetea el usuario actual
 */
export const resetUser = (): void => {
  if (!isBrowser || !mixpanelToken) return;
  mixpanel.reset();
};

/**
 * Trackea un cargo/pago del usuario
 * @param amount - Monto del cargo
 * @param properties - Propiedades adicionales del cargo
 */
export const trackCharge = (amount: number, properties?: Dict): void => {
  if (!isBrowser || !mixpanelToken) return;
  mixpanel.people.track_charge(amount, properties);
};

/**
 * Empieza a cronometrar un evento
 * @param eventName - Nombre del evento a cronometrar
 */
export const timeEvent = (eventName: string): void => {
  if (!isBrowser || !mixpanelToken) return;
  mixpanel.time_event(eventName);
};

/**
 * Obtiene el distinct_id del usuario actual
 * @returns El distinct_id del usuario
 */
export const getDistinctId = (): string | undefined => {
  if (!isBrowser || !mixpanelToken) return undefined;
  return mixpanel.get_distinct_id();
};

/**
 * Alias para asociar un nuevo ID con el ID existente
 * @param alias - Nuevo ID a asociar
 */
export const aliasUser = (alias: string): void => {
  if (!isBrowser || !mixpanelToken) return;
  mixpanel.alias(alias);
};

// Exportar la instancia de mixpanel para uso avanzado
export { mixpanel };

export default {
  identifyUser,
  setUserProperties,
  trackEvent,
  trackPageView,
  registerSuperProperties,
  registerSuperPropertiesOnce,
  incrementUserProperty,
  appendUserProperty,
  setUserPropertiesOnce,
  resetUser,
  trackCharge,
  timeEvent,
  getDistinctId,
  aliasUser,
  mixpanel,
};
