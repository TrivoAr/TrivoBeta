"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

const MiembrosPage = ({ params }: { params: { id: string } }) => {
  const [miembros, setMiembros] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string | null>(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener los miembros de la academia
        const miembrosResponse = await axios.get(`/api/academias/${params.id}/miembros`);
        setMiembros(miembrosResponse.data.miembros);

        // Obtener los grupos de la academia específica
        const gruposResponse = await axios.get(`/api/grupos?academiaId=${params.id}`);
        setGrupos(gruposResponse.data.grupos || []);  // Asegúrate de que sea un arreglo vacío si no hay grupos
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
      const grupoSeleccionadoObj = grupos.find(grupo => grupo._id === grupoId);
      if (!grupoSeleccionadoObj) {
        setError("Grupo no encontrado");
        return;
      }

      // Enviar la solicitud para asignar el grupo al miembro
      await axios.put(`/api/academias/${params.id}/miembros`, {
        user_id: userId,  // El user_id del miembro
        grupo_id: grupoId,  // El grupo seleccionado
      });

      // Actualizar el miembro con el grupo completo en el estado local
      setMiembros((prevMiembros) =>
        prevMiembros.map((miembro) =>
          miembro.user_id._id === userId
            ? { ...miembro, grupo: grupoSeleccionadoObj } // Aquí asignamos el grupo completo al miembro
            : miembro
        )
      );

      alert("Grupo asignado correctamente");
    } catch (error) {
      console.error("Error al asignar el grupo", error);
      setError("Error al asignar el grupo");
    }
  };

  if (cargando) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="w-[390px] flex flex-col items-center">
      <h1 className="font-bold">Miembros de la Academia</h1>
      {error && <p className="text-red-500">{error}</p>}

      <table className="w-[90%] border-collapse">
        <thead>
          <tr>
            <th className="">Foto</th>
            <th className="">Nombre</th>
            <th className="">Grupo</th>
            <th className="">Asignar</th>
          </tr>
        </thead>
        <tbody>
          {miembros.map((miembro) => (
            <tr key={miembro.user_id._id}>
              <td className="flex justify-center"><img className="rounded-full h-[35px] w-[35px]" src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" alt="" /></td>
              <td className="text-sm text-center">{miembro.user_id.firstname}</td>
              <td className="text-sm text-center">
                {miembro.grupo ? miembro.grupo.nombre_grupo : "No asignado"}
              </td>
              <td className="">
                {!miembro.grupo && (
                  <div className="flex justify-between">
                    <select
                      className="bg-[#f4f4f4] w-[70px] text-sm"
                      onChange={(e) => setGrupoSeleccionado(e.target.value)}  // Cambiar grupo seleccionado
                      value={grupoSeleccionado || ""} // El valor seleccionado
                    >
                      <option value="">Grupo</option>
                      {grupos && grupos.length > 0 ? (
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
                      onClick={() => asignarGrupo(miembro.user_id._id, grupoSeleccionado!)} // Asignar el grupo
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
