import Link from "next/link";
import { Clock, MapPin, Tag, Users, Phone, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { getAcademyImage } from "@/app/api/academias/getAcademyImage";

type AcademiaCard = {
  type: "academia";
  data: {
    _id: string;
    nombre_academia: string;
    descripcion: string;
    tipo_disciplina: string;
    telefono: string;
    imagen?: string;
  };
};

type SalidaSocialCard = {
  type: "salida";
  data: {
    _id: string;
    nombre: string;
    descripcion: string;
    fecha: string;
    localidad: string;
    disciplina: string;
  };
};

type TeamSocialCard = {
  type: "team-social";
  data: {
    _id: string;
    nombre: string;
    descripcion: string;
    disciplina: string;
    lugar: string;
  };
};

type UsuarioCard = {
  type: "usuario";
  data: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    rol: string;
  };
};

type SearchResultCardProps = AcademiaCard | SalidaSocialCard | TeamSocialCard | UsuarioCard;

interface UnifiedSearchResultCardProps {
  type: "academia" | "salida" | "team-social";
  data: any;
}

const getDefaultImage = (type: string, disciplina?: string) => {
  // Imágenes por disciplina (más específicas)
  const disciplinaImages = {
    running: "/assets/icons/pexels-runffwpu-2402761.png",
    Running: "/assets/icons/pexels-runffwpu-2402761.png",
    ciclismo: "/assets/icons/pexels-runffwpu-2402761.png",
    Ciclismo: "/assets/icons/pexels-runffwpu-2402761.png",
    trekking: "/assets/icons/pexels-runffwpu-2402761.png",
    Trekking: "/assets/icons/pexels-runffwpu-2402761.png",
  };

  // Imágenes por tipo de evento
  const typeImages = {
    academia: "/assets/icons/pexels-runffwpu-2402761.png",
    salida: "/assets/icons/pexels-runffwpu-2402761.png",
    "team-social": "/assets/icons/pexels-runffwpu-2402761.png",
  };

  // Prioridad: disciplina específica > tipo de evento > imagen por defecto
  return disciplinaImages[disciplina] || typeImages[type] || "/assets/Logo/Trivo T.png";
};

export default function SearchResultCard({ type, data }: UnifiedSearchResultCardProps) {
  const [imageError, setImageError] = useState(false);
  const [academiaImageUrl, setAcademiaImageUrl] = useState<string | null>(null);

  // Cargar imagen de Firebase para academias
  useEffect(() => {
    if (type === "academia" && data._id) {
      const loadAcademiaImage = async () => {
        try {
          const imageUrl = await getAcademyImage("profile-image.jpg", data._id);
          setAcademiaImageUrl(imageUrl);
        } catch (error) {
          console.error("Error al cargar imagen de academia:", error);
          // No hacer nada, se usará la imagen por defecto
        }
      };

      loadAcademiaImage();
    }
  }, [type, data._id]);

  const getHref = () => {
    switch (type) {
      case "academia":
        return `/academias/${data._id}`;
      case "salida":
        return `/social/${data._id}`;
      case "team-social":
        return `/team-social/${data._id}`;
      default:
        return "#";
    }
  };

  const getImageForItem = () => {
    // Para academias, priorizar imagen de Firebase
    if (type === "academia" && academiaImageUrl && !imageError) {
      return academiaImageUrl;
    }

    // Si hay error de imagen o no hay imagen, usar imagen por defecto
    if (imageError || !data.imagen || data.imagen.trim() === "") {
      let disciplina = "";
      if (type === "academia") disciplina = data.tipo_disciplina;
      else if (type === "salida") disciplina = data.deporte;
      else if (type === "team-social") disciplina = data.deporte;

      return getDefaultImage(type, disciplina);
    }

    // Usar imagen real del evento
    return data.imagen;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const renderCard = () => {
    return (
      <div className="w-full bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow h-[210px]">
        <div className="flex">
          <div className="w-[160px] h-[210px] flex-shrink-0 relative overflow-hidden">
            <img
              src={getImageForItem()}
              alt={type === "academia" ? data.nombre_academia : data.nombre}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {type === "academia" && (
                    <span className="text-xs text-orange-600 font-semibold bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 px-3 py-1 rounded-full">
                      Academia
                    </span>
                  )}
                  {type === "salida" && (
                    <span className="text-xs text-blue-600 font-semibold bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1 rounded-full">
                      Salida Social
                    </span>
                  )}
                  {type === "team-social" && (
                    <span className="text-xs text-green-600 font-semibold bg-green-100 dark:bg-green-900/20 dark:text-green-400 px-3 py-1 rounded-full">
                      Team Social
                    </span>
                  )}
                </div>

                {type === "academia" && (
                  <>
                    <h3 className="font-bold text-lg mb-2 text-foreground">{data.nombre_academia}</h3>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Tag size={14} />
                        {data.tipo_disciplina}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin size={14} />
                        {data.localidad}
                      </p>
                    </div>
                  </>
                )}

                {type === "salida" && (
                  <>
                    <h3 className="font-bold text-lg mb-2 text-foreground">{data.nombre}</h3>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin size={14} />
                        {data.localidad}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock size={14} />
                        {data.fecha}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Tag size={14} />
                        {data.deporte}
                      </p>
                    </div>
                  </>
                )}

                {type === "team-social" && (
                  <>
                    <h3 className="font-bold text-lg mb-2 text-foreground">{data.nombre}</h3>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin size={14} />
                        {data.lugar}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Tag size={14} />
                        {data.deporte}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Link href={getHref()}>
      {renderCard()}
    </Link>
  );
}