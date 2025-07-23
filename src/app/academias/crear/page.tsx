"use client";
import { FormEvent, useState } from "react";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { text } from "stream/consumers";
import { saveAcademyImage } from "@/app/api/academias/saveAcademyImage";

function CrearAcademia() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [text, setText] = useState("");
  const maxChars = 60;

  const handleChange = (event) => {
    setText(event.target.value);
  };
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // genera vista previa local
    }
  };

  //   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  //     event.preventDefault();
  //     const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     setSelectedFile(file);
  //     setPreviewUrl(URL.createObjectURL(file));
  //   }
  // };

  //     try {
  //       const formData = new FormData(event.currentTarget);
  //       const data = Object.fromEntries(formData.entries());

  //       const response = await axios.post("/api/academias", data);

  //       if (response.status === 201) {
  //         toast.success("¡Academia creada con éxito!");
  //         router.push("/home");
  //       } else {
  //         throw new Error("Error al crear la academia");
  //       }
  //     } catch (error) {
  //       console.error("Error:", error);
  //       if (error instanceof AxiosError) {
  //         const errorMessage = error.response?.data?.message || "Error en la solicitud";
  //         toast.error(errorMessage);
  //       } else {
  //         toast.error("Ocurrió un error desconocido");
  //       }
  //     }
  //   };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const formData = new FormData(event.currentTarget);
      formData.delete("imagen"); // borra campo file para que no se mande al backend
      // const data = Object.fromEntries(formData.entries());
      // data.clase_gratis = formData.get("clase_gratis") === "on";
      const data = Object.fromEntries(formData.entries());
      const claseGratis = formData.get("clase_gratis") === "on"; // ✅ calculás por fuera

      // Podés usar spread para mezclar el booleano después
      const payload = {
        ...data,
        clase_gratis: claseGratis,
      };

      // 1️⃣ Crear la academia (sin imagen)
      const response = await axios.post("/api/academias", payload);

      if (response.status === 201) {
        const { _id } = response.data;

        // 2️⃣ Subir imagen a Firebase si existe
        if (selectedFile && _id) {
          await saveAcademyImage(selectedFile, _id);
        }

        toast.success("¡Academia creada con éxito!");
        router.push("/home");
      } else {
        throw new Error("Error al crear la academia");
      }
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof AxiosError) {
        const errorMessage =
          error.response?.data?.message || "Error en la solicitud";
        toast.error(errorMessage);
      } else {
        toast.error("Ocurrió un error desconocido");
      }
    }
  };

  return (
    <div className="w-[390px] flex flex-col items-center gap-5">
      <Toaster position="top-center" /> {/* Para mostrar los toasts */}
      <h2 className="text-center font-bold text-2xl mt-4 bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] bg-clip-text text-transparent">
        Crear <span className="text-black">Grupo</span>
      </h2>
      <form
        onSubmit={handleSubmit}
        className="max-w-sm mx-auto p-4 space-y-5 rounded-xl  mb-[80px] bg-[#FEFBF9]"
      >
        {/* <div className="relative mb-6">
          <input
            type="text"
            name="nombre_academia"
            className="form-input peer"
            placeholder=" "
            required
          />
          <label className="form-label">Nombre</label>
        </div> */}

        <label className="block">
          Nombre
          <input
            name="nombre_academia"
            placeholder=""
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
        </label>

        {/* <div className="relative mb-6">
          <input
            type="text"
            name="pais"
            className="form-input peer"
            placeholder=" "
            required
          />
          <label className="form-label">País</label>
        </div> */}

        <select
          name="pais"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Pais</option>
          <option value="Argentina">Argentina</option>
          <option value="Chile">Chile</option>
          <option value="Peru">Peru</option>
          <option value="Uruguay">Uruguay</option>
        </select>

        {/* <div className="relative mb-6">
          <input
            type="text"
            name="provincia"
            className="form-input peer"
            placeholder=" "
            required
          />
          <label className="form-label">Provincia</label>
        </div> */}

        <select
          name="provincia"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Provincia</option>
          <option value="Tucuman">Tucuman</option>
          <option value="Buenos Aires">Buenos Aires</option>
          <option value="Cordoba">Cordoba</option>
          <option value="Mendoza">Mendoza</option>
        </select>

        {/* <div className="relative mb-6">
          <input
            type="text"
            name="localidad"
            className="form-input peer"
            placeholder=" "
            required
          />
          <label className="form-label">Localidad</label>
        </div> */}

        <select
          name="localidad"
          className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
        >
          <option value="">Localidad</option>
          <option value="San Miguel de Tucuman">San Miguel de Tucuman</option>
          <option value="Yerba Buena">Yerba Buena</option>
          <option value="Tafi Viejo">Tafi Viejo</option>
          <option value="Otros">Otros</option>
        </select>

        {/* <div className="relative mb-6">
          <textarea
            name="descripcion"
            className="form-input peer"
            placeholder=" "
            maxLength={maxChars}
          ></textarea>
          
          <label className="form-label">Descripción</label>
        </div> */}

        <label className="block">
          Descripción
          <textarea
            name="descripcion"
            maxLength={maxChars}
            placeholder="Somos una grupo de..."
            className="w-full px-3 py-4 border rounded-[15px] shadow-md"
          />
        </label>
        <label className="block">
          Precio
          <input
            name="precio"
            placeholder="18.000"
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
        </label>

        <div>
          <select
            name="tipo_disciplina"
            placeholder=" "
            required
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
          >
            <option value="">Selecciona un deporte</option>
            <option value="Running">Running</option>
            <option value="Trekking">Trekking</option>
            <option value="Ciclismo">Ciclismo</option>
            <option value="Otros">Otros</option>
          </select>
        </div>
        <label className="block">
          Imagen
          <div className="w-full h-40 bg-white border shadow-md rounded-md flex items-center justify-center relative overflow-hidden">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute w-full h-full opacity-0 cursor-pointer z-10"
            />
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Vista previa"
                className="w-full h-full object-cover absolute top-0 left-0"
              />
            ) : (
              <span className="text-gray-500 z-0">Subir imagen</span>
            )}
          </div>
        </label>

        {/* <div className="relative mb-6">
          <input
            type="text"
            name="telefono"
            className="form-input peer"
            placeholder=" "
          />
          <label className="form-label">Teléfono</label>
        </div> */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="clase_gratis"
            className="form-checkbox h-5 w-5 text-orange-500"
          />
          <span className="text-gray-700">¿Primera clase gratis?</span>
        </label>

        {/* <label className="block">
          Número de teléfono
          <input
            name="telefono"
            placeholder="+5491123456789"
            className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
        </label> */}
        <div className="flex flex-col  items-center gap-3">
          <button className="w-full py-2 rounded-md text-white  bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] font-bold">
            Crear Academia
          </button>

          <button
            type="button"
            className="text-center text-[#FF9A3D] font-bold "
            onClick={() => router.back()} // Atrás
          >
            Atrás
          </button>
        </div>
      </form>
      <div className="pb-[50px]"></div>
    </div>
  );
}

export default CrearAcademia;
