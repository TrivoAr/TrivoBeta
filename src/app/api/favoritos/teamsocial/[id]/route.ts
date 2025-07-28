import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";
import TeamSocial from "@/models/teamSocial";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return new Response(JSON.stringify({ message: "No autorizado" }), { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });

  if (!user || !user.favoritos || !user.favoritos.teamSocial) {
    return new Response(JSON.stringify({ favorito: false }));
  }

  const esFavorito = user.favoritos.teamSocial.includes(params.id);
  return new Response(JSON.stringify({ favorito: esFavorito }));
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return new Response(JSON.stringify({ message: "No autorizado" }), { status: 401 });
  }

  const user = await User.findOne({ email: session.user.email });

  if (!user) {
    return new Response(JSON.stringify({ message: "Usuario no encontrado" }), { status: 404 });
  }

  if (!user.favoritos) {
    user.favoritos = { academias: [], salidas: [], teamSocial: [] };
  } else if (!user.favoritos.teamSocial) {
    user.favoritos.teamSocial = [];
  }

  const yaEsFavorito = user.favoritos.teamSocial.includes(params.id);

  if (yaEsFavorito) {
    user.favoritos.teamSocial.pull(params.id);
  } else {
    const existeEvento = await TeamSocial.findById(params.id);
    if (!existeEvento) {
      return new Response(JSON.stringify({ message: "Evento no encontrado" }), { status: 404 });
    }
    user.favoritos.teamSocial.push(params.id);
  }

  await user.save();
  return new Response(JSON.stringify({ favorito: !yaEsFavorito }));
}
