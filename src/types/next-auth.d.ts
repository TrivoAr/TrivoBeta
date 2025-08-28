import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstname: string;
      lastname: string;
      telnumber: string;
      role: string;
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
    };
  }

  interface User {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    telnumber: string;
    role: string;
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


