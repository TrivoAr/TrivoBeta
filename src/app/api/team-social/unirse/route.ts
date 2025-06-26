import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroTeamSocial from "@/models/miembrosTeamSocial";
import TeamSocial from "@/models/teamSocial"; // asegúrate de tener este modelo
import User from "@/models/user";

export async function POST(req: Request) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session) return new Response("No autorizado", { status: 401 });

  const { teamSocialId } = await req.json();
  const user = await User.findOne({ email: session.user?.email });
  if (!user) return new Response("Usuario no encontrado", { status: 404 });

  const team = await TeamSocial.findById(teamSocialId);
  if (!team) return new Response("TeamSocial no encontrado", { status: 404 });

  const yaEsMiembro = await MiembroTeamSocial.findOne({
    usuario_id: user._id,
    teamsocial_id: teamSocialId,
  });

  if (yaEsMiembro) {
    return new Response("Ya eres miembro de este team", { status: 400 });
  }

  const nuevoMiembro = new MiembroTeamSocial({
    usuario_id: user._id,
    teamsocial_id: teamSocialId,
  });

  await nuevoMiembro.save();

  return new Response(JSON.stringify(nuevoMiembro), { status: 200 });
}

export async function DELETE(req: Request) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return new Response("No autorizado", { status: 401 });

  const { searchParams } = new URL(req.url);
  const teamSocialId = searchParams.get("teamSocialId");
  if (!teamSocialId) return new Response("Falta teamSocialId", { status: 400 });

  const user = await User.findOne({ email: session.user?.email });
  if (!user) return new Response("Usuario no encontrado", { status: 404 });

  const eliminado = await MiembroTeamSocial.findOneAndDelete({
    usuario_id: user._id,
    teamsocial_id: teamSocialId,
  });

  if (!eliminado) {
    return new Response("No estabas unido a este team", { status: 400 });
  }

  return new Response("Saliste del team", { status: 200 });
}
