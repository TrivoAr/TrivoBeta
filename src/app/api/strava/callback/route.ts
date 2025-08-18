// import { NextResponse } from "next/server";
// import axios from "axios";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/libs/authOptions";
// import User from "@/models/user";
// import { connectDB } from "@/libs/mongodb";

// export async function GET(req: Request) {
//   const url = new URL(req.url);
//   const code = url.searchParams.get("code");

//   if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

//   await connectDB();

//   let tokenResponse;
//   try {
//     tokenResponse = await axios.post("https://www.strava.com/oauth/token", null, {
//       params: {
//         client_id: process.env.STRAVA_CLIENT_ID,
//         client_secret: process.env.STRAVA_CLIENT_SECRET,
//         code,
//         grant_type: "authorization_code",
//       },
//     });
//   } catch (error: any) {
//     console.error("Error al intercambiar token con Strava:", error.response?.data || error.message);
//     return NextResponse.json({ error: "No se pudo conectar con Strava" }, { status: 500 });
//   }

//   const { access_token, refresh_token, expires_at, athlete } = tokenResponse.data;

//   const session = await getServerSession(authOptions);
//   if (!session?.user?.email) return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });

//   const user = await User.findById(session.user.email);
//   if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
//   console.log("Usuario ya tiene Strava conectado:", user.strava);

//   user.strava = {
//     access_token,
//     refresh_token,
//     expires_at,
//     athlete_id: athlete.id,
//   };

//   await user.save();

//   return NextResponse.redirect("http://localhost:3000/home");
// }

// pages/api/strava/callback.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import User from "@/models/user";
import { connectDB } from "@/libs/mongodb";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

  await connectDB();

  let tokenResponse;
  try {
    tokenResponse = await axios.post("https://www.strava.com/oauth/token", null, {
      params: {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      },
    });
  } catch (error: any) {
    console.error("Error al intercambiar token con Strava:", error.response?.data || error.message);
    return NextResponse.json({ error: "No se pudo conectar con Strava" }, { status: 500 });
  }

  const { access_token, refresh_token, expires_at, athlete } = tokenResponse.data;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });

  // Busca al usuario por email en vez de por id
  const user = await User.findOne({ email: session.user.email });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // Actualiza el subdocumento Strava
  user.strava = {
    access_token,
    refresh_token,
    expires_at,
    athlete_id: athlete.id,
  };

  await user.save();

  return NextResponse.redirect("http://localhost:3000/home");
}


