"use client";

import { useState, useEffect } from "react";

const CrearGrupo = () => {
  const [academias, setAcademias] = useState<any[]>([]);
  const [grupo, setGrupo] = useState({
    academia_id: "",
    nombre_grupo: "",
    nivel: "",
    ubicacion: "",
    horario: "",
    cuota_mensual: "",
    descripcion: "",
    tipo_grupo: "",
  });
  const [loading, setLoading] = useState(true);

  // Obtener academias asociadas al usuario logueado
  useEffect(() => {
    const fetchAcademias = async () => {
      try {
        const res = await fetch("/api/academias?owner=true"); // Ruta al endpoint de academias
        const data = await res.json();
        console.log("Academias recibidas:", data); // Debug
        setAcademias(data); // Guardar academias filtradas por el dueño_id del usuario
      } catch (error) {
        console.error("Error al cargar academias:", error);
      } finally {
        setLoading(false); // Finalizar estado de carga
      }
    };
    fetchAcademias();
  }, []);

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGrupo({ ...grupo, [name]: value });
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(grupo),
      });

      if (res.ok) {
        alert("Grupo creado exitosamente");
        setGrupo({
          academia_id: "",
          nombre_grupo: "",
          nivel: "",
          ubicacion: "",
          horario: "",
          cuota_mensual: "",
          descripcion: "",
          tipo_grupo: "",
        });
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error al crear el grupo:", error);
      alert("Hubo un error al crear el grupo");
    }
  };

  // Renderización condicional
  if (loading) {
    return <div className="text-center text-gray-500">Cargando...</div>;
  }

  if (academias.length === 0) {
    return (
      <div className="text-center mt-10 p-4 bg-white rounded shadow">
        <h1 className="text-xl font-bold mb-4">No tienes academias creadas</h1>
        <p className="text-gray-700">
          Crea una academia primero para poder gestionar grupos.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Crear Grupo</h1>
      <form onSubmit={handleSubmit}>
        {/* Academia */}
        <label className="block mb-2">
          Academia:
          <select
            name="academia_id"
            value={grupo.academia_id}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Selecciona una academia</option>
            {academias.map((academia) => (
              <option key={academia._id} value={academia._id}>
                {academia.nombre_academia}
              </option>
            ))}
          </select>
        </label>

        {/* Nombre del grupo */}
        <label className="block mb-2">
          Nombre del Grupo:
          <input
            type="text"
            name="nombre_grupo"
            value={grupo.nombre_grupo}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </label>

        {/* Nivel */}
        <label className="block mb-2">
          Nivel:
          <input
            type="text"
            name="nivel"
            value={grupo.nivel}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </label>

        {/* Ubicación */}
        <label className="block mb-2">
          Ubicación:
          <input
            type="text"
            name="ubicacion"
            value={grupo.ubicacion}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </label>

        {/* Horario */}
        <label className="block mb-2">
          Horario:
          <input
            type="text"
            name="horario"
            value={grupo.horario}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </label>

        {/* Cuota mensual */}
        <label className="block mb-2">
          Cuota Mensual:
          <input
            type="text"
            name="cuota_mensual"
            value={grupo.cuota_mensual}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </label>

        {/* Descripción */}
        <label className="block mb-2">
          Descripción:
          <textarea
            name="descripcion"
            value={grupo.descripcion}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </label>

        {/* Tipo de Grupo */}
        <label className="block mb-2">
          Tipo de Grupo:
          <select
            name="tipo_grupo"
            value={grupo.tipo_grupo}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Selecciona un tipo</option>
            <option value="nivel">Nivel</option>
            <option value="distancia">Distancia</option>
            <option value="otros">Otros</option>
          </select>
        </label>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700"
        >
          Crear Grupo
        </button>
      </form>
    </div>
  );
};

export default CrearGrupo;
