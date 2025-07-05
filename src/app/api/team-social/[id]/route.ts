import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import TeamSocial from "@/models/teamSocial";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import User from "@/models/user";




export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();

  try {
    const team = await TeamSocial.findById(params.id)
      .populate("creadorId", "firstname lastname imagen"); // 👈 Trae solo estos dos campos

    if (!team) {
      return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json(team, { status: 200 });
  } catch (error) {
    console.error("Error al buscar TeamSocial:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}



export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const salida = await TeamSocial.findById(params.id);
  if (!salida) {
    return NextResponse.json({ message: "Salida no encontrada" }, { status: 404 });
  }

  if (salida.creadorId.toString() !== session.user.id) {
    return NextResponse.json({ message: "No tienes permiso para editar" }, { status: 403 });
  }

  const data = await req.json();

  try {
    const actualizada = await TeamSocial.findByIdAndUpdate(params.id, data, { new: true });
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

  const salida = await TeamSocial.findById(params.id);
  if (!salida) {
    return NextResponse.json({ message: "Salida no encontrada" }, { status: 404 });
  }

  if (salida.creadorId.toString() !== session.user.id) {
    return NextResponse.json({ message: "No tienes permiso para eliminar" }, { status: 403 });
  }

  try {
    await TeamSocial.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Salida eliminada" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error al eliminar" }, { status: 500 });
  }
}