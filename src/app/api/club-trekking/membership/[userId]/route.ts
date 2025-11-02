import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/libs/mongodb";
import ClubTrekkingMembership from "@/models/ClubTrekkingMembership";
import User from "@/models/user";
import { authOptions } from "@/libs/authOptions";

/**
 * GET /api/club-trekking/membership/[userId]
 * Obtener membresía activa del usuario
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectDB();

    const { userId } = params;

    // Verificar que el usuario solicita su propia información o es admin
    const user = await User.findOne({ email: session.user.email });
    if (user._id.toString() !== userId && user.rol !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const membership = await ClubTrekkingMembership.findOne({
      userId,
      estado: { $in: ["activa", "pausada"] },
    })
      .populate("userId", "firstname lastname email imagen")
      .lean();

    if (!membership) {
      return NextResponse.json(
        { error: "No se encontró membresía activa" },
        { status: 404 }
      );
    }

    // Verificar y actualizar si necesita reset mensual
    const membershipDoc = await ClubTrekkingMembership.findById(membership._id);
    if (membershipDoc) {
      membershipDoc.resetearContadorMensual();
      await membershipDoc.save();
    }

    return NextResponse.json({ membership }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener membresía:", error);
    return NextResponse.json(
      { error: "Error al obtener la membresía" },
      { status: 500 }
    );
  }
}
