// Configuración central del Club del Trekking
// Modificar estos valores para cambiar el comportamiento del sistema

export const CLUB_TREKKING_CONFIG = {
  // Precio de la membresía mensual
  PRECIO_MENSUAL: 25000, // ARS - Valor base por defecto

  // Criterio de inclusión en membresía
  MAX_PRECIO_SALIDA: 10000, // Las salidas con precio <= $10,000 están incluidas
  DEPORTE_PERMITIDO: "Trekking", // Solo salidas de Trekking (no Ciclismo ni Running)

  // Límites de uso
  LIMITES: {
    SALIDAS_POR_SEMANA: 2, // Máximo 2 salidas por semana
    PAUSAS_POR_MES: 1, // Puede pausar solo 1 vez al mes
    DIAS_MINIMOS_PAUSA: 7, // Mínimo 7 días de pausa
  },

  // Check-in
  CHECK_IN: {
    RADIO_METROS: 100, // Debe estar a 100m del punto de encuentro
    TIEMPO_ANTES_MINUTOS: 30, // Puede hacer check-in 30 min antes
    TIEMPO_DESPUES_MINUTOS: 15, // Puede hacer check-in hasta 15 min después
  },

  // Configuración de MercadoPago
  MERCADO_PAGO: {
    FRECUENCIA: 1, // Frecuencia de cobro
    TIPO_FRECUENCIA: "months" as "months" | "days", // Tipo de frecuencia
    MONEDA: "ARS", // Moneda
    MOTIVO: "Club del Trekking - Membresía Mensual",
  },

  // Gamificación y badges
  BADGES: {
    BRONCE: {
      nombre: "Bronce",
      minimoSalidas: 0,
      color: "#CD7F32",
    },
    PLATA: {
      nombre: "Plata",
      minimoSalidas: 10,
      color: "#C0C0C0",
    },
    ORO: {
      nombre: "Oro",
      minimoSalidas: 25,
      color: "#FFD700",
    },
  },

  // Estados de la membresía
  ESTADOS: {
    ACTIVA: "activa",
    PAUSADA: "pausada",
    VENCIDA: "vencida",
    CANCELADA: "cancelada",
  } as const,

  // Notificaciones
  NOTIFICACIONES: {
    BIENVENIDA: true,
    NUEVA_SALIDA: true,
    RECORDATORIO_SALIDA: true, // 24h antes
    RECORDATORIO_CHECK_IN: true, // 1h antes
    LIMITE_ALCANZADO: true,
    RENOVACION_EXITOSA: true,
    RENOVACION_FALLIDA: true,
    RESUMEN_MENSUAL: true,
  },
} as const;

// Tipos derivados
export type EstadoMembershipClub =
  (typeof CLUB_TREKKING_CONFIG.ESTADOS)[keyof typeof CLUB_TREKKING_CONFIG.ESTADOS];
export type TipoBadge = "bronce" | "plata" | "oro";

// Funciones helper
export const clubTrekkingHelpers = {
  /**
   * Verifica si una salida está incluida en la membresía
   * Debe cumplir: precio > 0 Y precio <= $10,000 Y deporte = "Trekking"
   */
  esElegibleParaMembresia: (
    precio: string | number,
    deporte?: string
  ): boolean => {
    const precioNum = typeof precio === "string" ? parseFloat(precio) : precio;
    const cumplePrecio =
      precioNum > 0 && precioNum <= CLUB_TREKKING_CONFIG.MAX_PRECIO_SALIDA;

    // Si no se proporciona deporte, solo validar precio (para retrocompatibilidad)
    if (!deporte) return cumplePrecio;

    // Validar que sea Trekking
    return cumplePrecio && deporte === CLUB_TREKKING_CONFIG.DEPORTE_PERMITIDO;
  },

  /**
   * Calcula la fecha de fin del período mensual
   */
  calcularFechaFinPeriodo: (fechaInicio: Date): Date => {
    const fecha = new Date(fechaInicio);
    fecha.setMonth(fecha.getMonth() + 1);
    return fecha;
  },

  /**
   * Calcula la próxima fecha de pago
   */
  calcularProximaFechaPago: (fechaActual: Date = new Date()): Date => {
    const proximaFecha = new Date(fechaActual);
    proximaFecha.setMonth(fechaActual.getMonth() + 1);
    return proximaFecha;
  },

  /**
   * Obtiene el inicio y fin de la semana de una fecha
   */
  obtenerSemana: (
    fecha: Date
  ): { inicio: Date; fin: Date; numeroSemana: number } => {
    const inicioSemana = new Date(fecha);
    inicioSemana.setDate(fecha.getDate() - fecha.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);

    // Calcular número de semana del año
    const inicioAnio = new Date(fecha.getFullYear(), 0, 1);
    const diasTranscurridos = Math.floor(
      (inicioSemana.getTime() - inicioAnio.getTime()) / (1000 * 60 * 60 * 24)
    );
    const numeroSemana = Math.ceil(diasTranscurridos / 7);

    return { inicio: inicioSemana, fin: finSemana, numeroSemana };
  },

  /**
   * Calcula la distancia entre dos puntos geográficos (en metros)
   * Usa la fórmula de Haversine
   */
  calcularDistancia: (
    punto1: { lat: number; lng: number },
    punto2: { lat: number; lng: number }
  ): number => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = (punto1.lat * Math.PI) / 180;
    const φ2 = (punto2.lat * Math.PI) / 180;
    const Δφ = ((punto2.lat - punto1.lat) * Math.PI) / 180;
    const Δλ = ((punto2.lng - punto1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
  },

  /**
   * Verifica si el usuario está dentro del radio de check-in
   */
  estaEnRadioCheckIn: (
    ubicacionUsuario: { lat: number; lng: number },
    ubicacionSalida: { lat: number; lng: number }
  ): boolean => {
    const distancia = clubTrekkingHelpers.calcularDistancia(
      ubicacionUsuario,
      ubicacionSalida
    );
    return distancia <= CLUB_TREKKING_CONFIG.CHECK_IN.RADIO_METROS;
  },

  /**
   * Verifica si el check-in está dentro del tiempo permitido
   */
  estaEnTiempoCheckIn: (fechaSalida: Date, fechaActual: Date = new Date()): boolean => {
    const tiempoAntes =
      CLUB_TREKKING_CONFIG.CHECK_IN.TIEMPO_ANTES_MINUTOS * 60 * 1000;
    const tiempoDespues =
      CLUB_TREKKING_CONFIG.CHECK_IN.TIEMPO_DESPUES_MINUTOS * 60 * 1000;

    const diferenciaMs = fechaActual.getTime() - fechaSalida.getTime();

    return diferenciaMs >= -tiempoAntes && diferenciaMs <= tiempoDespues;
  },

  /**
   * Determina el tipo de badge según el número de salidas
   */
  obtenerTipoBadge: (totalSalidas: number): TipoBadge => {
    if (totalSalidas >= CLUB_TREKKING_CONFIG.BADGES.ORO.minimoSalidas) {
      return "oro";
    } else if (
      totalSalidas >= CLUB_TREKKING_CONFIG.BADGES.PLATA.minimoSalidas
    ) {
      return "plata";
    }
    return "bronce";
  },

  /**
   * Formatea el precio para mostrar
   */
  formatearPrecio: (precio: number): string => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(precio);
  },
};
