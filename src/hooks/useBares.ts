import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Bar {
  _id: string;
  name: string;
  locationCoords: {
    lat: number;
    lng: number;
  };
  logo: string; // Logo/imagen de perfil del bar
  imagenesCarrusel: string[]; // Array de imágenes para el carrusel
  direccion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BarInput {
  name: string;
  locationCoords: {
    lat: number;
    lng: number;
  };
  logo: string; // Logo/imagen de perfil del bar
  imagenesCarrusel: string[]; // Array de imágenes para el carrusel
  direccion?: string;
}

// Hook para obtener bares
export function useBares(params?: {
  lat?: number;
  lng?: number;
  radius?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['bares', params],
    queryFn: async (): Promise<Bar[]> => {
      const searchParams = new URLSearchParams();

      if (params?.lat) searchParams.append('lat', params.lat.toString());
      if (params?.lng) searchParams.append('lng', params.lng.toString());
      if (params?.radius) searchParams.append('radius', params.radius.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      const response = await fetch(`/api/bares?${searchParams}`);
      if (!response.ok) {
        throw new Error('Error al obtener bares');
      }
      return response.json();
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para obtener un bar específico
export function useBar(id: string) {
  return useQuery({
    queryKey: ['bar', id],
    queryFn: async (): Promise<Bar> => {
      const response = await fetch(`/api/bares/${id}`);
      if (!response.ok) {
        throw new Error('Error al obtener bar');
      }
      return response.json();
    },
    enabled: !!id,
    retry: 2,
  });
}

// Hook para crear un bar
export function useCreateBar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (barData: BarInput): Promise<Bar> => {
      const response = await fetch('/api/bares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(barData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear bar');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar todas las queries de bares
      queryClient.invalidateQueries({ queryKey: ['bares'] });
    },
  });
}

// Hook para actualizar un bar
export function useUpdateBar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BarInput> }): Promise<Bar> => {
      const response = await fetch(`/api/bares/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar bar');
      }

      return response.json();
    },
    onSuccess: (updatedBar) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['bares'] });
      queryClient.invalidateQueries({ queryKey: ['bar', updatedBar._id] });
    },
  });
}

// Hook para eliminar un bar
export function useDeleteBar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/bares/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar bar');
      }
    },
    onSuccess: () => {
      // Invalidar queries de bares
      queryClient.invalidateQueries({ queryKey: ['bares'] });
    },
  });
}

// Hook para bares cercanos (usando geolocalización)
export function useBaresCercanos(radius: number = 10) {
  return useQuery({
    queryKey: ['bares-cercanos', radius],
    queryFn: async (): Promise<Bar[]> => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocalización no disponible'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const response = await fetch(
                `/api/bares?lat=${latitude}&lng=${longitude}&radius=${radius}`
              );

              if (!response.ok) {
                throw new Error('Error al obtener bares cercanos');
              }

              const bares = await response.json();
              resolve(bares);
            } catch (error) {
              reject(error);
            }
          },
          (error) => {
            reject(new Error('Error al obtener ubicación'));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutos
          }
        );
      });
    },
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}