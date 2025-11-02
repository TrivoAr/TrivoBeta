/**
 * Utilidad centralizada para precios y configuración del Club del Trekking
 * ÚNICA FUENTE DE VERDAD para todos los valores relacionados al Club
 *
 * Para cambiar precios/límites: modificar SOLO las variables de entorno (.env)
 */

/**
 * Obtiene el precio mensual de la membresía desde las variables de entorno
 */
export const getClubPrice = (): number => {
  return Number(process.env.NEXT_PUBLIC_CLUB_TREKKING_PRICE || 25000);
};

/**
 * Formatea el precio mensual para mostrar en la UI
 * @returns String formateado en pesos argentinos (ej: "$250")
 */
export const formatClubPrice = (): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(getClubPrice());
};

/**
 * Obtiene el precio máximo de salida incluida en la membresía
 */
export const getMaxSalidaPrice = (): number => {
  return Number(process.env.NEXT_PUBLIC_CLUB_TREKKING_MAX_SALIDA_PRICE || 10000);
};

/**
 * Formatea el precio máximo de salida para mostrar en la UI
 */
export const formatMaxSalidaPrice = (): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(getMaxSalidaPrice());
};

/**
 * Obtiene el límite de salidas por semana
 */
export const getWeeklyLimit = (): number => {
  return Number(process.env.NEXT_PUBLIC_CLUB_TREKKING_WEEKLY_LIMIT || 2);
};

/**
 * Obtiene el radio de check-in en metros
 */
export const getCheckInRadius = (): number => {
  return Number(process.env.NEXT_PUBLIC_CLUB_TREKKING_CHECK_IN_RADIUS_METERS || 100);
};
