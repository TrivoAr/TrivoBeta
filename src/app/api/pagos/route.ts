import MercadoPagoCredentials from "../../../models/mercadoPagoCredentials"; 
import api from "../api.js"; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { grupoId, nombreGrupo, fecha, monto, duenoId } = body;

    if (!grupoId || !nombreGrupo || !fecha || !monto || !duenoId) {
      return new Response(JSON.stringify({ error: "Datos incompletos" }), {
        status: 400,
      });
    }

    console.log("Datos recibidos:", { grupoId, nombreGrupo, fecha, monto, duenoId });

    // Busca las credenciales del dueño
    const credentials = await MercadoPagoCredentials.findOne({ userId: duenoId });

    if (!credentials) {
      return new Response(JSON.stringify({ error: "Credenciales no encontradas para el dueño" }), {
        status: 404,
      });
    }

    const initPoint = await api.message.submit(
      { grupoId, nombreGrupo, fecha },
      parseFloat(monto),
      credentials.accessToken // Pasar el accessToken del dueño
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
