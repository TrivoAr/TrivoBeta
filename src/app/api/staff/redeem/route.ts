// import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/libs/authOptions";
// import { connectDB } from "@/libs/mongodb";
// import Ticket from "@/models/ticket";
// import SalidaSocial from "@/models/salidaSocial";

// // Tipos mínimos que necesitamos para que TS "vea" las props al usar .lean()
// type LeanTicketBase = {
//   _id: any;
//   status: "issued" | "redeemed" | "invalid";
//   redeemedAt?: Date | null;
//   salidaId: any; // ObjectId
// };

// type LeanSalida = {
//   _id: any;
//   creador_id?: any; // ObjectId
// };

// export async function POST(req: Request) {
//   await connectDB();

//   const headerKey = req.headers.get("x-scanner-key");
//   const allowByKey =
//     !!headerKey &&
//     !!process.env.SCANNER_TEST_KEY &&
//     headerKey === process.env.SCANNER_TEST_KEY;

//   const session = await getServerSession(authOptions);

//   // Si no viene clave válida y tampoco hay sesión de usuario staff -> 401
//   if (!allowByKey && !session?.user?.id) {
//     return NextResponse.json({ error: "unauthorized" }, { status: 401 });
//   }

//   // Para logs y redeemBy, priorizamos id de sesión; si no hay, marcamos "test"
//   const staffUserId = session?.user?.id ? String(session.user.id) : "test-key";
//   const staffRol = (session?.user as any)?.rol as string | undefined;

//   if (!session?.user?.id) {
//     return NextResponse.json({ error: "unauthorized" }, { status: 401 });
//   }

//   // body: { code: string }
//   let body: { code?: string } = {};
//   try {
//     body = await req.json();
//   } catch {
//     // ignore
//   }
//   const code = (body.code || "").trim();
//   if (!code) {
//     return NextResponse.json({ error: "code_required" }, { status: 400 });
//   }

//   // 1) Obtener el ticket (para autorizar y chequear estado)
//   const t = await Ticket.findOne({ code })
//     .select("status redeemedAt salidaId")
//     .lean<LeanTicketBase>();

//   if (!t) {
//     return NextResponse.json({ error: "invalid_code" }, { status: 404 });
//   }

//   // // (Opcional) Expiración por tiempo:
//   // if (t.expiresAt && new Date(t.expiresAt) < new Date()) {
//   //   return NextResponse.json({ error: "expired" }, { status: 410 });
//   // }

//   // 2) Autorización: creador de la salida o staff/admin
//   // const salida = await SalidaSocial.findById(t.salidaId)
//   //   .select("creador_id")
//   //   .lean<LeanSalida>();

//   // const isCreator = salida?.creador_id?.toString() === staffUserId;
//   // const isStaff =
//   //   staffRol === "admin" ||
//   //   staffRol === "profe" ||
//   //   staffRol === "dueño de academia";

//   // if (!isCreator && !isStaff) {
//   //   return NextResponse.json({ error: "forbidden" }, { status: 403 });
//   // }

//   const salida = await SalidaSocial.findById(t.salidaId)
//   .select("creador_id")
//   .lean<LeanSalida>();

// const isCreator = salida?.creador_id?.toString() === staffUserId;
// const isStaff =
//   staffRol === "admin" ||
//   staffRol === "profe" ||
//   staffRol === "dueño de academia";

// if (!allowByKey && !isCreator && !isStaff) {
//   return NextResponse.json({ error: "forbidden" }, { status: 403 });
// }


//   // 3) Canje atómico: sólo si sigue "issued"
//   const updated = await Ticket.findOneAndUpdate(
//     { code, status: "issued" },
//     {
//       $set: {
//         status: "redeemed",
//         redeemedAt: new Date(),
//         redeemedBy: staffUserId,
//       },
//     },
//     { new: true }
//   )
//     .select("redeemedAt status")
//     .lean<{ redeemedAt?: Date | null; status: "redeemed" | "issued" }>();

//   if (updated) {
//     return NextResponse.json({
//       ok: true,
//       redeemedAt: updated.redeemedAt ?? null,
//     });
//   }

//   // 4) No se actualizó => ver qué pasó
//   const existing = await Ticket.findOne({ code })
//     .select("status redeemedAt")
//     .lean<Pick<LeanTicketBase, "status" | "redeemedAt">>();

//   if (!existing) {
//     // (muy raro, pero cubrimos el caso)
//     return NextResponse.json({ error: "invalid_code" }, { status: 404 });
//   }

//   if (existing.status === "redeemed") {
//     return NextResponse.json(
//       {
//         error: "already_redeemed",
//         redeemedAt: existing.redeemedAt ?? null,
//       },
//       { status: 409 }
//     );
//   }

//   // Cualquier otro estado que no sea "issued" ni "redeemed" => no canjeable
//   return NextResponse.json({ error: "not_issuable" }, { status: 409 });
// }

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import Ticket from "@/models/ticket";
import SalidaSocial from "@/models/salidaSocial";

// === Tipos mínimos para TS ===
type LeanTicket = {
  _id: string;
  status: "issued" | "redeemed" | "invalid";
  salidaId: string;
};

type LeanSalida = {
  _id: string;
  creador_id?: string;
  profesorId?: string;
};

export async function POST(req: Request) {
  await connectDB();

  // Sesión del staff
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const staffUserId = String(session.user.id);
  const staffRol = (session.user as any)?.rol as string | undefined;

  // Body
  let body: { code?: string } = {};
  try {
    body = await req.json();
  } catch {}
  const code = (body.code || "").trim();
  if (!code) {
    return NextResponse.json({ error: "code_required" }, { status: 400 });
  }

  // 1) Buscar ticket
  const ticket = await Ticket.findOne({ code })
    .select("status salidaId")
    .lean<LeanTicket>();

  if (!ticket) {
    return NextResponse.json({ error: "invalid_code" }, { status: 404 });
  }

  // 2) Buscar salida asociada
  const salida = await SalidaSocial.findById(ticket.salidaId)
    .select("creador_id profesorId")
    .lean<LeanSalida>();

  if (!salida) {
    return NextResponse.json({ error: "salida_not_found" }, { status: 404 });
  }

  // 3) Autorización (creador, profesor o admin)
  const isCreator = salida.creador_id?.toString() === staffUserId;
  const isProfesor = salida.profesorId?.toString() === staffUserId;
  const isAdmin = staffRol === "admin";

  if (!isCreator && !isProfesor && !isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // 4) Canje atómico
  const updated = await Ticket.findOneAndUpdate(
    { code, status: "issued" },
    { $set: { status: "redeemed", redeemedAt: new Date(), redeemedBy: staffUserId } },
    { new: true }
  )
    .select("redeemedAt status")
    .lean<{ redeemedAt?: Date | null; status: "issued" | "redeemed" | "invalid" }>();

  if (updated) {
    return NextResponse.json({
      ok: true,
      redeemedAt: updated.redeemedAt ?? null,
    });
  }

  // 5) Revisar qué pasó si no se actualizó
  const existing = await Ticket.findOne({ code })
    .select("status redeemedAt")
    .lean<{ status: "issued" | "redeemed" | "invalid"; redeemedAt?: Date | null }>();

  if (!existing) {
    return NextResponse.json({ error: "invalid_code" }, { status: 404 });
  }

  if (existing.status === "redeemed") {
    return NextResponse.json(
      {
        error: "already_redeemed",
        redeemedAt: existing.redeemedAt ?? null,
      },
      { status: 409 }
    );
  }

  return NextResponse.json({ error: "not_issuable" }, { status: 409 });
}
