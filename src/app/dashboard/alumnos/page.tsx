"use client";
import { getSession } from "next-auth/react";
import { GetServerSidePropsContext } from "next";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  // Solo permitir acceso si el usuario tiene rol "alumno"
  if (!session || session.user.role !== "alumno") {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return { props: { session } };
}

export default function AlumnoDashboard() {
  return <div>Bienvenido al Dashboard de Alumnos</div>;
}
