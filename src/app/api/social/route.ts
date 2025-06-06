import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import SalidaSocial from "@/models/salidaSocial";
import Academia from "@/models/academia";
import User from "@/models/user"; // Asegurate de tener este modelo

export async function POST(req: Request) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  try {
    const nuevaSalida = await SalidaSocial.create({
      ...body,
      creador_id: session.user.id,
    });

    return NextResponse.json(nuevaSalida, { status: 201 });
  } catch (error) {
    console.error("Error al crear la salida social:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }


    const salidas = await SalidaSocial.find();

    return NextResponse.json(salidas, { status: 200 });
  } catch (error) {
    console.error("[GET_SALIDAS]", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
