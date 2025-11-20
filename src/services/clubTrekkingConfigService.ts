import ClubTrekkingConfig from "@/models/ClubTrekkingConfig";
import { CLUB_TREKKING_CONFIG } from "@/config/clubTrekking.config";

/**
 * Obtiene la configuración actual del Club del Trekking.
 * Intenta leer de la base de datos, si no existe, usa los valores por defecto.
 */
export async function getClubConfig() {
    try {
        const config = await ClubTrekkingConfig.findOne().sort({ createdAt: -1 });

        if (config) {
            return {
                PRECIO_MENSUAL: config.precioMensual,
                MAX_PRECIO_SALIDA: config.maxPrecioSalida,
                DEPORTE_PERMITIDO: config.deportePermitido,
                LIMITES: {
                    SALIDAS_POR_SEMANA: config.limiteSemanal,
                    PAUSAS_POR_MES: CLUB_TREKKING_CONFIG.LIMITES.PAUSAS_POR_MES, // No dinámico por ahora
                    DIAS_MINIMOS_PAUSA: CLUB_TREKKING_CONFIG.LIMITES.DIAS_MINIMOS_PAUSA, // No dinámico por ahora
                },
                CHECK_IN: {
                    RADIO_METROS: config.radioCheckIn,
                    TIEMPO_ANTES_MINUTOS: CLUB_TREKKING_CONFIG.CHECK_IN.TIEMPO_ANTES_MINUTOS,
                    TIEMPO_DESPUES_MINUTOS: CLUB_TREKKING_CONFIG.CHECK_IN.TIEMPO_DESPUES_MINUTOS,
                },
                MERCADO_PAGO: CLUB_TREKKING_CONFIG.MERCADO_PAGO,
                BADGES: CLUB_TREKKING_CONFIG.BADGES,
                ESTADOS: CLUB_TREKKING_CONFIG.ESTADOS,
                NOTIFICACIONES: CLUB_TREKKING_CONFIG.NOTIFICACIONES,
            };
        }
    } catch (error) {
        console.error("Error fetching club config from DB, using defaults:", error);
    }

    // Fallback a la configuración por defecto (env vars)
    return CLUB_TREKKING_CONFIG;
}
