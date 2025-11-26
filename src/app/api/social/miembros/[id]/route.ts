import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroSalida from "@/models/MiembroSalida";
import SalidaSocial from "@/models/salidaSocial";
import Pago from "@/models/pagos";
import mongoose from "mongoose";
import { revalidateTag } from "next/cache";
import {
  notifyMemberApproved,
  notifyMemberRejected,
} from "@/libs/notificationHelpers";
import { trackEventServer, trackChargeServer } from "@/libs/mixpanel.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

type MiembroLean = {
  _id: string;
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Await params in Next.js 15+
    const resolvedParams = await params;
    const salidaId = resolvedParams.id;
    if (!mongoose.isValidObjectId(salidaId)) {
      return jsonErr("salida_id inválido", 400);
    }

    const miembros = await MiembroSalida.find({ salida_id: salidaId })
      .populate("usuario_id", "firstname lastname email dni")
      .populate("pago_id", "estado")
      .select("_id usuario_id pago_id salida_id createdAt")
      .lean();

    return jsonOk(miembros, 200);
  } catch (e) {
    return jsonErr("Error interno", 500);
  }
}

// PUT endpoint removed - estado is now managed through Pago model

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return jsonErr("No autorizado", 401);
    }

    const { estado } = await req.json();
    if (!["pendiente", "aprobado", "rechazado"].includes(estado || "")) {
      return jsonErr("Estado inválido", 400);
    }

    // Await params in Next.js 15+
    const resolvedParams = await params;

    // Obtener información completa del miembro para las notificaciones
    const miembroCompleto = await MiembroSalida.findById(resolvedParams.id)
      .populate("usuario_id", "firstname lastname _id")
      .populate("salida_id", "nombre cupo creador_id precio")
      .lean();

    if (!miembroCompleto) return jsonErr("Miembro no encontrado", 404);

    const salida = (miembroCompleto as any).salida_id;
    const usuario = (miembroCompleto as any).usuario_id;

    if (!salida || !usuario) return jsonErr("Datos incompletos", 404);

    const cupo = typeof salida.cupo === "number" ? salida.cupo : 0;

    if (estado === "aprobado") {
      // Contar miembros con pago aprobado
      const pagosAprobados = await Pago.countDocuments({
        salidaId: salida._id,
        estado: "aprobado",
      });

      if (pagosAprobados >= cupo) {
        return jsonErr("No hay cupos disponibles", 409);
      }
    }

    // Actualizar solo el estado del pago
    await Pago.updateOne({ miembro_id: resolvedParams.id }, { estado });

    // ========== TRACKING DE REVENUE PARA TRANSFERENCIAS APROBADAS ==========
    if (estado === "aprobado") {
      console.log("[REVENUE] Iniciando tracking de transferencia aprobada");
      console.log("[REVENUE] Usuario:", usuario._id);
      console.log("[REVENUE] Salida:", salida.nombre);
      console.log("[REVENUE] Precio raw:", salida.precio);

      try {
        // Buscar el pago asociado para verificar si ya fue trackeado
        const pago = await Pago.findOne({ miembro_id: resolvedParams.id });
        const yaTrackeado = pago?.revenueTracked || false;

        console.log("[REVENUE] Pago encontrado:", !!pago);
        console.log("[REVENUE] Ya trackeado:", yaTrackeado);

        if (!yaTrackeado) {
          // Convertir precio de string a número
          let precioNumerico = 0;
          if (salida.precio) {
            const precioStr = String(salida.precio)
              .replace(/[^\d.,]/g, "")
              .replace(",", ".");
            precioNumerico = parseFloat(precioStr);
            console.log("[REVENUE] Precio convertido:", precioNumerico);
          } else {
            console.warn("[REVENUE] ⚠️ No hay precio en la salida");
          }

          if (precioNumerico > 0) {
            console.log(
              `💰 Tracking revenue (transferencia aprobada): $${precioNumerico} ARS para usuario ${usuario._id}`
            );

            // Trackear el evento de pago aprobado con revenue
            const trackSuccess = await trackEventServer({
              event: "Payment Approved",
              distinctId: usuario._id.toString(),
              properties: {
                distinct_id: usuario._id.toString(),
                amount: precioNumerico,
                revenue: precioNumerico, // Propiedad especial de Mixpanel para revenue
                event_id: salida._id.toString(),
                event_type: "salida_social",
                event_name: salida.nombre,
                payment_id: pago?._id?.toString() || `transfer_${id}`,
                payment_method: "transferencia_bancaria",
                currency: "ARS",
                source: "manual_approval",
                approved_by: session.user.id,
                timestamp: new Date().toISOString(),
              },
            });

            // Registrar el cargo en el perfil del usuario para lifetime value
            const chargeSuccess = await trackChargeServer({
              distinctId: usuario._id.toString(),
              amount: precioNumerico,
              properties: {
                event_id: salida._id.toString(),
                event_type: "salida_social",
                event_name: salida.nombre,
                payment_id: pago?._id?.toString() || `transfer_${id}`,
                payment_method: "transferencia_bancaria",
                currency: "ARS",
                timestamp: new Date().toISOString(),
              },
            });

            // Marcar el pago como trackeado si ambos fueron exitosos
            if (trackSuccess && chargeSuccess && pago) {
              pago.revenueTracked = true;
              pago.revenueTrackedAt = new Date();
              await pago.save();
              console.log(
                `✅ Revenue tracking completado y marcado para usuario ${usuario._id} (transferencia)`
              );
            } else {
              console.warn(
                `⚠️ Revenue tracking puede haber fallado para usuario ${usuario._id}`
              );
            }
          } else {
            console.warn(
              `⚠️ No se pudo obtener el precio de la salida ${salida._id} para tracking`
            );
          }
        } else {
          console.log(
            `ℹ️ Revenue ya trackeado para miembro ${id}, evitando duplicado`
          );
        }
      } catch (trackingError) {
        console.error("❌ Error al trackear revenue de transferencia:", trackingError);
        // No fallar la operación principal por error de tracking
      }
    }
    // ========== FIN TRACKING ==========

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
      // No fallar la operación principal por error de notificación
    }

    // TODO: Fix revalidateTag for Next.js 16
    // revalidateTag(`salida:${salida._id}`);

    return jsonOk({ message: "Estado actualizado correctamente" }, 200);
  } catch (error) {
    return jsonErr("Error interno", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return jsonErr("No autorizado", 401);
    }

    // Await params in Next.js 15+
    const resolvedParams = await params;

    const miembro = await MiembroSalida.findById(resolvedParams.id)
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

    await MiembroSalida.findByIdAndDelete(resolvedParams.id);
    await Pago.deleteOne({ miembro_id: resolvedParams.id }).catch(() => {});

    // TODO: Fix revalidateTag for Next.js 16
    // revalidateTag(`salida:${salidaId}`);

    return jsonOk({ message: "Miembro eliminado correctamente" }, 200);
  } catch (error) {
    return jsonErr("Error interno", 500);
  }
}
