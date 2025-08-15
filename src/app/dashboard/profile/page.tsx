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
    imagen: session?.user.imagen || "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stravaConnected, setStravaConnected] = useState(false);

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
        imagen: session.user.imagen || "",
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
        imagen: updatedUser.imagen,
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

  useEffect(() => {
    const checkStravaStatus = async () => {
      try {
        const res = await fetch("/api/strava/status");
        const data = await res.json();
        setStravaConnected(data.connected);
        console.log("Strava connected:", data.connected);
      } catch (error) {
        console.error("Error verificando Strava:", error);
      }
    };
    checkStravaStatus();
  }, []);
  console.log("usu", session?.user);

  return (
    <div className="w-[390px] min-h-screen bg-[#FEFBF9] px-4 pt-6 pb-24 flex flex-col items-center text-gray-800">
      {/* Header */}
      <h1 className="text-3xl font-medium w-full text-left mb-4">Perfil</h1>

      {/* Avatar */}
      <div className="w-[90%] bg-white border p-5 shadow-md rounded-[20px] flex flex-col items-center mb-4">
        <div onClick={() => setShowPreview(true)}>
          <img
            src={profileImage || session?.user.imagen}
            alt="Avatar"
            className="w-28 h-28 rounded-full object-cover mb-4 shadow-md"
          />
        </div>
        <div className="">
          <span className="text-2xl w-full text-left ">
            {formData.fullname}
          </span>
        </div>
        <div className="text-sm text-[#666] capitalize">{formData.rol}</div>
      </div>

      <h2 className="text-sm text-[#989898]  mb-2 w-full text-left">
        Datos personales
      </h2>

      {/* Cards de Perfil */}
      <div className="w-full flex flex-col gap-1 mb-6">
        <div
          className="bg-white rounded-[30px] border p-4 flex items-center justify-between shadow-sm"
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
      </div>


      {/* Redes */}
      <h2 className="text-sm text-gray-500 mb-3 w-full text-left">Redes</h2>
      <div className="flex flex-col gap-3 w-full">
        {/* Instagram */}
        <button
          onClick={() =>
            window.open(
              `https://www.instagram.com/${formData.instagram}`,
              "_blank"
            )
          }
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-[30px] border shadow-sm transition 
      ${formData.instagram ? "border bg-gray-100" : "bg-white"}`}
        >
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            height={25}
            width={25}
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              {" "}
              <rect
                x="2"
                y="2"
                width="28"
                height="28"
                rx="6"
                fill="url(#paint0_radial_87_7153)"
              ></rect>{" "}
              <rect
                x="2"
                y="2"
                width="28"
                height="28"
                rx="6"
                fill="url(#paint1_radial_87_7153)"
              ></rect>{" "}
              <rect
                x="2"
                y="2"
                width="28"
                height="28"
                rx="6"
                fill="url(#paint2_radial_87_7153)"
              ></rect>{" "}
              <path
                d="M23 10.5C23 11.3284 22.3284 12 21.5 12C20.6716 12 20 11.3284 20 10.5C20 9.67157 20.6716 9 21.5 9C22.3284 9 23 9.67157 23 10.5Z"
                fill="white"
              ></path>{" "}
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M16 21C18.7614 21 21 18.7614 21 16C21 13.2386 18.7614 11 16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21ZM16 19C17.6569 19 19 17.6569 19 16C19 14.3431 17.6569 13 16 13C14.3431 13 13 14.3431 13 16C13 17.6569 14.3431 19 16 19Z"
                fill="white"
              ></path>{" "}
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M6 15.6C6 12.2397 6 10.5595 6.65396 9.27606C7.2292 8.14708 8.14708 7.2292 9.27606 6.65396C10.5595 6 12.2397 6 15.6 6H16.4C19.7603 6 21.4405 6 22.7239 6.65396C23.8529 7.2292 24.7708 8.14708 25.346 9.27606C26 10.5595 26 12.2397 26 15.6V16.4C26 19.7603 26 21.4405 25.346 22.7239C24.7708 23.8529 23.8529 24.7708 22.7239 25.346C21.4405 26 19.7603 26 16.4 26H15.6C12.2397 26 10.5595 26 9.27606 25.346C8.14708 24.7708 7.2292 23.8529 6.65396 22.7239C6 21.4405 6 19.7603 6 16.4V15.6ZM15.6 8H16.4C18.1132 8 19.2777 8.00156 20.1779 8.0751C21.0548 8.14674 21.5032 8.27659 21.816 8.43597C22.5686 8.81947 23.1805 9.43139 23.564 10.184C23.7234 10.4968 23.8533 10.9452 23.9249 11.8221C23.9984 12.7223 24 13.8868 24 15.6V16.4C24 18.1132 23.9984 19.2777 23.9249 20.1779C23.8533 21.0548 23.7234 21.5032 23.564 21.816C23.1805 22.5686 22.5686 23.1805 21.816 23.564C21.5032 23.7234 21.0548 23.8533 20.1779 23.9249C19.2777 23.9984 18.1132 24 16.4 24H15.6C13.8868 24 12.7223 23.9984 11.8221 23.9249C10.9452 23.8533 10.4968 23.7234 10.184 23.564C9.43139 23.1805 8.81947 22.5686 8.43597 21.816C8.27659 21.5032 8.14674 21.0548 8.0751 20.1779C8.00156 19.2777 8 18.1132 8 16.4V15.6C8 13.8868 8.00156 12.7223 8.0751 11.8221C8.14674 10.9452 8.27659 10.4968 8.43597 10.184C8.81947 9.43139 9.43139 8.81947 10.184 8.43597C10.4968 8.27659 10.9452 8.14674 11.8221 8.0751C12.7223 8.00156 13.8868 8 15.6 8Z"
                fill="white"
              ></path>{" "}
              <defs>
                {" "}
                <radialGradient
                  id="paint0_radial_87_7153"
                  cx="0"
                  cy="0"
                  r="1"
                  gradientUnits="userSpaceOnUse"
                  gradientTransform="translate(12 23) rotate(-55.3758) scale(25.5196)"
                >
                  {" "}
                  <stop stop-color="#B13589"></stop>{" "}
                  <stop offset="0.79309" stop-color="#C62F94"></stop>{" "}
                  <stop offset="1" stop-color="#8A3AC8"></stop>{" "}
                </radialGradient>{" "}
                <radialGradient
                  id="paint1_radial_87_7153"
                  cx="0"
                  cy="0"
                  r="1"
                  gradientUnits="userSpaceOnUse"
                  gradientTransform="translate(11 31) rotate(-65.1363) scale(22.5942)"
                >
                  {" "}
                  <stop stop-color="#E0E8B7"></stop>{" "}
                  <stop offset="0.444662" stop-color="#FB8A2E"></stop>{" "}
                  <stop offset="0.71474" stop-color="#E2425C"></stop>{" "}
                  <stop
                    offset="1"
                    stop-color="#E2425C"
                    stop-opacity="0"
                  ></stop>{" "}
                </radialGradient>{" "}
                <radialGradient
                  id="paint2_radial_87_7153"
                  cx="0"
                  cy="0"
                  r="1"
                  gradientUnits="userSpaceOnUse"
                  gradientTransform="translate(0.500002 3) rotate(-8.1301) scale(38.8909 8.31836)"
                >
                  {" "}
                  <stop offset="0.156701" stop-color="#406ADC"></stop>{" "}
                  <stop offset="0.467799" stop-color="#6A45BE"></stop>{" "}
                  <stop
                    offset="1"
                    stop-color="#6A45BE"
                    stop-opacity="0"
                  ></stop>{" "}
                </radialGradient>{" "}
              </defs>{" "}
            </g>
          </svg>
          <span className="flex-1 text-left text-sm font-medium">
            {formData.instagram ? "Instagram vinculado" : "Vincular Instagram"}
          </span>
        </button>

        {/* Strava */}
        <button
          onClick={() => (window.location.href = "/api/strava/connect")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-[30px] border shadow-sm transition 
      ${stravaConnected ? "bg-gray-100 border" : "bg-white border"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Strava"
            role="img"
            viewBox="0 0 512 512"
            fill="#fc4c01"
            height={25}
            width={25}
          >
            <rect width="512" height="512" rx="15%" fill="#fc4c01"></rect>
            <path
              fill="#ffffff"
              d="M120 288L232 56l112 232h-72l-40-96-40 96z"
            ></path>
            <path
              fill="#fda580"
              d="M280 288l32 72 32-72h48l-80 168-80-168z"
            ></path>
          </svg>
          <span className="flex-1 text-left text-sm font-medium">
            {stravaConnected ? "Strava vinculado" : "Vincular Strava"}
          </span>
        </button>
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
