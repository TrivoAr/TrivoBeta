"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import TopContainer from "@/components/TopContainer";
import { useRouter } from "next/navigation";
import { saveProfileImage } from "@/app/api/profile/saveProfileImage";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import Link from "next/link";
import { FaInstagram, FaFacebookF, FaXTwitter } from "react-icons/fa6";
import { Pencil } from "lucide-react";

function ProfilePage() {
  const { data: session, status } = useSession();
  const [showPersonalData, setShowPersonalData] = useState(false);
  const [showObjectives, setShowObjectives] = useState(false); // Estado para los objetivos
  const [isEditing, setIsEditing] = useState(false); // Estado para edición
  const [formData, setFormData] = useState({
    fullname: session?.user.fullname || "",
    email: session?.user.email || "",
    rol: session?.user.role || "",
    instagram: session?.user.instagram || "",
    facebook: session?.user.facebook || "",
    twitter: session?.user.twitter || "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  // Actualizar formData cuando la sesión cambie
  useEffect(() => {
    if (session?.user) {
      setFormData({
        fullname: `${session.user.fullname || ""}`,
        email: session.user.email || "",
        rol: session.user.role || "",
        instagram: session.user.instagram || "",
        facebook: session.user.facebook || "",
        twitter: session.user.twitter || "",
      });
    }
    const loadProfileImage = async () => {
      try {
        const imageUrl = await getProfileImage(
          "profile-image.jpg",
          session.user.id
        );
        setProfileImage(imageUrl);
      } catch (error) {
        console.error("Error al obtener la imagen del perfil:", error);
        // Puedes agregar una imagen predeterminada en caso de error
        setProfileImage(session.user.imagen);
      }
    };

    loadProfileImage();
  }, [session]);

  const horaActual = new Date().getHours();

  let saludo;
  if (horaActual >= 6 && horaActual < 12) {
    saludo = "Buen día";
  } else if (horaActual >= 12 && horaActual < 20) {
    saludo = "Buenas tardes";
  } else {
    saludo = "Buenas noches";
  }

  const handleShowPersonalData = () => {
    setShowPersonalData((prev) => !prev);
  };

  const handleShowObjectives = () => {
    setShowObjectives((prev) => !prev);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
  };

  const handleSave = async () => {
    const confirmation = window.confirm(
      "¿Estás seguro de que deseas guardar los cambios?"
    );
    if (!confirmation) return;

    try {
      const { fullname, email } = formData; // Excluir 'rol' aquí
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: fullname.split(" ")[0],
          lastname: fullname.split(" ")[1],
          email,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el perfil");
      }

      // Actualiza los datos de la sesión después de guardar los cambios
      const updatedUser = await response.json();
      setFormData({
        fullname: `${updatedUser.firstname} ${updatedUser.lastname}`,
        email: updatedUser.email,
        rol: updatedUser.rol,
        instagram: updatedUser.instagram,
        facebook: updatedUser.facebook,
        twitter: updatedUser.twitter,
      });

      // Si la actualización fue exitosa, se desactiva el modo de edición y cierra sesión
      setIsEditing(false);

      alert("Los cambios se han guardado correctamente. Se cerrará la sesión.");
      signOut();
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al actualizar el perfil. Inténtalo de nuevo.");
    }
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await saveProfileImage(file, session?.user.id || "");
      setProfileImage(imageUrl); // Actualiza la imagen mostrada
      alert("Imagen actualizada con éxito.");
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      alert("Hubo un problema al subir la imagen.");
    } finally {
      setUploadingImage(false);
    }
  };

    const handleSignOut = async () => {
    setIsSubmitting(true);
    await signOut({ redirect: false });
    window.location.href = "/login";
  };


  return (
    <div className="w-[390px] min-h-screen bg-[#FEFBF9] px-4 pt-6 pb-24 flex flex-col items-center text-gray-800">
      {/* Header */}
      <h1 className="text-3xl font-medium w-full text-left mb-4">
        Perfil
      </h1>

      {/* Avatar */}
      <div className="w-[90%] bg-white border p-5 shadow-md rounded-[20px] flex flex-col items-center mb-4">
        <div onClick={() => setShowPreview(true)}>
          <img
            src={profileImage || session?.user?.imagen}
            alt="Avatar"
            className="w-28 h-28 rounded-full object-cover mb-4 shadow-md"
          />
        </div>
        <div className="">
          <span className="text-2xl w-full text-left ">
            {formData.fullname}
          </span>
        </div>
        <div className="text-sm text-[#666] capitalize">
          {formData.rol}
        </div>
      </div>

      <h2 className="text-sm text-[#989898]  mb-2 w-full text-left">
        Datos personales
      </h2>

      {/* Cards de Perfil y Objetivos */}
      <div className="w-full flex flex-col gap-1 mb-6">
        <div
          className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm"
          onClick={() => router.push("/dashboard/profile/editar")}
        >
          <div className="flex items-center gap-3">
            <img
              src="/assets/icons/Users.svg"
              alt=""
              className="w-full h-full object-cover"
            />
            <span className="text-[#989898] font-medium">Perfil</span>
          </div>
          <span className="text-gray-400 text-[28px]">›</span>
        </div>

        {/* <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
          {/* <div className="flex items-center gap-3">
            <img
                  src='/assets/icons/Goal.svg'
                  alt=""
                  className="w-full h-full object-cover"
                />
            <span className="text-[#989898] font-medium">Objetivos</span>
          </div> 
          <span className="text-gray-400 text-[28px]">›</span>
        </div> */}
      </div>

      {/* Redes */}
      <h2 className="text-sm text-gray-500 mb-3 w-full text-left">Redes</h2>
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-1">
          <a
            href={`https://www.instagram.com/${formData.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="w-14 h-14 bg-white rounded-xl  flex items-center justify-center shadow-md">
              <FaInstagram className="text-xl text-gray-600 w-7 h-7" />
            </div>
          </a>
        </div>
        <div className="flex flex-col items-center gap-1">
          {/* Instagram tiene <a>, pero estos no */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md">
              <FaFacebookF className="text-xl text-gray-600 w-7 h-7" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md">
            <FaXTwitter className="text-xl text-gray-600 w-7 h-7" />
          </div>
        </div>
      </div>
      <div className="text-center pt-4">
        {/* <button
         
          className="w-[140px] mt-[40px] py-2 rounded-[20px] bg-[#C95100] text-white font-bold shadow-md"
        >
          Cerrar sesión
        </button> */}
                <button
            className="bg-[#C95100] text-white font-bold px-4 py-2 w-full mt-4 rounded-[20px] flex gap-1 justify-center disabled:opacity-60"
            type="submit"
             onClick={handleSignOut}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Cerrando sesión" : "Cerrar sesión"}
            {isSubmitting && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
          </button>
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setShowPreview(false)}
        >
          <img
            src={profileImage || "/assets/icons/default-user.png"}
            alt="Avatar grande"
            className="w-[350px] h-[400px] rounded-2xl object-cover shadow-lg"
          />
        </div>
      )}

      {/* Espacio para bottom nav */}
      <div className="mt-auto"></div>
    </div>
  );
}

export default ProfilePage;
