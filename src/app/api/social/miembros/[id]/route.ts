// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/libs/authOptions";
// import { connectDB } from "@/libs/mongodb";
// import MiembroSalida from "@/models/MiembroSalida";
// import SalidaSocial from "@/models/salidaSocial";
// import Pago from "@/models/pagos";

// export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
//   await connectDB();

//   const salidaId = params.id;

//   const miembros = await MiembroSalida.find({ salida_id: salidaId })
//     .populate("usuario_id", "firstname lastname email dni") // opcional, si querés info del usuario
//     .populate("pago_id"); // opcional, para ver el estado del pago

//   return new Response(JSON.stringify(miembros), { status: 200 });
// }

// // 🔹 PUT: Actualizar estado del miembro
// export async function PUT(
//   req: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     await connectDB();
//     const body = await req.json();
//     const { estado } = body;

//     if (!["pendiente", "aprobado", "rechazado"].includes(estado)) {
//       return NextResponse.json(
//         { error: "Estado inválido" },
//         { status: 400 }
//       );
//     }

//     const miembro = await MiembroSalida.findByIdAndUpdate(
//       params.id,
//       { estado },
//       { new: true }
//     )
//       .populate("usuario_id")
//       .populate("salida_id")
//       .populate("pago_id");

//     if (!miembro) {
//       return NextResponse.json(
//         { error: "Miembro no encontrado" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(
//       { message: "Estado del miembro actualizado", miembro },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error actualizando miembro:", error);
//     return NextResponse.json({ error: "Error interno" }, { status: 500 });
//   }
// }

// export async function PATCH(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {

//   console.log("PATCH request received for miembro ID:", params.id);
//   try {
//     await connectDB();

//     const session = await getServerSession(authOptions);
//     if (!session) {
//       return NextResponse.json({ error: "No autorizado" }, { status: 401 });
//     }

//     const { estado } = await req.json(); // "pendiente" | "aprobado" | "rechazado"
//     if (!["pendiente", "aprobado", "rechazado"].includes(estado)) {
//       return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
//     }

//     const miembro = await MiembroSalida.findById(params.id);
//     if (!miembro) {
//       return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
//     }

//     const salida = await SalidaSocial.findById(miembro.salida_id);
//     if (!salida) {
//       return NextResponse.json({ error: "Salida no encontrada" }, { status: 404 });
//     }

//     // 🔹 Validar cupo si intenta aprobar
//     if (estado === "aprobado") {
//       const miembrosAprobados = await MiembroSalida.countDocuments({
//         salida_id: miembro.salida_id,
//         estado: "aprobado",
//       });

//       if (miembrosAprobados >= salida.cupo) {
//         return NextResponse.json(
//           { error: "No hay cupos disponibles" },
//           { status: 400 }
//         );
//       }
//     }

//     // 🔹 Actualizar estado del miembro
//     miembro.estado = estado;
//     await miembro.save();

//     // 🔹 Actualizar estado del pago asociado si existe
//     const pago = await Pago.findOne({ miembro_id: miembro._id });
//     if (pago) {
//       pago.estado = estado; // mismo estado que el miembro
//       await pago.save();
//     }

//     return NextResponse.json(
//       { message: "Estado actualizado correctamente", miembro },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error actualizando miembro:", error);
//     return NextResponse.json({ error: "Error interno" }, { status: 500 });
//   }
// }

// app/api/social/miembros/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroSalida from "@/models/MiembroSalida";
import SalidaSocial from "@/models/salidaSocial";
import Pago from "@/models/pagos";
import mongoose from "mongoose";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic"; // <- evita ISR
export const revalidate = 0; // <- sin revalidación
export const fetchCache = "force-no-store"; // <- sin caché de fetch
export const runtime = "nodejs"; // <- Mongoose no va en Edge

type MiembroLean = {
  _id: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  // puede venir como ObjectId (string) o como objeto populado
  salida_id: string | { _id: string; cupo?: number };
  usuario_id?:
    | string
    | { firstname?: string; lastname?: string; email?: string };
  pago_id?: string | { estado?: string };
};

type SalidaLeanMin = { _id: string; cupo?: number };

// Utilidad
function jsonOk(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
function jsonErr(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status });
}

// GET => LISTA de miembros por SALIDA (params.id = salida_id)
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
      .lean(); // <- más liviano para serializar

    return jsonOk(miembros, 200);
  } catch (e) {
    console.error("GET /miembros/:salidaId error:", e);
    return jsonErr("Error interno", 500); // <- SIEMPRE JSON, evita "Unexpected end of JSON input"
  }
}

// PUT => actualizar estado por MIEMBRO (params.id = miembro_id)
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
      .populate("salida_id", "cupo") // <- importante: que traiga _id
      .populate("pago_id", "estado")
      .lean<MiembroLean>(); // <- tipamos el lean

    if (!miembro) return jsonErr("Miembro no encontrado", 404);

    // salidaId puede ser string u objeto populado
    const salidaId =
      typeof miembro.salida_id === "string"
        ? miembro.salida_id
        : miembro.salida_id?._id;

    if (salidaId) {
      // @ts-ignore opcional si tu setup no expone types de Next cache
      revalidateTag(`salida:${salidaId}`);
    }

    return jsonOk({ message: "Estado del miembro actualizado", miembro }, 200);
  } catch (error) {
    console.error("PUT /miembros/:id error:", error);
    return jsonErr("Error interno", 500);
  }
}

// PATCH => transición de estado con validación de cupo (params.id = miembro_id)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { estado } = await req.json();
    if (!["pendiente", "aprobado", "rechazado"].includes(estado || "")) {
      return jsonErr("Estado inválido", 400);
    }

    type MiembroLeanMin = {
      _id: string;
      salida_id: string | { _id: string };
      estado: "pendiente" | "aprobado" | "rechazado";
    };

    // traemos lo mínimo y tipamos el lean
    const miembro = await MiembroSalida.findById(params.id)
      .select("salida_id estado")
      .lean<MiembroLeanMin>();

    if (!miembro) return jsonErr("Miembro no encontrado", 404);

    // resolver salidaId si viene populado o como string
    const salidaId =
      typeof miembro.salida_id === "string"
        ? miembro.salida_id
        : miembro.salida_id?._id;

    if (!salidaId) return jsonErr("Salida no encontrada", 404);

    // solo necesitamos el cupo y lo tipamos
    const salida = await SalidaSocial.findById(salidaId)
      .select("cupo")
      .lean<SalidaLeanMin>();

    if (!salida) return jsonErr("Salida no encontrada", 404);

    // normalizamos cupo a número seguro
    const cupo = typeof salida.cupo === "number" ? salida.cupo : 0;

    if (estado === "aprobado") {
      const aprobados = await MiembroSalida.countDocuments({
        salida_id: salidaId,
        estado: "aprobado",
      });

      if (aprobados >= cupo) {
        return jsonErr("No hay cupos disponibles", 409);
      }
    }

    // actualizar estados
    await MiembroSalida.updateOne({ _id: params.id }, { estado });
    await Pago.updateOne({ miembro_id: params.id }, { estado }).catch(() => {});

    // refresco de vistas cacheadas por tag
    // @ts-ignore si TS no reconoce revalidateTag types en tu setup
    revalidateTag(`salida:${salidaId}`);

    return jsonOk({ message: "Estado actualizado correctamente" }, 200);
  } catch (error) {
    console.error("PATCH /miembros/:id error:", error);
    return jsonErr("Error interno", 500);
  }
}
