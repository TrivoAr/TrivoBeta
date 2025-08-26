import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Pago from "@/models/pagos";
import Notificacion from "@/models/notificacion";
import { sendPaymentStatusEmail } from "@/libs/mailer";
import SalidaSocial from "@/models/salidaSocial";
import MiembroSalida from "@/models/MiembroSalida";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import User from "@/models/user";
import { getProfileImage } from "@/app/api/profile/getProfileImage";


// 🔹 GET: Buscar un pago por ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const pago = await Pago.findById(params.id)
      .populate("salidaId")
      .populate("userId");

    if (!pago) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    return NextResponse.json(pago, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo pago:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// 🔹 PUT: Actualizar estado del pago y notificar


export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { estado } = await req.json();
    if (!["pendiente", "aprobado", "rechazado"].includes(estado)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    // Actualizamos el estado del pago
    const pago = await Pago.findByIdAndUpdate(params.id, { estado }, { new: true });
    if (!pago) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    // Depuración de IDs
    console.log("=== DEBUG PAGOS ===");
    console.log("pago.salidaId:", pago.salidaId);
    console.log("pago.userId:", pago.userId);

    // Intentamos enviar notificaciones
    try {
      const salida = await SalidaSocial.findById(pago.salidaId).populate("creador_id");
      if (!salida) {
        console.warn("⚠️ Salida no encontrada");
        return NextResponse.json({ success: true, pago }); // No bloqueo por notificación
      }

      const organizador = salida.creador_id;
      const miembro = await User.findById(pago.userId);
      if (!miembro) {
        console.warn("⚠️ Miembro no encontrado");
        return NextResponse.json({ success: true, pago }); // No bloqueo por notificación
      }

      console.log("Salida:", salida._id, salida.nombre);
      console.log("Organizador:", organizador._id, organizador.firstname, organizador.lastname);
      console.log("Miembro:", miembro._id, miembro.firstname, miembro.lastname);

      // Notificación para el miembro
      const mensajeMiembro =
        estado === "aprobado"
          ? `Tu pago para la salida "${salida.nombre}" fue aprobado ✅`
          : `Tu pago para la salida "${salida.nombre}" fue rechazado ❌`;

      await Notificacion.create({
        userId: miembro._id,
        fromUserId: organizador._id,
        salidaId: salida._id,
        type: "pago_aprobado",
        message: mensajeMiembro,
        read: false,
      });

      
      await sendPaymentStatusEmail(miembro.email, estado);

    
      console.log("✅ Notificaciones creadas con éxito");
    } catch (notifError) {
      console.error("Error creando notificaciones:", notifError);
    }

    return NextResponse.json({ success: true, pago }, { status: 200 });
  } catch (error) {
    console.error("Error actualizando pago:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
