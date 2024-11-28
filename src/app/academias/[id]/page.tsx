"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

type Academia = {
  _id: string;
  nombre_academia: string;
  descripcion: string;
  tipo_disciplina: string;
  telefono: string;
};

export default function AcademiaDetailPage({ params }: { params: { id: string } }) {
  const [academia, setAcademia] = useState<Academia | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [error, setError] = useState<string | null>(null); // Para manejar errores
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Consumir la API de academia y grupos
        const response = await axios.get(`/api/academias/${params.id}`);
        setAcademia(response.data.academia);
        setGrupos(response.data.grupos);
      } catch (error) {
        console.error("Error al obtener los datos:", error);
        setError("Hubo un problema al cargar los datos de la academia.");
      }
    };

    fetchData();
  }, [params.id]);

  const handleJoinAcademia = async () => {
    if (!session || !session.user || !session.user.id) {
      alert("Por favor, inicia sesión para unirte a esta academia.");
      return;
    }

    try {
      await axios.post("/api/academias/unirse", {
        academia_id: params.id,
        user_id: session.user.id,
      });
      alert("Solicitud enviada con éxito. Espera la aprobación.");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error al unirse a la academia:", error);
      alert("Hubo un error al enviar la solicitud.");
    }
  };

  if (error) {
    return <div>{error}</div>;
  }

  if (!academia) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{academia.nombre_academia}</h1>
      <p>{academia.descripcion}</p>
      <p>Disciplina: {academia.tipo_disciplina}</p>
      <p>Teléfono: {academia.telefono}</p>
      <button
        onClick={handleJoinAcademia}
        className="bg-green-500 text-white px-4 py-2 rounded mt-4"
      >
        Unirse a esta Academia
      </button>

      <h2 className="text-xl font-bold mt-8 mb-4">Grupos Disponibles</h2>
      {grupos.length === 0 ? (
        <p>No hay grupos disponibles para esta academia.</p>
      ) : (
        <ul className="space-y-4">
          {grupos.map((grupo) => (
            <li
            key={grupo._id}
            className="border p-4 rounded shadow cursor-pointer"
            onClick={() => router.push(`/grupos/${grupo._id}`)}
          >
            <p>
              <strong>Nombre:</strong> {grupo.nombre_grupo}
            </p>
            <p>
              <strong>Horario:</strong> {grupo.horario || "No especificado"}
            </p>
            <p>
              <strong>Ubicación:</strong> {grupo.ubicacion || "No especificado"}
            </p>
            <p>
              <strong>Tipo de Grupo:</strong> {grupo.tipo_grupo || "No especificado"}
            </p>
          </li>
          ))}
        </ul>
      )}
      {/* Botón para ver los miembros */}
       <div className="mt-8">
      <button
       onClick={() => router.push(`/academias/${params.id}/miembros`)}
      className="bg-blue-500 text-white px-4 py-2 rounded"
       >
          Ver Miembros
        </button>
      </div>
    </div>
    
  );
}