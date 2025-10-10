import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstname: string;
      lastname: string;
      telnumber: string;
      rol: string;
      bio?: string;
      instagram?: string;
      imagen?: string;
      facebook?: string;
      twitter?: string;
      favoritos?: {
        salidas: string[];
        academias: string[];
        teamSocial: string[];
      };
      strava?: {
        access_token: string;
        refresh_token: string;
        expires_at: number;
        athlete_id: number;
      };
      dni?: string;
    } & DefaultSession["user"];
    accessToken?: any; // JWT token para Socket.IO
  }

  interface User extends DefaultUser {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    telnumber: string;
    rol: string;
    bio?: string;
    instagram?: string;
    imagen?: string;
    facebook?: string;
    twitter?: string;
    favoritos?: {
      salidas: string[];
      academias: string[];
      teamSocial: string[];
    };
    strava?: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
      athlete_id: number;
    };
    dni?: string;
  }
}
