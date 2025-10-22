// import { connectDB } from "@/libs/mongodb";
// import User from "@/models/user";
// import crypto from "crypto";

// export async function POST(req: Request) {
//   try {
//     await connectDB();
//     const { email } = await req.json();

//     const user = await User.findOne({ email });
//     if (!user) return new Response(JSON.stringify({ message: "Usuario no encontrado" }), { status: 400 });

//     // Generar un código aleatorio (Ejemplo: 6 dígitos)
//     const resetCode = crypto.randomInt(100000, 999999).toString();
//     const resetCodeExpire = Date.now() + 3600000; // 1 hora de validez

//     user.resetPasswordToken = resetCode;
//     user.resetPasswordExpire = resetCodeExpire;
//     await user.save();

//     return new Response(JSON.stringify({ resetCode, message: "Código generado. Envíalo manualmente al usuario." }), { status: 200 });
//   } catch (error) {
//     return new Response(JSON.stringify({ message: "Error en el servidor", error }), { status: 500 });
//   }
// }

// app/api/auth/reset/request/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";
import crypto from "crypto";

export const runtime = "nodejs"; // bcrypt/crypto => Node

export async function POST(req: Request) {
  await connectDB();
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ message: "Email requerido" }, { status: 400 });
    }

    const user = await User.findOne({ email }).select("_id email");
    // 🔒 Anti user-enumeration (opcional): siempre responde 200
    if (!user) {
      return NextResponse.json(
        { message: "Si el email existe, enviaremos un código" },
        { status: 200 }
      );
    }

    // Código 6 dígitos
    const resetCode = crypto.randomInt(100000, 999999).toString();

    // Guardamos HASH en DB (NO el código en claro)
    const hashed = crypto.createHash("sha256").update(resetCode).digest("hex");
    user.resetPasswordToken = hashed;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1h
    user.resetPasswordAttempts = 0; // opcional

    await user.save();

    // TODO: enviar `resetCode` por email con tu mailer (ya dijiste que te funciona)
    // Nunca envíes el hash.

    return NextResponse.json(
      { ok: true, message: "Código enviado si el email existe" },
      { status: 200 }
    );
  } catch (error) {

    return NextResponse.json(
      { message: "Error en el servidor" },
      { status: 500 }
    );
  }
}
