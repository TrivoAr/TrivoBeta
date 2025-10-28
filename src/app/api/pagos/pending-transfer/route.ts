import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import connectDB from "@/libs/mongodb";
import Pago from "@/models/pagos";
import MiembroSalida from "@/models/MiembroSalida";
import SalidaSocial from "@/models/salidaSocial";
import User from "@/models/user";
import { notifyJoinedEvent } from "@/libs/notificationHelpers";
import { nanoid } from "nanoid";

/**
 * Crea un pago pendiente para transferencia a CVU de MercadoPago
 *
 * Este endpoint se llama ANTES de que el usuario transfiera,
 * para que cuando llegue el webhook, ya exista el registro en BD.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { salidaId, academiaId, amount } = body;

    // Validar que tenga al menos salidaId o academiaId
    if (!salidaId && !academiaId) {
      return NextResponse.json(
        { error: "Debes proporcionar salidaId o academiaId" },
        { status: 400 }
      );
    }

    // Validar monto
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Monto inválido" },
        { status: 400 }
      );
    }

    await connectDB();

    // Generar external reference única
    const externalReference = `trivo_transfer_${nanoid(16)}`;

    // Crear pago pendiente
    const pago = await Pago.create({
      userId: session.user.id,
      salidaId: salidaId || undefined,
      academiaId: academiaId || undefined,
      amount,
      estado: "pendiente",
      tipoPago: "mercadopago_automatico",
      comprobanteUrl: "TRANSFERENCIA_MP_PENDIENTE",
      externalReference,
      currency: "ARS",
      paymentMethod: "bank_transfer",
    });

    console.log(`✅ Pago pendiente creado: ${pago._id}`);
    console.log(`📌 External Reference: ${externalReference}`);

    // Si es una salida social, crear MiembroSalida pendiente
    if (salidaId) {
      // Obtener datos de la salida y del usuario
      const salida = await SalidaSocial.findById(salidaId);
      const user = await User.findById(session.user.id);

      // Verificar si ya existe
      const miembroExistente = await MiembroSalida.findOne({
        usuario_id: session.user.id,
        salida_id: salidaId,
      });

      if (!miembroExistente) {
        await MiembroSalida.create({
          usuario_id: session.user.id,
          salida_id: salidaId,
          estado: "pendiente",
          pago_id: pago._id,
          rol: "miembro",
        });

        console.log(`✅ MiembroSalida pendiente creado`);
      } else {
        // Actualizar el miembro existente con el nuevo pago
        miembroExistente.pago_id = pago._id;
        miembroExistente.estado = "pendiente";
        await miembroExistente.save();

        console.log(`✅ MiembroSalida actualizado con nuevo pago`);
      }

      // ✅ Notificar al creador que alguien se unió a su salida
      if (salida && user && String(salida.creador_id) !== String(user._id)) {
        try {
          await notifyJoinedEvent(
            String(salida.creador_id),
            String(user._id),
            String(salida._id),
            `${user.firstname} ${user.lastname}`,
            salida.nombre
          );
          console.log(`🔔 Notificación enviada al creador de la salida`);
        } catch (notifError) {
          console.error("❌ Error enviando notificación:", notifError);
          // No lanzar error, continuar con el flujo
        }
      }
    }

    // Si es una academia, crear UsuarioAcademia pendiente
    if (academiaId) {
      const UsuarioAcademia = (await import("@/models/users_academia")).default;

      const usuarioExistente = await UsuarioAcademia.findOne({
        usuario_id: session.user.id,
        academia_id: academiaId,
      });

      if (!usuarioExistente) {
        await UsuarioAcademia.create({
          usuario_id: session.user.id,
          academia_id: academiaId,
          estado: "pendiente",
        });

        console.log(`✅ UsuarioAcademia pendiente creado`);
      }
    }

    return NextResponse.json({
      success: true,
      pagoId: pago._id,
      externalReference,
      message: "Pago pendiente registrado. Transfiere al CVU mostrado.",
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Error creando pago pendiente:", error);

    return NextResponse.json(
      {
        error: "Error al crear pago pendiente",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
