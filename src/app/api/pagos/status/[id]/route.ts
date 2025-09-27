import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import Pagos from "@/models/pagos";
import MiembroSalida from "@/models/MiembroSalida";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: salidaId } = params;
    const userId = session.user.id;

    await connectDB();

    // Buscar el pago más reciente para esta salida y usuario
    const pago = await Pagos.findOne({
      salidaId,
      userId
    }).sort({ createdAt: -1 });

    // Buscar el estado del miembro
    const miembro = await MiembroSalida.findOne({
      salida_id: salidaId,
      usuario_id: userId
    });

    return NextResponse.json({
      pago: pago ? {
        id: pago._id,
        estado: pago.estado,
        status: pago.status,
        statusDetail: pago.statusDetail,
        amount: pago.amount,
        paymentMethod: pago.paymentMethod,
        createdAt: pago.createdAt
      } : null,
      miembro: miembro ? {
        id: miembro._id,
        estado: miembro.estado
      } : null,
      isApproved: miembro?.estado === "aprobado" && pago?.estado === "aprobado",
      isPending: pago?.estado === "pendiente" || (pago?.estado === "aprobado" && miembro?.estado === "pendiente")
    });

  } catch (error) {
    console.error("Error obteniendo estado de pago:", error);
    return NextResponse.json({
      error: "Error interno del servidor"
    }, { status: 500 });
  }
}