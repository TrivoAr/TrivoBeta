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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prevData) => ({ ...prevData, imagen: reader.result as string }));
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
    router.push("/home");
  };

  const handleDelete = async () => {
    const confirm = window.confirm("¿Estás seguro que querés eliminar esta salida?");
    if (!confirm) return;

    await fetch(`/api/social/${params.id}`, { method: "DELETE" });
    router.push("/home");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#FEFBF9] mb-[40px]">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-center font-bold text-2xl bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent">Editar salida</h1>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            name="titulo"
            placeholder="Título"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />

          <textarea
            name="descripcion"
            placeholder="Descripción"
            value={formData.descripcion}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />

          <div className="flex gap-4">
            <input
              type="date"
              name="fecha"
              value={formData.fecha.split("T")[0]}
              onChange={handleChange}
              required
              className="w-1/2 px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
            <input
              type="time"
              name="hora"
              value={formData.hora}
              onChange={handleChange}
              required
              className="w-1/2 px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
          </div>

          <input
            type="text"
            name="ubicacion"
            placeholder="Ubicación"
            value={formData.ubicacion}
            onChange={handleChange}
            required
            className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
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
            className="w-full mt-2 text-[#C76C01] py-3 rounded-xl border border-[#C76C01] hover:bg-orange-50"
          >
            Eliminar salida
          </button>
        </div>
      </form>
    </div>
  );
}
