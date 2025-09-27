import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroSalida from "@/models/MiembroSalida";
import SalidaSocial from "@/models/salidaSocial";
import Pago from "@/models/Pagos";
import mongoose from "mongoose";
import { revalidateTag } from "next/cache";
import {
  notifyMemberApproved,
  notifyMemberRejected,
} from "@/libs/notificationHelpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

type MiembroLean = {
  _id: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  salida_id: string | { _id: string; cupo?: number };
  usuario_id?:
    | string
    | { firstname?: string; lastname?: string; email?: string };
  pago_id?: string | { estado?: string };
};

type SalidaLeanMin = { _id: string; cupo?: number };

function jsonOk(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
function jsonErr(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const salidaId = params.id;
    if (!mongoose.isValidObjectId(salidaId)) {
      return jsonErr("salida_id inválido", 400);
    }

    const miembros = await MiembroSalida.find({ salida_id: salidaId })
      .populate("usuario_id", "firstname lastname email dni")
      .populate("pago_id", "estado")
      .select("_id estado usuario_id pago_id salida_id createdAt")
      .lean();

    return jsonOk(miembros, 200);
  } catch (e) {
    return jsonErr("Error interno", 500);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { estado } = (await req.json()) as { estado?: string };
    if (!["pendiente", "aprobado", "rechazado"].includes(estado || "")) {
      return jsonErr("Estado inválido", 400);
    }

    const miembro = await MiembroSalida.findByIdAndUpdate(
      params.id,
      { estado },
      { new: true }
    )
      .populate("usuario_id", "firstname lastname email")
      .populate("salida_id", "cupo")
      .populate("pago_id", "estado")
      .lean<MiembroLean>();

    if (!miembro) return jsonErr("Miembro no encontrado", 404);

    const salidaId =
      typeof miembro.salida_id === "string"
        ? miembro.salida_id
        : miembro.salida_id?._id;

    if (salidaId) {
      revalidateTag(`salida:${salidaId}`);
    }

    return jsonOk({ message: "Estado del miembro actualizado", miembro }, 200);
  } catch (error) {
    return jsonErr("Error interno", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return jsonErr("No autorizado", 401);
    }

    const { estado } = await req.json();
    if (!["pendiente", "aprobado", "rechazado"].includes(estado || "")) {
      return jsonErr("Estado inválido", 400);
    }

    // Obtener información completa del miembro para las notificaciones
    const miembroCompleto = await MiembroSalida.findById(params.id)
      .populate("usuario_id", "firstname lastname _id")
      .populate("salida_id", "nombre cupo creador_id")
      .lean();

    if (!miembroCompleto) return jsonErr("Miembro no encontrado", 404);

    const salida = (miembroCompleto as any).salida_id;
    const usuario = (miembroCompleto as any).usuario_id;

    if (!salida || !usuario) return jsonErr("Datos incompletos", 404);

    const cupo = typeof salida.cupo === "number" ? salida.cupo : 0;

    if (estado === "aprobado") {
      const aprobados = await MiembroSalida.countDocuments({
        salida_id: salida._id,
        estado: "aprobado",
      });

      if (aprobados >= cupo) {
        return jsonErr("No hay cupos disponibles", 409);
      }
    }

    // Actualizar estado
    await MiembroSalida.updateOne({ _id: params.id }, { estado });
    await Pago.updateOne({ miembro_id: params.id }, { estado }).catch(() => {});

    // Crear notificación según el estado
    try {
      if (estado === "aprobado") {
        await notifyMemberApproved(
          usuario._id.toString(),
          session.user.id,
          salida._id.toString(),
          salida.nombre
        );
      } else if (estado === "rechazado") {
        await notifyMemberRejected(
          usuario._id.toString(),
          session.user.id,
          salida._id.toString(),
          salida.nombre
        );
      }
    } catch (notificationError) {
      console.error("Error al crear notificación:", notificationError);
      // No fallar la operación principal por error de notificación
    }

    revalidateTag(`salida:${salida._id}`);

    return jsonOk({ message: "Estado actualizado correctamente" }, 200);
  } catch (error) {
    return jsonErr("Error interno", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return jsonErr("No autorizado", 401);
    }

    const miembro = await MiembroSalida.findById(params.id)
      .populate("salida_id", "creador_id")
      .lean<{
        _id: string;
        salida_id: string | { _id: string; creador_id: string };
      }>();

    if (!miembro) return jsonErr("Miembro no encontrado", 404);

    const salidaId =
      typeof miembro.salida_id === "string"
        ? miembro.salida_id
        : miembro.salida_id?._id;

    if (!salidaId) return jsonErr("Salida no encontrada", 404);

    const salida = await SalidaSocial.findById(salidaId).select("creador_id");
    if (!salida) return jsonErr("Salida no encontrada", 404);

    if (String(salida.creador_id) !== String(session.user.id)) {
      return jsonErr("No autorizado para borrar miembros", 403);
    }

    await MiembroSalida.findByIdAndDelete(params.id);
    await Pago.deleteOne({ miembro_id: params.id }).catch(() => {});

    revalidateTag(`salida:${salidaId}`);

    return jsonOk({ message: "Miembro eliminado correctamente" }, 200);
  } catch (error) {
    return jsonErr("Error interno", 500);
  }
}
