import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroTeamSocial from "@/models/miembrosTeamSocial"; // Modelo correcto
import User from "@/models/user";
import { getProfileImage } from "@/app/api/profile/getProfileImage";

export async function GET(req: NextRequest) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session) return new Response("No autorizado", { status: 401 });

  const teamSocialId = req.nextUrl.searchParams.get("teamSocialId");
  if (!teamSocialId) return new Response("Falta teamSocialId", { status: 400 });

  // Buscar miembros por teamsocial_id (no salida_id)
  const miembros = await MiembroTeamSocial.find({ teamsocial_id: teamSocialId }).populate("usuario_id", "firstname lastname email");

  const miembrosConImagen = await Promise.all(
    miembros.map(async (m) => {
      const usuario = m.usuario_id as any; // mongoose document
      let imagenUrl;

      try {
        imagenUrl = await getProfileImage("profile-image.jpg", usuario._id.toString());
      } catch {
        imagenUrl = "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg";
      }

      return {
        _id: usuario._id,
        nombre: `${usuario.firstname} ${usuario.lastname}`.trim() || usuario.email,
        email: usuario.email,
        imagen: imagenUrl,
      };
    })
  );

  return new Response(JSON.stringify(miembrosConImagen), { status: 200 });
}
