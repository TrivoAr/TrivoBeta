// pages/api/strava/connect.ts
import { NextResponse } from "next/server";

export async function GET() {   // <- IMPORTANTE: debe ser GET
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URI;

  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=read,activity:read_all`;

  return NextResponse.redirect(stravaAuthUrl);
}
