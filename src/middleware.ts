import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Si el usuario está autenticado y trata de acceder a login, register o reset-password
    if (
      token &&
      (pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/reset-password")
    ) {
      return NextResponse.redirect(new URL("/home", req.url));
    }

    // Permitir el acceso
    return NextResponse.next();
  },
  {
    callbacks: {
      // Permitir acceso a todos (tanto autenticados como no autenticados)
      // La lógica de redirección se maneja en la función middleware de arriba
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    "/login",
    "/register",
    "/reset-password",
    "/home/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/social/:path*",
    "/team-social/:path*",
    "/academias/:path*",
  ],
};
