// app/api/notificaciones/mark-all-read/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import Notificacion from "@/models/notificacion";

export async function PATCH() {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await Notificacion.updateMany(
      { userId: session.user.id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    return NextResponse.json(
      {
        success: true,
        count: result.modifiedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
