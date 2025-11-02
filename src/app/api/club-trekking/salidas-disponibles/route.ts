import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/libs/mongodb";
import SalidaSocial from "@/models/salidaSocial";
import { authOptions } from "@/libs/authOptions";
import { clubTrekkingHelpers } from "@/config/clubTrekking.config";

/**
 * GET /api/club-trekking/salidas-disponibles
 * Obtener salidas incluidas en la membresía del Club del Trekking
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const fecha = searchParams.get("fecha");
    const dificultad = searchParams.get("dificultad");
    const lugar = searchParams.get("lugar");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Construir query
    const query: any = {
      "clubTrekking.incluidaEnMembresia": true,
    };

    // Filtros adicionales
    if (fecha) {
      query.fecha = fecha;
    }

    if (dificultad) {
      query.dificultad = dificultad;
    }

    if (lugar) {
      query.$or = [
        { ubicacion: { $regex: lugar, $options: "i" } },
        { localidad: { $regex: lugar, $options: "i" } },
        { provincia: { $regex: lugar, $options: "i" } },
      ];
    }

    // Solo salidas futuras
    const hoy = new Date().toISOString().split("T")[0];
    if (!fecha) {
      query.fecha = { $gte: hoy };
    }

    const skip = (page - 1) * limit;

    const salidas = await SalidaSocial.find(query)
      .populate("creador_id", "firstname lastname imagen")
      .sort({ fecha: 1, hora: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await SalidaSocial.countDocuments(query);

    return NextResponse.json(
      {
        salidas,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al obtener salidas disponibles:", error);
    return NextResponse.json(
      { error: "Error al obtener las salidas" },
      { status: 500 }
    );
  }
}
