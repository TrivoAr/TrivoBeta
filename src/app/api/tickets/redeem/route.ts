import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Ticket from "@/models/ticket";

export const runtime = "nodejs";

const SCANNER_KEY = process.env.SCANNER_KEY!;

// Tipito mínimo para el `existing` que usamos debajo
type LeanTicketMinimal = {
  status?: "issued" | "redeemed" | "invalid";
  redeemedAt?: Date | string | null;
} | null;

export async function POST(req: NextRequest) {
  await connectDB();

  const key = req.headers.get("x-scanner-key");
  if (!key || key !== SCANNER_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code, staffUserId } = await req.json();
  if (!code) {
    return NextResponse.json({ error: "code_required" }, { status: 400 });
  }

  // Canje atómico: issued -> redeemed
  const updated = await Ticket.findOneAndUpdate(
    { code, status: "issued" },
    {
      $set: {
        status: "redeemed",
        redeemedAt: new Date(),
        redeemedBy: staffUserId || null,
      },
    },
    { new: true }
  );

  if (!updated) {
    // 🔧 Tipamos el lean (o casteamos)
    const existing = (await Ticket.findOne({ code })
      .select("status redeemedAt")
      .lean()) as LeanTicketMinimal;

    if (!existing) {
      return NextResponse.json({ error: "invalid_code" }, { status: 404 });
    }

    if (existing.status === "redeemed") {
      return NextResponse.json({
        ok: true,
        alreadyRedeemed: true,
        redeemedAt: existing.redeemedAt ?? null,
      });
    }

    return NextResponse.json({ error: "not_issuable" }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    redeemedAt: updated.redeemedAt ?? null,
  });
}
