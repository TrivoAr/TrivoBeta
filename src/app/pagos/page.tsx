"use client";  

import { useEffect, useState } from "react";
import MercadoPagoimagen from "../../../public/assets/MercadoPago.png";  // Asegúrate de que la imagen esté en la ruta correcta

const Mp = () => {
  const [grupoId, setGrupoId] = useState<string | null>(null);
  const [nombreGrupo, setNombreGrupo] = useState<string | null>(null);
  const [monto, setMonto] = useState<string | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);

  useEffect(() => {
    const storedGrupoId = localStorage.getItem("grupoId");
    const storedNombreGrupo = localStorage.getItem("nombreGrupo");
    const storedMonto = localStorage.getItem("monto");
    const storedFecha = localStorage.getItem("fecha");

    if (storedGrupoId && storedNombreGrupo && storedMonto && storedFecha) {
      setGrupoId(storedGrupoId);
      setNombreGrupo(storedNombreGrupo);
      setMonto(storedMonto);
      setFecha(storedFecha);
    } else {
      console.error("Faltan datos de pago");
    }
  }, []);

  const handlePagar = async () => {
    try {
      const duenoId = localStorage.getItem("dueño_id"); // Obtén el dueno_id
      const response = await fetch("/api/pagos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grupoId,
          nombreGrupo,
          fecha,
          monto,
          duenoId, // Enviar el duenoId al backend
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error en el backend:", errorData.error, errorData.details);
        alert(`Hubo un problema al procesar el pago: ${errorData.error}\nDetalles: ${errorData.details}`);
        return;
      }
  
      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert("No se pudo crear la preferencia de pago.");
      }
    } catch (error) {
      console.error("Error en el pago:", error);
      alert(`Hubo un problema al procesar el pago. Detalles: ${error.message}`);
    }
  };
  
  
  

  if (!grupoId || !nombreGrupo || !monto || !fecha) return <div>Cargando...</div>;

  return (
    <div className="flex justify-center min-h-screen">
      <div className="w-[389px] p-4 shadow-md bg-[#F4F4F4] overflow-y-auto">
        <div className="pb-2">
          <h1 className="text-center h-[22px] text-centerfont-medium text-[20px] ">
           Detalles del pago
          </h1>
        </div>
        <div className="w-[339px] h-[350px] bg-[#E5E5E5] rounded-xl">
          <div className="w-[100%] p-4">
            <div className="flex items-center gap-1">
              <div className="w-[53px] h-[53px]">
                <img
                  src="https://i.pinimg.com/736x/33/3c/3b/333c3b3436af10833aabeccd7c91c701.jpg"
                  className="rounded-full"
                  alt="Logo"
                />
              </div>
              <div className="flex flex-col">
                <h2 className="w-[139px] h-[22px] font-medium text-[20px]">
                  {nombreGrupo}
                </h2>
                <span className="w-[70px] h-[22px] font-medium text-[11px] text-[#A0AEC0] pt-1">
                  Profe Manuel
                </span>
              </div>
            </div>
          </div>
          <div className="w-[100%] p-2 flex flex-col items-start gap-1">
            <span className="w-[135px] h-[22px] font-semibold text-[32px]">
              ${monto}
            </span>

            <span className="w-[183px] h-[22px] font-medium text-[11px] text-[#A0AEC0] pt-3">
              {fecha}
            </span>
            <br />
            <span className="w-[58px] h-[22px] font-bold text-[14px] text-[#000000] pt-3">
              Detalles
            </span>
            {/*
            <div className="w-full flex justify-between items-start pt-3">
              <span className="font-normal text-[10px] text-[#333333]">
                Tarjeta
              </span>
              <span className="font-normal text-[10px] text-[#333333]">
                Visa 4052
              </span>
            </div>
               */ }
            <div className="w-full flex justify-between items-start pt-2">
              <span className="font-normal text-[10px] text-[#333333]">
                Transacción Nº
              </span>
              <span className="font-normal text-[10px] text-[#333333]">
                #123456789
              </span>
            </div>
            

            <div className="flex justify-center mt-4 w-[100%]">
              <button onClick={handlePagar} className="w-[80%] h-[40px] bg-[#C2C9D2] rounded-xl">
                Pagar
              </button>
            </div>
            <div className="flex justify-center w-[100%]">
              <button className="font-medium text-[11px] text-[#A0AEC0]">
                Otro Método de pago
              </button>
            </div>
            <div className="flex justify-center w-[100%] mt-2">
              <img
                src={MercadoPagoimagen.src}
                alt="Mercado Pago"
                className="w-[100px] h-[26px]"
              />
            </div>
              {/* Mensaje de advertencia */}
              <div className="w-full p-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 text-sm mt-4">
              <p>⚠️ Recuerda esperar a que Mercado Pago te redirija de vuelta a la aplicación para confirmar tu pago.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mp;
