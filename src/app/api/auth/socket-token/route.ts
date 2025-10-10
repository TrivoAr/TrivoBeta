import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Generar un token JWT para Socket.IO
    const socketToken = jwt.sign(
      {
        sub: session.user.id,
        email: session.user.email,
        firstname: session.user.firstname,
        lastname: session.user.lastname,
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "1h" } // Token válido por 1 hora
    );

    return NextResponse.json({ token: socketToken });
  } catch (error) {
    console.error("[SOCKET_TOKEN] Error generando token:", error);
    return NextResponse.json(
      { error: "Error generando token" },
      { status: 500 }
    );
  }
}
