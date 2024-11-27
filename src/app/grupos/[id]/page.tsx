"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";

type Grupo = {
  _id: string;
  nombre_grupo: string;
  nivel?: string;
  ubicacion?: string;
  direccion?: string;
  horario?: string;
  descripcion?: string;
  tipo_grupo?: string;
};

export default function GrupoDetailPage({ params }: { params: { id: string } }) {
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Grupo | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchGrupo = async () => {
      try {
        const response = await axios.get(`/api/grupos/${params.id}`);
        setGrupo(response.data);
        setFormData(response.data);
      } catch (error) {
        console.error("Error al cargar los detalles del grupo:", error);
        setError("Hubo un problema al cargar los detalles del grupo.");
      }
    };

    fetchGrupo();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar este grupo?")) return;

    try {
      await axios.delete(`/api/grupos/${params.id}`);
      alert("Grupo eliminado con éxito.");
      router.push(`/academias`); // Redirige a la lista de academias
    } catch (error) {
      console.error("Error al eliminar el grupo:", error);
      alert("Hubo un problema al eliminar el grupo.");
    }
  };

  const handleEdit = async () => {
    try {
      // Enviar los datos modificados
      await axios.patch(`/api/grupos/${params.id}`, formData);
      alert("Grupo actualizado con éxito.");
      setIsEditing(false);

      // Actualizar el grupo en el estado con los datos modificados
      setGrupo(formData); // Esto actualiza la vista con los nuevos datos
    } catch (error) {
      console.error("Error al editar el grupo:", error);
      alert("Hubo un problema al editar el grupo.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (formData) {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
  };

  if (error) return <div>{error}</div>;

  if (!grupo) return <div>Cargando...</div>;

  return (
    <div className="p-4">
      {isEditing ? (
        <div>
          <h1 className="text-2xl font-bold mb-4">Editar Grupo</h1>
          <form>
            <div className="mb-4">
              <label className="block text-sm font-medium">Nombre del Grupo</label>
              <input
                type="text"
                name="nombre_grupo"
                value={formData?.nombre_grupo || ""}
                onChange={handleChange}
                className="border rounded w-full p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Horario</label>
              <input
                type="text"
                name="horario"
                value={formData?.horario || ""}
                onChange={handleChange}
                className="border rounded w-full p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Ubicación</label>
              <input
                type="text"
                name="ubicacion"
                value={formData?.ubicacion || ""}
                onChange={handleChange}
                className="border rounded w-full p-2"
              />
            </div>
            <button
              type="button"
              onClick={handleEdit}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="ml-4 bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancelar
            </button>
          </form>
        </div>
      ) : (
        <div>
          <h1 className="text-2xl font-bold mb-4">{grupo.nombre_grupo}</h1>
          <p>
            <strong>Horario:</strong> {grupo.horario || "No especificado"}
          </p>
          <p>
            <strong>Ubicación:</strong> {grupo.ubicacion || "No especificado"}
          </p>
          <p>
            <strong>Descripción:</strong> {grupo.descripcion || "No especificado"}
          </p>
          <div className="mt-4">
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Editar
            </button>
            <button
              onClick={handleDelete}
              className="ml-4 bg-red-500 text-white px-4 py-2 rounded"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
