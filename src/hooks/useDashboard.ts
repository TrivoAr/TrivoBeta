import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAcademyImage } from "@/app/api/academias/getAcademyImage";
import { getTeamSocialImage } from "@/app/api/team-social/getTeamSocialImage";

interface Academia {
  _id: string;
  nombre_academia: string;
  pais: string;
  provincia: string;
  localidad: string;
  imagenUrl: string;
  precio: string;
  tipo_disciplina: string;
  dueño_id: string;
}

interface SalidaSocial {
  _id: string;
  nombre: string;
  ubicacion: string;
  deporte: string;
  fecha: string;
  hora: string;
  localidad: string;
  precio: string;
  imagen: string;
  creador_id: string;
}

interface SalidaSocialMatch {
  _id: string;
  nombre: string;
  ubicacion: string;
  deporte: string;
  fecha: string;
  hora: string;
  localidad: string;
  precio: string;
  imagen: string;
  creador_id: {
    _id: string;
    firstname: string;
    lastname: string;
  };
}

interface TeamSocial {
  _id: string;
  nombre: string;
  ubicacion: string;
  deporte: string;
  fecha: string;
  hora: string;
  localidad: string;
  precio: string;
  imagen: string;
  creadorId: string;
}

// Hook para obtener las academias del usuario (Mi Panel)
export function useMyAcademias() {
  return useQuery({
    queryKey: ["my-academias"],
    queryFn: async (): Promise<Academia[]> => {
      const response = await fetch("/api/academias?owner=true");
      if (!response.ok) {
        throw new Error("Error al cargar academias");
      }
      const data = await response.json();

      // Filtrar y procesar las academias
      const filteredAcademias = Array.isArray(data)
        ? data.filter(
            (academia: Academia) => academia._id && academia.nombre_academia
          )
        : [];

      // Obtener imágenes de Firebase para cada academia
      const academiasConImagenes = await Promise.all(
        filteredAcademias.map(async (academia: Academia) => {
          try {
            const imagenUrl = await getAcademyImage(
              "foto_academia.jpg",
              academia._id
            );
            return { ...academia, imagenUrl };
          } catch (error) {
            return {
              ...academia,
              imagenUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(academia.nombre_academia)}&background=C95100&color=fff&size=310x115`,
            };
          }
        })
      );

      return academiasConImagenes;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

// Hook para obtener las salidas sociales del usuario (Mi Panel)
export function useMySalidasSociales(userId?: string) {
  return useQuery({
    queryKey: ["my-salidas-sociales", userId],
    queryFn: async (): Promise<SalidaSocial[]> => {
      if (!userId) return [];

      const response = await fetch("/api/social");
      if (!response.ok) {
        throw new Error("Error al cargar salidas sociales");
      }
      const data = await response.json();

      // Filtrar salidas donde el usuario es el creador
      const filteredSalidas = Array.isArray(data)
        ? data.filter((salida: any) => {
            const creadorId =
              typeof salida.creador_id === "object"
                ? salida.creador_id?._id
                : salida.creador_id;
            return creadorId === userId;
          })
        : [];

      // Procesar imágenes
      return filteredSalidas.map((salida: any) => ({
        ...salida,
        imagen:
          salida.imagen ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(salida.nombre)}&background=C95100&color=fff&size=310x115`,
      }));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useMyTeamSocials(userId?: string) {
  return useQuery({
    queryKey: ["my-team-socials", userId],
    queryFn: async (): Promise<SalidaSocial[]> => {
      if (!userId) return [];

      const response = await fetch("/api/team-social/");
      if (!response.ok) {
        throw new Error("Error al cargar salidas sociales");
      }
      const data = await response.json();

      // Filtrar salidas donde el usuario es el creador
      const filteredSalidas = Array.isArray(data)
        ? data.filter((salida: any) => {
            const creadorId =
              typeof salida.creadorId === "object"
                ? salida.creadorId?._id
                : salida.creadorId;
            return creadorId === userId;
          })
        : [];

      // Procesar imágenes
      return filteredSalidas.map((salida: any) => ({
        ...salida,
        imagen:
          salida.imagen ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(salida.nombre)}&background=C95100&color=fff&size=310x115`,
      }));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para obtener las academias donde soy miembro
export function useMyAcademiaMatches() {
  return useQuery({
    queryKey: ["my-academia-matches"],
    queryFn: async (): Promise<Academia[]> => {
      const response = await fetch("/api/academias/mis");
      if (!response.ok) {
        throw new Error("Error al cargar academias donde soy miembro");
      }
      const data = await response.json();

      // Procesar imágenes para cada academia
      const academiasConImagenes = await Promise.all(
        data.map(async (academia: Academia) => {
          try {
            const imagenUrl = await getAcademyImage(
              "foto_academia.jpg",
              academia._id
            );
            return { ...academia, imagenUrl };
          } catch (error) {
            return {
              ...academia,
              imagenUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(academia.nombre_academia)}&background=C95100&color=fff&size=310x115`,
            };
          }
        })
      );

      return academiasConImagenes;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para obtener los matches del usuario (salidas donde es miembro)
export function useMyMatches() {
  return useQuery({
    queryKey: ["my-matches"],
    queryFn: async (): Promise<{
      salidas: SalidaSocialMatch[];
      teams: TeamSocial[];
      academias: Academia[];
    }> => {
      // Obtener salidas donde soy miembro
      const salidasResponse = await fetch("/api/social/mis-match");
      const teamsResponse = await fetch("/api/team-social/mis");
      const academiasResponse = await fetch("/api/academias/mis");

      if (!salidasResponse.ok || !teamsResponse.ok || !academiasResponse.ok) {
        throw new Error("Error al cargar matches");
      }

      const salidasData = await salidasResponse.json();
      const teamsData = await teamsResponse.json();
      const academiasData = await academiasResponse.json();

      // Procesar salidas
      const salidas = Array.isArray(salidasData)
        ? salidasData.map((salida: any) => ({
            ...salida,
            imagen:
              salida.imagen ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(salida.nombre)}&background=C95100&color=fff&size=310x115`,
          }))
        : [];

      // Procesar teams - obtener imágenes de Firebase
      const teams = Array.isArray(teamsData)
        ? await Promise.all(
            teamsData.map(async (team: TeamSocial) => {
              try {
                const imagenUrl = await getTeamSocialImage(
                  "team-social-image.jpg",
                  team._id
                );
                return { ...team, imagen: imagenUrl };
              } catch (error) {
                return {
                  ...team,
                  imagen: `https://ui-avatars.com/api/?name=${encodeURIComponent(team.nombre)}&background=C95100&color=fff&size=310x115`,
                };
              }
            })
          )
        : [];

      // Procesar academias - obtener imágenes de Firebase
      const academias = Array.isArray(academiasData)
        ? await Promise.all(
            academiasData.map(async (academia: Academia) => {
              try {
                const imagenUrl = await getAcademyImage(
                  "foto_academia.jpg",
                  academia._id
                );
                return { ...academia, imagenUrl };
              } catch (error) {
                return {
                  ...academia,
                  imagenUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(academia.nombre_academia)}&background=C95100&color=fff&size=310x115`,
                };
              }
            })
          )
        : [];

      return { salidas, teams, academias };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para obtener los favoritos del usuario
export function useMyFavorites(userId?: string) {
  return useQuery({
    queryKey: ["my-favorites", userId],
    queryFn: async (): Promise<{
      academias: Academia[];
      salidas: SalidaSocialMatch[];
      teams: TeamSocial[];
    }> => {
      if (!userId) return { academias: [], salidas: [], teams: [] };

      const response = await fetch(`/api/profile/${userId}`);
      if (!response.ok) {
        throw new Error("Error al cargar favoritos");
      }

      const data = await response.json();
      const favoritos = data.favoritos || {};

      const result = {
        academias: [] as Academia[],
        salidas: [] as SalidaSocialMatch[],
        teams: [] as TeamSocial[],
      };

      // Procesar salidas favoritas
      if (favoritos.salidas && favoritos.salidas.length > 0) {
        const salidasPromises = favoritos.salidas.map(
          async (salidaId: string) => {
            try {
              const res = await fetch(`/api/social/${salidaId}`);
              if (!res.ok) return null;
              const salida = await res.json();
              return {
                ...salida,
                imagen:
                  salida.imagen ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(salida.nombre)}&background=C95100&color=fff&size=310x115`,
              };
            } catch {
              return null;
            }
          }
        );

        const salidas = await Promise.all(salidasPromises);
        result.salidas = salidas.filter(Boolean) as SalidaSocialMatch[];
      }

      // Procesar teams favoritos
      if (favoritos.teamSocial && favoritos.teamSocial.length > 0) {
        const teamsPromises = favoritos.teamSocial.map(
          async (teamId: string) => {
            try {
              const res = await fetch(`/api/team-social/${teamId}`);
              if (!res.ok) return null;
              const team = await res.json();
              return {
                ...team,
                imagen:
                  team.imagen ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(team.nombre)}&background=C95100&color=fff&size=310x115`,
              };
            } catch {
              return null;
            }
          }
        );

        const teams = await Promise.all(teamsPromises);
        result.teams = teams.filter(Boolean) as TeamSocial[];
      }

      // Procesar academias favoritas
      if (favoritos.academias && favoritos.academias.length > 0) {
        const academiasPromises = favoritos.academias.map(
          async (academiaId: string) => {
            try {
              const res = await fetch(`/api/academias/${academiaId}`);
              if (!res.ok) return null;
              const response = await res.json();
              const academia = response.academia; // Acceder a la propiedad 'academia' de la respuesta

              // Intentar obtener imagen de Firebase
              try {
                const imagenUrl = await getAcademyImage(
                  "foto_academia.jpg",
                  academia._id
                );
                return { ...academia, imagenUrl };
              } catch (error) {
                return {
                  ...academia,
                  imagenUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(academia.nombre_academia || "Academia")}&background=C95100&color=fff&size=310x115`,
                };
              }
            } catch {
              return null;
            }
          }
        );

        const academias = await Promise.all(academiasPromises);
        result.academias = academias.filter(Boolean) as Academia[];
      }

      return result;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

// Hook para toggle favoritos
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tipo,
      id,
    }: {
      tipo: "academias" | "sociales" | "teamsocial";
      id: string;
    }) => {
      const response = await fetch(`/api/favoritos/${tipo}/${id}`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Error al actualizar favorito");
      }
      return response.json();
    },
    onSuccess: (result, { tipo, id }) => {
      // Invalidar los favoritos para refrescar
      queryClient.invalidateQueries({ queryKey: ["my-favorites"] });

      // Opcionalmente, actualizar otros queries relacionados
      if (tipo === "sociales") {
        queryClient.invalidateQueries({ queryKey: ["social", id] });
      }
    },
  });
}

// Hook para eliminar academia
export function useDeleteAcademia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (academiaId: string) => {
      const response = await fetch(`/api/academias/${academiaId}/eliminar`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Error al eliminar academia");
      }
      return response.json();
    },
    onSuccess: () => {
      // Refrescar las academias
      queryClient.invalidateQueries({ queryKey: ["my-academias"] });
    },
  });
}

// Hook para eliminar salida social
export function useDeleteSalidaSocial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (salidaId: string) => {
      const response = await fetch(`/api/social/${salidaId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Error al eliminar salida social");
      }
      return response.json();
    },
    onSuccess: () => {
      // Refrescar las salidas
      queryClient.invalidateQueries({ queryKey: ["my-salidas-sociales"] });
    },
  });
}
