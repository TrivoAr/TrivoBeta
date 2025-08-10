// src/lib/authOptions.ts
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";

export const authOptions: AuthOptions = {
  // Asegura que authOptions tenga el tipo AuthOptions
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "tu-email@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDB();
        const userFound = await User.findOne({
          email: credentials?.email,
        }).select("+password");

        if (!userFound) throw new Error("Credenciales inválidas");

        const passwordMatch = await bcrypt.compare(
          credentials!.password,
          userFound.password
        );

        if (!userFound.imagen) {
          const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            userFound.firstname
          )}&length=1&background=random&color=fff&size=128`;
          userFound.imagen = avatarUrl;
          await userFound.save();
        }

        if (!passwordMatch) throw new Error("Credenciales inválidas");

        return {
          id: userFound._id.toString(),
          email: userFound.email,
          fullname: `${userFound.firstname} ${userFound.lastname}`,
          telnumber: userFound.telnumber,
          role: userFound.rol,
          imagen: userFound.imagen,
          instagram: userFound.instagram,
          facebook: userFound.facebook,
          twitter: userFound.twitter,
          bio: userFound.bio,
          favoritos: userFound.favoritos,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    /*maxAge: 10 * 60, // La sesión expira en 1 hora (en segundos)*/
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user as any;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
