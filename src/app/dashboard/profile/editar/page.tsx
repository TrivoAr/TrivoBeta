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
              lastname: data.lastname || "",
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
          }
        } catch (error) {}
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

      // Validación del lado del cliente
      if (!firstname?.trim()) {
        alert("❌ Error: El nombre es requerido");
        return;
      }
      if (!lastname?.trim()) {
        alert("❌ Error: El apellido es requerido");
        return;
      }
      if (!email?.trim()) {
        alert("❌ Error: El email es requerido");
        return;
      }
      if (!telnumber?.trim()) {
        alert("❌ Error: El teléfono es requerido");
        return;
      }

      const fullTelNumber = telnumber.startsWith("+549")
        ? telnumber
        : `+549${telnumber}`;

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: formData.firstname.trim(),
          lastname: formData.lastname.trim(),
          telnumber: fullTelNumber,
          email: formData.email.trim(),
          dni: formData.dni?.trim() || "",
          instagram: formData.instagram?.trim() || "",
          facebook: formData.facebook?.trim() || "",
          twitter: formData.twitter?.trim() || "",
          bio: formData.bio?.trim() || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Mostrar error detallado del servidor
        const errorMessage = data.details || data.error || "Error desconocido";

        if (data.missingFields) {
          alert(`❌ Datos incompletos\n\nFaltan: ${data.missingFields.join(", ")}`);
        } else if (response.status === 400) {
          alert(`❌ Error de validación\n\n${errorMessage}`);
        } else if (response.status === 409) {
          alert(`❌ Dato duplicado\n\n${errorMessage}`);
        } else if (response.status === 500) {
          alert(`❌ Error del servidor\n\n${errorMessage}\n\nPor favor, intenta nuevamente o contacta a soporte.`);
        } else {
          alert(`❌ Error ${response.status}\n\n${errorMessage}`);
        }

        return;
      }

      alert("✅ Perfil actualizado correctamente\n\nSe cerrará la sesión para aplicar los cambios.");
      signOut({ callbackUrl: "/login" });
    } catch (error: any) {
      alert(`❌ Error al guardar los cambios\n\n${error.message || "Error de conexión"}`);
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
    <div className="w-[390px] min-h-screen bg-background px-4 pt-6 pb-24 flex flex-col items-center text-foreground">
      <h1 className="text-2xl font-medium  w-full text-left mb-4">
        Editar Perfil
      </h1>

      <img
        src={
          profileImage ||
          session?.user?.imagen ||
          `https://ui-avatars.com/api/?name=${session?.user?.firstname || "User"}&length=1&background=random&color=fff&size=128`
        }
        alt="Avatar"
        className="w-32 h-32 rounded-full object-cover mb-4"
      />
      <input
        type="file"
        onChange={handleImageUpload}
        className="mb-4 text-sm"
      />
      <label className="block w-full">
        Numero de documento (DNI)
        <input
          type="text"
          name="dni"
          value={formData.dni}
          onChange={handleChange}
          className="w-full p-3 rounded-lg border border-gray-300 mb-3"
          placeholder="Numero de documento (opcional)"
        />
      </label>
      <label className="block w-full">
        Nombre <span className="text-red-500">*</span>
        <input
          type="text"
          name="firstname"
          value={formData.firstname}
          onChange={handleChange}
          className="w-full p-3 rounded-lg border border-gray-300 mb-3"
          placeholder="Nombre"
          required
        />
      </label>
      <label className="block w-full">
        Apellido <span className="text-red-500">*</span>
        <input
          type="text"
          name="lastname"
          value={formData.lastname}
          onChange={handleChange}
          className="w-full p-3 rounded-lg border border-gray-300 mb-3"
          placeholder="Apellido"
          required
        />
      </label>

      <label className="block w-full">
        Numero de Telefono <span className="text-red-500">*</span>
        <input
          type="tel"
          name="telnumber"
          value={formData.telnumber}
          onChange={handleChange}
          className="w-full p-3 rounded-lg border border-gray-300 mb-3"
          placeholder="3814859697 (sin +549)"
          required
        />
      </label>

      <label className="block w-full">
        Correo electronico <span className="text-red-500">*</span>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-3 rounded-lg border border-gray-300 mb-3"
          placeholder="correo@ejemplo.com"
          required
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

      {session?.user?.rol === "dueño de academia" ? (
        <label className="block w-full">
          Biografia profesor
          <input
            type="text"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Dejanos una descripcion de tu trayectoria..."
            className="w-full p-3 rounded-lg border border-gray-300 mb-3"
          />
        </label>
      ) : null}

      <div className="w-full text-sm text-gray-500 mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="font-semibold mb-1">⚠️ Campos requeridos (*)</p>
        <p>Los campos marcados con asterisco son obligatorios. Asegúrate de completarlos antes de guardar.</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="w-[140px] mt-[40px] py-2 rounded-full bg-[#C95100] text-white font-bold shadow-md"
        >
          Guardar
        </button>
        <button
          onClick={() => router.back()}
          className="w-[140px] mt-[40px] py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 rounded-full font-bold shadow"
        >
          Cancelar
        </button>
      </div>
      <div className="pb-[30px]"></div>
    </div>
  );
}

export default EditProfilePage;
