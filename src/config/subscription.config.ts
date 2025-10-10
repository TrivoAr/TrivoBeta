// Configuración central del sistema de suscripciones
// Modificar estos valores para cambiar el comportamiento del sistema

export const SUBSCRIPTION_CONFIG = {
  // Configuración del Trial Gratuito
  TRIAL: {
    // Tipo de trial: "global" = una vez en la vida, "por-academia" = una por academia
    TYPE: "global" as "global" | "por-academia",

    // Modelo híbrido: lo que suceda primero activa el cobro
    MAX_CLASES_GRATIS: 1, // Número de clases gratuitas
    MAX_DIAS_GRATIS: 7, // Días de trial gratuito

    // Si es true, se cobra después del trial. Si es false, se cobra de inmediato sin trial
    ENABLED: true,
  },

  // Configuración de la suscripción mensual
  SUBSCRIPTION: {
    FREQUENCY: 1, // Frecuencia de cobro
    FREQUENCY_TYPE: "months" as "months" | "days", // Tipo de frecuencia
    CURRENCY: "ARS", // Moneda
  },

  // Estados posibles de una suscripción
  ESTADOS: {
    TRIAL: "trial", // En período de prueba gratuito
    TRIAL_EXPIRADO: "trial_expirado", // Trial expirado, esperando configuración de pago
    PENDIENTE: "pendiente", // Esperando aprobación de pago
    ACTIVA: "activa", // Suscripción activa y pagada
    VENCIDA: "vencida", // Pago rechazado o vencido
    PAUSADA: "pausada", // Usuario pausó la suscripción
    CANCELADA: "cancelada", // Usuario canceló definitivamente
  } as const,

  // Configuración de webhooks de Mercado Pago
  WEBHOOK: {
    EVENTS: {
      PAYMENT_CREATED: "payment.created",
      PAYMENT_UPDATED: "payment.updated",
    },
    PAYMENT_STATUS: {
      APPROVED: "approved",
      REJECTED: "rejected",
      PENDING: "pending",
      CANCELLED: "cancelled",
    },
  },
} as const;

// Tipos derivados de la configuración
export type EstadoSuscripcion =
  (typeof SUBSCRIPTION_CONFIG.ESTADOS)[keyof typeof SUBSCRIPTION_CONFIG.ESTADOS];
export type TrialType = typeof SUBSCRIPTION_CONFIG.TRIAL.TYPE;

// Funciones helper para verificar configuración
export const subscriptionHelpers = {
  /**
   * Verifica si el trial está habilitado
   */
  isTrialEnabled: () => SUBSCRIPTION_CONFIG.TRIAL.ENABLED,

  /**
   * Verifica si el trial es global (una vez en la vida)
   */
  isTrialGlobal: () => SUBSCRIPTION_CONFIG.TRIAL.TYPE === "global",

  /**
   * Verifica si el trial es por academia
   */
  isTrialPorAcademia: () => SUBSCRIPTION_CONFIG.TRIAL.TYPE === "por-academia",

  /**
   * Obtiene el límite de clases gratis
   */
  getMaxClasesGratis: () => SUBSCRIPTION_CONFIG.TRIAL.MAX_CLASES_GRATIS,

  /**
   * Obtiene el límite de días gratis
   */
  getMaxDiasGratis: () => SUBSCRIPTION_CONFIG.TRIAL.MAX_DIAS_GRATIS,

  /**
   * Calcula la fecha de fin del trial basado en días
   */
  calcularFechaFinTrial: (fechaInicio: Date): Date => {
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + SUBSCRIPTION_CONFIG.TRIAL.MAX_DIAS_GRATIS);
    return fecha;
  },

  /**
   * Verifica si una fecha está dentro del período de trial
   */
  estaDentroDeTrial: (
    fechaInicio: Date,
    fechaActual: Date = new Date()
  ): boolean => {
    const fechaFin = subscriptionHelpers.calcularFechaFinTrial(fechaInicio);
    return fechaActual <= fechaFin;
  },
};
