"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

type Solicitud = {
  _id: string;
  estado: string;
  user_id?: { firstname: string; email: string; lastname: string }; // user_id podría ser undefined
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
      toast.promise(
        axios.patch("/api/academias/solicitudes", {
          solicitud_id: id,
          estado: nuevoEstado,
        }),
        {
          loading: "Actualizando solicitud...",
          success: `Solicitud ${nuevoEstado === "aceptado" ? "aceptada" : "rechazada"} correctamente`,
          error: "Hubo un error al actualizar la solicitud",
        }
      );

      // Actualizar el estado local
      setSolicitudes((prevSolicitudes) =>
        prevSolicitudes.filter((solicitud) => solicitud._id !== id)
      );
    } catch (err) {
      setError("Error al actualizar la solicitud");
    }
  };

  // Renderizado del componente
  if (loading) return <p>Cargando solicitudes...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="flex flex-col items-center p-4">
      <Toaster position="top-center" />
      <h1 className="text-2xl font-bold text-center mb-5">Solicitudes</h1>
      {solicitudes.length === 0 ? (
        <p>Sin solicitudes pendientes.</p>
      ) : (
        <ul className="w-[335px] flex flex-col gap-5">
          {solicitudes.map((solicitud) => (
            <li
              key={solicitud._id}
              className="flex h-[56px] justify-between items-center bg-[#d9d9d980] rounded-[20px] shadow-md px-4"
            >
              <div>
                <p className="font-semibold">
                  {solicitud.user_id
                    ? `${solicitud.user_id.firstname} ${solicitud.user_id.lastname}`
                    : "Usuario no encontrado"}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleEstadoChange(solicitud._id, "rechazado")}
                  className="bg-red-500 text-white h-[24px] w-[24px] rounded-full flex justify-center items-center hover:bg-red-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20px"
                    viewBox="0 0 24 24"
                    width="20px"
                    fill="#e8eaed"
                  >
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleEstadoChange(solicitud._id, "aceptado")}
                  className="bg-green-500 text-white h-[24px] w-[24px] rounded-full flex justify-center items-center hover:bg-green-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="20px"
                    viewBox="0 0 24 24"
                    width="20px"
                    fill="#e8eaed"
                  >
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
