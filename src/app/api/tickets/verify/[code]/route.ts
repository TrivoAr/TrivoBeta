import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Ticket from "@/models/ticket";

// export async function GET(_: Request, { params }: { params: { code: string } }) {
//   await connectDB();

//   // Tipamos el lean
//   const t = (await Ticket.findOne({ code: params.code }).populate("salidaId", "nombre").lean()) as LeanTicket;

//   if (!t) {
//     return NextResponse.json({ status: "invalid" }, { status: 404 });
//   }

//   // Manejo opcional de expiración
//   if (t.expiresAt && new Date(t.expiresAt) < new Date()) {
//     return NextResponse.json({ status: "invalid" }, { status: 410 });
//   }

//   return NextResponse.json({
//     status: t.status ?? "invalid",
//     redeemedAt: t.redeemedAt ?? null,
//   });
// }

// type LeanTicket = {
//   status?: "issued" | "redeemed" | "invalid";
//   redeemedAt?: Date | null;
//   expiresAt?: Date | null;
//   salidaId?: { nombre?: string } | null;
// } | null;

// export async function GET(_: Request, { params }: { params: { code: string } }) {
//   await connectDB();

//   try {
//     const t = (await Ticket.findOne({ code: params.code })
//       .populate({
//         path: "salidaId",
//         model: "SalidaSocial",
//         select: "nombre",
//       })
//       .lean()) as LeanTicket;

//     console.log("[VERIFY TICKET]", t);

//     if (!t) {
//       return NextResponse.json({ status: "invalid" }, { status: 404 });
//     }

//     if (t.expiresAt && new Date(t.expiresAt) < new Date()) {
//       return NextResponse.json({ status: "invalid" }, { status: 410 });
//     }

//     return NextResponse.json({
//       status: t.status ?? "invalid",
//       redeemedAt: t.redeemedAt ?? null,
//       salidaNombre: t.salidaId?.nombre ?? null,
//     });
//   } catch (err) {
//     console.error("[VERIFY ERROR]", err);
//     return NextResponse.json({ status: "invalid" }, { status: 500 });
//   }
// }

import SalidaSocial from "@/models/salidaSocial"; // 👈 importa el modelo

type TicketWithSalida = {
  status?: "issued" | "redeemed" | "invalid";
  redeemedAt?: Date | null;
  expiresAt?: Date | null;
  salidaId?: { nombre?: string } | null;
};

export async function GET(
  _: Request,
  { params }: { params: { code: string } }
) {
  await connectDB();

  try {
    const t = (await Ticket.findOne({ code: params.code })
      .populate({
        path: "salidaId",
        model: SalidaSocial, // 👈 usamos directamente el modelo importado
        select: "nombre",
      })
      .lean()) as TicketWithSalida | null;

    console.log("[VERIFY POPULATED TICKET]", t);

    if (!t) {
      return NextResponse.json({ status: "invalid" }, { status: 404 });
    }

    if (t.expiresAt && new Date(t.expiresAt) < new Date()) {
      return NextResponse.json({ status: "invalid" }, { status: 410 });
    }

    return NextResponse.json({
      status: t.status ?? "invalid",
      redeemedAt: t.redeemedAt ?? null,
      salidaNombre:
        t.salidaId && typeof t.salidaId === "object"
          ? (t.salidaId as any).nombre
          : null,
    });
  } catch (err) {
    console.error("[VERIFY ERROR]", err);
    return NextResponse.json(
      { status: "invalid", error: "server_error" },
      { status: 500 }
    );
  }
}
