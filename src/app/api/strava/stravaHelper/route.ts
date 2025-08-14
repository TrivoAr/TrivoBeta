import axios from "axios";
import User from "@/models/user";
import { connectDB } from "@/libs/mongodb";

async function refreshStravaToken(user) {
  const now = Math.floor(Date.now() / 1000);

  if (user.strava.expires_at > now) {
    return user.strava.access_token;
  }

  try {
    const { data } = await axios.post("https://www.strava.com/oauth/token", null, {
      params: {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: user.strava.refresh_token,
      },
    });

    user.strava.access_token = data.access_token;
    user.strava.refresh_token = data.refresh_token;
    user.strava.expires_at = data.expires_at;
    await user.save();

    return data.access_token;
  } catch (error: any) {
    console.error("Error al refrescar token de Strava:", error.response?.data || error.message);
    throw new Error("No se pudo refrescar el token de Strava");
  }
}

export async function getStravaActivities(userId: string) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user || !user.strava) throw new Error("Usuario o datos de Strava no encontrados");

  const accessToken = await refreshStravaToken(user);

  try {
    const { data } = await axios.get("https://www.strava.com/api/v3/athlete/activities", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { per_page: 30 },
    });

    return data;
  } catch (error: any) {
    console.error("Error obteniendo actividades de Strava:", error.response?.data || error.message);
    throw new Error("No se pudieron obtener las actividades de Strava");
  }
}

