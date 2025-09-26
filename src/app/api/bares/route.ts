import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import Bares from "@/models/bares";

// GET - Obtener todos los bares o buscar por proximidad
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = searchParams.get("radius"); // en kilómetros
    const limit = parseInt(searchParams.get("limit") || "20");

    let bares;

    if (lat && lng) {
      // Búsqueda por proximidad
      const radiusInMeters = radius ? parseFloat(radius) * 1000 : 10000; // 10km por defecto

      bares = await Bares.find({
        activo: true,
        geoLocation: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)],
            },
            $maxDistance: radiusInMeters,
          },
        },
      }).limit(limit);
    } else {
      // Obtener todos los bares activos
      bares = await Bares.find({ activo: true })
        .limit(limit)
        .sort({ createdAt: -1 });
    }

    return NextResponse.json(bares, { status: 200 });
  } catch (error) {
    console.error("[GET_BARES_ERROR]", error);
    return NextResponse.json(
      { error: "Error al obtener bares" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo bar (solo admin/staff)
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // TODO: Verificar que el usuario sea admin/staff
    // if (session.user.rol !== 'admin' && session.user.rol !== 'staff') {
    //   return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    // }

    const data = await req.json();
    const { name, locationCoords, logo, imagenesCarrusel, direccion } = data;

    // Validaciones básicas
    if (!name || !locationCoords?.lat || !locationCoords?.lng) {
      return NextResponse.json(
        { error: "Nombre y coordenadas son requeridos" },
        { status: 400 }
      );
    }

    if (!logo) {
      return NextResponse.json(
        { error: "Logo del bar es requerido" },
        { status: 400 }
      );
    }

    if (!imagenesCarrusel || imagenesCarrusel.length === 0) {
      return NextResponse.json(
        { error: "Al menos una imagen para el carrusel es requerida" },
        { status: 400 }
      );
    }

    const nuevoBar = new Bares({
      name,
      locationCoords,
      logo,
      imagenesCarrusel,
      direccion,
    });

    await nuevoBar.save();

    return NextResponse.json(nuevoBar, { status: 201 });
  } catch (error) {
    console.error("[CREATE_BAR_ERROR]", error);
    return NextResponse.json({ error: "Error al crear bar" }, { status: 500 });
  }
}
