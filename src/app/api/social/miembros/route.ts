import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroSalida from "@/models/MiembroSalida";
import mongoose from "mongoose";
import SalidaSocial from "@/models/salidaSocial";
import Notificacion from "@/models/notificacion";
import { getProfileImage } from "@/app/api/profile/getProfileImage";

export async function GET(req: NextRequest) {
  let salidaId: string | null = null;
  
  try {
    console.log("[GET_MIEMBROS] Starting request");
    await connectDB();
    console.log("[GET_MIEMBROS] DB connected");
    
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log("[GET_MIEMBROS] No session");
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
    }

    salidaId = req.nextUrl.searchParams.get("salidaId");
    console.log("[GET_MIEMBROS] salidaId:", salidaId);
    
    if (!salidaId) {
      return new Response(JSON.stringify({ error: "Falta salidaId" }), { status: 400 });
    }

    if (!mongoose.isValidObjectId(salidaId)) {
      console.log("[GET_MIEMBROS] Invalid ObjectId:", salidaId);
      return new Response(JSON.stringify({ error: "salidaId inválido" }), { status: 400 });
    }

    console.log("[GET_MIEMBROS] Querying miembros for salidaId:", salidaId);

    // Add timeout for database query in production
    const queryTimeout = process.env.NODE_ENV === 'production' ? 8000 : 15000;

    // Verify that the salidaId exists in SalidaSocial first
    let salidaExists = false;
    try {
      const salida = await SalidaSocial.findById(salidaId).select('_id').maxTimeMS(3000);
      salidaExists = !!salida;
      console.log("[GET_MIEMBROS] SalidaSocial exists:", salidaExists);
    } catch (salidaError) {
      console.log("[GET_MIEMBROS] Error checking salida existence:", salidaError.message);
    }

    if (!salidaExists) {
      console.log("[GET_MIEMBROS] SalidaSocial not found, returning empty array");
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const dbQueryPromise = MiembroSalida.find({ salida_id: salidaId })
      .populate("usuario_id", "firstname lastname email telnumber dni")
      .populate("pago_id")
      .maxTimeMS(queryTimeout);

    const miembros = await dbQueryPromise;
    console.log("[GET_MIEMBROS] Found", miembros.length, "miembros");


    // Process miembros with additional error handling
    const miembrosResults = await Promise.allSettled(
      miembros.map(async (m, index) => {
        try {
          console.log(`[GET_MIEMBROS] Processing member ${index + 1}/${miembros.length}:`, m._id);

          const usuario = m.usuario_id;
          const pago = m.pago_id;

          if (!usuario) {
            console.log(`[GET_MIEMBROS] Member ${index + 1} has no usuario_id`);
            return {
              _id: m._id,
              usuarioId: null,
              nombre: "Usuario eliminado",
              email: "",
              telnumber: "",
              imagen: `https://ui-avatars.com/api/?name=U&background=random&color=fff&size=128`,
              dni: "",
              pago_id: pago ? { _id: pago._id, estado: pago.estado || "" } : null,
            };
          }

          let imagenUrl;
          try {
            // More aggressive timeout for production (1.5 seconds)
            const timeoutDuration = process.env.NODE_ENV === 'production' ? 1500 : 3000;
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Image fetch timeout')), timeoutDuration)
            );

            // Race between image fetch and timeout
            imagenUrl = await Promise.race([
              getProfileImage("profile-image.jpg", usuario._id.toString()),
              timeoutPromise
            ]);
          } catch (imageError) {
            console.log("[GET_MIEMBROS] Image fetch failed for user:", usuario._id, imageError?.message || "unknown error", "using fallback");
            imagenUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              usuario.firstname || "U"
            )}&length=1&background=random&color=fff&size=128`;
          }

          return {
            _id: m._id,
            usuarioId: usuario._id,
            nombre: `${usuario.firstname ?? ""} ${usuario.lastname ?? ""}`.trim() || usuario.email,
            email: usuario.email,
            telnumber: usuario.telnumber,
            imagen: imagenUrl,
            dni: usuario.dni || "",
            pago_id: pago ? { _id: pago._id, estado: pago.estado || "" } : null,
          };
        } catch (e) {
          console.error("[GET_MIEMBROS] Error processing member:", m._id, e);
          return { 
            _id: m._id, 
            nombre: "Error interno",
            email: "",
            telnumber: "",
            imagen: "https://ui-avatars.com/api/?name=E&background=ff0000&color=fff&size=128",
            dni: "",
            pago_id: null
          };
        }
      })
    );

    // Extract successful results and handle failed ones
    const miembrosConImagen = miembrosResults
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          console.error("[GET_MIEMBROS] Promise failed for member at index:", index, result.reason);
          // Return a safe fallback member
          return {
            _id: miembros[index]?._id || `error_${index}`,
            usuarioId: miembros[index]?.usuario_id?._id || null,
            nombre: "Error de carga",
            email: "",
            telnumber: "",
            imagen: "https://ui-avatars.com/api/?name=E&background=ff0000&color=fff&size=128",
            dni: "",
            pago_id: miembros[index]?.pago_id ? {
              _id: miembros[index].pago_id._id,
              estado: miembros[index].pago_id.estado || "pendiente"
            } : null
          };
        }
      })
      .filter(Boolean); // Remove any null/undefined results

    console.log("[GET_MIEMBROS] Returning", miembrosConImagen.length, "processed members");

    return new Response(
      JSON.stringify(Array.isArray(miembrosConImagen) ? miembrosConImagen : []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[GET_MIEMBROS_ERROR]", {
      salidaId,
      environment: process.env.NODE_ENV,
      error: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    // NEVER return 500 in production - always return valid empty array
    // This prevents the UI from breaking completely
    if (process.env.NODE_ENV === 'production') {
      console.log("[GET_MIEMBROS] Production fallback: returning empty array instead of error");
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Return more specific error information for debugging in development
    const errorMessage = err instanceof Error ? err.message : String(err);
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('time') || errorMessage.includes('maxTimeMS');

    return new Response(JSON.stringify({
      error: "Error interno en GET /miembros",
      type: isTimeout ? "timeout" : "database_error",
      details: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}






  

export async function POST(req) {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session) return new Response("No autorizado", { status: 401 });

  const { salida_id } = await req.json();
  const usuario_id = session.user.id;

  const yaEsMiembro = await MiembroSalida.findOne({ salida_id, usuario_id });
  if (yaEsMiembro) {
    return new Response("Ya tienes una solicitud para esta salida", {
      status: 400,
    });
  }

  const nuevoMiembro = await MiembroSalida.create({
    salida_id,
    usuario_id,
    rol: "miembro",
    estado: "pendiente",
  });

  const salida = await SalidaSocial.findById(salida_id);
  if (!salida) return new Response("Salida no encontrada", { status: 404 });

  const creadorId = salida.creador_id || salida.usuario_id;

  if (String(creadorId) !== String(usuario_id)) {
    await Notificacion.create({
      userId: creadorId,
      fromUserId: usuario_id,
      type: "join_request",
      message: `${session.user.firstname} ${session.user.lastname || "Alguien"} pidió unirse a tu salida.`,
    });
  }

  return new Response(JSON.stringify(nuevoMiembro), { status: 201 });
}
