import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface LocationData {
  coords: LocationCoords;
  city: string;
  timestamp: number;
}

// Hook para obtener coordenadas GPS
export function useCurrentPosition() {
  return useQuery({
    queryKey: ["current-position"],
    queryFn: async (): Promise<LocationCoords> => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocalización no soportada"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            reject(new Error(`Error GPS: ${error.message}`));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // Cache por 5 minutos
          }
        );
      });
    },
    staleTime: 1000 * 60 * 5, // 5 minutos - no refetch automático
    gcTime: 1000 * 60 * 10, // 10 minutos en cache
    retry: 2,
    retryDelay: 1000,
    enabled: false, // Solo ejecutar manualmente
  });
}

// Hook para reverse geocoding (coordenadas → ciudad)
export function useReverseGeocode(coords: LocationCoords | null) {
  return useQuery({
    queryKey: ["reverse-geocode", coords?.latitude, coords?.longitude],
    queryFn: async (): Promise<string> => {
      if (!coords) throw new Error("No coordinates provided");

      const { latitude, longitude } = coords;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
          {
            headers: {
              "User-Agent": "TrivoApp/1.0",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Extraer ciudad, estado o localidad
        const address = data.address || {};
        const city =
          address.city ||
          address.town ||
          address.village ||
          address.municipality ||
          address.county ||
          address.state ||
          "Ubicación detectada";

        return city;
      } catch (error) {
        return "Ubicación detectada";
      }
    },
    enabled: !!coords, // Solo ejecutar si hay coordenadas
    staleTime: 1000 * 60 * 60 * 24, // 24 horas - las ciudades no cambian
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 días en cache
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

// Hook combinado para ubicación completa
export function useLocationDetection() {
  const queryClient = useQueryClient();

  const positionQuery = useCurrentPosition();
  const geocodeQuery = useReverseGeocode(positionQuery.data || null);

  const detectLocation = useMutation({
    mutationFn: async () => {
      // Primero obtener coordenadas
      const coords = await queryClient.fetchQuery({
        queryKey: ["current-position"],
        queryFn: async (): Promise<LocationCoords> => {
          return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error("Geolocalización no soportada"));
              return;
            }

            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                });
              },
              (error) => {
                reject(new Error(`Error GPS: ${error.message}`));
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000,
              }
            );
          });
        },
        staleTime: 1000 * 60 * 5,
      });

      // Luego obtener ciudad
      const city = await queryClient.fetchQuery({
        queryKey: ["reverse-geocode", coords.latitude, coords.longitude],
        queryFn: async (): Promise<string> => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&addressdetails=1`,
              {
                headers: {
                  "User-Agent": "TrivoApp/1.0",
                },
              }
            );

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const address = data.address || {};
            return (
              address.city ||
              address.town ||
              address.village ||
              address.municipality ||
              address.county ||
              address.state ||
              "Ubicación detectada"
            );
          } catch (error) {
            return "Ubicación detectada";
          }
        },
        staleTime: 1000 * 60 * 60 * 24,
      });

      return { coords, city };
    },
  });

  return {
    detectLocation: detectLocation.mutate,
    isLoading: detectLocation.isPending,
    error: detectLocation.error,
    data: detectLocation.data,
    isSuccess: detectLocation.isSuccess,
    reset: detectLocation.reset,
  };
}

// Hook para obtener ubicaciones guardadas del usuario
export function useSavedLocations() {
  return useQuery({
    queryKey: ["saved-locations"],
    queryFn: async (): Promise<LocationData[]> => {
      // Obtener ubicaciones guardadas del localStorage
      const saved = localStorage.getItem("savedLocations");
      return saved ? JSON.parse(saved) : [];
    },
    staleTime: Infinity, // No refetch automático
    gcTime: 1000 * 60 * 60 * 24, // 24 horas en cache
  });
}

// Hook para guardar ubicación
export function useSaveLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locationData: LocationData) => {
      const saved = localStorage.getItem("savedLocations");
      const locations: LocationData[] = saved ? JSON.parse(saved) : [];

      // Evitar duplicados (mismo lugar en radio de 1km)
      const isDuplicate = locations.some((loc) => {
        const distance = calculateDistance(
          locationData.coords.latitude,
          locationData.coords.longitude,
          loc.coords.latitude,
          loc.coords.longitude
        );
        return distance < 1; // 1km
      });

      if (!isDuplicate) {
        locations.push(locationData);
        // Mantener solo las últimas 10 ubicaciones
        const recentLocations = locations.slice(-10);
        localStorage.setItem("savedLocations", JSON.stringify(recentLocations));
      }

      return locations;
    },
    onSuccess: () => {
      // Invalidar cache para refrescar ubicaciones guardadas
      queryClient.invalidateQueries({ queryKey: ["saved-locations"] });
    },
  });
}

// Función helper para calcular distancia entre dos puntos
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
