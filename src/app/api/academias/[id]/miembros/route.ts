import UsuarioAcademia from "@/models/users_academia";
import UsuarioGrupo from "@/models/users_grupo";
import Grupo from "@/models/grupo";
import { connectDB } from "@/libs/mongodb";
import { NextResponse } from "next/server";

// Obtener los miembros de la academia y sus grupos
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: "ID no proporcionado" }, { status: 400 });
    }

    // Buscar los miembros de la academia
    const miembrosAcademia = await UsuarioAcademia.find({ academia_id: id, estado: "aceptado" })
      .populate("user_id") // Incluye información del usuario
      .lean();

    // Mapear IDs de los usuarios para buscar sus grupos, pero filtrar por esta academia
    const userIds = miembrosAcademia.map((miembro) => miembro.user_id._id);

    // Buscar los grupos relacionados con estos usuarios, pero que pertenecen a esta academia
    const grupos = await UsuarioGrupo.find({
      user_id: { $in: userIds },
    })
      .populate({
        path: "grupo_id",
        match: { academia_id: id }, // Solo grupos de esta academia
      })
      .lean();

    // Combinar datos de los miembros con los grupos
    const miembrosConGrupos = miembrosAcademia.map((miembro) => {
      const grupo = grupos.find(
        (g) => String(g.user_id) === String(miembro.user_id._id) && g.grupo_id
      );

      return {
        ...miembro,
        grupo: grupo ? grupo.grupo_id : null, // Solo incluir el grupo si pertenece a esta academia
      };
    });

    return NextResponse.json({ miembros: miembrosConGrupos }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener los miembros y sus grupos:", error);
    return NextResponse.json(
      { message: "Hubo un error al obtener los miembros y sus grupos", error },
      { status: 500 }
    );
  }
}


// Asignar un usuario a un grupo
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { id } = params; // ID de la academia
    const body = await req.json();
    const { user_id, grupo_id } = body; // Datos del cuerpo

    if (!user_id || !grupo_id) {
      return NextResponse.json(
        { message: "ID del usuario o del grupo no proporcionado" },
        { status: 400 }
      );
    }

    // Verificar que el grupo pertenece a la academia actual
    const grupo = await Grupo.findById(grupo_id);
    if (!grupo || grupo.academia_id.toString() !== id) {
      return NextResponse.json(
        { message: "El grupo no pertenece a esta academia" },
        { status: 400 }
      );
    }

    // Crear un nuevo documento en UsuarioGrupo para esta relación, no actualizar el existente
    const nuevoUsuarioGrupo = new UsuarioGrupo({
      user_id, // ID del usuario
      grupo_id, // ID del grupo
      academia_id: id, // ID de la academia
      fecha_ingreso: new Date(), // Fecha de ingreso
    });

    await nuevoUsuarioGrupo.save(); // Guardar la nueva relación en la base de datos

    return NextResponse.json(
      { message: "Grupo asignado correctamente", nuevoUsuarioGrupo },
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
