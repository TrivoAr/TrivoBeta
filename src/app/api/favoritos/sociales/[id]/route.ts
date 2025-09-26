import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";

// POST: toggle favorito
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return new Response(JSON.stringify({ message: "No autorizado" }), {
      status: 401,
    });
  }

  const userEmail = session.user.email;
  const salidaId = params.id;

  try {
    await connectDB();

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return new Response(
        JSON.stringify({ message: "Usuario no encontrado" }),
        { status: 404 }
      );
    }

    // Inicializar favoritos.salidas si no existe
    if (!user.favoritos) {
      user.favoritos = { academias: [], salidas: [] };
    } else if (!user.favoritos.salidas) {
      user.favoritos.salidas = [];
    }

    const yaAgregado = user.favoritos.salidas.includes(salidaId);

    if (yaAgregado) {
      user.favoritos.salidas.pull(salidaId);
    } else {
      user.favoritos.salidas.push(salidaId);
    }

    await user.save();

    return new Response(
      JSON.stringify({ success: true, favorito: !yaAgregado })
    );
  } catch (error) {
    console.error("Error al actualizar favoritos salidas:", error);
    return new Response(JSON.stringify({ message: "Error del servidor" }), {
      status: 500,
    });
  }
}

// GET: verificar si ya es favorito
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return new Response(JSON.stringify({ message: "No autorizado" }), {
      status: 401,
    });
  }

  const userEmail = session.user.email;
  const salidaId = params.id;

  try {
    await connectDB();

    const user = await User.findOne({ email: userEmail });
    if (!user || !user.favoritos || !user.favoritos.salidas) {
      return new Response(JSON.stringify({ favorito: false }));
    }

    const esFavorito = user.favoritos.salidas.includes(salidaId);
    return new Response(JSON.stringify({ favorito: esFavorito }));
  } catch (error) {
    console.error("Error al consultar favorito salida:", error);
    return new Response(JSON.stringify({ message: "Error del servidor" }), {
      status: 500,
    });
  }
}
