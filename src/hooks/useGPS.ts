"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * Interfaces para GPS
 */
export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface GPSError {
  code: number;
  message: string;
  type: "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | "UNKNOWN";
}

export interface UseGPSOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  autoStart?: boolean;
  watchPosition?: boolean;
}

export interface UseGPSReturn {
  position: GPSPosition | null;
  loading: boolean;
  error: GPSError | null;
  getCurrentPosition: () => Promise<GPSPosition>;
  startWatching: () => void;
  stopWatching: () => void;
  isWatching: boolean;
  isSupported: boolean;
  clearError: () => void;
}

/**
 * Hook para gestión de GPS/Geolocalización
 */
export const useGPS = (options: UseGPSOptions = {}): UseGPSReturn => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5 minutos
    autoStart = false,
    watchPosition = false,
  } = options;

  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GPSError | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  // Verificar soporte de geolocalización
  const isSupported =
    typeof navigator !== "undefined" && "geolocation" in navigator;

  // Convertir error de geolocalización
  const convertGeolocationError = useCallback(
    (error: GeolocationPositionError): GPSError => {
      let type: GPSError["type"] = "UNKNOWN";
      let message = "Error desconocido al obtener la ubicación";

      switch (error.code) {
        case error.PERMISSION_DENIED:
          type = "PERMISSION_DENIED";
          message =
            "Permiso de ubicación denegado. Verifique la configuración del navegador.";
          break;
        case error.POSITION_UNAVAILABLE:
          type = "POSITION_UNAVAILABLE";
          message = "Ubicación no disponible. Verifique su conexión GPS.";
          break;
        case error.TIMEOUT:
          type = "TIMEOUT";
          message = "Tiempo de espera agotado al obtener la ubicación.";
          break;
      }

      return { code: error.code, message, type };
    },
    []
  );

  // Convertir posición de geolocalización
  const convertGeolocationPosition = useCallback(
    (pos: GeolocationPosition): GPSPosition => {
      const { coords, timestamp } = pos;
      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        altitude: coords.altitude,
        altitudeAccuracy: coords.altitudeAccuracy,
        heading: coords.heading,
        speed: coords.speed,
        timestamp,
      };
    },
    []
  );

  // Obtener posición actual
  const getCurrentPosition = useCallback((): Promise<GPSPosition> => {
    return new Promise((resolve, reject) => {
      if (!isSupported) {
        const error: GPSError = {
          code: -1,
          message: "Geolocalización no soportada en este navegador",
          type: "UNKNOWN",
        };
        setError(error);
        reject(error);
        return;
      }

      setLoading(true);
      setError(null);

      const options: PositionOptions = {
        enableHighAccuracy,
        timeout,
        maximumAge,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const gpsPosition = convertGeolocationPosition(position);
          setPosition(gpsPosition);
          setLoading(false);
          resolve(gpsPosition);
        },
        (error) => {
          const gpsError = convertGeolocationError(error);
          setError(gpsError);
          setLoading(false);
          reject(gpsError);
        },
        options
      );
    });
  }, [
    isSupported,
    enableHighAccuracy,
    timeout,
    maximumAge,
    convertGeolocationError,
    convertGeolocationPosition,
  ]);

  // Iniciar seguimiento de posición
  const startWatching = useCallback(() => {
    if (!isSupported || isWatching) return;

    setError(null);
    setIsWatching(true);

    const options: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const gpsPosition = convertGeolocationPosition(position);
        setPosition(gpsPosition);
        setLoading(false);
      },
      (error) => {
        const gpsError = convertGeolocationError(error);
        setError(gpsError);
        setLoading(false);
      },
      options
    );

    setWatchId(id);
    setLoading(true);
  }, [
    isSupported,
    isWatching,
    enableHighAccuracy,
    timeout,
    maximumAge,
    convertGeolocationError,
    convertGeolocationPosition,
  ]);

  // Detener seguimiento de posición
  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsWatching(false);
      setLoading(false);
    }
  }, [watchId]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-iniciar si está configurado
  useEffect(() => {
    if (autoStart && isSupported) {
      if (watchPosition) {
        startWatching();
      } else {
        getCurrentPosition().catch(() => {
          // Error ya manejado en el hook
        });
      }
    }

    // Cleanup al desmontar
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [
    autoStart,
    watchPosition,
    isSupported,
    startWatching,
    getCurrentPosition,
    watchId,
  ]);

  return {
    position,
    loading,
    error,
    getCurrentPosition,
    startWatching,
    stopWatching,
    isWatching,
    isSupported,
    clearError,
  };
};

/**
 * Hook para cálculos GPS útiles
 */
export const useGPSUtils = () => {
  // Calcular distancia entre dos puntos (fórmula de Haversine)
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Radio de la Tierra en km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  // Formatear coordenadas para mostrar
  const formatCoordinates = useCallback(
    (latitude: number, longitude: number, precision = 6): string => {
      return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
    },
    []
  );

  // Convertir coordenadas a formato DMS (Grados, Minutos, Segundos)
  const toDMS = useCallback(
    (latitude: number, longitude: number): { lat: string; lng: string } => {
      const convertToDMS = (decimal: number, isLatitude: boolean): string => {
        const absolute = Math.abs(decimal);
        const degrees = Math.floor(absolute);
        const minutes = Math.floor((absolute - degrees) * 60);
        const seconds = ((absolute - degrees) * 60 - minutes) * 60;

        const direction = isLatitude
          ? decimal >= 0
            ? "N"
            : "S"
          : decimal >= 0
            ? "E"
            : "W";

        return `${degrees}°${minutes}'${seconds.toFixed(2)}"${direction}`;
      };

      return {
        lat: convertToDMS(latitude, true),
        lng: convertToDMS(longitude, false),
      };
    },
    []
  );

  // Verificar si una posición está dentro de un radio
  const isWithinRadius = useCallback(
    (
      centerLat: number,
      centerLon: number,
      pointLat: number,
      pointLon: number,
      radiusKm: number
    ): boolean => {
      const distance = calculateDistance(
        centerLat,
        centerLon,
        pointLat,
        pointLon
      );
      return distance <= radiusKm;
    },
    [calculateDistance]
  );

  // Obtener URL de Google Maps
  const getGoogleMapsUrl = useCallback(
    (latitude: number, longitude: number, zoom = 15): string => {
      return `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}`;
    },
    []
  );

  // Generar enlace para direcciones
  const getDirectionsUrl = useCallback(
    (
      fromLat: number,
      fromLon: number,
      toLat: number,
      toLon: number
    ): string => {
      return `https://www.google.com/maps/dir/${fromLat},${fromLon}/${toLat},${toLon}`;
    },
    []
  );

  return {
    calculateDistance,
    formatCoordinates,
    toDMS,
    isWithinRadius,
    getGoogleMapsUrl,
    getDirectionsUrl,
  };
};

/**
 * Hook para historial de posiciones GPS
 */
export const useGPSHistory = (maxHistorySize = 50) => {
  const [history, setHistory] = useState<GPSPosition[]>([]);

  const addPosition = useCallback(
    (position: GPSPosition) => {
      setHistory((current) => {
        const newHistory = [position, ...current];
        return newHistory.slice(0, maxHistorySize);
      });
    },
    [maxHistorySize]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getLastPosition = useCallback((): GPSPosition | null => {
    return history[0] || null;
  }, [history]);

  const getPositionAt = useCallback(
    (index: number): GPSPosition | null => {
      return history[index] || null;
    },
    [history]
  );

  const getTrackingDuration = useCallback((): number => {
    if (history.length < 2) return 0;
    const first = history[history.length - 1];
    const last = history[0];
    return last.timestamp - first.timestamp;
  }, [history]);

  return {
    history,
    addPosition,
    clearHistory,
    getLastPosition,
    getPositionAt,
    getTrackingDuration,
    count: history.length,
  };
};
