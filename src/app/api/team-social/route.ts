import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { connectDB } from "@/libs/mongodb";
import TeamSocial from "@/models/teamSocial";
import Bares from "@/models/bares";
import User from "@/models/user";

export async function POST(req: Request) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  try {
    const nuevoTeam = await TeamSocial.create({
      ...body,
      creadorId: session.user.id,
    });

    return NextResponse.json(nuevoTeam, { status: 201 });
  } catch (error) {
    console.error("Error al crear el team social:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // const session = await getServerSession(authOptions);
    // if (!session?.user?.email) {
    //   return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    // }

    // const user = await User.findOne({ email: session.user.email });
    // if (!user) {
    //   return NextResponse.json({ message: "User not found" }, { status: 404 });
    // }

    
    const teams = await TeamSocial.find();

    return NextResponse.json(teams, { status: 200 });
  } catch (error) {
    console.error("[GET_TEAM_SOCIAL]", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
