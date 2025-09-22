import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";

export async function GET(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    let usuarios;

    if (query) {
      const searchRegex = new RegExp(query, "i");
      usuarios = await User.find({
        $or: [
          { firstname: searchRegex },
          { lastname: searchRegex },
          { email: searchRegex }
        ]
      }).select("firstname lastname email rol").limit(20);
    } else {
      usuarios = await User.find()
        .select("firstname lastname email rol")
        .limit(20);
    }

    return NextResponse.json(usuarios, { status: 200 });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}