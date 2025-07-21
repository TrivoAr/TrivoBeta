import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";
import crypto from "crypto";
import {sendEmail} from "@/libs/sendEmail";
import { resetPasswordTemplate } from "@/libs/resetPasswordTemplate";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ message: "El email es requerido" }), { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return new Response(JSON.stringify({ message: "No existe un usuario con ese correo" }), { status: 404 });
    }

    // Generar código de recuperación
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutos
    await user.save();

    // Enviar correo
    await sendEmail({
      to: user.email,
      subject: "Código de recuperación de contraseña",
      html: resetPasswordTemplate(resetToken),
    });

    return new Response(JSON.stringify({ message: "Código enviado" }), { status: 200 });
  } catch (error) {
    console.error("Error enviando correo:", error);
    return new Response(JSON.stringify({ message: "Error en el servidor" }), { status: 500 });
  }
}
