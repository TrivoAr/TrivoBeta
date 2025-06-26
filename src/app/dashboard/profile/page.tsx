"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import TopContainer from "@/components/TopContainer";
import { useRouter } from "next/navigation";
import { saveProfileImage } from "@/app/api/profile/saveProfileImage";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import Link from "next/link";
import { FaInstagram, FaFacebookF, FaXTwitter } from 'react-icons/fa6';
import { Pencil } from 'lucide-react'; 

function ProfilePage() {
  const { data: session, status } = useSession();
  const [showPersonalData, setShowPersonalData] = useState(false);
  const [showObjectives, setShowObjectives] = useState(false); // Estado para los objetivos
  const [isEditing, setIsEditing] = useState(false); // Estado para edición
  const [formData, setFormData] = useState({
    fullname: session?.user.fullname || "",
    email: session?.user.email || "",
    rol: session?.user.role || "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();
  
  // Actualizar formData cuando la sesión cambie
  useEffect(() => {
    if (session?.user) {
      setFormData({
        fullname: session.user.fullname || "",
        email: session.user.email || "",
        rol: session.user.role || "",
      });
    }
     const loadProfileImage = async () => {
            try {
              const imageUrl = await getProfileImage("profile-image.jpg", session.user.id);
              setProfileImage(imageUrl);
            } catch (error) {
              console.error("Error al obtener la imagen del perfil:", error);
              // Puedes agregar una imagen predeterminada en caso de error
              setProfileImage("https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg");
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

return (
  <div className="w-[390px] min-h-screen bg-[#FEFBF9] px-4 pt-6 pb-24 flex flex-col items-center text-gray-800">
      {/* Header */}
      <h1 className="text-3xl font-bold bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent w-full text-left mb-4">
  Perfil
</h1>


      {/* Avatar */}
      <img
       src={profileImage || "/assets/icons/default-user.png"}
          alt="Avatar"
        className="w-24 h-24 rounded-2xl object-cover mb-4 shadow-md"
      />

      {/* Nombre + editar */}
      <div className="bg-white rounded-xl px-4 py-2 flex items-center gap-2 shadow-md mb-6">
        <span className="text-2xl font-bold bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent w-full text-left ">{formData.fullname}</span>
        <img
                  src='/assets/icons/Edit.svg'
                  alt=""
                  className="w-[17px] h-[17px] object-cover"
                />
      </div>

      {/* Subtítulo */}
      <h2 className="text-sm text-[#989898]  mb-2 w-full text-left">Datos personales</h2>

      {/* Cards de Perfil y Objetivos */}
      <div className="w-full flex flex-col gap-1 mb-6">
        <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <img
                  src='/assets/icons/Users.svg'
                  alt=""
                  className="w-full h-full object-cover"
                />
            <span className="text-[#989898] font-medium">Perfil</span>
          </div>
          <span className="text-gray-400 text-[28px]">›</span>
        </div>

        <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <img
                  src='/assets/icons/Goal.svg'
                  alt=""
                  className="w-full h-full object-cover"
                />
            <span className="text-[#989898] font-medium">Objetivos</span>
          </div>
          <span className="text-gray-400 text-[28px]">›</span>
        </div>

      </div>

      {/* Redes */}
      <h2 className="text-sm text-gray-500 mb-3 w-full text-left">Redes</h2>
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 bg-white rounded-xl  flex items-center justify-center shadow-md">
            <FaInstagram className="text-xl text-gray-600 w-7 h-7" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md">
            <FaFacebookF className="text-xl text-gray-600 w-7 h-7" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md">
            <FaXTwitter className="text-xl text-gray-600 w-7 h-7" />
          </div>
        </div>
      </div>
      <div className="text-center pt-4">
      <button
        onClick={() => signOut()}
        className="w-[140px] mt-[40px] py-2 rounded-[15px] bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] text-white font-bold shadow-md"
      >
        Cerrar sesión
      </button>
    </div>

      {/* Espacio para bottom nav */}
      <div className="mt-auto"></div>
   
  {/* <main className="bg-[#FEFBF9] min-h-screen px-4 py-6 w-[390px] mx-auto text-black space-y-6">
    <TopContainer />

    
    <section className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-md">
      <div className="w-16 h-16 bg-gray-300 rounded-full overflow-hidden">
        <img
          src={profileImage || "/assets/icons/default-user.png"}
          alt="Avatar"
          className="object-cover w-full h-full"
        />
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-bold">{formData.fullname}</h2>
        <p className="text-sm text-gray-500">{formData.email}</p>
        <p className="text-xs text-gray-400 capitalize">{session?.user.role}</p>
      </div>
    </section>

    
    <section className="bg-white rounded-2xl shadow-md p-4 space-y-4">
      <button
        onClick={handleShowPersonalData}
        className="flex justify-between items-center w-full text-left font-bold"
      >
        Datos Personales
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="#999"
          className={`transition-transform duration-300 ${showPersonalData ? "rotate-90" : ""}`}
        >
          <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
        </svg>
      </button>
      {showPersonalData && (
        <div className="space-y-2 text-sm text-gray-600">
          {!isEditing ? (
            <>
              <p><span className="font-semibold">Nombre: </span>{formData.fullname}</p>
              <p><span className="font-semibold">Email: </span>{formData.email}</p>
              <p><span className="font-semibold">Rol: </span>{session?.user.role}</p>
              <button onClick={handleEditToggle} className="text-[#C76C01] underline text-sm">Editar</button>
            </>
          ) : (
            <>
              <input
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleInputChange}
                placeholder="Nombre completo"
                className="w-full p-2 rounded border border-gray-300"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Correo"
                className="w-full p-2 rounded border border-gray-300"
              />
              <input
                type="file"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="text-xs"
              />
              {uploadingImage && <p className="text-xs text-gray-400">Subiendo imagen...</p>}
              <div className="flex gap-2">
                <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded shadow">
                  Guardar
                </button>
                <button onClick={handleEditToggle} className="bg-gray-400 text-white px-4 py-2 rounded shadow">
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>

    
    <section className="bg-white rounded-2xl shadow-md p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left font-bold"
      >
        Métodos de pago
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="#999"
          className={`transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
        >
          <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-4 space-y-2 text-sm">
          {formData.rol === "dueño de academia" && (
            <button onClick={() => router.push("/mercadopago")} className="w-full text-left text-[#C76C01]">
              Token
            </button>
          )}
          <Link href="/historial">
            <button className="w-full text-left text-[#C76C01]">Historial de Cobros</button>
          </Link>
        </div>
      )}
    </section>

   
    <section className="bg-white rounded-2xl shadow-md p-4">
      <button
        onClick={handleShowObjectives}
        className="flex justify-between items-center w-full text-left font-bold"
      >
        Objetivos
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="#999"
          className={`transition-transform duration-300 ${showObjectives ? "rotate-90" : ""}`}
        >
          <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
        </svg>
      </button>
      {showObjectives && (
        <div className="mt-4 text-sm text-gray-600">
          <p>Correr 10km</p>
        </div>
      )}
    </section>

    
    <div className="text-center pt-4">
      <button
        onClick={() => signOut()}
        className="w-[140px] py-2 rounded-full bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] text-white font-bold shadow-md"
      >
        Cerrar sesión
      </button>
    </div>
  </main> */}
  
   </div>
);

}

export default ProfilePage;
