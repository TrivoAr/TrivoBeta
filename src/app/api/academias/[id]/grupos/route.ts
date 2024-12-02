import { NextResponse } from "next/server";
import Grupo from "@/models/grupo";
import { connectDB } from "@/libs/mongodb";
import UsuarioGrupo from "@/models/users_grupo";
export async function GET(req: Request, { params }: { params: { id: string } }) {
  await connectDB();

  try {
    const grupos = await Grupo.find({ academia_id: params.id });
    return NextResponse.json(grupos);
  } catch (error) {
    console.error("Error al obtener grupos:", error);
    return NextResponse.json({ error: "Error al obtener grupos" }, { status: 500 });
  }
}
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
      await connectDB();
      const { id } = params; // ID del miembro
      const body = await req.json();
      const { grupo_id } = body;
  
      if (!id || !grupo_id) {
        return NextResponse.json(
          { message: "ID del miembro o ID del grupo no proporcionado" },
          { status: 400 }
        );
      }
  
      // Verificar que el grupo existe
      const grupo = await Grupo.findById(grupo_id);
      if (!grupo) {
        return NextResponse.json(
          { message: "Grupo no encontrado" },
          { status: 404 }
        );
      }
  
      // Actualizar o crear la relación en UsuarioGrupo
      const usuarioGrupo = await UsuarioGrupo.findOneAndUpdate(
        { user_id: id }, // Busca la relación por usuario
        { grupo_id, fecha_ingreso: new Date() }, // Actualiza el grupo y fecha de ingreso
        { upsert: true, new: true } // Crea la relación si no existe
      );
  
      return NextResponse.json(
        { message: "Grupo asignado correctamente", usuarioGrupo },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error al asignar grupo:", error);
      return NextResponse.json(
        { message: "Error al asignar grupo", error },
        { status: 500 }
      );
    }
  }
  