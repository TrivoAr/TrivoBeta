"use client"
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";  // Importar useSession

const MiembrosPage = ({ params }: { params: { id: string } }) => {
  const { data: session } = useSession();  // Obtener datos de sesión
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
      // Limpiar la selección de grupo
      setGrupoSeleccionado(null);
    } catch (error) {
      console.error("Error al asignar el grupo", error);
      setError("Error al asignar el grupo");
    }
  };

  if (cargando) {
    return <div>Cargando...</div>;
  }

  // Verificar el rol del usuario
  const isDueñoAcademia = session?.user?.role === "dueño de academia";

  return (
    <div>
      <h1>Miembros de la Academia</h1>
      {error && <p className="text-red-500">{error}</p>}

      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2">Nombre</th>
            <th className="border p-2">Grupo Actual</th>
            <th className="border p-2">Asignar Grupo</th>
          </tr>
        </thead>
        <tbody>
          {miembros.map((miembro) => (
            <tr key={miembro.user_id._id}>
              <td className="border p-2">{miembro.user_id.firstname}</td>
              <td className="border p-2">
                {miembro.grupo ? miembro.grupo.nombre_grupo : "No asignado"}
              </td>
              <td className="">
                {!miembro.grupo && (
                  <div className="flex justify-between">
                    <select
                      className="border p-2 rounded"
                      onChange={(e) => setGrupoSeleccionado(e.target.value)}  // Cambiar grupo seleccionado
                      value={grupoSeleccionado || ""} // El valor seleccionado
                    >
                      <option value="">-- Seleccionar un Grupo --</option>
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
                      className="bg-blue-500 text-white py-2 px-4 rounded mt-2"
                      disabled={!grupoSeleccionado}
                    >
                      Confirmar Asignación
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
