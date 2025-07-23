"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { FiX, FiEdit } from "react-icons/fi";

const MiembrosPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [miembros, setMiembros] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string | null>(
    null
  );
  const [cargando, setCargando] = useState<boolean>(true);
  const [editandoGrupo, setEditandoGrupo] = useState<string | null>(null); // Para controlar la edición

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dueñoId = localStorage.getItem("dueño_id");

        // if (!session?.user?.id || session.user.id !== dueñoId) {
        //   toast.error("No tienes permiso para ver los miembros de esta academia.");
        //   router.push("/dashboard");
        //   return;
        // }

        // Obtener los miembros de la academia
        const miembrosResponse = await axios.get(
          `/api/academias/${params.id}/miembros`
        );
        const miembrosData = miembrosResponse.data.miembros;

        // Obtener las imágenes de perfil de los miembros
        const miembrosConImagenes = await Promise.all(
          miembrosData.map(async (miembro: any) => {
            try {
              const profileImage = await getProfileImage(
                "profile-image.jpg",
                miembro.user_id._id
              );
              return { ...miembro, profileImage };
            } catch (error) {
              console.error(
                `Error al obtener la imagen del miembro ${miembro.user_id._id}:`,
                error
              );
              return {
                ...miembro,
                profileImage:
                  "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg",
              };
            }
          })
        );

        setMiembros(miembrosConImagenes);

        // Obtener los grupos de la academia
        const gruposResponse = await axios.get(
          `/api/grupos?academiaId=${params.id}`
        );
        setGrupos(gruposResponse.data.grupos || []);
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
      const grupoSeleccionadoObj = grupos.find(
        (grupo) => grupo._id === grupoId
      );
      if (!grupoSeleccionadoObj) {
        setError("Grupo no encontrado");
        return;
      }

      await axios.put(`/api/academias/${params.id}/miembros`, {
        user_id: userId,
        grupo_id: grupoId,
      });

      setMiembros((prevMiembros) =>
        prevMiembros.map((miembro) =>
          miembro.user_id._id === userId
            ? { ...miembro, grupo: grupoSeleccionadoObj }
            : miembro
        )
      );

      toast.success("Grupo actualizado correctamente");
      setEditandoGrupo(null); // Deja de editar
    } catch (error) {
      console.error("Error al actualizar el grupo", error);
      setError("Error al actualizar el grupo");
    }
  };

  // Eliminar miembro
  const eliminarMiembro = async (userId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este miembro?")) {
      try {
        const response = await axios.delete(
          `/api/academias/${params.id}/miembros?user_id=${userId}`
        );
        if (response.status === 200) {
          setMiembros((prev) =>
            prev.filter((miembro) => miembro.user_id._id !== userId)
          );
          toast.success("Miembro eliminado correctamente");
        } else {
          throw new Error("Error al eliminar miembro");
        }
      } catch (error) {
        console.error("Error al eliminar miembro:", error);
        toast.error("Error al eliminar miembro");
      }
    }
  };

  if (cargando) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="w-[390px] flex flex-col items-center">
      <Toaster position="top-center" />
      <div className="relative w-full h-[40px] flex">
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
      <h1 className="font-medium">Miembros de la Academia</h1>
      <br />
      {error && <p className="text-red-500">{error}</p>}

      <table className="w-full border-collapse p-2">
        <thead>
          <tr>
            <th>Foto</th>
            <th>Nombre</th>
            <th>Grupo</th>
            {session.user.id === localStorage.getItem("dueño_id") ? (
              <th>Acciones</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {miembros.map((miembro) => (
            <tr key={miembro.user_id._id}>
              <td className="flex justify-center mt-3 items-center">
                <img
                  className="rounded-full h-[45px] w-[45px]"
                  src={
                    miembro.profileImage ||
                    "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg"
                  }
                  alt="Imagen del miembro"
                />
              </td>
              <td className="text-sm text-center">
                {miembro.user_id.firstname}
              </td>
              <td className="text-sm text-center">
                {miembro.grupo ? miembro.grupo.nombre_grupo : "No asignado"}
              </td>
              {session.user.id === localStorage.getItem("dueño_id") ? (
                <td>
                  {editandoGrupo === miembro.user_id._id ? (
                    <div className="flex items-center gap-1 flex-col">
                      <select
                        className="bg-[#f4f4f4] w-[70px] text-sm"
                        onChange={(e) => setGrupoSeleccionado(e.target.value)}
                        value={grupoSeleccionado || ""}
                      >
                        <option value="">Grupo</option>
                        {grupos.map((grupo) => (
                          <option key={grupo._id} value={grupo._id}>
                            {grupo.nombre_grupo}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() =>
                          asignarGrupo(miembro.user_id._id, grupoSeleccionado!)
                        }
                        className="bg-[#FF9A3D] text-[#333] w-[70px] rounded text-sm"
                        disabled={!grupoSeleccionado}
                      >
                        Asignar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditandoGrupo(miembro.user_id._id)}
                      className="bg-[#FF9A3D] text-[#333] w-[70px] rounded text-sm"
                    >
                      <FiEdit className="text-white" size={18} />
                    </button>
                  )}
                </td>
              ) : null}

              {/* <td className="text-sm text-center">
                <button
                  onClick={() => eliminarMiembro(miembro.user_id._id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  <FiX className="text-white" size={20} />
                </button>
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MiembrosPage;
