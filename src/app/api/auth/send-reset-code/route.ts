// import { connectDB } from "@/libs/mongodb";
// import User from "@/models/user";
// import crypto from "crypto";
// import {sendEmail} from "@/libs/sendEmail";
// import { resetPasswordTemplate } from "@/libs/resetPasswordTemplate";

// export async function POST(req: Request) {
//   try {
//     await connectDB();
//     const { email } = await req.json();

//     if (!email) {
//       return new Response(JSON.stringify({ message: "El email es requerido" }), { status: 400 });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return new Response(JSON.stringify({ message: "No existe un usuario con ese correo" }), { status: 404 });
//     }

//     // Generar código de recuperación
//     const resetToken = crypto.randomBytes(20).toString("hex");
//     user.resetPasswordToken = resetToken;
//     user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutos
//     await user.save();

//     // Enviar correo
//     await sendEmail({
//       to: user.email,
//       subject: "Código de recuperación de contraseña",
//       html: resetPasswordTemplate(resetToken),
//     });

//     return new Response(JSON.stringify({ message: "Código enviado" }), { status: 200 });
//   } catch (error) {
//     console.error("Error enviando correo:", error);
//     return new Response(JSON.stringify({ message: "Error en el servidor" }), { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";
import crypto from "crypto";
import {sendEmail} from "@/libs/sendEmail";
import { resetPasswordTemplate } from "@/libs/resetPasswordTemplate";


export const runtime = "nodejs";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(req: Request) {
  await connectDB();
  try {
    const { email } = await req.json();
    const normEmail = String(email || "").trim().toLowerCase();
    if (!normEmail) return NextResponse.json({ message: "Email requerido" }, { status: 400 });

    // case-insensitive
    const user = await User.findOne({
      email: { $regex: `^${escapeRegExp(normEmail)}$`, $options: "i" },
    }).select("_id email");

    // siempre 200 (anti user-enum)
    if (!user) {
      return NextResponse.json({ ok: true, message: "Si el email existe, enviaremos un código." }, { status: 200 });
    }

    // ⚠️ Elegí 15 o 60 y sé consistente. Acá uso 15 para matchear el template.
    const EXPIRE_MINUTES = 15;

    const resetCode = crypto.randomInt(100000, 999999).toString();
    const hashed = crypto.createHash("sha256").update(resetCode).digest("hex");
    user.resetPasswordToken = hashed;
    user.resetPasswordExpire = new Date(Date.now() + EXPIRE_MINUTES * 60 * 1000);
    await user.save();

    // Enviar el email (NO el hash)
    try {
      await sendEmail({
        to: user.email,
        subject: "Tu código para restablecer la contraseña",
        html: resetPasswordTemplate(resetCode),
      });
    } catch (err) {
      console.error("Fallo al enviar email:", err);

      // DEV: devolver el código si activás debug (no lo hagas en prod)
      if (process.env.NODE_ENV !== "production" || process.env.DEBUG_RESET_CODE === "1") {
        return NextResponse.json({ ok: true, debugCode: resetCode, message: "Código generado (DEV)" }, { status: 200 });
      }
      // En prod, respuesta genérica:
      return NextResponse.json({ ok: true, message: "Si el email existe, enviaremos un código." }, { status: 200 });
    }

    return NextResponse.json({ ok: true, message: "Código enviado si el email existe." }, { status: 200 });
  } catch (e) {
    console.error("send-reset-code error:", e);
    return NextResponse.json({ message: "Error en el servidor" }, { status: 500 });
  }
}
