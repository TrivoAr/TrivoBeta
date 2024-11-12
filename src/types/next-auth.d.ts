import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      fullname: string;
      role: string; // Aquí incluimos el rol
    };
  }

  interface User {
    id: string;
    email: string;
    fullname: string;
    role: string;
  }
}
