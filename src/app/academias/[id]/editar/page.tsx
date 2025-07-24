"use client";
import { useEffect, useState, FormEvent } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { saveAcademyImage } from "@/app/api/academias/saveAcademyImage";
import { getAcademyImage } from "@/app/api/academias/getAcademyImage";
import { useSession } from "next-auth/react";
import Skeleton from "react-loading-skeleton";
import AcademiaEditarSkeleton from '@/components/AcademiaEditarSkeleton';

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
    precio: "",
    clase_gratis: false,
    imagen: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true); // Para la carga inicial
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      const imageUrl = await getAcademyImage("profile-image.jpg", params.id);
      setProfileImage(imageUrl);
      setFormData((prev) => ({ ...prev, imagen: imageUrl }));

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
    setIsSubmitting(true);

    try {
      const response = await axios.put(
        `/api/academias/${params.id}/editar`,
        formData
      );

      if (response.status === 200) {
        toast.success("¡Academia actualizada con éxito!");
        router.push("/dashboard"); // Redirige después de actualizar
      } else {
        throw new Error("Error al actualizar la academia");
      }
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof AxiosError) {
        const errorMessage =
          error.response?.data?.message || "Error en la solicitud";
        toast.error(errorMessage);
      } else {
        toast.error("Ocurrió un error desconocido");
      }
    }
  };

  // Manejar cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Manejar eliminación
  const handleDelete = async () => {
    const confirmDelete = confirm(
      "¿Estás seguro de que deseas eliminar esta academia?"
    );
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(
        `/api/academias/${params.id}/eliminar`
      );

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await saveAcademyImage(file, params.id);

      setFormData((prev) => ({
        ...prev,
        imagen: imageUrl,
      }));

      setProfileImage(imageUrl);
      toast.success("Imagen subida con éxito");
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      toast.error("Hubo un problema al subir la imagen.");
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return <AcademiaEditarSkeleton />;
  }

  return (
    <div className="w-[390px] flex flex-col items-center gap-5">
      <Toaster position="top-center" /> {/* Para mostrar los toasts */}
      <div className="relative w-full h-[30px] flex">
        <button
          type="button"
          onClick={() => router.back()}
          className="btnFondo absolute top-2 left-2 text-white p-2 rounded-full shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="black"
            viewBox="0 0 16 16"
            width="24"
            height="24"
          >
            <path
              fillRule="evenodd"
              d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
            />
          </svg>
        </button>
      </div>
      <p className="text-xl font-medium mt-3 justify-self-center">
        Editar Academia
      </p>
    
        <form
          onSubmit={handleSubmit}
          className="max-w-sm mx-auto p-4 space-y-5 rounded-xl  mb-[80px] bg-[#FEFBF9]"
        >
          <input
            type="text"
            name="nombre_academia"
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            placeholder=" "
            value={formData.nombre_academia}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="precio"
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            placeholder=" "
            value={formData.precio}
            onChange={handleChange}
            required
          />

          <select
            name="localidad"
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
            value={formData.pais}
            onChange={handleChange}
          >
            <option value="">Pais</option>
            <option value="Argentina">Argentina</option>
            <option value="Chile">Chile</option>
            <option value="Peru">Peru</option>
            <option value="Uruguay">Uruguay</option>
          </select>

          <select
            name="localidad"
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
            value={formData.provincia}
            onChange={handleChange}
          >
            <option value="">Provincia</option>
            <option value="Tucuman">Tucuman</option>
            <option value="Buenos Aires">Buenos Aires</option>
            <option value="Cordoba">Cordoba</option>
            <option value="Mendoza">Mendoza</option>
          </select>

          <select
            name="localidad"
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
            value={formData.localidad}
            onChange={handleChange}
          >
            <option value="">Localidad</option>
            <option value="San Miguel de Tucuman">San Miguel de Tucuman</option>
            <option value="Yerba Buena">Yerba Buena</option>
            <option value="Tafi Viejo">Tafi Viejo</option>
            <option value="Otros">Otros</option>
          </select>

          <textarea
            name="descripcion"
            placeholder="Descripción"
            value={formData.descripcion}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />

          <select
            name="tipo_disciplina"
            value={formData.tipo_disciplina}
            onChange={handleChange}
            className="w-full p-4  border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="Running">Running</option>
            <option value="Ciclismo">Ciclismo</option>
            <option value="Trekking">Trekking</option>
            <option value="Otros">Otros</option>
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="clase_gratis"
              checked={formData.clase_gratis}
              className="form-checkbox h-5 w-5 text-orange-500"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  clase_gratis: e.target.checked,
                }))
              }
            />
            <span className="text-gray-700">¿Primera clase gratis?</span>
          </label>

          <div>
            <div className="flex flex-col items-center">
              {formData.imagen ? (
                <img
                  src={formData.imagen}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-xl cursor-pointer mb-2"
                  onClick={() => document.getElementById("fileInput")?.click()}
                />
              ) : (
                <div
                  onClick={() => document.getElementById("fileInput")?.click()}
                  className="w-full h-48 border-2 border-dashed border-orange-300 rounded-xl flex flex-col items-center justify-center cursor-pointer text-orange-400 hover:bg-orange-50 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 15a4 4 0 00.88 2.66L5 19h14l1.12-1.34A4 4 0 0021 15V7a4 4 0 00-4-4H7a4 4 0 00-4 4v8z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11v6m0 0l3-3m-3 3l-3-3"
                    />
                  </svg>
                  <span>Agregar imagen</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                id="fileInput"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          <button
            className="bg-[#C95100] text-white font-bold px-4 py-2 w-full mt-4 rounded-[20px] flex gap-1 justify-center disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando cambios" : "Guardar Cambios"}
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

          <button
            type="button"
            className="text-red-500 font-bold px-4 py-2 block w-full mt-4 rounded-[10px]"
            onClick={handleDelete} // Eliminar
          >
            Eliminar Academia
          </button>
        </form>
  
    </div>
  );
}
