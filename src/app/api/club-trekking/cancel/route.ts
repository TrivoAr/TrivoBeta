import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/libs/mongodb";
import ClubTrekkingMembership from "@/models/ClubTrekkingMembership";
import User from "@/models/user";
import { authOptions } from "@/libs/authOptions";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { trackServerClubTrekkingCancelled } from "@/libs/mixpanelServer";

// Inicializar MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || "",
});

const preapproval = new PreApproval(client);

/**
 * POST /api/club-trekking/cancel
 * Cancelar membresía del Club del Trekking
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { membershipId, motivo } = body;

    if (!membershipId || !motivo) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const membership = await ClubTrekkingMembership.findById(membershipId);
    if (!membership) {
      return NextResponse.json(
        { error: "Membresía no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la membresía pertenece al usuario
    if (membership.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Cancelar en MercadoPago si existe preapprovalId
    if (membership.mercadoPago.preapprovalId) {
      try {
        await preapproval.update({
          id: membership.mercadoPago.preapprovalId,
          body: { status: "cancelled" },
        });
      } catch (mpError) {
        console.error("Error al cancelar en MercadoPago:", mpError);
        // Continuar con la cancelación local aunque falle MP
      }
    }

    // Cancelar la membresía
    membership.cancelar(motivo);
    await membership.save();

    // Actualizar el usuario
    user.clubTrekking.esMiembro = false;
    user.clubTrekking.badge.activo = false;
    await user.save();

    // Track en Mixpanel
    // Calcular meses activos (aproximado)
    const fechaInicio = new Date(membership.fechaInicio);
    const fechaFin = new Date();
    const mesesActivos = Math.max(1, Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24 * 30)));

    trackServerClubTrekkingCancelled(
      user._id.toString(),
      membership._id.toString(),
      motivo,
      mesesActivos
    );

    return NextResponse.json(
      {
        success: true,
        message: "Membresía cancelada exitosamente",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al cancelar membresía:", error);
    return NextResponse.json(
      { error: "Error al cancelar la membresía" },
      { status: 500 }
    );
  }
}
