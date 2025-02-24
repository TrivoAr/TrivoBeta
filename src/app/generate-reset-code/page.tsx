"use client";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";

export default function GenerateResetCode() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/generate-reset-code", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setMessage(`Código enviado: ${data.resetCode}. ¡Compártelo con el usuario!`);
      toast.success("Código enviado correctamente.");
    } else {
      setMessage(data.message || "Hubo un error al generar el código.");
      toast.error(data.message || "Hubo un error.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#F4F4F4] font-sans">
      <Toaster position="top-center" />

      {/* Logo y título */}
      <Image  src="/assets/Isologo - Positivo a color.png" alt="Klubo Logo" width={120} height={120}/>
      <div className="text-center mb-6 mt-6">
     
        <h1 className="text-xl font-bold text-black mt-2">Generar Código de Recuperación</h1>
      </div>

      {/* Formulario */}
      <form className="w-80 flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* Email */}
        <div className="relative border-b border-gray-300 pb-2 flex items-center">
          <i className="icon-user text-gray-400 mr-2"></i>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-none outline-none text-sm p-1 bg-[#F4F4F4]"
            required
          />
        </div>

        {/* Botón de generar código */}
        <button
          type="submit"
          className="bg-orange-500 text-white py-2 rounded-full font-medium text-base hover:bg-orange-600"
          disabled={loading}
        >
          {loading ? "Generando..." : "Generar Código"}
        </button>

        {/* Mensaje de estado */}
        {message && <p className="text-center text-sm text-gray-600 mt-4">{message}</p>}
      </form>
    </div>
  );
}
