import { getStravaRoutes } from "@/libs/stravaHelpers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ error: "userId es requerido" }), {
      status: 400,
    });
  }

  try {
    const routes = await getStravaRoutes(userId);
    return new Response(JSON.stringify(routes), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
