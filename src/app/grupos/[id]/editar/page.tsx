"use client";

import { useEffect, useState, FormEvent } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { saveGroupImage } from "@/app/api/grupos/saveGroupImage";

export default function EditarGrupo({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre_grupo: "",
    nivel: "",
    ubicacion: "",
    direccion: "",
    horario: "",
    clas: "",
    descripcion: "",
    objetivos: "",
    cuota_mensual: "",
    tipo_grupo: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);

  // Obtener los datos del grupo
  const fetchGrupo = async () => {
    try {
      const response = await axios.get(`/api/grupos/${params.id}`);
      setFormData(response.data.grupo);
      toast.success("Datos cargados con éxito");
    } catch (error) {
      console.error("Error al cargar los datos:", error);
      toast.error("Error al cargar los datos del grupo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrupo();
  }, []);

  // Manejar el envío del formulario
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
        const response = await axios.patch(`/api/grupos/${params.id}`, formData);
      if (response.status === 200) {
        toast.success("¡Grupo actualizado con éxito!");
        router.push("/dashboard");
      } else {
        throw new Error("Error al actualizar el grupo");
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await saveGroupImage(file, params.id);
      setProfileImage(imageUrl);
      alert("Imagen actualizada con éxito.");
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      alert("Hubo un problema al subir la imagen.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = confirm("¿Estás seguro de que deseas eliminar este grupo?");
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`/api/grupos/${params.id}/eliminar`);
      if (response.status === 200) {
        toast.success("¡Grupo eliminado con éxito!");
        router.push("/dashboard");
      } else {
        throw new Error("Error al eliminar el grupo");
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Error al eliminar el grupo.");
    }
  };

  return (
    <div className="w-[390px] flex flex-col items-center gap-5">
      <Toaster position="top-center" />
      <p className="text-xl font-bold justify-self-center">Editar Grupo</p>

      {loading ? (
        <p className="text-center">Cargando datos...</p>
      ) : (
        <form onSubmit={handleSubmit} className="w-[80%]">
          <div className="relative mb-6">
            <input
              type="text"
              name="nombre_grupo"
              className="form-input peer"
              placeholder=" "
              value={formData.nombre_grupo}
              onChange={handleChange}
              required
            />
            <label className="form-label">Nombre del Grupo</label>
          </div>
          {/* Campos adicionales */}
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
              name="tipo_grupo"
              className="form-input peer"
              value={formData.tipo_grupo}
              onChange={handleChange}
              required
            >
              <option value="nivel">Nivel</option>
              <option value="distancia">Distancia</option>
              <option value="otros">Otros</option>
            </select>
            <label className="form-label">Tipo de Grupo</label>
          </div>

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
            onClick={handleDelete}
          >
            Eliminar Grupo
          </button>
        </form>
      )}
    </div>
  );
}
