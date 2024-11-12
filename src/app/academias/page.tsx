"use client";
import { FormEvent, useState } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";

function CrearAcademia() {
  const [error, setError] = useState<string | undefined>(undefined);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const formData = new FormData(event.currentTarget);
      const data = Object.fromEntries(formData.entries());
      
      const response = await axios.post("/api/academias", data);

      if (response.status === 201) {
        router.push("/dashboard"); // Redirige si se creó correctamente
      } else {
        throw new Error("Error al crear la academia");
      }
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || "Error en la solicitud";
        setError(errorMessage);
      } else {
        setError("Ocurrió un error desconocido");
      }
    }
  };

  return (
    <div className="justify-center h-[calc(100vh-4rem)] flex items-center">
      <form onSubmit={handleSubmit} className="bg-neutral-950 px-8 py-10 w-3/12">
        {error && <div className="bg-red-500 text-white p-2 mb-2">{error}</div>}
        <h1 className="text-4xl font-bold mb-7">Crear Academia</h1>

        <label className="text-slate-300">Nombre de la Academia:</label>
        <input type="text" name="nombre_academia" placeholder="Nombre de la Academia" className="bg-zinc-800 px-4 py-2 block mb-2 w-full" required />

        <label className="text-slate-300">País:</label>
        <input type="text" name="pais" placeholder="País" className="bg-zinc-800 px-4 py-2 block mb-2 w-full" required />

        <label className="text-slate-300">Provincia:</label>
        <input type="text" name="provincia" placeholder="Provincia" className="bg-zinc-800 px-4 py-2 block mb-2 w-full" required />

        <label className="text-slate-300">Localidad:</label>
        <input type="text" name="localidad" placeholder="Localidad" className="bg-zinc-800 px-4 py-2 block mb-2 w-full" required />

        <label className="text-slate-300">Descripción:</label>
        <textarea name="descripcion" placeholder="Descripción" className="bg-zinc-800 px-4 py-2 block mb-2 w-full" />

        <label className="text-slate-300">Tipo de Disciplina:</label>
        <select name="tipo_disciplina" className="bg-zinc-800 px-4 py-2 block mb-2 w-full" required>
          <option value="running">Running</option>
          <option value="trekking">Trekking</option>
          <option value="otros">Otros</option>
        </select>

        <label className="text-slate-300">Teléfono:</label>
        <input type="text" name="telefono" placeholder="Teléfono" className="bg-zinc-800 px-4 py-2 block mb-2 w-full" />

        <button className="bg-blue-500 text-white px-4 py-2 block w-full mt-4">
          Crear Academia
        </button>
      </form>
    </div>
  );
}

export default CrearAcademia;
