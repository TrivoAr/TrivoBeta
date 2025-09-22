import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroSalida from "@/models/MiembroSalida";
import MiembroTeamSocial from "@/models/miembrosTeamSocial";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const usuarioId = req.nextUrl.searchParams.get("usuarioId");

    if (!usuarioId) {
      return new Response(JSON.stringify({ error: "Falta usuarioId" }), { status: 400 });
    }

    if (!mongoose.isValidObjectId(usuarioId)) {
      return new Response(JSON.stringify({ error: "usuarioId inválido" }), { status: 400 });
    }

    // Obtener eventos sociales donde el usuario es miembro
    const eventosSociales = await MiembroSalida.find({
      usuario_id: usuarioId
    }).countDocuments();

    // Obtener eventos de equipo donde el usuario es miembro
    const eventosTeam = await MiembroTeamSocial.find({
      usuario_id: usuarioId
    }).countDocuments();

    const totalEventos = eventosSociales + eventosTeam;

    return new Response(JSON.stringify({
      eventosSociales,
      eventosTeam,
      totalEventos
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[GET_EVENTOS_ASISTIDOS_ERROR]", err);
    return new Response(JSON.stringify({
      error: "Error interno al obtener eventos asistidos"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}