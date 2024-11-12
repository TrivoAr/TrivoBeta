import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDB();
        const userFound = await User.findOne({
          email: credentials?.email,
        }).select("+password");

        if (!userFound) throw new Error("Invalid credentials");

        const passwordMatch = await bcrypt.compare(
          credentials!.password,
          userFound.password
        );

        if (!passwordMatch) throw new Error("Invalid credentials");

        // Devuelve el usuario con el rol incluido
        return {
          id: userFound._id.toString(),
          email: userFound.email,
          fullname: `${userFound.firstname} ${userFound.lastname}`,
          role: userFound.rol, // Incluimos el rol en el objeto usuario
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user; // Incluye el usuario completo (incluyendo el rol) en el token
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user as any; // Asigna el usuario (con el rol) a la sesión
      return session;
    },
  },
});

export { handler as GET, handler as POST };
