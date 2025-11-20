import { useState, useEffect } from "react";
import { CLUB_TREKKING_CONFIG } from "@/config/clubTrekking.config";

export interface ClubConfig {
    precioMensual: number;
    maxPrecioSalida: number;
    limiteSemanal: number;
    radioCheckIn: number;
    deportePermitido: string;
    active: boolean;
}

export const useClubTrekkingConfig = () => {
    const [config, setConfig] = useState<ClubConfig>({
        precioMensual: CLUB_TREKKING_CONFIG.PRECIO_MENSUAL,
        maxPrecioSalida: CLUB_TREKKING_CONFIG.MAX_PRECIO_SALIDA,
        limiteSemanal: CLUB_TREKKING_CONFIG.LIMITES.SALIDAS_POR_SEMANA,
        radioCheckIn: CLUB_TREKKING_CONFIG.CHECK_IN.RADIO_METROS,
        deportePermitido: CLUB_TREKKING_CONFIG.DEPORTE_PERMITIDO,
        active: true,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/admin/config/club-trekking");
                if (!res.ok) throw new Error("Error fetching config");

                const data = await res.json();
                if (data.config) {
                    setConfig(data.config);
                }
            } catch (err) {
                console.error("Error loading club config:", err);
                setError("No se pudo cargar la configuración actualizada");
                // Mantenemos los valores por defecto del estado inicial
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            minimumFractionDigits: 0,
        }).format(price);
    };

    return {
        config,
        loading,
        error,
        formattedPrice: formatPrice(config.precioMensual),
        formatPrice,
    };
};
