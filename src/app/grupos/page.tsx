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
    <div>
      <Toaster position="top-center" />
      <h1 className="text-xl font-bold text-center mb-5">Crear Grupo</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        <select
          name="academia_id"
          value={grupo.academia_id}
          onChange={handleInputChange}
          required
          className="bg-[#f4f4f4] border-b text-gray-400"
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
          className="bg-[#F4F4F4] border-b"
        />

        <select
          name="nivel"
          value={grupo.nivel}
          onChange={handleInputChange}
          required
          className="bg-[#F4F4F4] border-b text-gray-400"
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
          className="bg-[#F4F4F4] border-b"
        />

        <input
          type="time"
          name="horario"
          value={grupo.horario}
          onChange={handleInputChange}
          required
          className="bg-[#F4F4F4] border-b"
        />

        <input
          type="text"
          name="cuota_mensual"
          value={grupo.cuota_mensual}
          onChange={handleInputChange}
          placeholder="Cuota mensual"
          className="bg-[#F4F4F4] border-b"
        />

        <textarea
          name="descripcion"
          value={grupo.descripcion}
          onChange={handleInputChange}
          placeholder="Descripción"
          className="bg-[#F4F4F4] border-b"
        />

        <select
          name="tipo_grupo"
          value={grupo.tipo_grupo}
          onChange={handleInputChange}
          className="bg-[#F4F4F4] border-b text-gray-400"
        >
          <option value="">Selecciona un tipo</option>
          <option value="nivel">Nivel</option>
          <option value="distancia">Distancia</option>
          <option value="otros">Otros</option>
        </select>

        <button type="submit" className="text-sm font-bold w-[300px] bg-[#FF9A3D] rounded-md h-[40px]">
          Crear Grupo
        </button>

        <button type="button" onClick={() => router.back()} className="text-sm font-bold w-[300px] bg-[#f4f4f4] border-2 border-[#FF9A3D] text-[#FF9A3D] rounded-md h-[40px]">
          Atrás
        </button>
      </form>
    </div>
  );
};

export default CrearGrupo;
