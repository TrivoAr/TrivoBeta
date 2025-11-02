"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TopContainer from "@/components/TopContainer";
import { DashboardCard } from "@/components/Dashboard/DashboardCard";
import { Toaster } from "react-hot-toast";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import {
  useMyAcademias,
  useMySalidasSociales,
  useMyMatches,
  useMyFavorites,
  useToggleFavorite,
  useDeleteAcademia,
  useDeleteSalidaSocial,
  useMyTeamSocials,
} from "@/hooks/useDashboard";

interface Academia {
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

// Las categorías se definirán dinámicamente basándose en el rol del usuario

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(0);
  const [selectedLocalidad, setSelectedLocalidad] = useState(
    "San Miguel de Tucuman"
  );

  // TanStack Query hooks
  const { data: academias = [], isLoading: isLoadingAcademias } =
    useMyAcademias();
  const { data: salidasSociales = [], isLoading: isLoadingSalidas } =
    useMySalidasSociales(session?.user?.id);
  const { data: matchesData, isLoading: isLoadingMatches } = useMyMatches();
  const { data: teamSocials = [], isLoading: isLoadingTeamMatches } =
    useMyTeamSocials(session?.user?.id);
  const { data: favoritosData, isLoading: isLoadingFavoritos } = useMyFavorites(
    session?.user?.id
  );

  // Mutations
  const toggleFavoriteMutation = useToggleFavorite();
  const deleteAcademiaMutation = useDeleteAcademia();
  const deleteSalidaMutation = useDeleteSalidaSocial();

  // Extract data from queries
  const miMatchSalidas = matchesData?.salidas || [];
  const miMatchTeams = matchesData?.teams || [];
  const miMatchAcademias = matchesData?.academias || [];
  const favoritosAcademias = favoritosData?.academias || [];
  const favoritosSalidas = favoritosData?.salidas || [];
  const favoritosTeams = favoritosData?.teams || [];

  // Loading state - any of the relevant queries loading
  const loading =
    isLoadingAcademias ||
    isLoadingSalidas ||
    isLoadingMatches ||
    isLoadingFavoritos ||
    isLoadingTeamMatches;

  // Definir categorías basándose en el rol del usuario
  const getCategories = () => {
    const userRole = session?.user?.rol;
    const baseCategories = [
      { label: "Mis match", index: 1 },
      { label: "Mis favoritos", index: 2 },
    ];

    if (userRole === "admin") {
      return [{ label: "Mi panel", index: 0 }, ...baseCategories];
    }

    return baseCategories;
  };

  const categories = getCategories();

  const handleDeleteAcademia = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta academia?"))
      return;

    deleteAcademiaMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Academia eliminada correctamente");
      },
      onError: () => {
        toast.error("Error al eliminar academia");
      },
    });
  };

  const handleDeleteSalidaSocial = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta salida social?"))
      return;

    deleteSalidaMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Salida social eliminada correctamente");
      },
      onError: () => {
        toast.error("Error al eliminar salida social");
      },
    });
  };

  const handleToggleFavorite = async (
    tipo: "academias" | "sociales" | "teamsocial",
    id: string
  ) => {
    toggleFavoriteMutation.mutate(
      { tipo, id },
      {
        onSuccess: (result) => {
          if (!result.favorito) {
            toast.success("Eliminado de favoritos");
          } else {
            toast.success("Agregado a favoritos");
          }
        },
        onError: () => {
          toast.error("Error al actualizar favoritos");
        },
      }
    );
  };

  // Redireccionar si no hay sesión
  if (status === "loading") {
    return (
      <div className="app-container min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C95100]"></div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const renderContent = () => {
    // Encontrar la categoría activa por su índice
    const currentCategory = categories[activeCategory];
    const categoryIndex = currentCategory?.index;

    switch (categoryIndex) {
      case 0: // Mi panel
        return (
          <div className="space-y-6">
            {/* Sección: Mis Academias */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Mis Academias
                </h3>
                <button
                  onClick={() => router.push("/academias/crear")}
                  className="text-sm px-3 py-1 bg-[#C95100] text-white rounded-[15px] hover:bg-[#A03D00] transition-colors"
                >
                  + Nueva
                </button>
              </div>

              {academias.length > 0 ? (
                academias.map((academia) => (
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
                    onClick={() => router.push(`/academias/${academia._id}`)}
                    onEdit={() =>
                      router.push(`/academias/${academia._id}/editar`)
                    }
                    onDelete={() => handleDeleteAcademia(academia._id)}
                    onViewMembers={() =>
                      router.push(`/academias/${academia._id}/miembros`)
                    }
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted rounded-[20px]">
                  <p>No has creado academias aún</p>
                </div>
              )}
            </div>

            {/* Sección: Mis Salidas Sociales */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Mis Salidas Sociales
                </h3>
                <button
                  onClick={() => router.push("/social/crear")}
                  className="text-sm px-3 py-1 bg-[#C95100] text-white rounded-[15px] hover:bg-[#A03D00] transition-colors"
                >
                  + Nueva
                </button>
              </div>

              {salidasSociales.length > 0 ? (
                salidasSociales.map((salida) => (
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
                    fecha={salida.fecha}
                    hora={salida.hora}
                    price={salida.precio}
                    type="salida"
                    showActions={true}
                    isOwner={true}
                    onClick={() => router.push(`/social/${salida._id}`)}
                    onEdit={() => router.push(`/social/editar/${salida._id}`)}
                    onDelete={() => handleDeleteSalidaSocial(salida._id)}
                    onViewMembers={() =>
                      router.push(`/social/miembros/${salida._id}`)
                    }
                    onScanQR={() => router.push(`/social/${salida._id}/scan`)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted rounded-[20px]">
                  <p>No has creado salidas sociales aún</p>
                </div>
              )}
            </div>

            {/* Sección: Mis Team Socials */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Mis Socials Teams
                </h3>
                <button
                  onClick={() => router.push("/team-social/crear")}
                  className="text-sm px-3 py-1 bg-[#C95100] text-white rounded-[15px] hover:bg-[#A03D00] transition-colors"
                >
                  + Nueva
                </button>
              </div>

              {teamSocials.length > 0 ? (
                teamSocials.map((salida) => (
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
                    fecha={salida.fecha}
                    hora={salida.hora}
                    price={salida.precio}
                    type="team"
                    showActions={true}
                    isOwner={true}
                    onClick={() => router.push(`/team-social/${salida._id}`)}
                    onEdit={() =>
                      router.push(`/team-social/editar/${salida._id}`)
                    }
                    onDelete={() => handleDeleteSalidaSocial(salida._id)}
                    onViewMembers={() =>
                      router.push(`/team-social/miembros/${salida._id}`)
                    }
                    onScanQR={() =>
                      router.push(`/team-social/${salida._id}/scan`)
                    }
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted rounded-[20px]">
                  <p>No has creado salidas sociales aún</p>
                </div>
              )}
            </div>
          </div>
        );

      case 1: // Mis match
        return (
          <div className="space-y-4">
            {/* Salidas Sociales */}
            {miMatchSalidas.map((salida) => (
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
                onClick={() => router.push(`/social/${salida._id}`)}
                showActions={false}
              />
            ))}

            {/* Teams Sociales */}
            {miMatchTeams.map((team) => (
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
                type="team"
                onClick={() => router.push(`/team-social/${team._id}`)}
                showActions={false}
              />
            ))}

            {/* Academias donde soy miembro */}
            {miMatchAcademias.map((academia) => (
              <DashboardCard
                key={academia._id}
                id={academia._id}
                title={academia.nombre_academia}
                image={academia.imagenUrl}
                category={academia.tipo_disciplina}
                location=""
                localidad={academia.localidad}
                price={academia.precio}
                teacher={
                  typeof academia.dueño_id === "string"
                    ? academia.dueño_id
                    : `${(academia.dueño_id as { firstname: string; lastname: string })?.firstname || ""} ${(academia.dueño_id as { firstname: string; lastname: string })?.lastname || ""}`.trim()
                }
                type="academia"
                onClick={() => router.push(`/academias/${academia._id}`)}
                showActions={false}
              />
            ))}

            {miMatchSalidas.length === 0 &&
              miMatchTeams.length === 0 &&
              miMatchAcademias.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="mb-4">
                    <svg
                      className="mx-auto h-16 w-16 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">
                    No tienes matches activos
                  </p>
                  <p className="text-sm mt-2">
                    Únete a salidas, teams y academias para ver tus matches aquí
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

      case 2: // Mis favoritos
        const totalFavoritos =
          favoritosAcademias.length +
          favoritosSalidas.length +
          favoritosTeams.length;

        return (
          <div className="space-y-6">
            {/* Academias Favoritas */}
            {favoritosAcademias.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Mis Academias Favoritas
                </h3>
                {favoritosAcademias.map((academia) => (
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
                    onClick={() => router.push(`/academias/${academia._id}`)}
                    showActions={true}
                    isFavorite={true}
                    onToggleFavorite={() =>
                      handleToggleFavorite("academias", academia._id)
                    }
                  />
                ))}
              </div>
            )}

            {/* Salidas Sociales Favoritas */}
            {favoritosSalidas.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Mis Salidas Sociales Favoritas
                </h3>
                {favoritosSalidas.map((salida) => (
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
                    onClick={() => router.push(`/social/${salida._id}`)}
                    showActions={true}
                    isFavorite={true}
                    onToggleFavorite={() =>
                      handleToggleFavorite("sociales", salida._id)
                    }
                  />
                ))}
              </div>
            )}

            {/* Teams Sociales Favoritos */}
            {favoritosTeams.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Mis Teams Sociales Favoritos
                </h3>
                {favoritosTeams.map((team) => (
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
                    type="team"
                    onClick={() => router.push(`/team-social/${team._id}`)}
                    showActions={true}
                    isFavorite={true}
                    onToggleFavorite={() =>
                      handleToggleFavorite("teamsocial", team._id)
                    }
                  />
                ))}
              </div>
            )}

            {totalFavoritos === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-16 w-16 text-muted-foreground"
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
                <p className="text-lg font-medium">
                  No tienes favoritos guardados
                </p>
                <p className="text-sm mt-2">
                  Explora y marca como favoritos las salidas, teams y academias
                  que te interesen
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

      default:
        return null;
    }
  };

  return (
    <>
      <Toaster position="top-center" />

      <main className="bg-background min-h-screen text-foreground app-container py-6 space-y-6">
        {/* Header */}
        <TopContainer
          selectedLocalidad={selectedLocalidad}
          setSelectedLocalidad={setSelectedLocalidad}
        />

        {/* Main Content */}
        <div className="px-4">
          {/* Navigation Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-card rounded-xl p-1 shadow-sm border">
              {categories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => setActiveCategory(index)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeCategory === index
                      ? "bg-[#C95100] text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {categories[activeCategory].label}
            </h2>

            {/* Dynamic Content */}
            {loading ? (
              <div className="space-y-4">
                <div className="animate-pulse bg-muted h-[240px] rounded-[20px]"></div>
                <div className="animate-pulse bg-muted h-[240px] rounded-[20px]"></div>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </div>

        {/* Footer spacing */}
        <div className="h-[100px]"></div>
      </main>
    </>
  );
}
