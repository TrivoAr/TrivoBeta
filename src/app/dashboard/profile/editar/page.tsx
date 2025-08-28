"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { saveProfileImage } from "@/app/api/profile/saveProfileImage";
import { getProfileImage } from "@/app/api/profile/getProfileImage";

function EditProfilePage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    telnumber: "",
    rol: "",
    instagram: "",
    facebook: "",
    twitter: "",
    bio: "",
    dni: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const router = useRouter();

  useEffect(() => {
  if (session?.user) {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (res.ok) {
          setFormData({
            firstname: data.firstname || "", 
            lastname: data.lastname  || "",
            email: data.email || "",
            telnumber: data.telnumber || "",
            rol: data.role || "",
            instagram: data.instagram || "",
            facebook: data.facebook || "",
            twitter: data.twitter || "",
            bio: data.bio || "",
            dni: data.dni || "",
          });
          // Cargar imagen
          const url = await getProfileImage("profile-image.jpg", data._id);
          setProfileImage(url || data.imagen);
        } else {
          console.error(data.error);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchProfile();
  }
}, [session]);




  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const confirmation = confirm("¿Guardar los cambios?");
    if (!confirmation) return;

    try {
      const { firstname, lastname, email, telnumber } = formData;

      const fullTelNumber = telnumber.startsWith("+549")
        ? telnumber
        : `+549${telnumber}`;

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: formData.firstname || "",
          lastname: formData.lastname || "",
          telnumber: fullTelNumber,
          email,
          dni: formData.dni,
          instagram: formData.instagram,
          facebook: formData.facebook,
          twitter: formData.twitter,
          bio: formData.bio
        }),
      });

      if (!response.ok) throw new Error("Error al actualizar");

      alert("Guardado correctamente. Se cerrará la sesión.");
      signOut();
    } catch (error) {
      alert("Error al guardar los cambios");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const url = await saveProfileImage(file, session?.user.id || "");
      setProfileImage(url);
    } catch {
      alert("Error al subir imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  console.log(formData);

  return (
    <div className="w-[390px] min-h-screen bg-[#fdf8f4] px-4 pt-6 pb-24 flex flex-col items-center text-gray-800">
      <h1 className="text-2xl font-medium  w-full text-left mb-4">
        Editar Perfil
      </h1>

      <img
        src={profileImage || "/assets/icons/default-user.png"}
        alt="Avatar"
        className="w-32 h-32 rounded-full object-cover mb-4"
      />
      <input
        type="file"
        onChange={handleImageUpload}
        className="mb-4 text-sm"
      />
        <label className="block">
        Numero de documento (DNI)
        <input
          type="text"
          name="dni"
          value={formData.dni}
          onChange={handleChange}
          className="w-full p-3 rounded-lg border border-gray-300 mb-3"
          placeholder="Numero de documento"
        />
      </label>
      <label className="block w-full">
        Nombre
        <input
          type="text"
          name="firstname"
          value={formData.firstname}
          onChange={handleChange}
          className="w-full p-3 rounded-lg border border-gray-300 mb-3"
          placeholder="Nombre"
        />
      </label>
         <label className="block w-full">
        Apeliido
        <input
          type="text"
          name="lastname"
          value={formData.lastname}
          onChange={handleChange}
          className="w-full p-3 rounded-lg border border-gray-300 mb-3"
          placeholder="Apellido"
        />
      </label>

      <label className="block w-full">
        Numero de Telefono
        <input
          type="string"
          name="telnumber"
          value={formData.telnumber}
          onChange={handleChange}
          className="w-full p-3 rounded-lg border border-gray-300 mb-3"
          placeholder="3814859697"
        />
      </label>

      <label className="block w-full">
        Correo electronico
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-3 rounded-lg border border-gray-300 mb-3"
          placeholder="Correo electrónico"
        />
      </label>
      <label className="block w-full">
        Instagram usuario
        <input
          type="text"
          name="instagram"
          value={formData.instagram}
          onChange={handleChange}
          placeholder="usuario de instagram"
          className="w-full p-3 rounded-lg border border-gray-300 mb-3"
        />
      </label>

      {session?.user?.role === "dueño de academia" ? (
        <label className="block w-full">
          Biografia profesor
          <input
            type="text"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Dejanos una descripcion de tu trayectoria..."
            className="w-full p-3 rounded-lg border border-gray-300 mb-6"
          />
        </label>
      ) : null}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="w-[140px] mt-[40px] py-2 rounded-full bg-[#C95100] text-white font-bold shadow-md"
        >
          Guardar
        </button>
        <button
          onClick={() => router.back()}
          className="w-[140px] mt-[40px] py-2 bg-gray-400 text-white px-6 rounded-full font-bold shadow"
        >
          Cancelar
        </button>
      </div>
      <div className="pb-[30px]"></div>
    </div>
  );
}

export default EditProfilePage;
