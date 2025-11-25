import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Sponsors from "@/models/sponsors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🔹 GET: Obtener un sponsor por ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params in Next.js 15+
  const resolvedParams = await params;

  try {
    await connectDB();

    const sponsor = await Sponsors.findById(resolvedParams.id).lean();

    if (!sponsor) {
      return NextResponse.json(
        {
          success: false,
          error: "Sponsor no encontrado",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: sponsor,
      },
      { status: 200 }
    );
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

// 🔹 PUT: Actualizar un sponsor
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params in Next.js 15+
  const resolvedParams = await params;

  try {
    await connectDB();

    const { name, imagen } = await req.json();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "El nombre es requerido",
        },
        { status: 400 }
      );
    }

    const sponsor = await Sponsors.findByIdAndUpdate(
      resolvedParams.id,
      { name, imagen },
      { new: true, runValidators: true }
    );

    if (!sponsor) {
      return NextResponse.json(
        {
          success: false,
          error: "Sponsor no encontrado",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: sponsor,
        message: "Sponsor actualizado exitosamente",
      },
      { status: 200 }
    );
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

// 🔹 DELETE: Eliminar un sponsor
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params in Next.js 15+
  const resolvedParams = await params;

  try {
    await connectDB();

    const sponsor = await Sponsors.findByIdAndDelete(resolvedParams.id);

    if (!sponsor) {
      return NextResponse.json(
        {
          success: false,
          error: "Sponsor no encontrado",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sponsor eliminado exitosamente",
      },
      { status: 200 }
    );
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
