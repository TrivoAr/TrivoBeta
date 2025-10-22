import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroTeamSocial from "@/models/miembrosTeamSocial";
import TeamSocial from "@/models/teamSocial"; // Modelo correcto
import User from "@/models/user";
import { getProfileImage } from "@/app/api/profile/getProfileImage";

export async function GET(req: NextRequest) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session) return new Response("No autorizado", { status: 401 });

  const teamSocialId = req.nextUrl.searchParams.get("teamSocialId");
  if (!teamSocialId) return new Response("Falta teamSocialId", { status: 400 });

  // Buscar miembros por teamsocial_id (no salida_id)
  const miembros = await MiembroTeamSocial.find({
    teamsocial_id: teamSocialId,
  }).populate("usuario_id", "firstname lastname email");

  const miembrosConImagen = await Promise.all(
    miembros.map(async (m) => {
      const usuario = m.usuario_id as any; // mongoose document
      let imagenUrl;

      try {
        imagenUrl = await getProfileImage(
          "profile-image.jpg",
          usuario._id.toString()
        );
      } catch {
        imagenUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          usuario.firstname
        )}&length=1&background=random&color=fff&size=128`;
      }

      return {
        _id: usuario._id,
        nombre:
          `${usuario.firstname} ${usuario.lastname}`.trim() || usuario.email,
        email: usuario.email,
        imagen: imagenUrl,
      };
    })
  );

  return new Response(JSON.stringify(miembrosConImagen), { status: 200 });
}
