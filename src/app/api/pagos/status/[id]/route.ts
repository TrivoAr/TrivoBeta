import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import Pagos from "@/models/pagos";
import MiembroSalida from "@/models/MiembroSalida";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: salidaId } = await params;
    const userId = session.user.id;

    await connectDB();

    // Buscar el pago más reciente para esta salida y usuario
    const pago = await Pagos.findOne({
      salidaId,
      userId,
    }).sort({ createdAt: -1 });

    // Populate pago_id to get estado
    const miembroWithPago = await MiembroSalida.findOne({
      salida_id: salidaId,
      usuario_id: userId,
    }).populate("pago_id", "estado");

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
      miembro: miembroWithPago
        ? {
          id: miembroWithPago._id,
          estado: (miembroWithPago.pago_id as any)?.estado || "pendiente",
        }
        : null,
      isApproved: pago?.estado === "aprobado",
      isPending: pago?.estado === "pendiente",
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
