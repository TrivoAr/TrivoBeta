// import axios from "axios";
// import User from "@/models/user";
// import { connectDB } from "@/libs/mongodb";

// async function refreshStravaToken(user) {
//   const now = Math.floor(Date.now() / 1000);

//   if (user.strava.expires_at > now) {
//     return user.strava.access_token;
//   }

//   try {
//     const { data } = await axios.post("https://www.strava.com/oauth/token", null, {
//       params: {
//         client_id: process.env.STRAVA_CLIENT_ID,
//         client_secret: process.env.STRAVA_CLIENT_SECRET,
//         grant_type: "refresh_token",
//         refresh_token: user.strava.refresh_token,
//       },
//     });

//     user.strava.access_token = data.access_token;
//     user.strava.refresh_token = data.refresh_token;
//     user.strava.expires_at = data.expires_at;
//     await user.save();

//     return data.access_token;
//   } catch (error: any) {
//     console.error("Error al refrescar token de Strava:", error.response?.data || error.message);
//     throw new Error("No se pudo refrescar el token de Strava");
//   }
// }

// export async function getStravaActivities(userId: string) {
//   await connectDB();

//   const user = await User.findById(userId);
//   if (!user || !user.strava) throw new Error("Usuario o datos de Strava no encontrados");

//   const accessToken = await refreshStravaToken(user);

//   try {
//     const { data } = await axios.get("https://www.strava.com/api/v3/athlete/activities", {
//       headers: { Authorization: `Bearer ${accessToken}` },
//       params: { per_page: 30 },
//     });

//     return data;
//   } catch (error: any) {
//     console.error("Error obteniendo actividades de Strava:", error.response?.data || error.message);
//     throw new Error("No se pudieron obtener las actividades de Strava");
//   }
// }

import User from "@/models/user";
import { connectDB } from "@/libs/mongodb";

// Esta función ya la usás para activities
async function refreshStravaToken(user: any) {
  if (Date.now() / 1000 < user.strava.expires_at) {
    return user.strava.access_token;
  }

  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: user.strava.refresh_token,
    }),
  });

  const data = await res.json();
  user.strava.access_token = data.access_token;
  user.strava.refresh_token = data.refresh_token;
  user.strava.expires_at = data.expires_at;
  await user.save();

  return data.access_token;
}

// 🔥 Nuevo: obtener rutas
export async function getStravaRoutes(userId: string) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user || !user.strava) {
    throw new Error("Usuario no vinculado a Strava");
  }

  const accessToken = await refreshStravaToken(user);

  const res = await fetch("https://www.strava.com/api/v3/athlete/routes", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Error al obtener rutas: ${res.statusText}`);
  }

  return res.json();
}


export async function getStravaActivities(userId: string) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user || !user.strava) throw new Error("Usuario no vinculado a Strava");

  const accessToken = await refreshStravaToken(user);

  // traer actividades recientes
  const res = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=10", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Error al obtener actividades: ${res.statusText}`);
  }

  const activities = await res.json();

  // enriquecer cada actividad con su polyline detallado
  const detailed = await Promise.all(
    activities.map(async (a: any) => {
      const detailRes = await fetch(`https://www.strava.com/api/v3/activities/${a.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });


      
      const detail = await detailRes.json();

      return {
        id: a.id,
        name: a.name,
        distance: a.distance,
        moving_time: a.moving_time,
        average_speed: a.average_speed,
        sport_type: a.sport_type,
        start_date: a.start_date,
        map: detail.map, // contiene summary_polyline y polyline
      };
    })
  );

  return detailed;
}

