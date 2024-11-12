"use client";
import { getSession } from "next-auth/react";
import { GetServerSidePropsContext } from "next";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  // Solo permitir acceso si el usuario tiene rol "profe" o "dueño"
  if (!session || (session.user.role !== "profe" && session.user.role !== "dueño")) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return { props: { session } };
}

export default function ProfeDashboard() {
  return <div>Bienvenido al Dashboard de Profesores</div>;
}

