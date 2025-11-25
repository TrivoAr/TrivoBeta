import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import Bares from "@/models/bares";
import mongoose from "mongoose";

// GET - Obtener bar específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { error: "ID de bar inválido" },
        { status: 400 }
      );
    }

    const bar = await Bares.findById(id);

    if (!bar) {
      return NextResponse.json({ error: "Bar no encontrado" }, { status: 404 });
    }

    return NextResponse.json(bar, { status: 200 });
  } catch (error) {

    return NextResponse.json(
      { error: "Error al obtener bar" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar bar (solo admin/staff)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { error: "ID de bar inválido" },
        { status: 400 }
      );
    }

    const data = await req.json();

    // Campos permitidos para actualizar
    const camposPermitidos = [
      "name",
      "locationCoords",
      "logo",
      "imagenesCarrusel",
      "direccion",
      "activo",
    ];

    const updateData: any = {};
    camposPermitidos.forEach((campo) => {
      if (data[campo] !== undefined) {
        updateData[campo] = data[campo];
      }
    });

    const barActualizado = await Bares.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!barActualizado) {
      return NextResponse.json({ error: "Bar no encontrado" }, { status: 404 });
    }

    return NextResponse.json(barActualizado, { status: 200 });
  } catch (error) {

    return NextResponse.json(
      { error: "Error al actualizar bar" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar bar (solo admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // TODO: Verificar que el usuario sea admin
    // if (session.user.rol !== 'admin') {
    //   return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    // }

    const { id } = params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { error: "ID de bar inválido" },
        { status: 400 }
      );
    }

    // Soft delete - marcar como inactivo en lugar de eliminar
    const barEliminado = await Bares.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!barEliminado) {
      return NextResponse.json({ error: "Bar no encontrado" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Bar eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {

    return NextResponse.json(
      { error: "Error al eliminar bar" },
      { status: 500 }
    );
  }
}
