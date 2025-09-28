import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import Pagos from "@/models/pagos";
import UsuarioAcademia from "@/models/users_academia";

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

    // Buscar el pago más reciente para esta academia y usuario
    const pago = await Pagos.findOne({
      academiaId, // Nota: necesitaremos actualizar el modelo Pagos para incluir academiaId
      userId,
    }).sort({ createdAt: -1 });

    // Buscar el estado del miembro en la academia
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
      isApproved: miembro?.estado === "aceptado" && pago?.estado === "aprobado",
      isPending:
        pago?.estado === "pendiente" ||
        (pago?.estado === "aprobado" && miembro?.estado === "pendiente"),
    });
  } catch (error) {
    console.error("Error obteniendo estado de pago de academia:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
