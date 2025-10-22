import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Ticket from "@/models/ticket";
import { qrPngDataUrl } from "@/libs/qr";
import { sendTicketEmail } from "@/libs/email/sendTicketEmail";
import type { TicketDoc } from "@/models/ticket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await connectDB();
    // 1) buscá el último ticket creado (o ajustá filtro si querés uno específico)
    const t = (await Ticket.findOne()
      .sort({ createdAt: -1 })
      .lean()) as TicketDoc | null;
    if (!t) return NextResponse.json({ error: "no_ticket" }, { status: 404 });

    if (!t.userId || !t.salidaId || !t.code) {
      return NextResponse.json(
        { error: "ticket_incompleto", t },
        { status: 400 }
      );
    }

    const redeemUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${t.code}`;
    const dataUrl = await qrPngDataUrl(redeemUrl);


    const emailId = await sendTicketEmail({
      userId: String(t.userId),
      salidaId: String(t.salidaId),
      redeemUrl,
      qrDataUrl: dataUrl,
    });

    return NextResponse.json({ ok: true, emailId }, { status: 200 });
  } catch (e: any) {

    return NextResponse.json({ error: e?.message ?? "fail" }, { status: 500 });
  }
}
