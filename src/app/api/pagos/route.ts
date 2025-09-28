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
import Notificacion from "@/models/notificacion";

export async function POST(req: Request) {
  try {
    console.log("Iniciando POST /api/pagos");
    await connectDB();
    const body = await req.json();
    console.log("Body recibido:", body);

    const { salidaId, academiaId, userId, comprobanteUrl } = body;

    if (!userId || !comprobanteUrl || (!salidaId && !academiaId)) {
      console.log("Faltan campos obligatorios:", {
        userId,
        comprobanteUrl,
        salidaId,
        academiaId,
      });
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

    if (salidaId) {
      pagoData.salidaId = new Types.ObjectId(salidaId);
    }
    if (academiaId) {
      pagoData.academiaId = new Types.ObjectId(academiaId);
    }

    console.log("Datos para crear pago:", pagoData);

    // Validación manual: debe tener al menos salidaId o academiaId
    if (!pagoData.salidaId && !pagoData.academiaId) {
      console.log("Error: Debe tener al menos salidaId o academiaId");
      return NextResponse.json(
        { error: "Debe especificar salidaId o academiaId" },
        { status: 400 }
      );
    }

    const pago = await Pago.create(pagoData);
    console.log("Pago creado exitosamente:", pago._id);

    // Notificar al creador sobre el comprobante recibido
    // Solo si no es un evento gratuito (que usa "EVENTO_GRATUITO" como comprobanteUrl)
    if (comprobanteUrl !== "EVENTO_GRATUITO") {
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
    console.error("Error creando pago:", error);
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
      console.error("No se encontró el usuario para notificar");
      return;
    }

    let creadorId: string;
    let nombre: string;
    let mensaje: string;

    if (tipo === "salida") {
      const salida = await SalidaSocial.findById(entidadId);
      if (!salida) {
        console.error("No se encontró la salida para notificar");
        return;
      }

      creadorId = salida.creador_id;
      nombre = salida.nombre;

      // No notificar si el creador es el mismo usuario
      if (String(creadorId) === String(userId)) {
        return;
      }

      mensaje = `${usuario.firstname} ha enviado el comprobante de pago para tu salida "${nombre}". Revisa y aprueba su participación.`;

      await Notificacion.create({
        userId: creadorId,
        fromUserId: userId,
        salidaId: salida._id,
        type: "payment_pending",
        message: mensaje,
      });
    } else if (tipo === "academia") {
      const academia = await Academia.findById(entidadId);
      if (!academia) {
        console.error("No se encontró la academia para notificar");
        return;
      }

      creadorId = academia.dueño_id;
      nombre = academia.nombre_academia;

      // No notificar si el dueño es el mismo usuario
      if (String(creadorId) === String(userId)) {
        return;
      }

      mensaje = `${usuario.firstname} ha enviado el comprobante de pago para tu academia "${nombre}". Revisa y aprueba su participación.`;

      await Notificacion.create({
        userId: creadorId,
        fromUserId: userId,
        academiaId: academia._id,
        type: "payment_pending",
        message: mensaje,
      });
    }

    console.log(
      `Notificación enviada al creador (${creadorId}) sobre comprobante recibido de transferencia`
    );
  } catch (error) {
    console.error(
      "Error enviando notificación al creador sobre comprobante:",
      error
    );
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
