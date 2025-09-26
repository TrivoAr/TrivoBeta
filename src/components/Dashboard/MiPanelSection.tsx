import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { DashboardCard } from "./DashboardCard";
import { getAcademyImage } from "@/app/api/academias/getAcademyImage";
import { getSocialImage } from "@/app/api/social/getSocialImage";

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

// Funciones para fetching de datos
const fetchMisAcademias = async (userId: string): Promise<Academia[]> => {
  const response = await fetch(`/api/academias?owner=true`);
  if (!response.ok) throw new Error("Error al obtener academias");

  const data = await response.json();
  const filteredData = Array.isArray(data)
    ? data.filter(
        (academia: Academia) => academia._id && academia.nombre_academia
      )
    : [];

  // Obtener imágenes de Firebase para cada academia
  const academiasConImagenes = await Promise.all(
    filteredData.map(async (academia: Academia) => {
      try {
        const imagenUrl = await getAcademyImage(
          "profile-image.jpg",
          academia._id
        );
        return { ...academia, imagenUrl };
      } catch (error) {
        return {
          ...academia,
          imagenUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(academia.nombre_academia)}&background=C76C01&color=fff&size=310x115`,
        };
      }
    })
  );

  return academiasConImagenes;
};

const fetchMisSalidasSociales = async (
  userId: string
): Promise<SalidaSocial[]> => {
  const response = await fetch(`/api/social`);
  if (!response.ok) throw new Error("Error al obtener salidas sociales");

  const rawData = await response.json();
  const data = Array.isArray(rawData)
    ? rawData.filter((salida: SalidaSocial) => salida.creador_id === userId)
    : [];

  // Obtener imágenes para cada salida
  const salidasConImagenes = await Promise.all(
    data.map(async (salida: SalidaSocial) => {
      try {
        const imagenUrl = await getSocialImage("social-image.jpg", salida._id);
        return { ...salida, imagen: imagenUrl };
      } catch (error) {
        return {
          ...salida,
          imagen: `https://ui-avatars.com/api/?name=${encodeURIComponent(salida.nombre)}&background=C76C01&color=fff&size=310x115`,
        };
      }
    })
  );

  return salidasConImagenes;
};

export const MiPanelSection: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [academias, setAcademias] = useState<Academia[]>([]);
  const [salidasSociales, setSalidasSociales] = useState<SalidaSocial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMiPanelData = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const [academiasData, salidasData] = await Promise.all([
        fetchMisAcademias(session.user.id),
        fetchMisSalidasSociales(session.user.id),
      ]);

      setAcademias(academiasData);
      setSalidasSociales(salidasData);
    } catch (error) {
      console.error("Error loading mi panel data:", error);
      toast.error("Error al cargar datos del panel");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadMiPanelData();
    }
  }, [session?.user?.id]);

  const deleteAcademia = async (id: string) => {
    try {
      const response = await fetch(`/api/academias/${id}/eliminar`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar academia");

      toast.success("Academia eliminada correctamente");
      await loadMiPanelData(); // Reload data
    } catch (error) {
      toast.error("Error al eliminar academia");
    }
  };

  const deleteSalidaSocial = async (id: string) => {
    try {
      const response = await fetch(`/api/social/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar salida social");

      toast.success("Salida social eliminada correctamente");
      await loadMiPanelData(); // Reload data
    } catch (error) {
      toast.error("Error al eliminar salida social");
    }
  };

  const handleDeleteAcademia = (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta academia?"))
      return;
    deleteAcademia(id);
  };

  const handleDeleteSalidaSocial = (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta salida social?"))
      return;
    deleteSalidaSocial(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
          <div className="animate-pulse bg-gray-200 h-[240px] rounded-[20px]"></div>
        </div>
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-40"></div>
          <div className="animate-pulse bg-gray-200 h-[240px] rounded-[20px]"></div>
        </div>
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
              onViewMembers={() =>
                router.push(`/academias/${academia._id}/miembros`)
              }
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
          <h3 className="text-lg font-semibold text-gray-800">
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
              onEdit={() => router.push(`/social/editar/${salida._id}`)}
              onDelete={() => handleDeleteSalidaSocial(salida._id)}
              onViewMembers={() =>
                router.push(`/social/miembros/${salida._id}`)
              }
              onScanQR={() => router.push(`/social/${salida._id}/scan`)}
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
};
