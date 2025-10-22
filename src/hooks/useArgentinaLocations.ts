import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Locality {
  id: string;
  name: string;
  province_id: string;
}

export interface Province {
  id: string;
  name: string;
  localities: Locality[];
}

export interface LocationData {
  province: string;
  locality: string;
  coords: {
    lat: number;
    lng: number;
  };
}

// Datos base de Argentina (principales provincias y localidades)
const ARGENTINA_LOCATIONS: Province[] = [
  {
    id: "tucuman",
    name: "Tucumán",
    localities: [
      {
        id: "san_miguel",
        name: "San Miguel de Tucumán",
        province_id: "tucuman",
      },
      { id: "yerba_buena", name: "Yerba Buena", province_id: "tucuman" },
      { id: "tafi_viejo", name: "Tafí Viejo", province_id: "tucuman" },
      {
        id: "banda_rio_sali",
        name: "Banda del Río Salí",
        province_id: "tucuman",
      },
      { id: "las_talitas", name: "Las Talitas", province_id: "tucuman" },
      { id: "alderetes", name: "Alderetes", province_id: "tucuman" },
      { id: "concepcion", name: "Concepción", province_id: "tucuman" },
      { id: "aguilares", name: "Aguilares", province_id: "tucuman" },
      { id: "monteros", name: "Monteros", province_id: "tucuman" },
      { id: "lules", name: "Lules", province_id: "tucuman" },
    ],
  },
  {
    id: "buenos_aires",
    name: "Buenos Aires",
    localities: [
      {
        id: "caba",
        name: "Ciudad Autónoma de Buenos Aires",
        province_id: "buenos_aires",
      },
      { id: "la_plata", name: "La Plata", province_id: "buenos_aires" },
      {
        id: "mar_del_plata",
        name: "Mar del Plata",
        province_id: "buenos_aires",
      },
      { id: "bahia_blanca", name: "Bahía Blanca", province_id: "buenos_aires" },
      { id: "quilmes", name: "Quilmes", province_id: "buenos_aires" },
      { id: "lanus", name: "Lanús", province_id: "buenos_aires" },
      { id: "san_isidro", name: "San Isidro", province_id: "buenos_aires" },
      {
        id: "vicente_lopez",
        name: "Vicente López",
        province_id: "buenos_aires",
      },
      { id: "avellaneda", name: "Avellaneda", province_id: "buenos_aires" },
      { id: "tigre", name: "Tigre", province_id: "buenos_aires" },
    ],
  },
  {
    id: "cordoba",
    name: "Córdoba",
    localities: [
      {
        id: "cordoba_capital",
        name: "Córdoba Capital",
        province_id: "cordoba",
      },
      {
        id: "villa_carlos_paz",
        name: "Villa Carlos Paz",
        province_id: "cordoba",
      },
      { id: "rio_cuarto", name: "Río Cuarto", province_id: "cordoba" },
      { id: "villa_maria", name: "Villa María", province_id: "cordoba" },
      { id: "san_francisco", name: "San Francisco", province_id: "cordoba" },
      { id: "alta_gracia", name: "Alta Gracia", province_id: "cordoba" },
      { id: "jesus_maria", name: "Jesús María", province_id: "cordoba" },
      { id: "la_falda", name: "La Falda", province_id: "cordoba" },
      { id: "villa_allende", name: "Villa Allende", province_id: "cordoba" },
      { id: "cosquin", name: "Cosquín", province_id: "cordoba" },
    ],
  },
  {
    id: "santa_fe",
    name: "Santa Fe",
    localities: [
      {
        id: "santa_fe_capital",
        name: "Santa Fe Capital",
        province_id: "santa_fe",
      },
      { id: "rosario", name: "Rosario", province_id: "santa_fe" },
      { id: "rafaela", name: "Rafaela", province_id: "santa_fe" },
      { id: "reconquista", name: "Reconquista", province_id: "santa_fe" },
      { id: "venado_tuerto", name: "Venado Tuerto", province_id: "santa_fe" },
      { id: "esperanza", name: "Esperanza", province_id: "santa_fe" },
      { id: "san_lorenzo", name: "San Lorenzo", province_id: "santa_fe" },
      { id: "casilda", name: "Casilda", province_id: "santa_fe" },
      {
        id: "villa_gobernador_galvez",
        name: "Villa Gobernador Gálvez",
        province_id: "santa_fe",
      },
      { id: "santo_tome", name: "Santo Tomé", province_id: "santa_fe" },
    ],
  },
  {
    id: "mendoza",
    name: "Mendoza",
    localities: [
      {
        id: "mendoza_capital",
        name: "Mendoza Capital",
        province_id: "mendoza",
      },
      { id: "san_rafael", name: "San Rafael", province_id: "mendoza" },
      { id: "godoy_cruz", name: "Godoy Cruz", province_id: "mendoza" },
      { id: "las_heras", name: "Las Heras", province_id: "mendoza" },
      { id: "lujan_de_cuyo", name: "Luján de Cuyo", province_id: "mendoza" },
      { id: "maipu", name: "Maipú", province_id: "mendoza" },
      { id: "san_martin", name: "San Martín", province_id: "mendoza" },
      { id: "tunuyan", name: "Tunuyán", province_id: "mendoza" },
      { id: "rivadavia", name: "Rivadavia", province_id: "mendoza" },
      { id: "general_alvear", name: "General Alvear", province_id: "mendoza" },
    ],
  },
];

// Hook para obtener todas las provincias
export function useProvinces() {
  return useQuery({
    queryKey: ["provinces"],
    queryFn: async (): Promise<Province[]> => {
      // Por ahora usamos datos locales, pero se puede conectar a una API
      return ARGENTINA_LOCATIONS;
    },
    staleTime: Infinity, // Los datos no cambian frecuentemente
    gcTime: 1000 * 60 * 60 * 24, // 24 horas en cache
  });
}

// Hook para obtener localidades de una provincia específica
export function useLocalitiesByProvince(provinceId: string | null) {
  return useQuery({
    queryKey: ["localities", provinceId],
    queryFn: async (): Promise<Locality[]> => {
      if (!provinceId) return [];

      const province = ARGENTINA_LOCATIONS.find((p) => p.id === provinceId);
      return province?.localities || [];
    },
    enabled: !!provinceId,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

// Hook para detectar provincia y localidad desde coordenadas GPS
export function useLocationFromCoords() {
  return useMutation({
    mutationFn: async (coords: {
      lat: number;
      lng: number;
    }): Promise<LocationData> => {
      try {
        // Usar reverse geocoding para obtener información detallada
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=10&addressdetails=1&accept-language=es`,
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

        // Extraer provincia y localidad
        const state = address.state || address.province || "";
        const city =
          address.city ||
          address.town ||
          address.village ||
          address.municipality ||
          address.county ||
          "";

        // Intentar mapear a nuestras provincias conocidas
        const mappedProvince = mapToKnownProvince(state);
        const mappedLocality = mapToKnownLocality(city, mappedProvince);

        return {
          province: mappedProvince || state || "Otra Provincia",
          locality: mappedLocality || city || "Otra Localidad",
          coords,
        };
      } catch (error) {
        // Fallback: detectar provincia por coordenadas aproximadas
        const detectedProvince = detectProvinceByCoords(coords);

        return {
          province: detectedProvince || "Provincia Detectada",
          locality: "Localidad Detectada",
          coords,
        };
      }
    },
  });
}

// Función para mapear nombres de provincias a nuestros IDs
function mapToKnownProvince(stateName: string): string | null {
  const normalizedState = stateName.toLowerCase().trim();

  const mappings: Record<string, string> = {
    tucumán: "tucuman",
    tucuman: "tucuman",
    "buenos aires": "buenos_aires",
    "ciudad autónoma de buenos aires": "buenos_aires",
    caba: "buenos_aires",
    córdoba: "cordoba",
    cordoba: "cordoba",
    "santa fe": "santa_fe",
    mendoza: "mendoza",
  };

  return mappings[normalizedState] || null;
}

// Función para mapear nombres de localidades
function mapToKnownLocality(
  cityName: string,
  provinceId: string | null
): string | null {
  if (!provinceId || !cityName) return null;

  const province = ARGENTINA_LOCATIONS.find((p) => p.id === provinceId);
  if (!province) return null;

  const normalizedCity = cityName.toLowerCase().trim();

  // Buscar coincidencia exacta o parcial
  const locality = province.localities.find((loc) => {
    const normalizedLocality = loc.name.toLowerCase();
    return (
      normalizedLocality.includes(normalizedCity) ||
      normalizedCity.includes(normalizedLocality)
    );
  });

  return locality?.id || null;
}

// Función para detectar provincia por coordenadas (como fallback)
function detectProvinceByCoords(coords: {
  lat: number;
  lng: number;
}): string | null {
  const { lat, lng } = coords;

  // Rangos aproximados de coordenadas para cada provincia
  const provinceRanges: Record<
    string,
    { latMin: number; latMax: number; lngMin: number; lngMax: number }
  > = {
    tucuman: { latMin: -27.8, latMax: -26.0, lngMin: -66.5, lngMax: -64.5 },
    buenos_aires: {
      latMin: -42.0,
      latMax: -33.0,
      lngMin: -63.0,
      lngMax: -56.0,
    },
    cordoba: { latMin: -35.0, latMax: -29.0, lngMin: -66.0, lngMax: -62.0 },
    santa_fe: { latMin: -34.0, latMax: -28.0, lngMin: -63.0, lngMax: -59.0 },
    mendoza: { latMin: -37.5, latMax: -32.0, lngMin: -70.5, lngMax: -66.5 },
  };

  for (const [provinceId, range] of Object.entries(provinceRanges)) {
    if (
      lat >= range.latMin &&
      lat <= range.latMax &&
      lng >= range.lngMin &&
      lng <= range.lngMax
    ) {
      return provinceId;
    }
  }

  return null;
}

// Hook para buscar localidades por texto
export function useSearchLocalities(searchTerm: string) {
  return useQuery({
    queryKey: ["search-localities", searchTerm],
    queryFn: async (): Promise<
      Array<{ province: string; locality: Locality }>
    > => {
      if (!searchTerm || searchTerm.length < 2) return [];

      const results: Array<{ province: string; locality: Locality }> = [];
      const normalizedSearch = searchTerm.toLowerCase().trim();

      ARGENTINA_LOCATIONS.forEach((province) => {
        province.localities.forEach((locality) => {
          if (locality.name.toLowerCase().includes(normalizedSearch)) {
            results.push({ province: province.name, locality });
          }
        });
      });

      return results.slice(0, 10); // Limitar a 10 resultados
    },
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
