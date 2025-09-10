import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers";
import type { User } from "next-auth";

interface StravaProfile {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  profile: string;
}

// 

export default function StravaProvider<P extends StravaProfile>(
  options: OAuthUserConfig<P>
): OAuthConfig<P> {
  return {
    id: "strava",
    name: "Strava",
    type: "oauth",
    authorization: {
      url: "https://www.strava.com/oauth/authorize",
      params: { scope: "read,activity:read_all", approval_prompt: "force", response_type: "code" },
    },
    token: {
      url: "https://www.strava.com/oauth/token",
    },
    userinfo: {
      url: "https://www.strava.com/api/v3/athlete",
    },

    

    profile(profile: P): User {
      return {
        id: profile.id.toString(),
        email: profile.email,
        firstname: profile.firstname,
        lastname: profile.lastname,
        telnumber: "",
        rol: "alumno",
        bio: "",
        instagram: "",
        imagen: profile.profile || "",
        facebook: "",
        twitter: "",
        favoritos: {
          salidas: [],
          academias: [],
          teamSocial: [],
        },
        name: `${profile.firstname} ${profile.lastname}`, // para compatibilidad con DefaultUser
      };
      
    },
    ...options,
    

  };

   



}




