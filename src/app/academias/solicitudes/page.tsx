"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type Solicitud = {
  _id: string;
  estado: string;
  user_id?: { firstname: string; email: string; lastname: string; }; // user_id podría ser undefined
  academia_id?: { nombre_academia: string }; // academia_id podría ser undefined
};

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Obtener las solicitudes al montar el componente
  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        const response = await axios.get("/api/academias/solicitudes");
        setSolicitudes(response.data);
        setLoading(false);
      } catch (err) {
        setError("Error al cargar las solicitudes");
        setLoading(false);
      }
    };

    fetchSolicitudes();
  }, []);

  // Manejar el cambio de estado de una solicitud
  const handleEstadoChange = async (id: string, nuevoEstado: string) => {
    try {
      await axios.patch("/api/academias/solicitudes", {
        solicitud_id: id,
        estado: nuevoEstado,
      });

      // Actualizar el estado local
      setSolicitudes((prevSolicitudes) =>
        prevSolicitudes.map((solicitud) =>
          solicitud._id === id ? { ...solicitud, estado: nuevoEstado } : solicitud
        )
      );
    } catch (err) {
      console.error("Error al actualizar la solicitud", err);
      setError("Error al actualizar la solicitud");
    }
  };

  // Renderizado del componente
  if (loading) return <p>Cargando solicitudes...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Solicitudes Pendientes</h1>
      {solicitudes.length === 0 ? (
        <p>No hay solicitudes pendientes.</p>
      ) : (
        <ul className="space-y-4">
          {solicitudes.map((solicitud) => (
            <li
              key={solicitud._id}
              className="border p-4 rounded shadow flex justify-between items-center"
            >
              <div>
                <p>
                  <strong>Usuario:</strong>{" "}
                  {solicitud.user_id
                    ? `${solicitud.user_id.firstname} ${solicitud.user_id.lastname} (${solicitud.user_id.email})`
                    : "Usuario no encontrado"}
                </p>
                <p>
                  <strong>Academia:</strong>{" "}
                  {solicitud.academia_id
                    ? solicitud.academia_id.nombre_academia
                    : "Academia no encontrada"}
                </p>
                <p>
                  <strong>Estado:</strong> {solicitud.estado}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEstadoChange(solicitud._id, "aceptado")}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => handleEstadoChange(solicitud._id, "rechazado")}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Rechazar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
