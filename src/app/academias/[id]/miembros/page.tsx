"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

const MiembrosPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const { data: session } = useSession(); // Obtener datos de sesión
  const [miembros, setMiembros] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dueñoId = localStorage.getItem("dueño_id"); // Obtener dueño_id del localStorage

      if (!session?.user?.id || session.user.id !== dueñoId) {
        toast.error("No tienes permiso para ver los miembros de esta academia.");
        router.push("/dashboard"); // Redirige si no está autorizado
        return;
      }
        // Obtener los miembros de la academia
        const miembrosResponse = await axios.get(`/api/academias/${params.id}/miembros`);
        const miembrosData = miembrosResponse.data.miembros;

        // Obtener las imágenes de perfil de los miembros
        const miembrosConImagenes = await Promise.all(
          miembrosData.map(async (miembro: any) => {
            try {
              const profileImage = await getProfileImage("profile-image.jpg", miembro.user_id._id);
              return { ...miembro, profileImage };
            } catch (error) {
              console.error(`Error al obtener la imagen del miembro ${miembro.user_id._id}:`, error);
              return {
                ...miembro,
                profileImage:
                  "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg",
              };
            }
          })
        );

        setMiembros(miembrosConImagenes);

        // Obtener los grupos de la academia específica
        const gruposResponse = await axios.get(`/api/grupos?academiaId=${params.id}`);
        setGrupos(gruposResponse.data.grupos || []); // Asegúrate de que sea un arreglo vacío si no hay grupos
      } catch (error) {
        setError("Error al obtener los datos");
        console.error(error);
      } finally {
        setCargando(false);
      }
    };

    fetchData();
  }, [params.id]);

  // Asignar el grupo al miembro
  const asignarGrupo = async (userId: string, grupoId: string) => {
    if (!userId || !grupoId) {
      setError("Debes seleccionar un grupo");
      return;
    }

    try {
      // Obtener el objeto completo del grupo seleccionado
      const grupoSeleccionadoObj = grupos.find((grupo) => grupo._id === grupoId);
      if (!grupoSeleccionadoObj) {
        setError("Grupo no encontrado");
        return;
      }

      // Enviar la solicitud para asignar el grupo al miembro
      await axios.put(`/api/academias/${params.id}/miembros`, {
        user_id: userId,
        grupo_id: grupoId,
      });

      // Actualizar el miembro con el grupo completo en el estado local
      setMiembros((prevMiembros) =>
        prevMiembros.map((miembro) =>
          miembro.user_id._id === userId
            ? { ...miembro, grupo: grupoSeleccionadoObj }
            : miembro
        )
      );

      alert("Grupo asignado correctamente");
      setGrupoSeleccionado(null);
    } catch (error) {
      console.error("Error al asignar el grupo", error);
      setError("Error al asignar el grupo");
    }
  };

  if (cargando) {
    return <div>Cargando...</div>;
  }

  const isDueñoAcademia = session?.user?.role === "dueño de academia";

  return (
    <div className="w-[390px] flex flex-col items-center">
       <Toaster position="top-center" />
      <h1 className="font-bold mt-10">Miembros de la Academia</h1>
      <br />
      {error && <p className="text-red-500">{error}</p>}

      <table className="w-[90%] border-collapse">
        <thead>
          <tr>
            <th>Foto</th>
            <th>Nombre</th>
            <th>Grupo</th>
            <th>Asignar</th>
          </tr>
        </thead>
        <tbody>
          {miembros.map((miembro) => (
            <tr key={miembro.user_id._id}>
              <td className="flex justify-center mt-3">
                <img
                  className="rounded-full h-[35px] w-[35px] "
                  src={miembro.profileImage || "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg"}
                  alt="Imagen del miembro"
                />
              </td>
              <td className="text-sm text-center">{miembro.user_id.firstname}</td>
              <td className="text-sm text-center">
                {miembro.grupo ? miembro.grupo.nombre_grupo : "No asignado"}
              </td>
              <td>
                {!miembro.grupo && (
                  <div className="flex justify-between">
                    <select
                      className="bg-[#f4f4f4] w-[70px] text-sm"
                      onChange={(e) => setGrupoSeleccionado(e.target.value)}
                      value={grupoSeleccionado || ""}
                    >
                      <option value="">Grupo</option>
                      {grupos.length > 0 ? (
                        grupos.map((grupo) => (
                          <option key={grupo._id} value={grupo._id}>
                            {grupo.nombre_grupo}
                          </option>
                        ))
                      ) : (
                        <option value="">No hay grupos disponibles</option>
                      )}
                    </select>
                    <button
                      onClick={() => asignarGrupo(miembro.user_id._id, grupoSeleccionado!)}
                      className="bg-[#FF9A3D] text-[#333] w-[70px] rounded text-sm"
                      disabled={!grupoSeleccionado}
                    >
                      Confirmar
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MiembrosPage;
