import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { DashboardCard } from "./DashboardCard";
import { getSocialImage } from "@/app/api/social/getSocialImage";
import { getTeamSocialImage } from "@/app/api/team-social/getTeamSocialImage";
import { getAcademyImage } from "@/app/api/academias/getAcademyImage";

interface FavoritoSalida {
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
    firstname: string;
    lastname: string;
  };
}

interface FavoritoTeam {
  _id: string;
  nombre: string;
  ubicacion: string;
  deporte: string;
  fecha: string;
  hora: string;
  localidad: string;
  precio: string;
  imagen: string;
  creadorId: {
    firstname: string;
    lastname: string;
  };
}

interface FavoritoAcademia {
  _id: string;
  nombre_academia: string;
  pais: string;
  provincia: string;
  localidad: string;
  precio: string;
  tipo_disciplina: string;
  imagenUrl: string;
}

// Función para obtener todos los favoritos
const fetchFavoritos = async (userId: string) => {
  const response = await fetch(`/api/profile/${userId}`);
  if (!response.ok) throw new Error("Error al obtener perfil");

  const data = await response.json();
  const favoritos = data.favoritos || {};

  const results = {
    salidas: [] as FavoritoSalida[],
    teams: [] as FavoritoTeam[],
    academias: [] as FavoritoAcademia[],
  };

  // Fetch salidas favoritas
  if (favoritos.salidas && favoritos.salidas.length > 0) {
    const salidasPromises = favoritos.salidas.map(async (salidaId: string) => {
      try {
        const res = await fetch(`/api/social/${salidaId}`);
        if (!res.ok) return null;

        const salida = await res.json();

        try {
          const imagenUrl = await getSocialImage(
            "social-image.jpg",
            salida._id
          );
          return { ...salida, imagen: imagenUrl };
        } catch (error) {
          return {
            ...salida,
            imagen: `https://ui-avatars.com/api/?name=${encodeURIComponent(salida.nombre)}&background=C95100&color=fff&size=310x115`,
          };
        }
      } catch (error) {
        return null;
      }
    });

    const salidas = await Promise.all(salidasPromises);
    results.salidas = salidas.filter(Boolean) as FavoritoSalida[];
  }

  // Fetch teams favoritos
  if (favoritos.teamSocial && favoritos.teamSocial.length > 0) {
    const teamsPromises = favoritos.teamSocial.map(async (teamId: string) => {
      try {
        const res = await fetch(`/api/team-social/${teamId}`);
        if (!res.ok) return null;

        const team = await res.json();

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
      } catch (error) {
        return null;
      }
    });

    const teams = await Promise.all(teamsPromises);
    results.teams = teams.filter(Boolean) as FavoritoTeam[];
  }

  // Fetch academias favoritas
  if (favoritos.academias && favoritos.academias.length > 0) {
    const academiasPromises = favoritos.academias.map(
      async (academiaId: string) => {
        try {
          const res = await fetch(`/api/academias/${academiaId}`);
          if (!res.ok) return null;

          const academia = await res.json();

          try {
            const imagenUrl = await getAcademyImage(
              "profile-image.jpg",
              academia._id
            );
            return { ...academia, imagenUrl };
          } catch (error) {
            return {
              ...academia,
              imagenUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(academia.nombre_academia)}&background=C95100&color=fff&size=310x115`,
            };
          }
        } catch (error) {
          return null;
        }
      }
    );

    const academias = await Promise.all(academiasPromises);
    results.academias = academias.filter(Boolean) as FavoritoAcademia[];
  }

  return results;
};

export const MisFavoritosSection: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [favoritos, setFavoritos] = useState<{
    salidas: FavoritoSalida[];
    teams: FavoritoTeam[];
    academias: FavoritoAcademia[];
  }>({ salidas: [], teams: [], academias: [] });
  const [isLoading, setIsLoading] = useState(true);

  const loadFavoritos = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const data = await fetchFavoritos(session.user.id);
      setFavoritos(data);
    } catch (error) {
      toast.error("Error al cargar favoritos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadFavoritos();
    }
  }, [session?.user?.id]);

  const handleRemoveFavorite = async (
    type: "salidas" | "teamsocial" | "academias",
    id: string
  ) => {
    try {
      const response = await fetch(`/api/favoritos/${type}/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Eliminado de favoritos");

        // Reload data to update UI
        loadFavoritos();
      } else {
        throw new Error("Error al actualizar favorito");
      }
    } catch (error) {
      toast.error("Error al quitar favorito");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-[240px] rounded-[20px]"></div>
        <div className="animate-pulse bg-gray-200 h-[240px] rounded-[20px]"></div>
      </div>
    );
  }

  const totalFavoritos =
    favoritos.salidas.length +
    favoritos.teams.length +
    favoritos.academias.length;

  return (
    <div className="space-y-4">
      {/* Salidas Favoritas */}
      {favoritos.salidas.map((salida) => (
        <DashboardCard
          key={salida._id}
          id={salida._id}
          title={salida.nombre}
          image={salida.imagen}
          category={salida.deporte}
          location={salida.ubicacion}
          localidad={salida.localidad}
          date={dayjs(salida.fecha).format("DD/MM/YYYY")}
          time={salida.hora}
          price={salida.precio}
          teacher={`${salida.creador_id?.firstname} ${salida.creador_id?.lastname}`}
          type="salida"
          showActions={true}
          isFavorite={true}
          onToggleFavorite={() => handleRemoveFavorite("salidas", salida._id)}
        />
      ))}

      {/* Teams Favoritos */}
      {favoritos.teams.map((team) => (
        <DashboardCard
          key={team._id}
          id={team._id}
          title={team.nombre}
          image={team.imagen}
          category={team.deporte}
          location={team.ubicacion}
          localidad={team.localidad}
          date={dayjs(team.fecha).format("DD/MM/YYYY")}
          time={team.hora}
          price={team.precio}
          teacher={`${team.creadorId?.firstname} ${team.creadorId?.lastname}`}
          type="team"
          showActions={true}
          isFavorite={true}
          onToggleFavorite={() => handleRemoveFavorite("teamsocial", team._id)}
        />
      ))}

      {/* Academias Favoritas */}
      {favoritos.academias.map((academia) => (
        <DashboardCard
          key={academia._id}
          id={academia._id}
          title={academia.nombre_academia}
          image={academia.imagenUrl}
          category={academia.tipo_disciplina}
          location=""
          localidad={academia.localidad}
          price={academia.precio}
          type="academia"
          showActions={true}
          isFavorite={true}
          onToggleFavorite={() =>
            handleRemoveFavorite("academias", academia._id)
          }
        />
      ))}

      {totalFavoritos === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium">No tienes favoritos guardados</p>
          <p className="text-sm mt-2">
            Explora y marca como favoritos las salidas, teams y academias que te
            interesen
          </p>
          <button
            onClick={() => router.push("/home")}
            className="mt-4 px-4 py-2 bg-[#C95100] text-white rounded-[20px] hover:bg-[#A03D00] transition-colors"
          >
            Explorar Eventos
          </button>
        </div>
      )}
    </div>
  );
};
