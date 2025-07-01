import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import SalidaSocial from "@/models/salidaSocial";
import User from "@/models/user";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('Conectando a DB...');
    await connectDB();
    console.log('DB conectada');

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      console.log('No autorizado');
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log('Usuario de sesión:', session.user.email);

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      console.log('Usuario no encontrado');
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { id } = params;
    console.log('ID recibido:', id);

    // Aquí se hace el populate para traer el objeto completo del creador
    const salida = await SalidaSocial.findById(id).populate("creador_id");
    if (!salida) {
      console.log('Salida social no encontrada');
      return NextResponse.json({ message: "Salida social no encontrada" }, { status: 404 });
    }

    console.log('Salida social encontrada:', salida);

    return NextResponse.json(salida, { status: 200 });
  } catch (error) {
    console.error("[GET_SALIDA_BY_ID]", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const salida = await SalidaSocial.findById(params.id);
  if (!salida) {
    return NextResponse.json({ message: "Salida no encontrada" }, { status: 404 });
  }

  if (salida.creador_id.toString() !== session.user.id) {
    return NextResponse.json({ message: "No tienes permiso para editar" }, { status: 403 });
  }

  const data = await req.json();

  try {
    const actualizada = await SalidaSocial.findByIdAndUpdate(params.id, data, { new: true });
    return NextResponse.json(actualizada, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const salida = await SalidaSocial.findById(params.id);
  if (!salida) {
    return NextResponse.json({ message: "Salida no encontrada" }, { status: 404 });
  }

  if (salida.creador_id.toString() !== session.user.id) {
    return NextResponse.json({ message: "No tienes permiso para eliminar" }, { status: 403 });
  }

  try {
    await SalidaSocial.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Salida eliminada" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error al eliminar" }, { status: 500 });
  }
}