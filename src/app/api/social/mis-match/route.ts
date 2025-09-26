import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroSalida from "@/models/MiembroSalida";
import SalidaSocial from "@/models/salidaSocial";

export async function GET(req: NextRequest) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session) return new Response("No autorizado", { status: 401 });

  try {
    // Buscar donde el usuario es miembro aprobado
    const membresias = await MiembroSalida.find({
      usuario_id: session.user.id,
    });

    const salidaIds = membresias.map((m) => m.salida_id);

    // Obtener las salidas sociales populadas con creador
    const salidas = await SalidaSocial.find({
      _id: { $in: salidaIds },
    }).populate("creador_id", "firstname lastname");

    return new Response(JSON.stringify(salidas), { status: 200 });
  } catch (error) {
    return new Response("Error interno", { status: 500 });
  }
}
