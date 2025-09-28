import Pago from "@/models/pagos";
import User from "@/models/user";
import UsuarioAcademia from "@/models/users_academia";
import UsuarioGrupo from "@/models/users_grupo";
import Grupo from "@/models/grupo";
import { connectDB } from "@/libs/mongodb";
import { NextResponse } from "next/server";
import { ImageService } from "@/libs/services/ImageService";

// Función auxiliar para obtener la imagen del usuario desde Firebase
async function getUserImageUrl(user: any): Promise<string> {
  try {
    const fullName =
      `${user.firstname || "Usuario"} ${user.lastname || ""}`.trim();

    // Si ya tiene URL de imagen almacenada (completa de Firebase), úsala
    if (user.imagen && user.imagen.includes("firebasestorage.googleapis.com")) {
      return user.imagen;
    }

    // Intentar obtener imagen desde Firebase Storage
    return await ImageService.getProfileImageWithFallback(
      user._id.toString(),
      fullName
    );
  } catch (error) {
    // Fallback en caso de error
    const fullName =
      `${user.firstname || "Usuario"} ${user.lastname || ""}`.trim();
    return ImageService.generateAvatarUrl(fullName, {
      size: 200,
      background: "C95100",
      color: "fff",
    });
  }
}

// Obtener los miembros de la academia y sus grupos
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("[ACADEMIA-MIEMBROS] Iniciando GET con academiaId:", params.id);
    await connectDB();

    const { id } = params;

    if (!id) {
      console.error("[ACADEMIA-MIEMBROS] ID no proporcionado");
      return NextResponse.json(
        { message: "ID no proporcionado" },
        { status: 400 }
      );
    }

    // Buscar los miembros de la academia (tanto aceptados como pendientes)
    console.log("[ACADEMIA-MIEMBROS] Buscando miembros de academia:", id);
    const miembrosAcademia = await UsuarioAcademia.find({
      academia_id: id,
    })
      .populate("user_id") // Incluye información del usuario
      .lean();

    console.log(
      "[ACADEMIA-MIEMBROS] Miembros encontrados:",
      miembrosAcademia.length
    );

    // Buscar pagos para estos miembros si tienen pago_id
    const pagoIds = miembrosAcademia
      .map((miembro) => miembro.pago_id)
      .filter(Boolean);
    const pagosMap = new Map();

    if (pagoIds.length > 0) {
      try {
        const pagos = await Pago.find({ _id: { $in: pagoIds } }).lean();
        pagos.forEach((pago) => {
          pagosMap.set(String(pago._id), pago);
        });
        console.log("[ACADEMIA-MIEMBROS] Pagos encontrados:", pagos.length);
      } catch (pagoError) {
        console.warn(
          "[ACADEMIA-MIEMBROS] Error al buscar pagos:",
          pagoError.message
        );
        // Continuar sin datos de pago si hay error
      }
    }

    // TODO: Funcionalidad de grupos comentada temporalmente
    /*
    // Mapear IDs de los usuarios para buscar sus grupos, pero filtrar por esta academia
    const userIds = miembrosAcademia.map((miembro) => {
      console.log("[ACADEMIA-MIEMBROS] Procesando miembro:", miembro._id, "usuario:", miembro.user_id?._id || "SIN USER_ID");
      return miembro.user_id?._id;
    }).filter(Boolean);

    // Buscar los grupos relacionados con estos usuarios, pero que pertenecen a esta academia
    const grupos = await UsuarioGrupo.find({
      user_id: { $in: userIds },
    })
      .populate({
        path: "grupo_id",
        match: { academia_id: id }, // Solo grupos de esta academia
      })
      .lean();
    */

    // Combinar datos de los miembros con los grupos y obtener imágenes de Firebase
    const miembrosConGrupos = await Promise.all(
      miembrosAcademia.map(async (miembro) => {
        // Validar que el usuario existe y tiene los campos necesarios
        if (!miembro.user_id) {
          console.error("Miembro sin user_id:", miembro._id);
          return null;
        }

        const user = miembro.user_id;
        const firstname = user.firstname || "Usuario";
        const lastname = user.lastname || "";
        const fullName = `${firstname} ${lastname}`.trim();

        // TODO: Funcionalidad de grupos comentada temporalmente
        /*
        const grupo = grupos.find(
          (g) => String(g.user_id) === String(user._id) && g.grupo_id
        );
        */

        // Obtener datos del pago si existe
        const pagoData = miembro.pago_id
          ? pagosMap.get(String(miembro.pago_id))
          : null;

        // Obtener imagen desde Firebase
        const imagenUrl = await getUserImageUrl(user);

        return {
          _id: miembro._id,
          user_id: user,
          estado: miembro.estado,
          pago_id: pagoData, // Usar los datos del pago obtenidos manualmente
          // grupo: grupo ? grupo.grupo_id : null, // Funcionalidad de grupos comentada
          // Campos adicionales para compatibilidad con el frontend de social
          nombre: fullName,
          email: user.email || "",
          telnumber: user.telnumber || "",
          dni: user.dni || "",
          imagen: imagenUrl,
          instagram: user.instagram || "",
          usuarioId: user._id,
        };
      })
    );

    // Filtrar elementos null
    const miembrosValidados = miembrosConGrupos.filter(Boolean);

    console.log(
      "[ACADEMIA-MIEMBROS] Enviando respuesta con",
      miembrosValidados.length,
      "miembros procesados"
    );
    return NextResponse.json({ miembros: miembrosValidados }, { status: 200 });
  } catch (error) {
    console.error(
      "[ACADEMIA-MIEMBROS] Error al obtener los miembros y sus grupos:",
      error
    );
    console.error("[ACADEMIA-MIEMBROS] Stack trace:", error.stack);
    return NextResponse.json(
      {
        message: "Hubo un error al obtener los miembros y sus grupos",
        error: error.message,
        type: "academia_miembros_error",
      },
      { status: 500 }
    );
  }
}

// TODO: Funcionalidad de asignación de grupos comentada temporalmente
/*
// Asignar un usuario a un grupo
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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
*/

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const url = new URL(req.url);
  const user_id = url.searchParams.get("user_id");

  console.log("🔍 Eliminando usuario con ID:", user_id);

  if (!user_id) {
    return NextResponse.json(
      { message: "ID del usuario no proporcionado" },
      { status: 400 }
    );
  }

  try {
    await connectDB(); // Conexión a la base de datos

    const { id } = params; // ID de la academia

    // 1. Eliminar la relación entre el usuario y la academia
    const eliminarUsuarioAcademia = await UsuarioAcademia.deleteOne({
      academia_id: id,
      user_id,
    });

    if (eliminarUsuarioAcademia.deletedCount === 0) {
      return NextResponse.json(
        { message: "El usuario no pertenece a esta academia" },
        { status: 404 }
      );
    }

    // 2. Eliminar la relación entre el usuario y el grupo (si tiene uno)
    const eliminarUsuarioGrupo = await UsuarioGrupo.deleteOne({
      user_id,
    });

    if (eliminarUsuarioGrupo.deletedCount === 0) {
      console.log(
        `El usuario ${user_id} no tiene grupo asignado o no se encontró.`
      );
    }

    return NextResponse.json(
      { message: "Usuario eliminado correctamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { message: "Error al eliminar el usuario", error },
      { status: 500 }
    );
  }
}
