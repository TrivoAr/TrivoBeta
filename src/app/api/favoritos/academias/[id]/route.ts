// /api/favoritos/academias/[id]/route.ts

import { getServerSession } from "next-auth";
import User from "@/models/user";
import { connectDB } from "@/libs/mongodb";
import { authOptions } from "@/libs/authOptions";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ message: "No autorizado" }), { status: 401 });
  }

  const userEmail = session.user.email;
  const academiaId = params.id;

  if (!academiaId) {
    return new Response(JSON.stringify({ message: "ID de academia faltante" }), { status: 400 });
  }

  try {
    await connectDB();

    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return new Response(JSON.stringify({ message: "Usuario no encontrado" }), { status: 404 });
    }

    if (!user.favoritos) {
      user.favoritos = { academias: [] };
    }

    let favorito = false;

    if (user.favoritos.academias.includes(academiaId)) {
      user.favoritos.academias.pull(academiaId);
      favorito = false;
    } else {
      user.favoritos.academias.push(academiaId);
      favorito = true;
    }

    await user.save();

    return new Response(JSON.stringify({ success: true, favorito }));
  } catch (error) {
    console.error("Error al actualizar favoritos:", error);
    return new Response(JSON.stringify({ message: "Error del servidor" }), { status: 500 });
  }
}
