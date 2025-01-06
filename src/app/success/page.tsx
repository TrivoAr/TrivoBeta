"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const Success = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const payment_id = searchParams.get("payment_id");
  const status = searchParams.get("status");
  const external_reference = searchParams.get("external_reference");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const registrarPago = async () => {
      if (payment_id && status && external_reference) {
        try {
          const response = await fetch("/api/registrar-pago", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              payment_id,
              status,
              external_reference,
            }),
          });

          if (!response.ok) {
            throw new Error("Error al registrar el pago");
          }

          setLoading(false);
        } catch (error) {
          console.error("Error al registrar el pago:", error);
          setError(true);
        }
      }
    };

    registrarPago();
  }, [payment_id, status, external_reference]);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error al registrar el pago. Por favor, contacta soporte.</div>;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <h1 className="text-2xl font-semibold text-green-600">¡Pago exitoso!</h1>
        <p className="mt-4 text-gray-700">Tu pago ha sido procesado correctamente.</p>
        <p className="mt-2 text-gray-500">
          <strong>ID de Pago:</strong> {payment_id}
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default Success;
