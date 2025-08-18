import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import User from "@/models/user";
import { connectDB } from "@/libs/mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ connected: false }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id);
//   if (!user || !user.strava?.accessToken) return NextResponse.json({ connected: false });
if (!user || !user.strava?.access_token) return NextResponse.json({ connected: false });


  return NextResponse.json({ connected: true });
}
