import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Academia from "@/models/academia";
import Grupo from "@/models/grupo";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: "ID de academia no proporcionado" }, { status: 400 });
    }

    const academia = await Academia.findByIdAndDelete(id);
    if (!academia) {
      return NextResponse.json({ message: "Academia no encontrada" }, { status: 404 });
    }

    // Opcional: Eliminar los grupos asociados
    await Grupo.deleteMany({ academia_id: id });

    return NextResponse.json({ message: "Academia eliminada con éxito" }, { status: 200 });
  } catch (error) {
    console.error("Error al eliminar la academia:", error);
    return NextResponse.json(
      { message: "Hubo un error al eliminar la academia", error: error },
      { status: 500 }
    );
  }
}
