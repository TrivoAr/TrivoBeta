// import { connectDB } from "@/libs/mongodb";
// import User from "@/models/user";
// import bcrypt from "bcryptjs";

// export async function POST(req: Request) {
//   try {
//     await connectDB();
//     const { email, resetCode, newPassword } = await req.json();

//     const user = await User.findOne({
//       email,
//       resetPasswordToken: resetCode,
//       resetPasswordExpire: { $gt: Date.now() },
//     });

//     if (!user) return new Response(JSON.stringify({ message: "Código inválido o expirado" }), { status: 400 });

//     // Hashear la nueva contraseña
//     user.password = await bcrypt.hash(newPassword, 10);
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpire = undefined;
//     await user.save();

//     return new Response(JSON.stringify({ message: "Contraseña restablecida correctamente" }), { status: 200 });
//   } catch (error) {
//     return new Response(JSON.stringify({ message: "Error en el servidor", error }), { status: 500 });
//   }
// }

// import { connectDB } from "@/libs/mongodb";
// import User from "@/models/user";
// import bcrypt from "bcryptjs";
// import crypto from "crypto";

// export async function POST(req: Request) {
//   try {
//     await connectDB();
//     const { email, resetCode, newPassword } = await req.json();

//     const hashedToken = crypto.createHash("sha256").update(resetCode).digest("hex");

//     const user = await User.findOne({
//       email,
//       resetPasswordToken: hashedToken,
//       resetPasswordExpire: { $gt: Date.now() },
//     });

//     if (!user) {
//       return new Response(JSON.stringify({ message: "Código inválido o expirado" }), { status: 400 });
//     }

//     user.password = await bcrypt.hash(newPassword, 10);
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpire = undefined;
//     await user.save();

//     return new Response(JSON.stringify({ message: "Contraseña restablecida correctamente" }), { status: 200 });
//   } catch (error) {
//     console.error(error);
//     return new Response(JSON.stringify({ message: "Error en el servidor", error }), { status: 500 });
//   }
// }

// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const runtime = "nodejs";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function toMs(exp: unknown): number {
  if (exp instanceof Date) return exp.getTime();
  if (typeof exp === "number") return exp;
  if (typeof exp === "string") {
    const ms = Date.parse(exp);
    return Number.isNaN(ms) ? 0 : ms;
  }
  return 0;
}

export async function POST(req: Request) {
  await connectDB();
  try {
    const { email, resetCode, newPassword } = await req.json();

    const normEmail = String(email || "")
      .trim()
      .toLowerCase();
    const codeRaw = String(resetCode || "").trim();
    const pwd = String(newPassword || "");

    if (!normEmail || !codeRaw || !pwd) {
      return NextResponse.json({ message: "Faltan campos" }, { status: 400 });
    }
    if (pwd.length < 8) {
      return NextResponse.json(
        { message: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    // Acepta código de 6 dígitos o hash (32/64 hex)
    const isHex32 = /^[a-f0-9]{32}$/i.test(codeRaw);
    const isHex64 = /^[a-f0-9]{64}$/i.test(codeRaw);
    const hashedToken =
      isHex32 || isHex64
        ? codeRaw
        : crypto.createHash("sha256").update(codeRaw).digest("hex");

    // 1) Traer usuario por email (case-insensitive) + token
    const user = await User.findOne({
      email: { $regex: `^${escapeRegExp(normEmail)}$`, $options: "i" },
      resetPasswordToken: hashedToken,
    }).select("_id resetPasswordExpire email");

    if (!user) {
      return NextResponse.json(
        { message: "Código inválido o expirado" },
        { status: 400 }
      );
    }

    // 2) Validar expiración robusta
    const expMs = toMs((user as any).resetPasswordExpire);
    if (!expMs || Date.now() >= expMs) {
      return NextResponse.json(
        { message: "Código inválido o expirado" },
        { status: 400 }
      );
    }

    // 3) Update atómico (sin save ni hooks)
    const hashedPwd = await bcrypt.hash(pwd, 12);
    const { modifiedCount } = await User.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPwd },
        $unset: { resetPasswordToken: 1, resetPasswordExpire: 1 },
      }
    );

    if (!modifiedCount) {
      // Muy raro: no se aplicó el update
      return NextResponse.json(
        { message: "No se pudo actualizar la contraseña" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Contraseña restablecida correctamente" },
      { status: 200 }
    );
  } catch (e: any) {

    return NextResponse.json(
      { message: "Error en el servidor" },
      { status: 500 }
    );
  }
}
