import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import Notificacion from "@/models/notificacion";
import { connectDB } from "@/libs/mongodb";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params in Next.js 15+
  const resolvedParams = await params;

  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session) return new Response("No autorizado", { status: 401 });

  const notificacionId = resolvedParams.id;

  try {
    const notificacion = await Notificacion.findById(notificacionId);
    if (!notificacion) {
      return new Response("Notificación no encontrada", { status: 404 });
    }

    if (String(notificacion.userId) !== session.user.id) {
      return new Response("No autorizado", { status: 403 });
    }

    notificacion.read = true;
    await notificacion.save();

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {

    return new Response("Error al marcar como leída", { status: 500 });
  }
}
