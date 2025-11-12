import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { trackEventServer, setUserPropertiesServer } from "@/libs/mixpanel.server";

export async function POST(request: Request) {
  try {
    await connectDB();

    // Desestructuración de los datos que llegan del frontend
    const { email, password, firstname, lastname, rol, telnumber } =
      await request.json();

    // Validación de la contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Verificar si el correo ya existe
    const userFound = await User.findOne({ email });

    if (userFound) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 }
      );
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstname)}&length=1&background=random&color=fff&size=128`;

    // Crear el nuevo usuario
    const user = new User({
      email,
      password: hashedPassword,
      firstname,
      lastname,
      imagen: avatarUrl,
      rol,
    });

    // Guardar el usuario en la base de datos
    const savedUser = await user.save();

    // Trackear signup en Mixpanel
    try {
      await trackEventServer({
        event: "User Signup",
        distinctId: savedUser._id.toString(),
        properties: {
          distinct_id: savedUser._id.toString(),
          method: "credentials",
          email: savedUser.email,
          firstname: savedUser.firstname,
          lastname: savedUser.lastname,
          rol: savedUser.rol,
          timestamp: new Date().toISOString(),
        },
      });

      // Establecer propiedades iniciales del usuario
      await setUserPropertiesServer(savedUser._id.toString(), {
        $email: savedUser.email,
        $name: `${savedUser.firstname} ${savedUser.lastname}`.trim(),
        firstname: savedUser.firstname,
        lastname: savedUser.lastname,
        rol: savedUser.rol,
        $avatar: savedUser.imagen,
        first_seen: savedUser.createdAt.toISOString(),
      });
    } catch (mixpanelError) {
      console.error("Error tracking signup in Mixpanel:", mixpanelError);
      // No fallar el signup si Mixpanel falla
    }

    // Retornar una respuesta con los datos del usuario
    return NextResponse.json(
      {
        email,
        firstname: firstname,
        lastname: lastname,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
      },
      { status: 201 }
    );
  } catch (error) {
    // Manejo de errores de validación de mongoose
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        {
          message: error.message,
        },
        {
          status: 400,
        }
      );
    }
    // Respuesta genérica en caso de otro tipo de error
    return NextResponse.error();
  }
}
