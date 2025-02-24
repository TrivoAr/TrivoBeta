import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email } = await req.json();

    const user = await User.findOne({ email });
    if (!user) return new Response(JSON.stringify({ message: "Usuario no encontrado" }), { status: 400 });

    // Generar un código aleatorio (Ejemplo: 6 dígitos)
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const resetCodeExpire = Date.now() + 3600000; // 1 hora de validez

    user.resetPasswordToken = resetCode;
    user.resetPasswordExpire = resetCodeExpire;
    await user.save();

    return new Response(JSON.stringify({ resetCode, message: "Código generado. Envíalo manualmente al usuario." }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Error en el servidor", error }), { status: 500 });
  }
}
