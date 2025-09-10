"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TopContainer from "@/components/TopContainer";
import PushManager from "../../components/PushManager";
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
  useDeleteSalidaSocial
} from "@/hooks/useDashboard";

export default function DashboardPageWithTanStack() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(0);
  const [selectedLocalidad, setSelectedLocalidad] = useState("San Miguel de Tucuman");

  // TanStack Query hooks
  const { data: academias, isLoading: academiasLoading } = useMyAcademias();
  const { data: salidasSociales, isLoading: salidasLoading } = useMySalidasSociales(session?.user?.id);
  const { data: matches, isLoading: matchesLoading } = useMyMatches();
  const { data: favorites, isLoading: favoritesLoading } = useMyFavorites(session?.user?.id);
  
  // Mutations
  const toggleFavorite = useToggleFavorite();
  const deleteAcademia = useDeleteAcademia();
  const deleteSalidaSocial = useDeleteSalidaSocial();

  // Definir categorías basándose en el rol del usuario
  const getCategories = () => {
    const userRole = session?.user?.rol;
    const baseCategories = [
      { label: "Mis match", index: 1 }, 
      { label: "Mis favoritos", index: 2 },
    ];

    if (userRole === "admin") {
      return [
        { label: "Mi panel", index: 0 },
        ...baseCategories
      ];
    }
    
    return baseCategories;
  };

  const categories = getCategories();

  const handleToggleFavorite = async (tipo: 'academias' | 'sociales' | 'teamsocial', id: string) => {
    try {
      await toggleFavorite.mutateAsync({ tipo, id });
      toast.success("Favorito actualizado");
    } catch (error) {
      toast.error("Error al actualizar favorito");
    }
  };

  const handleDeleteAcademia = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta academia?")) return;
    
    try {
      await deleteAcademia.mutateAsync(id);
      toast.success("Academia eliminada correctamente");
    } catch (error) {
      toast.error("Error al eliminar academia");
    }
  };

  const handleDeleteSalidaSocial = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta salida social?")) return;
    
    try {
      await deleteSalidaSocial.mutateAsync(id);
      toast.success("Salida social eliminada correctamente");
    } catch (error) {
      toast.error("Error al eliminar salida social");
    }
  };

  // Redireccionar si no hay sesión
  if (status === "loading") {
    return (
      <div className="w-[390px] min-h-screen bg-[#FEFBF9] flex items-center justify-center">
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
        const isLoading = academiasLoading || salidasLoading;
        
        if (isLoading) {
          return (
            <div className="space-y-4">
              <div className="animate-pulse bg-gray-200 h-[240px] rounded-[20px]"></div>
              <div className="animate-pulse bg-gray-200 h-[240px] rounded-[20px]"></div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            {/* Sección: Mis Academias */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Mis Academias</h3>
                <button 
                  onClick={() => router.push("/academias/crear")}
                  className="text-sm px-3 py-1 bg-[#C95100] text-white rounded-[15px] hover:bg-[#A03D00] transition-colors"
                >
                  + Nueva
                </button>
              </div>
              
              {academias && academias.length > 0 ? (
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
                    onEdit={() => router.push(`/academias/${academia._id}/editar`)}
                    onDelete={() => handleDeleteAcademia(academia._id)}
                    onViewMembers={() => router.push(`/academias/${academia._id}/miembros`)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-[20px]">
                  <p>No has creado academias aún</p>
                </div>
              )}
            </div>

            {/* Sección: Mis Salidas Sociales */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Mis Salidas Sociales</h3>
                <button 
                  onClick={() => router.push("/social/crear")}
                  className="text-sm px-3 py-1 bg-[#C95100] text-white rounded-[15px] hover:bg-[#A03D00] transition-colors"
                >
                  + Nueva
                </button>
              </div>

              {salidasSociales && salidasSociales.length > 0 ? (
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
                    price={salida.precio}
                    type="salida"
                    showActions={true}
                    onEdit={() => router.push(`/social/editar/${salida._id}`)}
                    onDelete={() => handleDeleteSalidaSocial(salida._id)}
                    onViewMembers={() => router.push(`/social/miembros/${salida._id}`)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-[20px]">
                  <p>No has creado salidas sociales aún</p>
                </div>
              )}
            </div>
          </div>
        );
        
      case 1: // Mis match
        if (matchesLoading) {
          return (
            <div className="space-y-4">
              <div className="animate-pulse bg-gray-200 h-[240px] rounded-[20px]"></div>
              <div className="animate-pulse bg-gray-200 h-[240px] rounded-[20px]"></div>
            </div>
          );
        }

        const { salidas: miMatchSalidas = [], teams: miMatchTeams = [] } = matches || {};

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
                showActions={false}
              />
            ))}

            {miMatchSalidas.length === 0 && miMatchTeams.length === 0 && (
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                    />
                  </svg>
                </div>
                <p className="text-lg font-medium">No tienes matches activos</p>
                <p className="text-sm mt-2">Únete a salidas y teams para ver tus matches aquí</p>
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
        if (favoritesLoading) {
          return (
            <div className="space-y-4">
              <div className="animate-pulse bg-gray-200 h-[240px] rounded-[20px]"></div>
              <div className="animate-pulse bg-gray-200 h-[240px] rounded-[20px]"></div>
            </div>
          );
        }

        const { academias: favoritosAcademias = [], salidas: favoritosSalidas = [], teams: favoritosTeams = [] } = favorites || {};
        const totalFavoritos = favoritosAcademias.length + favoritosSalidas.length + favoritosTeams.length;
        
        return (
          <div className="space-y-6">
            {/* Academias Favoritas */}
            {favoritosAcademias.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Mis Academias Favoritas</h3>
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
                    showActions={true}
                    isFavorite={true}
                    onToggleFavorite={() => handleToggleFavorite('academias', academia._id)}
                  />
                ))}
              </div>
            )}

            {/* Salidas Sociales Favoritas */}
            {favoritosSalidas.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Mis Salidas Sociales Favoritas</h3>
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
                    showActions={true}
                    isFavorite={true}
                    onToggleFavorite={() => handleToggleFavorite('sociales', salida._id)}
                  />
                ))}
              </div>
            )}

            {/* Teams Sociales Favoritos */}
            {favoritosTeams.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Mis Teams Sociales Favoritos</h3>
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
                    showActions={true}
                    isFavorite={true}
                    onToggleFavorite={() => handleToggleFavorite('teamsocial', team._id)}
                  />
                ))}
              </div>
            )}

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
                <p className="text-sm mt-2">Explora y marca como favoritos las salidas, teams y academias que te interesen</p>
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
    <div className="bg-[#FEFBF9] min-h-screen text-black px-4 py-6 space-y-6 w-[390px] mx-auto">
      <Toaster position="top-center" />
      
      {/* Header */}
      <TopContainer selectedLocalidad={selectedLocalidad} setSelectedLocalidad={setSelectedLocalidad} />
      
      {/* Push Manager */}
      <PushManager />

      {/* Main Content */}
      <div className="px-4">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm border">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setActiveCategory(index)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeCategory === index
                    ? "bg-[#C95100] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {categories[activeCategory].label}
          </h2>
          
          {/* Dynamic Content */}
          {renderContent()}
        </div>
      </div>

      {/* Footer spacing */}
      <div className="h-[100px]"></div>
    </div>
  );
}