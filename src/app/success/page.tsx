"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const Success = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [grupoId, setGrupoId] = useState<string | null>(null);
  const [nombreGrupo, setNombreGrupo] = useState<string | null>(null);
  const [monto, setMonto] = useState<string | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);

  const payment_id = searchParams.get("payment_id");
  const status = searchParams.get("status");
  const external_reference = searchParams.get("external_reference");
  const storedGrupoId = localStorage.getItem("grupoId");
  const storedNombreGrupo = localStorage.getItem("nombreGrupo");
  const storedMonto = localStorage.getItem("monto");
  const storedFecha = localStorage.getItem("fecha");
  const usuario_id = session?.user?.id || null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const registrarPago = async () => {
      // Verificamos que todos los datos necesarios estén disponibles
      if (
        !payment_id ||
        !status ||
        !external_reference ||
        !storedMonto ||
        !usuario_id ||
        !storedGrupoId ||
        !storedFecha ||
        isRegistered
      ) {
        console.log("Datos faltantes o pago ya registrado. Saliendo...");
        setLoading(false);
        return;
      }

      try {
        setIsRegistered(true);
        console.log("Registrando pago...");
        const response = await fetch("/api/registrar-pago", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_id,
            status,
            external_reference,
            monto: storedMonto,
            metodo_pago: "--", // Este valor se puede mejorar según sea necesario
            usuario_id,
            grupo_id: storedGrupoId,
            mes_pagado: storedFecha,
          }),
        });

        if (!response.ok) {
          throw new Error("Error al registrar el pago");
        }

        console.log("Pago registrado correctamente");
      } catch (error) {
        console.error("Error al registrar el pago:", error);
        setError(true);
      } finally {
        setLoading(false); // Aseguramos que la carga termine, incluso si hubo un error
      }
    };

    if (session) {
      registrarPago();
    }
  }, [
    session,
    payment_id,
    status,
    external_reference,
    isRegistered,
    storedMonto,
    storedGrupoId,
    storedFecha,
    usuario_id,
  ]);

  // Si estamos en estado de carga
  if (loading) {
    console.log("Cargando...");
    return <div>Cargando...</div>;
  }

  // Si hay error en el registro del pago
  if (error) {
    console.log("Ocurrió un error al registrar el pago");
    return (
      <div>
        <h1 className="text-3xl font-semibold text-[#333] mt-7">Pago</h1>
        <div className="w-[350px] h-[190px] bg-[#FF3E3E] shadow-md rounded-lg flex flex-col items-center justify-evenly mt-4">
          <h1 className="text-xs text-white font-light">
            ¡El pago no se pudo realizar!
          </h1>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="60px"
            viewBox="0 0 24 24"
            width="60px"
            fill="#fff"
          >
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
          </svg>
          <p className="text-4xl text-white">
            <strong>{storedMonto}</strong>
          </p>
        </div>
        <div className="mt-3">
          <div className="mb-3">
            <p className="text-xs text-[#696969]">Cantidad</p>
            <div className="w-[350px] border-b border-b-[#9999]">
              <p className="text-lg text-[#333]">{storedMonto}</p>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-xs text-[#696969]">Fecha</p>
            <div className="w-[350px] border-b border-b-[#9999]">
              <p className="text-lg text-[#333]">{storedFecha}</p>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-xs text-[#696969]">Método de pago</p>
            <div className="w-[350px] border-b border-b-[#9999]">
              <p className="text-lg text-[#333] font-light">
                Tarjeta de crédito
              </p>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-xs text-[#696969]">Número de Transacción</p>
            <div className="w-[350px] border-b border-b-[#9999]">
              <p className="text-lg text-[#333] font-light">{payment_id}</p>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-xs text-[#696969]">Estado</p>
            <div className="w-[350px] border-b border-b-[#9999]">
              <p className="text-lg text-[#333] font-light">Rechazado</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="w-[350px] h-[40px] font-bold text-[#333] bg-[#FA861F] rounded-md"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  // Si el pago fue exitoso
  return (
    <div>
      <h1 className="text-3xl font-semibold text-[#333] mt-7">Pago</h1>
      <div className="w-[350px] h-[190px] bg-[#78A55A] shadow-md rounded-lg flex flex-col items-center justify-evenly mt-4">
        <h1 className="text-xs text-white font-light">
          ¡Pago realizado correctamente!
        </h1>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="60px"
          viewBox="0 0 24 24"
          width="60px"
          fill="#fff"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
        <p className="text-4xl text-white">
          <strong>{storedMonto}</strong>
        </p>
      </div>
      <div className="mt-5 mb-10">
        <div className="mb-3">
          <p className="text-xs text-[#696969]">Cantidad</p>
          <div className="w-[350px] border-b border-b-[#9999]">
            <p className="text-lg text-[#333]">{storedMonto}</p>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-xs text-[#696969]">Fecha</p>
          <div className="w-[350px] border-b border-b-[#9999]">
            <p className="text-lg text-[#333]">{storedFecha}</p>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-xs text-[#696969]">Método de pago</p>
          <div className="w-[350px] border-b border-b-[#9999]">
            <p className="text-lg text-[#333] font-light">Tarjeta de crédito</p>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-xs text-[#696969]">Número de Transacción</p>
          <div className="w-[350px] border-b border-b-[#9999]">
            <p className="text-lg text-[#333] font-light">{payment_id}</p>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-xs text-[#696969]">Estado</p>
          <div className="w-[350px] border-b border-b-[#9999]">
            <p className="text-lg text-[#333] font-light">Pagado</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push("/dashboard")}
        className="w-[350px] h-[40px] font-bold text-[#333] bg-[#FA861F] rounded-md"
      >
        Volver al inicio
      </button>
    </div>
  );
};

export default Success;
