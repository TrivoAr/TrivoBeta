import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import UsuarioAcademia from "../../../../models/users_academia";

export async function GET() {
  try {
    await connectDB();
    // Consultar solicitudes pendientes y popular referencias
    const solicitudes = await UsuarioAcademia.find({ estado: "pendiente" }).populate("user_id academia_id");

    // Log para depurar los resultados
    console.log("Solicitudes obtenidas:", solicitudes);

    return NextResponse.json(solicitudes, { status: 200 });
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    return NextResponse.json({ message: "Hubo un error al obtener las solicitudes" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // Actualizar la solicitud por ID
    const solicitud = await UsuarioAcademia.findByIdAndUpdate(
      body.solicitud_id,
      { estado: body.estado }, // "aceptado" o "rechazado"
      { new: true } // Devolver el documento actualizado
    );

    if (!solicitud) {
      return NextResponse.json({ message: "Solicitud no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ message: "Solicitud actualizada exitosamente" }, { status: 200 });
  } catch (error) {
    console.error("Error al actualizar solicitud:", error);
    return NextResponse.json({ message: "Hubo un error al actualizar la solicitud" }, { status: 500 });
  }
}
