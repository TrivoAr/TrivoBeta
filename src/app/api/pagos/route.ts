// import MercadoPagoCredentials from "../../../models/mercadoPagoCredentials";
// import api from "../api.js";

// export async function POST(request: Request) {
//   try {
//     const body = await request.json();
//     const { grupoId, nombreGrupo, fecha, monto, duenoId } = body;

//     if (!grupoId || !nombreGrupo || !fecha || !monto || !duenoId) {
//       return new Response(JSON.stringify({ error: "Datos incompletos" }), {
//         status: 400,
//       });
//     }

//     console.log("Datos recibidos:", { grupoId, nombreGrupo, fecha, monto, duenoId });

//     // Busca las credenciales del dueño
//     const credentials = await MercadoPagoCredentials.findOne({ userId: duenoId });

//     if (!credentials) {
//       return new Response(JSON.stringify({ error: "Credenciales no encontradas para el dueño" }), {
//         status: 404,
//       });
//     }

//     const initPoint = await api.message.submit(
//       { grupoId, nombreGrupo, fecha },
//       parseFloat(monto),
//       credentials.accessToken // Pasar el accessToken del dueño
//     );

//     return new Response(JSON.stringify({ init_point: initPoint }), {
//       status: 200,
//     });
//   } catch (error) {
//     console.error("Error en el backend:", error);
//     return new Response(
//       JSON.stringify({ error: "Error al procesar el pago" }),
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Pago from "@/models/Pagos";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { salidaId, userId, comprobanteUrl } = body;

    if (!salidaId || !userId || !comprobanteUrl) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const pago = await Pago.create({
      salidaId,
      userId,
      comprobanteUrl,
    });

    return NextResponse.json(
      { message: "Pago registrado", pago },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando pago:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const pagos = await Pago.find().populate("salidaId").populate("userId");
    return NextResponse.json(pagos, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo pagos:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
