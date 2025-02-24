import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, resetCode, newPassword } = await req.json();

    const user = await User.findOne({
      email,
      resetPasswordToken: resetCode,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return new Response(JSON.stringify({ message: "Código inválido o expirado" }), { status: 400 });

    // Hashear la nueva contraseña
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return new Response(JSON.stringify({ message: "Contraseña restablecida correctamente" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: "Error en el servidor", error }), { status: 500 });
  }
}
