import { Payment } from "mercadopago";
import api from "../api.js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { grupoId, nombreGrupo, fecha, monto } = body;

    if (!grupoId || !nombreGrupo || !fecha || !monto) {
      return new Response(JSON.stringify({ error: "Datos incompletos" }), {
        status: 400,
      });
    }

    console.log("Datos recibidos:", { grupoId, nombreGrupo, fecha, monto });

    const initPoint = await api.message.submit(
      { grupoId, nombreGrupo, fecha },
      parseFloat(monto)
    );

    return new Response(JSON.stringify({ init_point: initPoint }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error en el backend:", error);
    return new Response(
      JSON.stringify({ error: "Error al procesar el pago" }),
      { status: 500 }
    );
  }
}

