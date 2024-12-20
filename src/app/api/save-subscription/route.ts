// src/app/api/save-subscription/route.ts
import { NextResponse } from "next/server";
import Subscription from "@/models/subscription";

export async function POST(req: Request) {
  try {
    const subscription = await req.json();

    // Guarda la suscripción en la base de datos
    await Subscription.create(subscription);

    return NextResponse.json({ message: "Suscripción guardada correctamente" }, { status: 200 });
  } catch (error) {
    console.error("Error al guardar la suscripción:", error);
    return NextResponse.json({ error: "Error al guardar la suscripción" }, { status: 500 });
  }
}
