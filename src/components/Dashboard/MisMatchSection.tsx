import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { DashboardCard } from "./DashboardCard";
import { getSocialImage } from "@/app/api/social/getSocialImage";
import { getTeamSocialImage } from "@/app/api/team-social/getTeamSocialImage";

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
  creadorId: {
    _id: string;
    firstname: string;
    lastname: string;
  };
}

// Funciones para fetching de datos
const fetchMisSalidas = async (userId: string): Promise<SalidaSocial[]> => {
  const response = await fetch(`/api/social/mis-match`);
  if (!response.ok) throw new Error("Error al obtener salidas");
  
  const rawData = await response.json();
  const data = Array.isArray(rawData) ? rawData : [];

  // Obtener imágenes para cada salida
  const salidasConImagenes = await Promise.all(
    data.map(async (salida: SalidaSocial) => {
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

  return salidasConImagenes;
};

const fetchMisTeamSocial = async (userId: string): Promise<TeamSocial[]> => {
  const response = await fetch(`/api/team-social/mis`);
  if (!response.ok) throw new Error("Error al obtener teams");

  const rawData = await response.json();
  const data = Array.isArray(rawData) ? rawData : [];

  // Obtener imágenes para cada team
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

  return teamsConImagenes;
};

export const MisMatchSection: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [salidas, setSalidas] = useState<SalidaSocial[]>([]);
  const [teamSocial, setTeamSocial] = useState<TeamSocial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMatchData = async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    try {
      const [salidasData, teamsData] = await Promise.all([
        fetchMisSalidas(session.user.id),
        fetchMisTeamSocial(session.user.id)
      ]);
      
      setSalidas(salidasData);
      setTeamSocial(teamsData);
    } catch (error) {
      console.error('Error loading match data:', error);
      toast.error("Error al cargar datos de matches");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadMatchData();
    }
  }, [session?.user?.id]);


  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-[240px] rounded-[20px]"></div>
        <div className="animate-pulse bg-gray-200 h-[240px] rounded-[20px]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Salidas Sociales */}
      {salidas.map((salida) => (
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
      {teamSocial.map((team) => (
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
          showActions={false}
        />
      ))}

      {salidas.length === 0 && teamSocial.length === 0 && (
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
};