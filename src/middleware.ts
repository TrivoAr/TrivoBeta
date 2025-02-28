import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ req, token }) {
      console.log("Token en Middleware:", token); // Ver si existe un token en consola
      return !!token; // Solo permite acceso si hay token
    },
  },
});

export const config = { matcher: ["/about/:path*"] };
