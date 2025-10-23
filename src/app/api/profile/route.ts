import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";
import Academia from "@/models/academia";
import TeamSocial from "@/models/teamSocial";
import SalidaSocial from "@/models/salidaSocial";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../libs/authOptions";

// Obtener el perfil del usuario (GET)
export async function GET(req: Request) {
  try {
    await connectDB();

    // Forzar el registro de los modelos antes del populate
    TeamSocial;
    SalidaSocial;
    Academia;

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await User.findById(session.user.id)
      .populate("favoritos.salidas")
      .populate("favoritos.academias")
      .populate("favoritos.teamSocial");

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener el perfil" },
      { status: 500 }
    );
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
    const {
      firstname,
      lastname,
      telnumber,
      email,
      instagram,
      facebook,
      twitter,
      bio,
      dni,
    } = body;

    // Validación detallada de campos requeridos
    const missingFields = [];
    if (!firstname?.trim()) missingFields.push("nombre");
    if (!lastname?.trim()) missingFields.push("apellido");
    if (!telnumber?.trim()) missingFields.push("teléfono");
    if (!email?.trim()) missingFields.push("email");

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Datos incompletos",
          details: `Faltan los siguientes campos: ${missingFields.join(", ")}`,
          missingFields,
        },
        { status: 400 }
      );
    }

    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: "Email inválido",
          details: "El formato del email no es válido",
        },
        { status: 400 }
      );
    }

    // Validación de formato de teléfono (debe tener al menos 10 dígitos)
    const phoneDigits = telnumber.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        {
          error: "Teléfono inválido",
          details: "El teléfono debe tener al menos 10 dígitos",
        },
        { status: 400 }
      );
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Actualiza el perfil, sin modificar 'rol'.
    user.firstname = firstname.trim();
    user.lastname = lastname.trim();
    user.telnumber = telnumber.trim();
    user.email = email.trim().toLowerCase();
    user.dni = dni?.trim() || user.dni;

    user.instagram = instagram?.trim() || "";
    user.facebook = facebook?.trim() || "";
    user.twitter = twitter?.trim() || "";
    user.bio = bio?.trim() || "";

    // Guarda los cambios en la base de datos
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Perfil actualizado correctamente",
        user,
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Log detallado del error para debugging
    const errorDetails = {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };

    // Manejo de errores específicos de MongoDB
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors || {}).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        {
          error: "Error de validación",
          details: validationErrors.join(", "),
        },
        { status: 400 }
      );
    }

    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern || {})[0];
      return NextResponse.json(
        {
          error: "Valor duplicado",
          details: `El ${field} ya está en uso por otro usuario`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Error al actualizar el perfil",
        details:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Ocurrió un error inesperado. Por favor, intenta nuevamente.",
        ...(process.env.NODE_ENV === "development" && { debug: errorDetails }),
      },
      { status: 500 }
    );
  }
}
