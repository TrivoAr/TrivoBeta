"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

const CrearGrupo = () => {
  const router = useRouter();
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
    tiempo_promedio: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAcademias = async () => {
      try {
        const res = await fetch("/api/academias?owner=true");
        const data = await res.json();
        setAcademias(data);
      } catch (error) {
        console.error("Error al cargar academias:", error);
        toast.error("Error al cargar las academias");
      } finally {
        setLoading(false);
      }
    };
    fetchAcademias();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGrupo({ ...grupo, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(grupo),
      });

      if (res.ok) {
        toast.success("Grupo creado exitosamente");
        setGrupo({
          academia_id: "",
          nombre_grupo: "",
          nivel: "",
          ubicacion: "",
          horario: "",
          cuota_mensual: "",
          descripcion: "",
          tipo_grupo: "",
          tiempo_promedio: "",
        });
        router.push("/dashboard");
      } else {
        const errorData = await res.json();
        toast.error(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error al crear el grupo:", error);
      toast.error("Hubo un error al crear el grupo");
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500">Cargando...</div>;
  }

  if (academias.length === 0) {
    return (
      <div className="text-center mt-10 p-4 bg-white rounded shadow">
        <h1 className="text-xl font-bold mb-4">No tienes academias creadas</h1>
        <p className="text-gray-700">Crea una academia primero para poder gestionar grupos.</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-4 space-y-5 rounded-xl  mb-[80px] bg-[#FEFBF9">
      <Toaster position="top-center" />
       <h2 className="text-center font-bold text-xl bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent">
        Crear grupo <span className="text-black">de entrenamiento</span>
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        <select
          name="academia_id"
          value={grupo.academia_id}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Academia</option>
          {academias.map((academia) => (
            <option key={academia._id} value={academia._id}>
              {academia.nombre_academia}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="nombre_grupo"
          value={grupo.nombre_grupo}
          onChange={handleInputChange}
          required
          placeholder="Nombre"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />

        <select
          name="nivel"
          value={grupo.nivel}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Selecciona dificultad</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>

        <input
          type="text"
          name="ubicacion"
          value={grupo.ubicacion}
          onChange={handleInputChange}
          placeholder="Ubicación"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />

        <input
          type="time"
          name="horario"
          value={grupo.horario}
          onChange={handleInputChange}
          placeholder="Horario"
          required
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        />
          {/* tiempo */}
        <input
          type="text"
          name="tiempo_promedio"
          value={grupo.tiempo_promedio}
          onChange={handleInputChange}
          placeholder="Tiempo promedio"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />
        <input
          type="text"
          name="cuota_mensual"
          value={grupo.cuota_mensual}
          onChange={handleInputChange}
          placeholder="Cuota mensual"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />

        <textarea
          name="descripcion"
          value={grupo.descripcion}
          onChange={handleInputChange}
          placeholder="Descripción"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />

        <select
          name="tipo_grupo"
          value={grupo.tipo_grupo}
          onChange={handleInputChange}
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Selecciona un tipo</option>
          <option value="nivel">Nivel</option>
          <option value="distancia">Distancia</option>
          <option value="otros">Otros</option>
        </select>

        <button type="submit" className="w-full py-2 rounded-md text-white  bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] font-bold">
          Crear Grupo
        </button>

        <button type="button" onClick={() => router.back()} className="text-md text-orange-400">
          Atrás
        </button>
      </form>
      <div className="pb-[20px]"></div>
    </div>
  );
};

export default CrearGrupo;
