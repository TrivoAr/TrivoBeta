import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Academia from "@/models/academia";
import UsuarioAcademia from "@/models/users_academia";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";

export async function GET() {
  try {
    await connectDB();

    // Verificar sesión del usuario
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Buscar relaciones usuario-academia donde el usuario es miembro
    const usuarioAcademias = await UsuarioAcademia.find({
      user_id: userId,
      estado: "aceptado", // Solo academias donde fue aceptado
    })
      .populate({
        path: "academia_id",
        populate: {
          path: "dueño_id",
          select: "firstname lastname",
        },
      })
      .lean();

    // Filtrar solo las academias válidas y formatear los datos
    const academias = usuarioAcademias
      .map((relacion) => relacion.academia_id)
      .filter((academia) => academia && academia._id)
      .map((academia) => ({
        _id: academia._id,
        nombre_academia: academia.nombre_academia,
        pais: academia.pais,
        provincia: academia.provincia,
        localidad: academia.localidad,
        descripcion: academia.descripcion,
        tipo_disciplina: academia.tipo_disciplina,
        precio: academia.precio,
        clase_gratis: academia.clase_gratis,
        dueño_id: academia.dueño_id,
        // Para compatibilidad con el dashboard
        teacher: academia.dueño_id
          ? `${academia.dueño_id.firstname} ${academia.dueño_id.lastname}`
          : "Instructor",
      }));

    return NextResponse.json(academias, { status: 200 });
  } catch (error) {
    console.error("Error al obtener academias donde soy miembro:", error);
    return NextResponse.json(
      { message: "Error al obtener las academias", error: error.message },
      { status: 500 }
    );
  }
}
