import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import TeamSocial from "@/models/teamSocial";

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
