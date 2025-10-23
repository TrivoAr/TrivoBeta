import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import Pagos from "@/models/pagos";
import UsuarioAcademia from "@/models/users_academia";
import Suscripcion from "@/models/Suscripcion";
import { SUBSCRIPTION_CONFIG } from "@/config/subscription.config";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: academiaId } = params;
    const userId = session.user.id;

    await connectDB();

    // PRIORIDAD 1: Verificar sistema nuevo (Suscripciones)
    const suscripcion = await Suscripcion.findOne({
      userId,
      academiaId,
    }).sort({ createdAt: -1 });

    if (suscripcion) {
      // Si existe suscripción, usar ese estado
      const estadosSuscripcionActivos = [
        SUBSCRIPTION_CONFIG.ESTADOS.TRIAL,
        SUBSCRIPTION_CONFIG.ESTADOS.ACTIVA,
      ];

      const isApproved = estadosSuscripcionActivos.includes(suscripcion.estado);
      const isPending = suscripcion.estado === SUBSCRIPTION_CONFIG.ESTADOS.PENDIENTE;
      // NO marcar trial_expirado como pending - necesita mostrar botón de activación

      return NextResponse.json({
        pago: null,
        miembro: {
          id: suscripcion._id,
          estado: suscripcion.estado,
        },
        suscripcion: {
          id: suscripcion._id,
          estado: suscripcion.estado,
          trial: suscripcion.trial,
          mercadoPago: suscripcion.mercadoPago,
        },
        isApproved,
        isPending,
        tipoSistema: "suscripcion", // Para debugging
      });
    }

    // FALLBACK: Sistema viejo (Pagos + UsuarioAcademia)
    const pago = await Pagos.findOne({
      academiaId,
      userId,
    }).sort({ createdAt: -1 });

    const miembro = await UsuarioAcademia.findOne({
      academia_id: academiaId,
      user_id: userId,
    });

    return NextResponse.json({
      pago: pago
        ? {
            id: pago._id,
            estado: pago.estado,
            status: pago.status,
            statusDetail: pago.statusDetail,
            amount: pago.amount,
            paymentMethod: pago.paymentMethod,
            createdAt: pago.createdAt,
          }
        : null,
      miembro: miembro
        ? {
            id: miembro._id,
            estado: miembro.estado,
          }
        : null,
      suscripcion: null,
      isApproved: miembro?.estado === "aceptado" && pago?.estado === "aprobado",
      isPending:
        pago?.estado === "pendiente" ||
        (pago?.estado === "aprobado" && miembro?.estado === "pendiente"),
      tipoSistema: "viejo", // Para debugging
    });
  } catch (error) {

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
