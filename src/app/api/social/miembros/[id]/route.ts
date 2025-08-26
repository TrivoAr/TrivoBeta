// import { NextRequest } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/libs/authOptions";
// import { connectDB } from "@/libs/mongodb";
// import { NextResponse } from "next/server";
// import MiembroSalida from "@/models/MiembroSalida";
// import SalidaSocial from "@/models/salidaSocial";
// import Pago from "@/models/pagos";

// export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
//   await connectDB();
//   const session = await getServerSession(authOptions);
//   if (!session) return new Response("No autorizado", { status: 401 });

//   const { estado } = await req.json(); // "aprobado" o "rechazado"
//   const miembroId = params.id;

//   const miembro = await MiembroSalida.findById(miembroId);
//   if (!miembro) return new Response("Miembro no encontrado", { status: 404 });

//   const salida = await SalidaSocial.findById(miembro.salida_id);
//   if (!salida) return new Response("Salida no encontrada", { status: 404 });

//   // Si intenta aprobar, primero validamos el cupo
//   if (estado === "aprobado") {
//     const miembrosAprobados = await MiembroSalida.countDocuments({
//       salida_id: miembro.salida_id,
//       estado: "aprobado",
//     });

//     if (miembrosAprobados >= salida.cupo) {
//       return new Response("No hay cupos disponibles", { status: 400 });
//     }
//   }

//   // Actualizar estado
//   miembro.estado = estado;
//   await miembro.save();



//     const pago = await Pago.findOne({ miembro_id: miembro._id });
//   if (pago) {
//     pago.estado = "validado";
//     await pago.save();
//   }

//   return new Response(JSON.stringify(miembro), { status: 200 });
// }

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import MiembroSalida from "@/models/MiembroSalida";
import SalidaSocial from "@/models/salidaSocial";
import Pago from "@/models/pagos";


export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();

  const salidaId = params.id;

  const miembros = await MiembroSalida.find({ salida_id: salidaId })
    .populate("usuario_id", "firstname lastname email dni") // opcional, si querés info del usuario
    .populate("pago_id"); // opcional, para ver el estado del pago

  return new Response(JSON.stringify(miembros), { status: 200 });
}


// 🔹 PUT: Actualizar estado del miembro
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await req.json();
    const { estado } = body;

    if (!["pendiente", "aprobado", "rechazado"].includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      );
    }

    const miembro = await MiembroSalida.findByIdAndUpdate(
      params.id,
      { estado },
      { new: true }
    )
      .populate("usuario_id")
      .populate("salida_id")
      .populate("pago_id");

    if (!miembro) {
      return NextResponse.json(
        { error: "Miembro no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Estado del miembro actualizado", miembro },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error actualizando miembro:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}



export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {

  console.log("PATCH request received for miembro ID:", params.id);
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { estado } = await req.json(); // "pendiente" | "aprobado" | "rechazado"
    if (!["pendiente", "aprobado", "rechazado"].includes(estado)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const miembro = await MiembroSalida.findById(params.id);
    if (!miembro) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    const salida = await SalidaSocial.findById(miembro.salida_id);
    if (!salida) {
      return NextResponse.json({ error: "Salida no encontrada" }, { status: 404 });
    }

    // 🔹 Validar cupo si intenta aprobar
    if (estado === "aprobado") {
      const miembrosAprobados = await MiembroSalida.countDocuments({
        salida_id: miembro.salida_id,
        estado: "aprobado",
      });

      if (miembrosAprobados >= salida.cupo) {
        return NextResponse.json(
          { error: "No hay cupos disponibles" },
          { status: 400 }
        );
      }
    }

    // 🔹 Actualizar estado del miembro
    miembro.estado = estado;
    await miembro.save();

    // 🔹 Actualizar estado del pago asociado si existe
    const pago = await Pago.findOne({ miembro_id: miembro._id });
    if (pago) {
      pago.estado = estado; // mismo estado que el miembro
      await pago.save();
    }

    return NextResponse.json(
      { message: "Estado actualizado correctamente", miembro },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error actualizando miembro:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
