import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import SalidaSocial from "@/models/salidaSocial";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import User from "@/models/user";
import Sponsors from "@/models/sponsors";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("API GET /social/[id] called with ID:", params.id);

  try {
    console.log("Conectando a DB...");
    await connectDB();
    console.log("DB conectada");

    // Ensure models are registered by accessing them
    console.log("Ensuring models are registered...");
    console.log("User model:", User.modelName);
    console.log("Sponsors model:", Sponsors.modelName);

    const session = await getServerSession(authOptions);
    // if (!session || !session.user?.email) {
    //   console.log("No autorizado");
    //   return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    // }

    // console.log("Usuario de sesión:", session.user.email);

    // const user = await User.findOne({ email: session.user.email });
    // if (!user) {
    //   console.log("Usuario no encontrado");
    //   return NextResponse.json({ message: "User not found" }, { status: 404 });
    // }

    const { id } = params;
    console.log("ID recibido:", id);

    // Busca la salida paso a paso para evitar problemas de populate
    console.log("Finding salida by ID...");
    const salida = await SalidaSocial.findById(id)
      .populate("creador_id")
      .populate("sponsors");

    console.log("Salida found:", salida ? salida.nombre : "not found");
    if (!salida) {
      console.log("Salida social no encontrada");
      return NextResponse.json(
        { message: "Salida social no encontrada" },
        { status: 404 }
      );
    }

    // Convierte el documento a objeto plano
    const salidaObj = salida.toObject();

    let imagenUrl;
    try {
      imagenUrl = await getProfileImage(
        "profile-image.jpg",
        salida.creador_id._id.toString()
      );
    } catch (error) {
      imagenUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        salida.creador_id.firstname
      )}&length=1&background=random&color=fff&size=128`;
    }

    // Reemplaza el creador_id con el objeto que quieres devolver
    salidaObj.creador_id = {
      _id: salida.creador_id._id,
      firstname: salida.creador_id.firstname,
      lastname: salida.creador_id.lastname,
      email: salida.creador_id.email,
      imagen: imagenUrl,
    };

    console.log("Salida social encontrada y preparada:", salidaObj);

    // Ahora sí, devuelves la respuesta correctamente
    return NextResponse.json(salidaObj, { status: 200 });
  } catch (error) {
    console.error("[GET_SALIDA_BY_ID]", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const salida = await SalidaSocial.findById(params.id);
  if (!salida) {
    return NextResponse.json(
      { message: "Salida no encontrada" },
      { status: 404 }
    );
  }

  if (salida.creador_id.toString() !== session.user.id) {
    return NextResponse.json(
      { message: "No tienes permiso para editar" },
      { status: 403 }
    );
  }

  const data = await req.json();

  try {
    const actualizada = await SalidaSocial.findByIdAndUpdate(params.id, data, {
      new: true,
    });
    return NextResponse.json(actualizada, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error al actualizar" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const salida = await SalidaSocial.findById(params.id);
  if (!salida) {
    return NextResponse.json(
      { message: "Salida no encontrada" },
      { status: 404 }
    );
  }

  if (salida.creador_id.toString() !== session.user.id) {
    return NextResponse.json(
      { message: "No tienes permiso para eliminar" },
      { status: 403 }
    );
  }

  try {
    await SalidaSocial.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Salida eliminada" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error al eliminar" }, { status: 500 });
  }
}
