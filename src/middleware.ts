export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/", "/:path*"], // Esto protege solo la raíz y todas las demás rutas, excepto /dashboard
};
