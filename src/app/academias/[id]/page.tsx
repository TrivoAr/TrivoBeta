"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; // Para manejar la sesión del usuario
import { useRouter } from "next/navigation";
import axios from "axios";

type Academia = {
  _id: string;
  nombre_academia: string;
  descripcion: string;
  tipo_disciplina: string;
  telefono: string;
};

export default function AcademiaDetailPage({ params }: { params: { id: string } }) {
  const [academia, setAcademia] = useState<Academia | null>(null);
  const router = useRouter();
  const { data: session } = useSession(); // Obtener la sesión de NextAuth

  useEffect(() => {
    const fetchAcademia = async () => {
      try {
        const response = await axios.get(`/api/academias/${params.id}`);
        setAcademia(response.data);
      } catch (error) {
        console.error("Error fetching academia details:", error);
      }
    };

    fetchAcademia();
  }, [params.id]);

  const handleJoinAcademia = async () => {
    if (!session || !session.user || !session.user.id) {
      alert("Por favor, inicia sesión para unirte a esta academia.");
      return;
    }

    try {
      await axios.post("/api/academias/unirse", {
        academia_id: params.id,
        user_id: session.user.id, // Usar el ID del usuario autenticado
      });
      alert("Solicitud enviada con éxito. Espera la aprobación.");
      router.push("/dashboard"); // Redirigir después de unirse
    } catch (error) {
      console.error("Error joining academia:", error);
      alert("Hubo un error al enviar la solicitud.");
    }
  };

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
    </div>
  );
}
