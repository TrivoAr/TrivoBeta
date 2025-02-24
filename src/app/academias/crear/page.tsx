"use client";
import { FormEvent, useState } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

function CrearAcademia() {
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const formData = new FormData(event.currentTarget);
      const data = Object.fromEntries(formData.entries());
      
      const response = await axios.post("/api/academias", data);

      if (response.status === 201) {
        toast.success("¡Academia creada con éxito!");
        router.push("/dashboard"); 
      } else {
        throw new Error("Error al crear la academia");
      }
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || "Error en la solicitud";
        toast.error(errorMessage);
      } else {
        toast.error("Ocurrió un error desconocido");
      }
    }
  };

  return (
    <div className="w-[390px] flex flex-col items-center gap-5">
      <Toaster position="top-center" /> {/* Para mostrar los toasts */}
      <p className="text-xl font-bold justify-self-center mt-10">Crear Academia</p>
      <form onSubmit={handleSubmit} className="w-[80%]">
        
        <div className="relative mb-6">
          <input
            type="text"
            name="nombre_academia"
            className="form-input peer"
            placeholder=" "
            required
          />
          <label className="form-label">Nombre</label>
        </div>

        <div className="relative mb-6">
          <input
            type="text"
            name="pais"
            className="form-input peer"
            placeholder=" "
            required
          />
          <label className="form-label">País</label>
        </div>

        <div className="relative mb-6">
          <input
            type="text"
            name="provincia"
            className="form-input peer"
            placeholder=" "
            required
          />
          <label className="form-label">Provincia</label>
        </div>

        <div className="relative mb-6">
          <input
            type="text"
            name="localidad"
            className="form-input peer"
            placeholder=" "
            required
          />
          <label className="form-label">Localidad</label>
        </div>

        <div className="relative mb-6">
          <textarea
            name="descripcion"
            className="form-input peer"
            placeholder=" "
          ></textarea>
          <label className="form-label">Descripción</label>
        </div>

        <div className="relative mb-6">
          <select name="tipo_disciplina" className="form-input peer" placeholder=" " required>
            <option value="running">Running</option>
            <option value="trekking">Trekking</option>
            <option value="ciclismo">Ciclismo</option>
          </select>
          <label className="form-label">Tipo de disciplina</label>
        </div>

        <div className="relative mb-6">
          <input
            type="text"
            name="telefono"
            className="form-input peer"
            placeholder=" "
          />
          <label className="form-label">Teléfono</label>
        </div>

        <button className="bg-[#FF9A3D] text-[#333] font-bold px-4 py-2 block w-full mt-4 rounded-[10px]">
          Crear Academia
        </button>

        <button 
          type="button"
          className="bg-[#f4f4f4] border-2 border-[#FF9A3D] text-[#FF9A3D] font-bold px-4 py-2 block w-full mt-4 rounded-[10px]"
          onClick={() => router.back()} // Atrás
        >
          Atrás
        </button>
      </form>
    </div>
  );
}

export default CrearAcademia;
