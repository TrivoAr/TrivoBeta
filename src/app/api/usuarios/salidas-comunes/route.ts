import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroSalida from "@/models/MiembroSalida";
import MiembroTeamSocial from "@/models/miembrosTeamSocial";
import SalidaSocial from "@/models/salidaSocial";
import TeamSocial from "@/models/teamSocial";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
    }

    const otroUsuarioId = req.nextUrl.searchParams.get("otroUsuarioId");

    if (!otroUsuarioId) {
      return new Response(JSON.stringify({ error: "Falta otroUsuarioId" }), { status: 400 });
    }

    if (!mongoose.isValidObjectId(otroUsuarioId)) {
      return new Response(JSON.stringify({ error: "otroUsuarioId inválido" }), { status: 400 });
    }

    const usuarioLogueadoId = session.user.id;

    // Si es el mismo usuario, no hay salidas en común
    if (usuarioLogueadoId === otroUsuarioId) {
      return new Response(JSON.stringify({
        salidasSociales: [],
        salidasTeam: [],
        totalComunes: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Buscar salidas sociales en común
    const miembrosSalidasUsuario1 = await MiembroSalida.find({
      usuario_id: usuarioLogueadoId
    }).select('salida_id');

    const miembrosSalidasUsuario2 = await MiembroSalida.find({
      usuario_id: otroUsuarioId
    }).select('salida_id');

    // IDs de salidas sociales en común
    const salidasSocialesComunes = miembrosSalidasUsuario1
      .filter(m1 => miembrosSalidasUsuario2.some(m2 =>
        m1.salida_id.toString() === m2.salida_id.toString()
      ))
      .map(m => m.salida_id);

    // Buscar salidas de team en común
    const miembrosTeamUsuario1 = await MiembroTeamSocial.find({
      usuario_id: usuarioLogueadoId
    }).select('teamsocial_id');

    const miembrosTeamUsuario2 = await MiembroTeamSocial.find({
      usuario_id: otroUsuarioId
    }).select('teamsocial_id');

    // IDs de salidas team en común
    const salidasTeamComunes = miembrosTeamUsuario1
      .filter(m1 => miembrosTeamUsuario2.some(m2 =>
        m1.teamsocial_id.toString() === m2.teamsocial_id.toString()
      ))
      .map(m => m.teamsocial_id);

    // Obtener detalles de salidas sociales en común
    const salidasSocialesDetalles = await SalidaSocial.find({
      _id: { $in: salidasSocialesComunes }
    }).select('titulo fecha ubicacion imagen').sort({ fecha: -1 });

    // Obtener detalles de salidas team en común
    const salidasTeamDetalles = await TeamSocial.find({
      _id: { $in: salidasTeamComunes }
    }).select('titulo fecha ubicacion imagen').sort({ fecha: -1 });

    const totalComunes = salidasSocialesDetalles.length + salidasTeamDetalles.length;

    return new Response(JSON.stringify({
      salidasSociales: salidasSocialesDetalles,
      salidasTeam: salidasTeamDetalles,
      totalComunes
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[GET_SALIDAS_COMUNES_ERROR]", err);
    return new Response(JSON.stringify({
      error: "Error interno al obtener salidas en común"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}