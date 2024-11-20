import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Academia from "@/models/academia";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;
    const academia = await Academia.findById(id);

    if (!academia) {
      return NextResponse.json({ message: "Academia no encontrada" }, { status: 404 });
    }

    return NextResponse.json(academia, { status: 200 });
  } catch (error) {
    console.error("Error al obtener academia:", error);
    return NextResponse.json({ message: "Hubo un error al obtener la academia" }, { status: 500 });
  }
}
