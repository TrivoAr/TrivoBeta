// src/app/api/strava/activities/route.ts
import { getStravaActivities } from "@/libs/stravaHelpers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ error: "userId es requerido" }), {
      status: 400,
    });
  }

  try {
    const activities = await getStravaActivities(userId);
    return new Response(JSON.stringify(activities), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

// src/app/api/strava/activities/route.ts
// import { getStravaActivities } from "../stravaHelper/route";
// import StravaActivity from "@/models/activitiesStrava";
// import { connectDB } from "@/libs/mongodb";

// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const userId = searchParams.get("userId");

//   if (!userId) {
//     return new Response(JSON.stringify({ error: "userId es requerido" }), { status: 400 });
//   }

//   try {
//     await connectDB();

//     // 1. traer desde Strava API
//     const activitiesFromStrava = await getStravaActivities(userId);

//     // 2. guardar/actualizar en Mongo
//     const activities = await Promise.all(
//       activitiesFromStrava.map((act: any) =>
//         StravaActivity.findOneAndUpdate(
//           { id: act.id }, // buscamos por id de Strava
//           {
//             id: act.id,
//             name: act.name,
//             distance: act.distance,
//             moving_time: act.moving_time,
//             average_speed: act.average_speed,
//             sport_type: act.sport_type,
//             start_date: act.start_date,
//             map: act.map,
//           },
//           { upsert: true, new: true }
//         )
//       )
//     );

//     // 3. devolver los docs de Mongo (con `_id`)
//     return new Response(JSON.stringify(activities), { status: 200 });
//   } catch (err: any) {
//     console.error("Error guardando actividades de Strava:", err);
//     return new Response(JSON.stringify({ error: err.message }), { status: 500 });
//   }
// }
