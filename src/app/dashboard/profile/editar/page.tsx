"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { saveProfileImage } from "@/app/api/profile/saveProfileImage";
import { getProfileImage } from "@/app/api/profile/getProfileImage";

function EditProfilePage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    rol: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      setFormData({
        fullname: `${session.user.fullname}`,
        email: session.user.email,
        rol: session.user.role,
      });

      const loadImage = async () => {
        try {
          const url = await getProfileImage("profile-image.jpg", session.user.id);
          setProfileImage(url);
        } catch {
          setProfileImage("/assets/icons/default-user.png");
        }
      };
      loadImage();
    }
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const confirmation = confirm("¿Guardar los cambios?");
    if (!confirmation) return;

    try {
      const { fullname, email } = formData;
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: fullname.split(" ")[0],
          lastname: fullname.split(" ")[1] || "",
          email,
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

  return (
    <div className="w-[390px] min-h-screen bg-[#fdf8f4] px-4 pt-6 pb-24 flex flex-col items-center text-gray-800">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent w-full text-left mb-4">
        Editar Perfil
      </h1>

      <img
        src={profileImage || "/assets/icons/default-user.png"}
        alt="Avatar"
        className="w-24 h-24 rounded-2xl object-cover mb-4"
      />
      <input type="file" onChange={handleImageUpload} className="mb-4 text-sm" />

      <input
        type="text"
        name="fullname"
        value={formData.fullname}
        onChange={handleChange}
        className="w-full p-3 rounded-lg border border-gray-300 mb-3"
        placeholder="Nombre completo"
      />
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        className="w-full p-3 rounded-lg border border-gray-300 mb-6"
        placeholder="Correo electrónico"
      />

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="w-[140px] mt-[40px] py-2 rounded-full bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] text-white font-bold shadow-md"
        >
          Guardar
        </button>
        <button
          onClick={() => router.back()}
          className="w-[140px] mt-[40px] py-2 rounded-full bg-gray-400 text-white px-6 py-2 rounded-full font-bold shadow"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default EditProfilePage;
