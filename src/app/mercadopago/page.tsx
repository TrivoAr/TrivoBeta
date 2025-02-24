"use client";
import { useState, useEffect } from "react";
import TopContainer from "@/components/TopContainer";
import { useSession } from "next-auth/react";

const Mp = () => {
  const { data: session } = useSession();
  const [publicKey, setPublicKey] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [tokenActual, setTokenActual] = useState("");
  const [hasCredentials, setHasCredentials] = useState(false); // Estado para saber si ya tiene credenciales

  useEffect(() => {
    if (session?.user?.id) {
      fetchToken(session.user.id);
    }
  }, [session]);

  async function fetchToken(userId) {
    try {
      const response = await fetch(`/api/mercado-pago?userId=${userId}`);
      const data = await response.json();
      if (response.ok) {
        setTokenActual(data.token || "No disponible");
        setHasCredentials(data.hasCredentials || false); // Guardar estado de credenciales
      } else {
        console.error("Error al obtener el token:", data.message);
      }
    } catch (error) {
      console.error("Error en la petición:", error);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!session || !session.user || !session.user.id) {
      alert("No se pudo obtener el ID del usuario de la sesión");
      return;
    }

    const userId = session.user.id;
    const response = await fetch("/api/mercado-pago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, publicKey, accessToken }),
    });

    const result = await response.json();
    if (result.success) {
      alert("Credenciales guardadas correctamente");
      setHasCredentials(true); // Actualizar estado después de guardar
    } else {
      alert(`Error: ${result.message}`);
    }
  }

  return (
    <>
      <TopContainer />
      <div>
        <h1 className="font-bold mt-5 pl-2 text-lg">Credenciales Mercado Pago</h1>

        {hasCredentials ? (
          <p className="text-green-600 font-medium pl-2 mt-2">
            ✅ Ya has agregado credenciales de pago.
          </p>
        ) : (
          <p className="text-red-600 font-medium pl-2 mt-2">
            ⚠️ Aún no has agregado credenciales de pago.
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
          <p className="font-light text-sm pl-2 mt-2 self-start">
            Token Actual: {tokenActual || "No disponible"}
          </p>
          <p className="font-light text-sm pl-2 mt-2 self-start">
            Credenciales de producción
          </p>

          <div className="relative w-[95%]">
            <input
              type="text"
              id="publicKey"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder=" "
              className="peer w-full h-[50px] px-4 border border-gray-300 rounded-md bg-transparent text-sm outline-none focus:border-[#FF9A3D] focus:ring-1 focus:ring-[#FF9A3D] transition-all duration-200"
            />
            <label
              htmlFor="publicKey"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#FF9A3D]"
            >
              Public Key <span className="text-red-600">*</span>
            </label>
          </div>

          <div className="relative w-[95%]">
            <input
              type="text"
              id="accessToken"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder=" "
              className="peer w-full h-[50px] px-4 border border-gray-300 rounded-md bg-transparent text-sm outline-none focus:border-[#FF9A3D] focus:ring-1 focus:ring-[#FF9A3D] transition-all duration-200"
            />
            <label
              htmlFor="accessToken"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[#FF9A3D]"
            >
              Access Token <span className="text-red-600">*</span>
            </label>
          </div>

          <p className="font-light text-sm pl-2 self-start text-[#bcbcbc]">
            Habilita a los checkout de Mercado Pago para recibir pagos reales en la app
          </p>

          <button
            className="w-[95%] bg-[#FF9A3D] h-[40px] rounded-md mt-10 text-[#333] text-sm font-medium hover:bg-[#e88a35] transition-colors"
          >
            Guardar
          </button>
        </form>
      </div>
    </>
  );
};

export default Mp;
