import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/user";

export const authOptions: AuthOptions = {
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

        if (userFound.fromOAuth) {
          throw new Error("Este usuario solo puede iniciar sesión con Google");
        }

        const passwordMatch = await bcrypt.compare(
          credentials!.password,
          userFound.password
        );

        if (!passwordMatch) throw new Error("Credenciales inválidas");

        if (!userFound.imagen) {
          const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            userFound.firstname || "U"
          )}&length=1&background=random&color=fff&size=128`;
          userFound.imagen = avatarUrl;
          await userFound.save();
        }

        return {
          id: userFound._id.toString(),
          email: userFound.email,
          firstname: userFound.firstname,
          lastname: userFound.lastname,
          telnumber: userFound.telnumber,
          rol: userFound.rol,
          imagen: userFound.imagen,
          instagram: userFound.instagram,
          facebook: userFound.facebook,
          twitter: userFound.twitter,
          bio: userFound.bio,
          favoritos: userFound.favoritos,
          strava: userFound.strava,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 10 * 60,
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB();
        let existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          const [firstname, ...lastnameParts] = user.name?.trim().split(" ") || ["", ""];
          const lastname = lastnameParts.join(" ");

          const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            firstname || "U"
          )}&length=1&background=random&color=fff&size=128`;

          existingUser = new User({
            email: user.email,
            firstname,
            lastname,
            rol: "alumno",
            imagen: avatarUrl,
            fromOAuth: true,
          });

          await existingUser.save();
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email });
        
        if (dbUser) {
          token.user = {
            id: dbUser._id.toString(),
            email: dbUser.email,
            firstname: dbUser.firstname, 
            lastname: dbUser.lastname,
            rol: dbUser.rol,
            imagen: dbUser.imagen,
            instagram: dbUser.instagram,
            facebook: dbUser.facebook,
            twitter: dbUser.twitter,
            bio: dbUser.bio,
            favoritos: dbUser.favoritos,
            strava: dbUser.strava,
          };
        } else {
          token.user = user;
        }
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