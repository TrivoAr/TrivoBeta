import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/user"; // Asegúrate de que la ruta sea correcta
import { getServerSession } from "next-auth"; // Para obtener la sesión del usuario
import { authOptions } from "../../../libs/authOptions"; // Configuración de NextAuth
import { Biohazard } from "lucide-react";

// Obtener el perfil del usuario (GET)
export async function GET(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    return NextResponse.json({ error: "Error al obtener el perfil" }, { status: 500 });
  }
}

// Actualizar el perfil del usuario (PUT)
export async function PUT(req: Request) {
    try {
      await connectDB();
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
  
      const body = await req.json();
      const { firstname, lastname, telnumber, email, instagram, facebook, twitter, bio  } = body; // Eliminar 'rol' de aquí, ya que no quieres que se actualice.
  
      if (!firstname || !lastname || !telnumber || !email) {
        return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
      }
  
      const user = await User.findById(session.user.id);
      if (!user) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }
  
      // Actualiza el perfil, sin modificar 'rol'.
      user.firstname = firstname;
      user.lastname = lastname;
      user.telnumber = telnumber;
      user.email = email;

      user.instagram = instagram;
      user.facebook = facebook;
      user.twitter = twitter;
      user.bio = bio;
  
      // Guarda los cambios en la base de datos
      await user.save();
  
      return NextResponse.json(user, { status: 200 });
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      return NextResponse.json({ error: "Error al actualizar el perfil" }, { status: 500 });
    }
  }
