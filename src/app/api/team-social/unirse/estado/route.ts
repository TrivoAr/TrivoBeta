import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroTeamSocial from "@/models/miembrosTeamSocial";
import User from "@/models/user";

export async function POST(req: NextRequest) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

  const { teamSocialId } = await req.json();
  if (!teamSocialId) return NextResponse.json({ message: "Falta teamSocialId" }, { status: 400 });

  const user = await User.findOne({ email: session.user?.email });
  if (!user) return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });

  const miembro = await MiembroTeamSocial.findOne({
    usuario_id: user._id,
    teamsocial_id: teamSocialId,
  });

  return NextResponse.json({ unido: !!miembro });
}
