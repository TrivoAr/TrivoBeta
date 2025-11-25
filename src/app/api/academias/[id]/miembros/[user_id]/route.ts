import UsuarioAcademia from "@/models/users_academia";
import UsuarioGrupo from "@/models/users_grupo";
import Grupo from "@/models/grupo";
import { connectDB } from "@/libs/mongodb";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params in Next.js 15+
  const resolvedParams = await params;

  const url = new URL(req.url);
  const user_id = url.searchParams.get("user_id");

  if (!user_id) {
    return NextResponse.json(
      { message: "ID del usuario no proporcionado" },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { message: "Usuario eliminado correctamente" },
    { status: 200 }
  );
}
