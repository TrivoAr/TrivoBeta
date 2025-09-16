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

    const { id } = params;
    console.log("ID recibido:", id);

    // First, get the salida without any populate to test basic functionality
    console.log("Finding salida by ID (no populate)...");
    const basicSalida = await SalidaSocial.findById(id);

    if (!basicSalida) {
      console.log("Salida social no encontrada");
      return NextResponse.json({ message: "Salida social no encontrada" }, { status: 404 });
    }

    console.log("Basic salida found:", basicSalida.nombre);

    // Now try with populate step by step
    console.log("Finding salida with creador_id populate...");
    const salidaWithCreator = await SalidaSocial.findById(id).populate("creador_id");

    console.log("Salida with creator found:", salidaWithCreator ? "yes" : "no");

    // Try sponsors populate separately
    console.log("Finding salida with sponsors populate...");
    const salidaWithSponsors = await SalidaSocial.findById(id).populate("sponsors");

    console.log("Salida with sponsors found:", salidaWithSponsors ? "yes" : "no");
    console.log("Sponsors data:", salidaWithSponsors?.sponsors);

    // Now try with all populates together
    console.log("Finding salida with all populates...");
    const salida = await SalidaSocial.findById(id)
      .populate("creador_id")
      .populate("profesorId")
      .populate("sponsors");

    console.log("Salida with both populates found:", salida ? salida.nombre : "not found");

    // Convert to plain object
    const salidaObj = salida.toObject();

    // Get profile image with timeout
    let imagenUrl;
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Image fetch timeout')), 3000)
      );

      imagenUrl = await Promise.race([
        getProfileImage("profile-image.jpg", salida.creador_id._id.toString()),
        timeoutPromise
      ]);
    } catch (error) {
      console.log("[GET_SALIDA] Image fetch failed for creator:", salida.creador_id._id, error.message || "unknown error");
      imagenUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            salida.creador_id.firstname
          )}&length=1&background=random&color=fff&size=128`;
    }

    // Update creator info
    salidaObj.creador_id = {
      _id: salida.creador_id._id,
      firstname: salida.creador_id.firstname,
      lastname: salida.creador_id.lastname,
      email: salida.creador_id.email,
      imagen: imagenUrl,
    };

    // Update professor info if exists
    if (salida.profesorId) {
      let profesorImagenUrl;
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Image fetch timeout')), 3000)
        );

        profesorImagenUrl = await Promise.race([
          getProfileImage("profile-image.jpg", salida.profesorId._id.toString()),
          timeoutPromise
        ]);
      } catch (error) {
        console.log("[GET_SALIDA] Image fetch failed for professor:", salida.profesorId._id, error.message || "unknown error");
        profesorImagenUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
              salida.profesorId.firstname
            )}&length=1&background=random&color=fff&size=128`;
      }

      salidaObj.profesorId = {
        _id: salida.profesorId._id,
        firstname: salida.profesorId.firstname,
        lastname: salida.profesorId.lastname,
        imagen: profesorImagenUrl,
        bio: salida.profesorId.bio,
        telnumber: salida.profesorId.telnumber,
        rol: salida.profesorId.rol,
      };
    }

    console.log("Salida social encontrada y preparada:", salidaObj.nombre);

    return NextResponse.json(salidaObj, { status: 200 });

  } catch (error) {
    console.error("[GET_SALIDA_BY_ID] Error:", error);
    return NextResponse.json({ message: "Server Error", error: error.message }, { status: 500 });
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