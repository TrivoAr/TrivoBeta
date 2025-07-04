"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function EditarSalida({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    deporte: "",
    fecha: "",
    hora: "",
    ubicacion: "",
    imagen: "",
  });

  useEffect(() => {
    fetch(`/api/social/${params.id}`)
      .then((res) => res.json())
      .then((data) => setFormData(data));
  }, [params.id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prevData) => ({
          ...prevData,
          imagen: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/social/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    alert("Salida Guardada");
    router.push("/home");
  };

  const handleDelete = async () => {
    const confirm = window.confirm(
      "¿Estás seguro que querés eliminar esta salida?"
    );
    if (!confirm) return;

    await fetch(`/api/social/${params.id}`, { method: "DELETE" });
    router.push("/home");
  };

  console.log("data", formData);

  return (
    <div className="flex flex-col justify-center items-center bg-[#FEFBF9]">
         <button
            onClick={() => router.back()}
            className="text-[#C76C01] self-start bg-white shadow-md rounded-full w-[40px] h-[40px] flex justify-center items-center ml-5 mt-5"
          >
            <img
              src="/assets/icons/Collapse Arrow.svg"
              alt="callback"
              className="h-[20px] w-[20px]"
            />
          </button>
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl h-[900px] p-8 mb-4">
        <div className="mb-4 flex justify-center items-center relative">

          <h1 className="text-center font-bold text-2xl bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent">
            Editar salida
          </h1>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            name="nombre"
            placeholder="Título"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />

          <textarea
            name="descripcion"
            placeholder="Descripción"
            value={formData.descripcion}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />

          <select
            name="deporte"
            value={formData.deporte}
            onChange={handleChange}
            className="w-full p-4  border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="Running">Running</option>
            <option value="Ciclismo">Ciclismo</option>
            <option value="Trekking">Trekking</option>
            <option value="Otros">Otros</option>
          </select>

          <div className="flex gap-4">
            <input
              type="date"
              name="fecha"
              value={formData.fecha.split("T")[0]}
              onChange={handleChange}
              required
              className="w-1/2 px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
            <input
              type="time"
              name="hora"
              value={formData.hora}
              onChange={handleChange}
              required
              className="w-1/2 px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
          </div>

          <input
            type="text"
            name="ubicacion"
            placeholder="Ubicación"
            value={formData.ubicacion}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />

          <div>
            {formData.imagen && (
              <img
                src={formData.imagen}
                alt="Preview"
                className="w-full h-48 object-cover rounded-xl cursor-pointer mb-2"
                onClick={() => document.getElementById("fileInput")?.click()}
              />
            )}
            <input
              type="file"
              accept="image/*"
              id="fileInput"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <button
            type="submit"
            className="w-full  bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] text-white py-3 rounded-xl font-semibold hover:bg-orange-600"
          >
            Guardar cambios
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="w-full mt-2 text-red-500 py-3"
          >
            Eliminar salida
          </button>
        </div>
      </form>
    </div>
  );
}
