import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import TeamSocial from "@/models/teamSocial";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import User from "@/models/user";




export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();

  try {
    const team = await TeamSocial.findById(params.id)
      .populate("creadorId", "firstname lastname imagen")
      .populate("bar", "name direccion logo imagenesCarrusel")
      .populate("sponsors", "name imagen");
      
         const salidaObj = team.toObject();
      
          let imagenUrl;
          try {
            imagenUrl = await getProfileImage("profile-image.jpg", team.creadorId._id .toString());
          } catch (error) {
            imagenUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            team.creadorId.firstname
          )}&length=1&background=random&color=fff&size=128`;
          }
      
          // Reemplaza el creador_id con el objeto que quieres devolver
          salidaObj.creadorId = {
            _id: team.creadorId._id,
            firstname: team.creadorId.firstname,
            lastname: team.creadorId.lastname,
            email: team.creadorId.email,
            imagen: imagenUrl,
          };
      
      
      
      
      
      
      
      
      // 👈 Trae solo estos dos campos

    if (!team) {
      return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json(salidaObj, { status: 200 });
  } catch (error) {
    console.error("Error al buscar TeamSocial:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}



export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const salida = await TeamSocial.findById(params.id);
  if (!salida) {
    return NextResponse.json({ message: "Salida no encontrada" }, { status: 404 });
  }

  if (salida.creadorId.toString() !== session.user.id) {
    return NextResponse.json({ message: "No tienes permiso para editar" }, { status: 403 });
  }

  const data = await req.json();

  try {
    const actualizada = await TeamSocial.findByIdAndUpdate(params.id, data, { new: true });
    return NextResponse.json(actualizada, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error al actualizar" }, { status: 500 });
  }
}





export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const salida = await TeamSocial.findById(params.id);
  if (!salida) {
    return NextResponse.json({ message: "Salida no encontrada" }, { status: 404 });
  }

  if (salida.creadorId.toString() !== session.user.id) {
    return NextResponse.json({ message: "No tienes permiso para eliminar" }, { status: 403 });
  }

  try {
    await TeamSocial.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Salida eliminada" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error al eliminar" }, { status: 500 });
  }
}