import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      fullname: string;
      telnumber: string;
      role: string;
      bio: string;
      instagram?: string;
      imagen?:string;
  facebook?: string;
  twitter?: string; 
    };
  }

  interface User {
    id: string;
    email: string;
    fullname: string;
    telnumber: string;
    role: string;
    bio?: string;
    instagram?: string;
    imagen?: string;
  facebook?: string;
  twitter?: string;
  }
}
