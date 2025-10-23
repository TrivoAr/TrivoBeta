"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useFormContext, Controller } from "react-hook-form";

/**
 * Interfaces para LocationPicker
 */
export interface LocationData {
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
  city?: string;
  country?: string;
  formatted?: string;
}

export interface LocationPickerProps {
  name: string;
  label?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
  validation?: {
    required?: string | boolean;
    validate?: (value: LocationData) => boolean | string;
  };
  onLocationChange?: (location: LocationData | null) => void;
  enableGPS?: boolean;
  mapboxToken?: string;
  defaultLocation?: LocationData;
}

/**
 * Hook para geolocalización
 */
export const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("La geolocalización no está soportada en este navegador");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setLoading(false);
      },
      (error) => {
        let errorMessage = "Error al obtener la ubicación";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permiso de ubicación denegado";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Ubicación no disponible";
            break;
          case error.TIMEOUT:
            errorMessage = "Tiempo de espera agotado";
            break;
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutos
      }
    );
  }, []);

  return { location, loading, error, getCurrentLocation };
};

/**
 * Hook para geocodificación reversa
 */
export const useReverseGeocode = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<LocationData | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/search/reverse?lat=${lat}&lng=${lng}`
        );

        if (!response.ok) {
          throw new Error("Error en geocodificación reversa");
        }

        const data = await response.json();

        const locationData: LocationData = {
          coordinates: [lng, lat],
          address: data.address,
          city: data.city,
          country: data.country,
          formatted: data.formatted || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        };

        setLoading(false);
        return locationData;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        setLoading(false);
        return null;
      }
    },
    []
  );

  return { reverseGeocode, loading, error };
};

/**
 * Componente LocationPicker principal
 */
export const LocationPicker: React.FC<LocationPickerProps> = ({
  name,
  label,
  validation,
  className,
  placeholder = "Buscar ubicación o usar GPS...",
  onLocationChange,
  enableGPS = true,
  defaultLocation,
}) => {
  const {
    control,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const {
    location: gpsLocation,
    loading: gpsLoading,
    getCurrentLocation,
  } = useGeolocation();
  const { reverseGeocode, loading: reverseLoading } = useReverseGeocode();

  const currentValue = watch(name);
  const error = errors[name];

  // Buscar ubicaciones
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/search/places?q=${encodeURIComponent(query)}`
      );

      if (response.ok) {
        const results = await response.json();
        setSearchResults(results.slice(0, 5)); // Máximo 5 resultados
      }
    } catch (error) {
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce para búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchLocations(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchLocations]);

  // Manejar GPS
  const handleGPSClick = useCallback(async () => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Procesar ubicación GPS
  useEffect(() => {
    if (gpsLocation) {
      const { latitude, longitude } = gpsLocation.coords;
      reverseGeocode(latitude, longitude).then((locationData) => {
        if (locationData) {
          setValue(name, locationData);
          onLocationChange?.(locationData);
          setSearchTerm(locationData.formatted || "");
          setShowResults(false);
        }
      });
    }
  }, [gpsLocation, reverseGeocode, setValue, name, onLocationChange]);

  // Seleccionar ubicación
  const selectLocation = useCallback(
    (location: LocationData) => {
      setValue(name, location);
      onLocationChange?.(location);
      setSearchTerm(location.formatted || location.address || "");
      setShowResults(false);
      setSearchResults([]);
    },
    [setValue, name, onLocationChange]
  );

  // Limpiar ubicación
  const clearLocation = useCallback(() => {
    setValue(name, null);
    onLocationChange?.(null);
    setSearchTerm("");
    setSearchResults([]);
    setShowResults(false);
  }, [setValue, name, onLocationChange]);

  return (
    <div className={`location-picker ${className || ""}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {validation?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <Controller
        name={name}
        control={control}
        rules={validation}
        defaultValue={defaultLocation}
        render={({ field }) => (
          <div className="relative">
            {/* Input de búsqueda */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                placeholder={placeholder}
                className={`w-full px-3 py-2 pr-20 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  error ? "border-red-500" : "border-gray-300"
                }`}
              />

              {/* Botones de acción */}
              <div className="absolute right-2 top-2 flex space-x-1">
                {enableGPS && (
                  <button
                    type="button"
                    onClick={handleGPSClick}
                    disabled={gpsLoading || reverseLoading}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Usar ubicación actual"
                  >
                    {gpsLoading || reverseLoading ? (
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                )}

                {field.value && (
                  <button
                    type="button"
                    onClick={clearLocation}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Limpiar ubicación"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Resultados de búsqueda */}
            {showResults && (searchResults.length > 0 || isSearching) && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {isSearching ? (
                  <div className="px-4 py-3 text-sm text-gray-500 flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2" />
                    Buscando...
                  </div>
                ) : (
                  searchResults.map((result, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectLocation(result)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {result.formatted || result.address}
                      </div>
                      {result.city && result.country && (
                        <div className="text-xs text-gray-500">
                          {result.city}, {result.country}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Ubicación seleccionada */}
            {field.value && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm font-medium text-blue-900">
                  📍 {field.value.formatted || field.value.address}
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  Coordenadas: {field.value.coordinates[1].toFixed(6)},{" "}
                  {field.value.coordinates[0].toFixed(6)}
                </div>
              </div>
            )}
          </div>
        )}
      />

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {(typeof error === "string" ? error : (error as any)?.message) ||
            "Ubicación requerida"}
        </p>
      )}
    </div>
  );
};

/**
 * Hook para gestionar LocationPicker de forma externa
 */
export const useLocationPicker = (initialLocation?: LocationData) => {
  const [location, setLocation] = useState<LocationData | null>(
    initialLocation || null
  );
  const { reverseGeocode } = useReverseGeocode();

  const setCoordinates = useCallback(
    async (lat: number, lng: number) => {
      const locationData = await reverseGeocode(lat, lng);
      if (locationData) {
        setLocation(locationData);
      }
      return locationData;
    },
    [reverseGeocode]
  );

  const clearLocation = useCallback(() => {
    setLocation(null);
  }, []);

  return {
    location,
    setLocation,
    setCoordinates,
    clearLocation,
  };
};
