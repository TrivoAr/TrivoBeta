// src/app/api/strava/profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import User from "@/models/user";
import { connectDB } from "@/libs/mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const dbUser = await User.findById(session.user.id);
  if (!dbUser?.strava?.accessToken) {
    return NextResponse.json({ error: "No Strava connected" }, { status: 400 });
  }

  const res = await fetch("https://www.strava.com/api/v3/athlete", {
    headers: {
      Authorization: `Bearer ${dbUser.strava.accessToken}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Error fetching from Strava" },
      { status: res.status }
    );
  }

  const athlete = await res.json();

  return NextResponse.json({
    firstname: athlete.firstname,
    lastname: athlete.lastname,
    bio: athlete.bio,
    imagen: athlete.profile, // o profile_medium
    ciudad: athlete.city,
    pais: athlete.country,
    createdAt: athlete.created_at,
    peso: athlete.weight,
  });
}
