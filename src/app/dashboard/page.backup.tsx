"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopContainer from "@/components/TopContainer";
import PushManager from "../../components/PushManager";
import { DashboardCard } from "@/components/Dashboard/DashboardCard";
import { Toaster } from "react-hot-toast";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import { getAcademyImage } from "@/app/api/academias/getAcademyImage";
import { getSocialImage } from "@/app/api/social/getSocialImage";
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

const categories = [
  { label: "Mi panel" },
  { label: "Mis match" }, 
  { label: "Mis favoritos" },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(0);
  const [selectedLocalidad, setSelectedLocalidad] = useState("San Miguel de Tucuman");
  
  // Mi Panel states
  const [academias, setAcademias] = useState<Academia[]>([]);
  const [salidasSociales, setSalidasSociales] = useState<SalidaSocial[]>([]);
  
  // Mis Match states
  const [miMatchSalidas, setMiMatchSalidas] = useState<SalidaSocialMatch[]>([]);
  const [miMatchTeams, setMiMatchTeams] = useState<TeamSocial[]>([]);
  
  // Mis Favoritos states
  const [favoritosAcademias, setFavoritosAcademias] = useState<Academia[]>([]);
  const [favoritosSalidas, setFavoritosSalidas] = useState<SalidaSocialMatch[]>([]);
  const [favoritosTeams, setFavoritosTeams] = useState<TeamSocial[]>([]);
  
  const [loading, setLoading] = useState(true);

  const fetchMiPanel = async () => {
    console.log("fetchMiPanel iniciado");
    try {
      // Obtener academias del usuario
      const academiasRes = await fetch(`/api/academias?owner=true`);
      if (academiasRes.ok) {
        const academiasData = await academiasRes.json();
        const filteredAcademias = Array.isArray(academiasData) ? academiasData.filter((academia: Academia) => 
          academia._id && academia.nombre_academia
        ) : [];

        // Obtener imágenes de Firebase para cada academia
        const academiasConImagenes = await Promise.all(
          filteredAcademias.map(async (academia: Academia) => {
            try {
              const imagenUrl = await getAcademyImage("profile-image.jpg", academia._id);
              return { ...academia, imagenUrl };
            } catch (error) {
              return {
                ...academia,
                imagenUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(academia.nombre_academia)}&background=C95100&color=fff&size=310x115`
              };
            }
          })
        );

        setAcademias(academiasConImagenes);
      }

      // Obtener salidas sociales del usuario
      const salidasRes = await fetch(`/api/social`);
      if (salidasRes.ok) {
        const salidasData = await salidasRes.json();
        const filteredSalidas = Array.isArray(salidasData) ? salidasData.filter((salida: any) => 
          salida.creador_id === session?.user?.id
        ) : [];

        // Obtener imágenes para cada salida
        const salidasConImagenes = await Promise.all(
          filteredSalidas.map(async (salida: any) => {
            try {
              const imagenUrl = await getSocialImage("social-image.jpg", salida._id);
              return { ...salida, imagen: imagenUrl };
            } catch (error) {
              return {
                ...salida,
                imagen: `https://ui-avatars.com/api/?name=${encodeURIComponent(salida.nombre)}&background=C95100&color=fff&size=310x115`
              };
            }
          })
        );

        setSalidasSociales(salidasConImagenes);
      }
    } catch (error) {
      toast.error("Error al cargar mi panel");
    }
  };

  const fetchMisMatch = async () => {
    try {
      // Obtener salidas donde soy miembro
      const salidasRes = await fetch(`/api/social/mis-match`);
      if (salidasRes.ok) {
        const salidasData = await salidasRes.json();
        const data = Array.isArray(salidasData) ? salidasData : [];

        // Obtener imágenes para cada salida
        const salidasConImagenes = await Promise.all(
          data.map(async (salida: SalidaSocialMatch) => {
            try {
              const imagenUrl = await getSocialImage("social-image.jpg", salida._id);
              return { ...salida, imagen: imagenUrl };
            } catch (error) {
              return {
                ...salida,
                imagen: `https://ui-avatars.com/api/?name=${encodeURIComponent(salida.nombre)}&background=C95100&color=fff&size=310x115`
              };
            }
          })
        );

        setMiMatchSalidas(salidasConImagenes);
      }

      // Obtener teams donde soy miembro
      const teamsRes = await fetch(`/api/team-social/mis`);
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        const data = Array.isArray(teamsData) ? teamsData : [];

        // Obtener imágenes para each team
        const teamsConImagenes = await Promise.all(
          data.map(async (team: TeamSocial) => {
            try {
              const imagenUrl = await getTeamSocialImage("team-social-image.jpg", team._id);
              return { ...team, imagen: imagenUrl };
            } catch (error) {
              return {
                ...team,
                imagen: `https://ui-avatars.com/api/?name=${encodeURIComponent(team.nombre)}&background=C95100&color=fff&size=310x115`
              };
            }
          })
        );

        setMiMatchTeams(teamsConImagenes);
      }
    } catch (error) {
      toast.error("Error al cargar matches");
    }
  };

  const fetchMisFavoritos = async () => {
    try {
      const response = await fetch(`/api/profile/${session?.user?.id}`);
      if (response.ok) {
        const data = await response.json();
        const favoritos = data.favoritos || {};

        // Fetch salidas favoritas
        if (favoritos.salidas && favoritos.salidas.length > 0) {
          const salidasPromises = favoritos.salidas.map(async (salidaId: string) => {
            try {
              const res = await fetch(`/api/social/${salidaId}`);
              if (!res.ok) return null;
              
              const salida = await res.json();
              
              try {
                const imagenUrl = await getSocialImage("social-image.jpg", salida._id);
                return { ...salida, imagen: imagenUrl };
              } catch (error) {
                return {
                  ...salida,
                  imagen: `https://ui-avatars.com/api/?name=${encodeURIComponent(salida.nombre)}&background=C95100&color=fff&size=310x115`
                };
              }
            } catch (error) {
              return null;
            }
          });
          
          const salidas = await Promise.all(salidasPromises);
          setFavoritosSalidas(salidas.filter(Boolean) as SalidaSocialMatch[]);
        }

        // Fetch teams favoritos
        if (favoritos.teamSocial && favoritos.teamSocial.length > 0) {
          const teamsPromises = favoritos.teamSocial.map(async (teamId: string) => {
            try {
              const res = await fetch(`/api/team-social/${teamId}`);
              if (!res.ok) return null;
              
              const team = await res.json();
              
              try {
                const imagenUrl = await getTeamSocialImage("team-social-image.jpg", team._id);
                return { ...team, imagen: imagenUrl };
              } catch (error) {
                return {
                  ...team,
                  imagen: `https://ui-avatars.com/api/?name=${encodeURIComponent(team.nombre)}&background=C95100&color=fff&size=310x115`
                };
              }
            } catch (error) {
              return null;
            }
          });
          
          const teams = await Promise.all(teamsPromises);
          setFavoritosTeams(teams.filter(Boolean) as TeamSocial[]);
        }

        // Fetch academias favoritas
        if (favoritos.academias && favoritos.academias.length > 0) {
          const academiasPromises = favoritos.academias.map(async (academiaId: string) => {
            try {
              const res = await fetch(`/api/academias/${academiaId}`);
              if (!res.ok) return null;
              
              const academia = await res.json();
              
              try {
                const imagenUrl = await getAcademyImage("profile-image.jpg", academia._id);
                return { ...academia, imagenUrl };
              } catch (error) {
                return {
                  ...academia,
                  imagenUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(academia.nombre_academia)}&background=C95100&color=fff&size=310x115`
                };
              }
            } catch (error) {
              return null;
            }
          });
          
          const academias = await Promise.all(academiasPromises);
          setFavoritosAcademias(academias.filter(Boolean) as Academia[]);
        }
      }
    } catch (error) {
      toast.error("Error al cargar favoritos");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAcademia = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta academia?")) return;
    
    try {
      const response = await fetch(`/api/academias/${id}/eliminar`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Academia eliminada correctamente");
        setAcademias(prev => prev.filter(academia => academia._id !== id));
      }
    } catch (error) {
      toast.error("Error al eliminar academia");
    }
  };

  const handleDeleteSalidaSocial = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta salida social?")) return;
    
    try {
      const response = await fetch(`/api/social/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Salida social eliminada correctamente");
        setSalidasSociales(prev => prev.filter(salida => salida._id !== id));
      }
    } catch (error) {
      toast.error("Error al eliminar salida social");
    }
  };

  useEffect(() => {
    console.log("Dashboard useEffect ejecutado:", { session, userId: session?.user?.id });
    if (session?.user?.id) {
      console.log("Ejecutando funciones de fetch...");
      fetchMiPanel();
      fetchMisMatch();
      fetchMisFavoritos();
    }
  }, [session]);

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
    switch (activeCategory) {
      case 0: // Mi panel
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
        const totalFavoritos = favoritosAcademias.length + favoritosSalidas.length + favoritosTeams.length;
        
        return (
          <div className="space-y-4">
            {/* Academias Favoritas */}
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
              />
            ))}

            {/* Salidas Favoritas */}
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
              />
            ))}

            {/* Teams Favoritos */}
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
          {loading ? (
            <div className="space-y-4">
              <div className="animate-pulse bg-gray-200 h-[240px] rounded-[20px]"></div>
              <div className="animate-pulse bg-gray-200 h-[240px] rounded-[20px]"></div>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>

      {/* Footer spacing */}
      <div className="h-[100px]"></div>
    </div>
  );
}