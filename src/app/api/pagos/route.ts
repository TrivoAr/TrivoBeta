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
import { Types } from "mongoose";
import Pago from "@/models/pagos";
import SalidaSocial from "@/models/salidaSocial";
import Academia from "@/models/academia";
import User from "@/models/user";
import { notifyPaymentPending } from "@/libs/notificationHelpers";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { salidaId, academiaId, userId, comprobanteUrl, estado } = body;

    if (!userId || !comprobanteUrl || (!salidaId && !academiaId)) {
      return NextResponse.json(
        {
          error:
            "Faltan campos obligatorios (userId, comprobanteUrl, y salidaId o academiaId)",
        },
        { status: 400 }
      );
    }

    const pagoData: any = {
      userId: new Types.ObjectId(userId),
      comprobanteUrl,
    };

    // Agregar estado si se proporciona (ej: "aprobado" para Club del Trekking)
    if (estado) {
      pagoData.estado = estado;
    }

    if (salidaId) {
      pagoData.salidaId = new Types.ObjectId(salidaId);
    }
    if (academiaId) {
      pagoData.academiaId = new Types.ObjectId(academiaId);
    }

    // Validación manual: debe tener al menos salidaId o academiaId
    if (!pagoData.salidaId && !pagoData.academiaId) {
      return NextResponse.json(
        { error: "Debe especificar salidaId o academiaId" },
        { status: 400 }
      );
    }

    const pago = await Pago.create(pagoData);

    // Notificar al creador sobre el comprobante recibido
    // Solo si no es un evento gratuito o del Club del Trekking
    if (comprobanteUrl !== "EVENTO_GRATUITO" && comprobanteUrl !== "CLUB_DEL_TREKKING") {
      if (salidaId) {
        await notificarCreadorComprobante(salidaId, userId, "salida");
      } else if (academiaId) {
        await notificarCreadorComprobante(academiaId, userId, "academia");
      }
    }

    return NextResponse.json(
      { message: "Pago registrado", pago },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// Función para notificar al creador sobre comprobante de transferencia recibido
async function notificarCreadorComprobante(
  entidadId: string,
  userId: string,
  tipo: "salida" | "academia"
) {
  try {
    const usuario = await User.findById(userId);
    if (!usuario) {
      return;
    }

    if (tipo === "salida") {
      const salida = await SalidaSocial.findById(entidadId);
      if (!salida) {
        return;
      }

      const creadorId = salida.creador_id;

      // No notificar si el creador es el mismo usuario
      if (String(creadorId) === String(userId)) {
        return;
      }

      // Usar la función helper que maneja BD + Socket.IO
      await notifyPaymentPending(
        String(creadorId),
        String(userId),
        String(salida._id),
        `${usuario.firstname} ${usuario.lastname}`,
        salida.nombre
      );
    } else if (tipo === "academia") {
      const academia = await Academia.findById(entidadId);
      if (!academia) {
        return;
      }

      const creadorId = academia.dueño_id;

      // No notificar si el dueño es el mismo usuario
      if (String(creadorId) === String(userId)) {
        return;
      }

      // TODO: Crear función notifyPaymentPendingAcademia cuando sea necesario
    }
  } catch (error) {
  }
}

export async function GET() {
  try {
    await connectDB();
    const pagos = await Pago.find().populate("salidaId").populate("userId");
    return NextResponse.json(pagos, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
