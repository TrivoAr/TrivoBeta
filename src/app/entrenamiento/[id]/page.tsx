"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type Entrenamiento = {
  _id: string;
  fecha: string;
  descripcion: string;
  objetivo: string;
  estado: string;
};

export default function EntrenamientosUsuario({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [entrenamientos, setEntrenamientos] = useState<Entrenamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchEntrenamientos = async () => {
      try {
        const response = await axios.get(
          `/api/entrenamientos?user=${id}`
        );
        setEntrenamientos(response.data);
      } catch (error) {
        setError("Error al cargar los entrenamientos.");
      } finally {
        setLoading(false);
      }
    };

    fetchEntrenamientos();
  }, [id]);

  if (loading) return <div>Cargando entrenamientos...</div>;
  if (error) return <div>{error}</div>;

  // Función para traducir el estado de color a texto
  const traducirEstado = (estado: string) => {
    switch (estado) {
      case "gris":
        return "No iniciado";
      case "verde":
        return "Completado";
      case "rojo":
        return "No completado";
      default:
        return "Desconocido";
    }
  };

  return (
    <div className="flex flex-col items-center w-[390px] bg-[#F4F4F4]">
      <div className="w-[340px]">
        <h2 className="text-lg font-bold mb-4">Historial de Entrenamientos</h2>
        {entrenamientos.length > 0 ? (
          <ul className="space-y-2">
            {entrenamientos.map((entrenamiento) => (
              <li
                key={entrenamiento._id}
                className="p-3 border rounded-lg shadow-sm"
              >
                <p className="text-sm text-gray-500">
                  {new Date(entrenamiento.fecha).toLocaleDateString()}
                </p>
                <p className="font-bold">{entrenamiento.objetivo}</p>
                <p>{entrenamiento.descripcion}</p>
                <p className="font-semibold">
                  Estado: {traducirEstado(entrenamiento.estado)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay entrenamientos registrados.</p>
        )}
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-gray-300 rounded"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
