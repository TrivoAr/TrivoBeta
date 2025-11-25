import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Academia from "@/models/academia";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "ID de academia no proporcionado" },
        { status: 400 }
      );
    }

    const updatedData = await req.json();

    const academia = await Academia.findByIdAndUpdate(id, updatedData, {
      new: true,
    });
    if (!academia) {
      return NextResponse.json(
        { message: "Academia no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(academia, { status: 200 });
  } catch (error) {

    return NextResponse.json(
      { message: "Hubo un error al actualizar la academia", error: error },
      { status: 500 }
    );
  }
}
