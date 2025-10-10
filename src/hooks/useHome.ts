import { useQuery } from "@tanstack/react-query";
import { ref, getDownloadURL } from "firebase/storage";
import { getStorageInstance } from "@/libs/firebaseConfig";

export interface Academia {
  _id: string;
  nombre_academia: string;
  pais: string;
  provincia: string;
  localidad: string;
  imagenUrl: string;
  precio: string;
  tipo_disciplina: string;
  dueño_id:
    | string
    | {
        _id: string;
        firstname: string;
        lastname: string;
      };
}

export interface SalidaSocial {
  _id: string;
  nombre: string;
  ubicacion: string;
  deporte: string;
  fecha: string;
  hora: string;
  localidad: string;
  precio: string;
  imagen: string;
  cupo: number;
  dificultad?: string;
  creador_id: {
    _id: string;
    firstname: string;
    lastname: string;
  };
  miembros?: Array<{ _id: string }>;
}

/**
 * Helper to get academy image from Firebase Storage
 */
const getAcademyImage = async (
  academyId: string,
  nombre_academia: string
): Promise<string> => {
  try {
    // Try new structure: academias/{academyId}/foto_academia.jpg
    const storage = await getStorageInstance();
    const fileRef = ref(storage, `academias/${academyId}/foto_academia.jpg`);
    return await getDownloadURL(fileRef);
  } catch (error) {
    try {
      // Fallback: academias/{academyId}/profile-image.jpg
      const storage = await getStorageInstance();
      const fallbackRef = ref(
        storage,
        `academias/${academyId}/profile-image.jpg`
      );
      return await getDownloadURL(fallbackRef);
    } catch (fallbackError) {
      // Return ui-avatars placeholder if no image found
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre_academia)}&background=C95100&color=fff&size=310x115`;
    }
  }
};

/**
 * Hook to fetch all academias with Firebase images and caching
 */
export function useAcademias() {
  return useQuery<Academia[]>({
    queryKey: ["academias"],
    queryFn: async () => {
      const res = await fetch("/api/academias");
      if (!res.ok) {
        throw new Error("Failed to fetch academias");
      }
      const data = await res.json();

      // Fetch Firebase images for all academias
      const academiasWithImages = await Promise.all(
        data.map(async (academia: Academia) => {
          const imagenUrl = await getAcademyImage(
            academia._id,
            academia.nombre_academia
          );
          return { ...academia, imagenUrl };
        })
      );

      return academiasWithImages;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook to fetch all salidas sociales with caching
 * Excludes Trekking events (those should be shown in Club del Trekking section)
 */
export function useSalidas() {
  return useQuery<SalidaSocial[]>({
    queryKey: ["salidas"],
    queryFn: async () => {
      const res = await fetch("/api/social");
      if (!res.ok) {
        throw new Error("Failed to fetch salidas");
      }
      const data = await res.json();

      // Filter future events only and exclude Trekking
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return data.filter((salida: SalidaSocial) => {
        if (!salida.fecha) return false;

        // Exclude Trekking events
        if (salida.deporte?.toLowerCase() === "trekking") return false;

        const [year, month, day] = salida.fecha.split("-").map(Number);
        const eventDate = new Date(year, month - 1, day);
        return eventDate >= today;
      });
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch filtered data based on type
 */
export function useHomeData(filter: "all" | "academias" | "salidas" = "all") {
  const academiasQuery = useAcademias();
  const salidasQuery = useSalidas();

  if (filter === "academias") {
    return {
      data: academiasQuery.data || [],
      isLoading: academiasQuery.isLoading,
      error: academiasQuery.error,
      type: "academias" as const,
    };
  }

  if (filter === "salidas") {
    return {
      data: salidasQuery.data || [],
      isLoading: salidasQuery.isLoading,
      error: salidasQuery.error,
      type: "salidas" as const,
    };
  }

  // Combined data
  return {
    data: [...(academiasQuery.data || []), ...(salidasQuery.data || [])],
    isLoading: academiasQuery.isLoading || salidasQuery.isLoading,
    error: academiasQuery.error || salidasQuery.error,
    type: "all" as const,
  };
}
