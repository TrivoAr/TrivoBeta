"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopContainer from "@/components/TopContainer";
import { DashboardCard } from "@/components/Dashboard/DashboardCard";
import { Toaster } from "react-hot-toast";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import {
  useMyFavorites,
  useToggleFavorite,
  useDeleteAcademia,
  useDeleteSalidaSocial,
  useMySalidasSociales,
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
  const [selectedLocalidad, setSelectedLocalidad] = useState(
    "San Miguel de Tucuman"
  );
  // Default to 1 (Mis match) if not admin, but we'll handle initial state better if needed. 
  // For now let's default to the first category's index after categories is defined, 
  // but categories is defined later. Let's start with 1 or 0 safely.
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(2);
  // We'll sync this with useEffect or just rely on user interaction. 
  // Ideally we initialize it lazily but categories depends on session.


  // TanStack Query hooks
  const { data: favoritosData, isLoading: isLoadingFavoritos } = useMyFavorites(
    session?.user?.id
  );

  const { data: mySalidas, isLoading: isLoadingMySalidas } = useMySalidasSociales(
    session?.user?.id
  );

  // Mutations
  const toggleFavoriteMutation = useToggleFavorite();
  const deleteAcademiaMutation = useDeleteAcademia();
  const deleteSalidaMutation = useDeleteSalidaSocial();

  // Extract data from queries
  const favoritosAcademias = favoritosData?.academias || [];
  const favoritosSalidas = favoritosData?.salidas || [];
  const favoritosTeams = favoritosData?.teams || [];

  // Loading state
  const loading = isLoadingFavoritos || isLoadingMySalidas;

  // Definir categorías basándose en el rol del usuario
  const getCategories = () => {
    const categories = [{ label: "Mis favoritos", index: 2 }];

    // Si no es alumno (es admin, profe o dueño), mostrar Mis salidas
    if (session?.user?.rol && session.user.rol !== "alumno") {
      categories.push({ label: "Mis salidas", index: 3 });
    }

    return categories;
  };

  const categories = getCategories();

  // Set active category to 2 (Favorites) by default, or 3 if user prefers (logic could be improved)
  useEffect(() => {
    // Default to favorites
    // We could check if there's a stored preference or URL param
  }, []);

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
    const categoryIndex = activeCategoryIndex;

    switch (categoryIndex) {
      case 0: // Mi panel
        return (
          <div className="w-full space-y-4">
            <div className="w-full bg-card rounded-[20px] p-6 shadow-sm border">
              <h3 className="font-semibold text-lg mb-2">Resumen</h3>
              <p className="text-muted-foreground">Bienvenido a tu panel de administración.</p>
            </div>
          </div>
        );

      case 2: // Mis favoritos
        const totalFavoritos =
          favoritosAcademias.length +
          favoritosSalidas.length +
          favoritosTeams.length;

        return (
          <div className="w-full space-y-6">
            {/* Academias Favoritas */}
            {favoritosAcademias.length > 0 && (
              <div className="w-full space-y-4">
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
              <div className="w-full space-y-4">
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
              <div className="w-full space-y-4">
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
              <div className="w-full text-center py-12 text-muted-foreground">
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

      case 3: // Mis salidas (Creado por mi)
        return (
          <div className="w-full space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-foreground">
                Mis Salidas Creadas
              </h3>
              <button
                onClick={() => router.push("/social/crear")}
                className="px-4 py-2 bg-[#C95100] text-white rounded-[15px] text-sm font-medium hover:bg-[#A03D00] transition-colors"
              >
                + Crear nueva
              </button>
            </div>

            {mySalidas && mySalidas.length > 0 ? (
              <div className="w-full space-y-4">
                {mySalidas.map((salida) => (
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
                    teacher="Organizador"
                    type="salida"
                    onClick={() => router.push(`/social/${salida._id}`)}
                    showActions={true}
                    isFavorite={false} // No need to show heart for own events, or could be handled
                    onDelete={() => handleDeleteSalidaSocial(salida._id)}
                    onEdit={() => router.push(`/social/editar/${salida._id}`)}
                    onToggleFavorite={() => { }} // Optional
                  />
                ))}
              </div>
            ) : (
              <div className="w-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                <p>No has creado ninguna salida social aún.</p>
                <button
                  onClick={() => router.push("/social/crear")}
                  className="mt-4 text-[#C95100] font-medium hover:underline"
                >
                  ¡Crea tu primera salida!
                </button>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="w-full text-center py-12 text-muted-foreground">
            <p>Sección en construcción</p>
          </div>
        );
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
        <div className="w-full">
          {/* Navigation Tabs */}
          <div className="mb-6 w-full">
            <div className="flex space-x-1 bg-card rounded-xl p-1 shadow-sm border w-full">
              {categories.map((cat) => (
                <button
                  key={cat.index}
                  onClick={() => setActiveCategoryIndex(cat.index)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeCategoryIndex === cat.index
                    ? "bg-[#C95100] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {categories.find(c => c.index === activeCategoryIndex)?.label}
            </h2>

            {/* Dynamic Content */}
            {loading ? (
              <div className="w-full space-y-4">
                <div className="w-full animate-pulse bg-muted h-[240px] rounded-[20px]"></div>
                <div className="w-full animate-pulse bg-muted h-[240px] rounded-[20px]"></div>
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
