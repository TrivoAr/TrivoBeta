"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getProfileImage } from "@/app/api/profile/getProfileImage"; // Asegúrate de tener esta función para obtener la imagen
import { useParams } from "next/navigation";
import {
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaUserCircle,
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




  // src/components/UserPublicProfile.tsx
type Props = { userId: string };







export default function UserPublicProfile({ userId }: Props) {
  const { id } = useParams(); // solo funciona con App Router
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/profile/${id}`)
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => console.error("Error fetching profile:", err))
      .finally(() => setLoading(false));

     const loadProfileImage = async () => {
          try {
            const imageUrl = await getProfileImage(
              "profile-image.jpg",
              id
            );
            setProfileImage(imageUrl);
          } catch (error) {
            console.error("Error al obtener la imagen del perfil:", error);
            // Puedes agregar una imagen predeterminada en caso de error
          }
        };
    
        loadProfileImage();



  }, [id]);

  if (loading) return <p className="text-center py-10">Cargando perfil...</p>;
  if (!user) return <p className="text-center py-10">Perfil no encontrado</p>;

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen">
      {/* Imagen de perfil */}
      <div className="flex flex-col items-center mb-4 bg-white p-4 rounded-[20px] shadow-md border">
        {user.imagen ? (
          <div className="relative w-24 h-24 rounded-full overflow-hidden shadow" 
            onClick={() => setShowPreview(true)}>
            {/* Imagen de perfil */}
            <Image
              src={profileImage || user.imagen}
              alt={`${user.firstname} ${user.lastname}`}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <FaUserCircle className="w-24 h-24 text-gray-300" />
        )}
        <h1 className="text-xl font-bold mt-3 text-center">
          {user.firstname} {user.lastname}
        </h1>
        <p className="text-sm text-gray-500 capitalize">{user.rol}</p>
        <p className="text-xs text-gray-400 mt-1">
          Miembro desde {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Bio */}
      {user.bio && (
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Sobre mí</h2>
          <p className="text-sm text-gray-600">{user.bio}</p>
        </div>
      )}

      {/* Redes sociales */}
      {(user.instagram || user.facebook || user.twitter) && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            Redes sociales
          </h2>
          <div className="flex gap-4 text-[#C95100] text-xl">
            {user.instagram && (
              <a
                href={`https://instagram.com/${user.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram />
              </a>
            )}
            {user.facebook && (
              <a
                href={`https://facebook.com/${user.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaFacebookF />
              </a>
            )}
            {user.twitter && (
              <a
                href={`https://twitter.com/${user.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaTwitter />
              </a>
            )}
          </div>
        </div>
      )}

           {showPreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setShowPreview(false)}
        >
          <img
            src={profileImage || user.imagen}
            alt="Avatar grande"
            className="w-[350px] h-[400px] rounded-2xl object-cover shadow-lg"
          />
        </div>
      )}
    </div>
  );
}

export type { Props as UserPublicProfileProps };