import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroTeamSocial from "@/models/teamSocial"; // Nuevo modelo
import User from "@/models/user";
import { getProfileImage } from "@/app/api/profile/getProfileImage";

export async function GET(req: NextRequest) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session) return new Response("No autorizado", { status: 401 });

  const salidaId = req.nextUrl.searchParams.get("salidaId");
  if (!salidaId) return new Response("Falta salidaId", { status: 400 });

  const miembros = await MiembroTeamSocial.find({ salida_id: salidaId }).populate("usuario_id");

  const miembrosConImagen = await Promise.all(
    miembros.map(async (m) => {
      const usuario = m.usuario_id;
      let imagenUrl;

      try {
        imagenUrl = await getProfileImage("profile-image.jpg", usuario._id.toString());
      } catch {
        imagenUrl = "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg";
      }

      return {
        _id: usuario._id,
        nombre: usuario.fullname || usuario.email,
        email: usuario.email,
        imagen: imagenUrl,
      };
    })
  );

  return new Response(JSON.stringify(miembrosConImagen), { status: 200 });
}
