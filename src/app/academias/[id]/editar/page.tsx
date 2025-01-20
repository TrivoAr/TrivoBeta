"use client";
import { useEffect, useState, FormEvent } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { saveAcademyImage } from "@/app/api/academias/saveAcademyImage";
import { useSession } from "next-auth/react";

export default function EditarAcademia({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    nombre_academia: "",
    pais: "",
    provincia: "",
    localidad: "",
    descripcion: "",
    tipo_disciplina: "",
    telefono: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null); 
  const [uploadingImage, setUploadingImage] = useState(false); 
  const [loading, setLoading] = useState(true); // Para la carga inicial

  // Función para obtener los datos iniciales
  const fetchAcademia = async () => {
    try {
      const dueñoId = localStorage.getItem("dueño_id"); // Obtener dueño_id del localStorage

      if (!session?.user?.id || session.user.id !== dueñoId) {
        toast.error("No tienes permiso para editar esta academia.");
        router.push("/dashboard"); // Redirige si no está autorizado
        return;
      }
      const response = await axios.get(`/api/academias/${params.id}`);
      setFormData(response.data.academia);
      toast.success("Datos cargados con éxito");
    } catch (error) {
      console.error("Error al cargar los datos:", error);
      toast.error("Error al cargar los datos de la academia.");
    } finally {
      setLoading(false);
    }
  };

  // Manejar la carga inicial
  useEffect(() => {
    fetchAcademia();
  }, []);

  // Manejar el envío del formulario
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await axios.put(`/api/academias/${params.id}/editar`, formData);

      if (response.status === 200) {
        toast.success("¡Academia actualizada con éxito!");
        router.push("/dashboard"); // Redirige después de actualizar
      } else {
        throw new Error("Error al actualizar la academia");
      }
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || "Error en la solicitud";
        toast.error(errorMessage);
      } else {
        toast.error("Ocurrió un error desconocido");
      }
    }
  };

  // Manejar cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Manejar eliminación
  const handleDelete = async () => {
    const confirmDelete = confirm("¿Estás seguro de que deseas eliminar esta academia?");
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`/api/academias/${params.id}/eliminar`);

      if (response.status === 200) {
        toast.success("¡Academia eliminada con éxito!");
        router.push("/dashboard"); // Redirige después de eliminar
      } else {
        throw new Error("Error al eliminar la academia");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Error al eliminar la academia.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const academyId = params.id;  // Asignamos el ID de la academia
  
    if (!academyId) {
      alert("ID de academia no disponible.");
      return;
    }
  
    try {
      setUploadingImage(true);
      const imageUrl = await saveAcademyImage(file, academyId);
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
    <div className="w-[390px] flex flex-col items-center gap-5">
      <Toaster position="top-center" /> {/* Para mostrar los toasts */}
      <p className="text-xl font-bold justify-self-center">Editar Academia</p>
      
      {loading ? (
        <p className="text-center">Cargando datos...</p>
      ) : (
        <form onSubmit={handleSubmit} className="w-[80%]">
          <div className="relative mb-6">
            <input
              type="text"
              name="nombre_academia"
              className="form-input peer"
              placeholder=" "
              value={formData.nombre_academia}
              onChange={handleChange}
              required
            />
            <label className="form-label">Nombre</label>
          </div>

          <div className="relative mb-6">
            <input
              type="text"
              name="pais"
              className="form-input peer"
              placeholder=" "
              value={formData.pais}
              onChange={handleChange}
              required
            />
            <label className="form-label">País</label>
          </div>

          <div className="relative mb-6">
            <input
              type="text"
              name="provincia"
              className="form-input peer"
              placeholder=" "
              value={formData.provincia}
              onChange={handleChange}
              required
            />
            <label className="form-label">Provincia</label>
          </div>

          <div className="relative mb-6">
            <input
              type="text"
              name="localidad"
              className="form-input peer"
              placeholder=" "
              value={formData.localidad}
              onChange={handleChange}
              required
            />
            <label className="form-label">Localidad</label>
          </div>

          <div className="relative mb-6">
            <textarea
              name="descripcion"
              className="form-input peer"
              placeholder=" "
              value={formData.descripcion}
              onChange={handleChange}
            ></textarea>
            <label className="form-label">Descripción</label>
          </div>

          <div className="relative mb-6">
            <select
              name="tipo_disciplina"
              className="form-input peer"
              value={formData.tipo_disciplina}
              onChange={handleChange}
              required
            >
              <option value="running">Running</option>
              <option value="trekking">Trekking</option>
              <option value="otros">Ciclismo</option>
            </select>
            <label className="form-label">Tipo de disciplina</label>
          </div>

          <div className="relative mb-6">
            <input
              type="text"
              name="telefono"
              className="form-input peer"
              placeholder=" "
              value={formData.telefono}
              onChange={handleChange}
            />
            <label className="form-label">Teléfono</label>
          </div>
           {/* Sección de subida de imagen */}
           <div className="mt-4 text-[#E5E5E5]">
                      <input
                        type="file"
                        onChange={handleImageUpload}
                        accept="image/*"
                        disabled={uploadingImage}
                      />
                      {uploadingImage && <p>Subiendo imagen...</p>}
                    </div>
          <button className="bg-[#FF9A3D] text-[#333] font-bold px-4 py-2 block w-full mt-4 rounded-[10px]">
            Guardar Cambios
          </button>

          <button
            type="button"
            className="bg-red-500 text-white font-bold px-4 py-2 block w-full mt-4 rounded-[10px]"
            onClick={handleDelete} // Eliminar
          >
            Eliminar Academia
          </button>
        </form>
      )}
    </div>
  );
}
