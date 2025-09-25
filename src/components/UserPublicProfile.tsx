"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaUserCircle,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaRunning,
  FaCrown,
  FaUsers,
} from "react-icons/fa";

interface PublicUser {
  firstname: string;
  lastname: string;
  bio?: string;
  imagen?: string;
  rol: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  createdAt: string;
}

type Props = { userId: string };




export default function UserPublicProfile({ userId }: Props) {
  const { id } = useParams(); // solo funciona con App Router
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [eventosAsistidos, setEventosAsistidos] = useState(0);
  const [salidasComunes, setSalidasComunes] = useState<any>(null);
  const { data: session } = useSession();

  const router = useRouter();

  useEffect(() => {
    if (!id) return;

    // Cargar perfil del usuario
    fetch(`/api/profile/${id}`)
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => {/* Silently handle profile fetch error */})
      .finally(() => setLoading(false));

    // Cargar imagen de perfil
    const loadProfileImage = async () => {
      try {
        const imageUrl = await getProfileImage(
          "profile-image.jpg",
          id
        );
        setProfileImage(imageUrl);
      } catch (error) {
        // Si no hay imagen, usar null para mostrar el ícono por defecto
        setProfileImage(null);
      }
    };

    loadProfileImage();

    // Cargar eventos asistidos
    const loadEventosAsistidos = async () => {
      try {
        const response = await fetch(`/api/usuarios/eventos-asistidos?usuarioId=${id}`);
        if (response.ok) {
          const data = await response.json();
          setEventosAsistidos(data.totalEventos || 0);
        } else {
          setEventosAsistidos(0);
        }
      } catch (error) {
        console.log('Error loading eventos asistidos:', error);
        setEventosAsistidos(0);
      }
    };

    loadEventosAsistidos();

    // Cargar salidas en común (solo si hay una sesión activa)
    const loadSalidasComunes = async () => {
      if (!session?.user?.id || session.user.id === id) {
        setSalidasComunes(null);
        return;
      }

      try {
        const response = await fetch(`/api/usuarios/salidas-comunes?otroUsuarioId=${id}`);
        if (response.ok) {
          const data = await response.json();
          setSalidasComunes(data);
        } else {
          setSalidasComunes(null);
        }
      } catch (error) {
        console.log('Error loading salidas comunes:', error);
        setSalidasComunes(null);
      }
    };

    loadSalidasComunes();
  }, [id, session?.user?.id]);

  if (loading) {
    return (
      <div className="w-[390px] mx-auto bg-background min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#C95100] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-[390px] mx-auto bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUserCircle className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-foreground font-medium">Perfil no encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">El usuario que buscas no existe</p>
        </div>
      </div>
    );
  }

  const getRolBadge = (rol: string) => {
    const rolConfig = {
      admin: { icon: FaCrown, bg: "bg-purple-100 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-400", label: "Administrador" },
      user: { icon: FaRunning, bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", label: "Alumno" },
      trainer: { icon: FaRunning, bg: "bg-green-100 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400", label: "Entrenador" }
    };

    const config = rolConfig[rol as keyof typeof rolConfig] || rolConfig.user;
    const IconComponent = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} ${config.text}`}>
        <IconComponent className="w-3 h-3" />
        <span className="text-xs font-medium">{config.label}</span>
      </div>
    );
  };

  return (
    <div className="w-[390px] mx-auto bg-background min-h-screen">
      {/* Header con gradiente */}
      <div className="relative bg-[#C95100] h-32 rounded-b-[40px]">
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-4 bg-white/20 backdrop-blur-sm shadow-lg rounded-full w-10 h-10 flex justify-center items-center hover:bg-white/30 transition-all"
        >
          <img
            src="/assets/icons/Collapse Arrow.svg"
            alt="callback"
            className="h-5 w-5 filter brightness-0 invert"
          />
        </button>
      </div>

      <div className="px-6 -mt-16 relative z-10">
        {/* Card principal del perfil */}
        <div className="bg-card rounded-3xl shadow-xl border-0 p-6 mb-6">
          {/* Imagen de perfil centrada */}
          <div className="flex flex-col items-center -mt-12 mb-4">
            <div
              className={`relative transform transition-transform duration-200 ${
                profileImage ? 'cursor-pointer hover:scale-105' : 'cursor-default'
              }`}
              onClick={() => profileImage && setShowPreview(true)}
            >
              {profileImage ? (
                <div
                  className="w-28 h-28 rounded-full border-4 border-white shadow-lg"
                  style={{
                    backgroundImage: `url(${profileImage})`,
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-card shadow-lg bg-muted flex items-center justify-center">
                  <FaUserCircle className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Información básica */}
            <h1 className="text-2xl font-bold text-foreground mt-4 text-center">
              {user.firstname} {user.lastname}
            </h1>

            <div className="mt-2">
              {getRolBadge(user.rol)}
            </div>

            <div className="flex items-center gap-2 mt-3 text-muted-foreground">
              <FaCalendarAlt className="w-4 h-4" />
              <span className="text-sm">
                Miembro desde {new Date(user.createdAt).toLocaleDateString('es-AR', {
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Sección Bio */}
        {user.bio && (
          <div className="bg-card rounded-2xl shadow-md p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-semibold text-foreground">Sobre mí</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">{user.bio}</p>
          </div>
        )}

        {/* Redes sociales */}
        {(user.instagram || user.facebook || user.twitter) && (
          <div className="bg-card rounded-2xl shadow-md p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-foreground">Redes sociales</h2>
            </div>

            <div className="flex gap-4">
              {user.instagram && (
                <a
                  href={`https://instagram.com/${user.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <FaInstagram className="w-5 h-5" />
                  <span className="text-sm font-medium">Instagram</span>
                </a>
              )}

              {user.facebook && (
                <a
                  href={`https://facebook.com/${user.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <FaFacebookF className="w-5 h-5" />
                  <span className="text-sm font-medium">Facebook</span>
                </a>
              )}

              {user.twitter && (
                <a
                  href={`https://twitter.com/${user.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-sky-500 text-white px-4 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <FaTwitter className="w-5 h-5" />
                  <span className="text-sm font-medium">Twitter</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Salidas en común */}
        {salidasComunes && salidasComunes.totalComunes > 0 && (
          <div className="bg-card rounded-2xl shadow-md p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <FaUsers className="w-5 h-5 text-[#C95100]" />
              <h2 className="text-lg font-semibold text-foreground">
                Salidas en común ({salidasComunes.totalComunes})
              </h2>
            </div>

            <div className="space-y-3">
              {/* Salidas sociales en común */}
              {salidasComunes.salidasSociales.map((salida: any) => (
                <div key={salida._id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#C95100]/5 to-[#C95100]/10 rounded-lg">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                    {salida.imagen ? (
                      <img
                        src={salida.imagen}
                        alt={salida.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#C95100] to-[#E67E22] flex items-center justify-center">
                        <FaRunning className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground text-sm">{salida.titulo}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(salida.fecha).toLocaleDateString('es-AR')} • Social
                    </p>
                    {salida.ubicacion && (
                      <p className="text-xs text-muted-foreground">{salida.ubicacion}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Salidas de equipo en común */}
              {salidasComunes.salidasTeam.map((salida: any) => (
                <div key={salida._id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                    {salida.imagen ? (
                      <img
                        src={salida.imagen}
                        alt={salida.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <FaUsers className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground text-sm">{salida.titulo}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(salida.fecha).toLocaleDateString('es-AR')} • Equipo
                    </p>
                    {salida.ubicacion && (
                      <p className="text-xs text-muted-foreground">{salida.ubicacion}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estadísticas o información adicional */}
        <div className="bg-card rounded-2xl shadow-md p-5 mb-20">
          <h2 className="text-lg font-semibold text-foreground mb-4">Estadísticas</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center bg-gradient-to-br from-[#C95100]/5 to-[#C95100]/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-[#C95100]">
                {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Días en Trivo</div>
            </div>
            <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {eventosAsistidos}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Eventos asistidos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de preview de imagen */}
      {showPreview && profileImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={() => setShowPreview(false)}
        >
          <div className="relative">
            <img
              src={profileImage}
              alt="Imagen de perfil ampliada"
              className="w-80 h-80 rounded-2xl object-cover shadow-2xl"
            />
            <button
              onClick={() => setShowPreview(false)}
              className="absolute -top-4 -right-4 bg-card rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-accent transition-colors"
            >
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <div className="pb-[100px]"></div>
    </div>
  );
}
