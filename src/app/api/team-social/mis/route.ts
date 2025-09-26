import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroTeamSocial from "@/models/miembrosTeamSocial";
import TeamSocial from "@/models/teamSocial";

export async function GET(req: NextRequest) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session) return new Response("No autorizado", { status: 401 });

  // buscar donde el usuario es miembro
  const membresias = await MiembroTeamSocial.find({
    usuario_id: session.user.id,
  });
  const teamSocialIds = membresias.map((m) => m.teamsocial_id);

  const teams = await TeamSocial.find({ _id: { $in: teamSocialIds } });

  return new Response(JSON.stringify(teams), { status: 200 });
}
