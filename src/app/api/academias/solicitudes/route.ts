// app/api/academias/solicitudes/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import UsuarioAcademia from "@/models/users_academia";
import Academia from "@/models/academia";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/authOptions";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import Notificacion from "@/models/notificacion";

// 🔧 Evita que Next intente prerender/estático este endpoint
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(_req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Usuario no autenticado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Academias del dueño
    const academiasDelUsuario = await Academia.find({ dueño_id: userId });
    if (!academiasDelUsuario?.length) {
      return NextResponse.json([], { status: 200 });
    }

    const academiaIds = academiasDelUsuario.map((a) => a._id);

    // Solicitudes pendientes
    const solicitudes = await UsuarioAcademia.find({
      academia_id: { $in: academiaIds },
      estado: "pendiente",
    }).populate("user_id academia_id");

    

    // Enriquecemos con imagen + campos seguros
    const enrichedSolicitudes = await Promise.all(
      solicitudes.map(async (sol: any) => {
        let imagen = "";
        try {
          imagen = await getProfileImage("profile-image.jpg", sol.user_id?._id?.toString());
        } catch {
          // const nombre = `${sol?.user_id?.firstname || "User"} ${sol?.user_id?.lastname || ""}.trim()`;
          const nombre = `${(sol?.user_id?.firstname || "User")} ${(sol?.user_id?.lastname || "")}`;

          imagen = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random&color=fff&size=128;`
        }

        return {
          _id: sol._id,
          user_id: sol.user_id?._id,
          nombre: `${sol?.user_id?.firstname || ""} ${sol?.user_id?.lastname || ""}`,
          academia: sol?.academia_id?.nombre_academia || "", // 👈 campo correcto
          academia_id: sol?.academia_id?._id,
          estado: sol?.estado,
          createdAt: sol?.createdAt,
          imagen,
        };
      })
    );

    return NextResponse.json(enrichedSolicitudes, { status: 200 });
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    return NextResponse.json(
      { message: "Hubo un error al obtener las solicitudes" },
      { status: 500 }
    );
  }
}


export async function PATCH(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "No autorizado" }, { status: 401 });

    const { solicitud_id, estado } = await req.json();
    if (!solicitud_id || !estado)
      return NextResponse.json({ message: "Datos incompletos" }, { status: 400 });

    const solicitud = await UsuarioAcademia.findById(solicitud_id);
    if (!solicitud)
      return NextResponse.json({ message: "Solicitud no encontrada" }, { status: 404 });

    const academia = await Academia.findById(solicitud.academia_id);
    if (!academia || String(academia.dueño_id) !== session.user.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    solicitud.estado = estado; // "aceptado" | "rechazado"
    await solicitud.save();

    const mensaje =
      estado === "aceptado"
        ? `: Tu solicitud para unirte a la academia "${academia.nombre_academia}" fue aceptada`
        : `: Tu solicitud para unirte a la academia "${academia.nombre_academia}" fue rechazada`;

    // ✅ Agregamos type
    const creada = await Notificacion.create({
      userId: solicitud.user_id,       // receptor (quien pidió unirse)
      fromUserId: session.user.id,     // dueño que acepta/rechaza
      type: "solicitud_respuesta",     // ✅ requerido por el schema
      message: mensaje,
      read: false,
    });

    // opcional: devolvé el id creada para debug
    return NextResponse.json({ ok: true, estado: solicitud.estado, notificacionId: creada._id }, { status: 200 });
  } catch (error: any) {
    console.error("Error al actualizar solicitud / crear notificación:", error?.message, error?.errors);
    return NextResponse.json({ message: "Error interno", detalle: error?.message }, { status: 500 });
  }
}
