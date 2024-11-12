// app/dashboard/page.tsx
"use client";

import React from 'react';
import { useSession } from 'next-auth/react';

const DashboardPage: React.FC = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Cargando...</p>;
  }

  if (!session) {
    return <p>No estás autenticado. Por favor, inicia sesión.</p>;
  }

  const userRole = session.user?.role;

  // Datos de ejemplo que cambiarían según el rol
  const dataByRole = {
    alumno: {
      grupos: [
        { name: "Running Sport", action: "Entrar", img: "/path/to/image1.png" },
      ],
      eventos: [
        { title: "Entrenamiento SMT", location: "Parque", schedule: "Sáb y Mar - 18 hs" },
      ],
      aventuras: [{ title: "Aventura 1", img: "/path/to/adventure1.png" }],
    },
    profe: {
      grupos: [
        { name: "Entrenamiento Profe", action: "Gestionar", img: "/path/to/image2.png" },
      ],
      eventos: [
        { title: "Clase Avanzada", location: "Gimnasio", schedule: "Lun y Mié - 10 hs" },
      ],
      aventuras: [{ title: "Aventura Profe", img: "/path/to/adventure2.png" }],
    },
    dueño: {
      grupos: [
        { name: "Grupo Privado", action: "Administrar", img: "/path/to/image3.png" },
      ],
      eventos: [
        { title: "Evento Exclusivo", location: "Sede Central", schedule: "Dom - 15 hs" },
      ],
      aventuras: [{ title: "Aventura Dueño", img: "/path/to/adventure3.png" }],
    },
  };

  const roleData = dataByRole[userRole as 'alumno' | 'profe' | 'dueño'];

  // Verificar si roleData es válido
  if (!roleData) {
    return <p>Rol no válido o no encontrado para el usuario.</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src="/path/to/user-icon.png" alt="User" style={{ borderRadius: "50%", width: "50px" }} />
        <div>
          <p>Ubicación</p>
          <p>San Miguel de Tucumán</p>
        </div>
      </div>

      <h2>Mis grupos</h2>
      <div style={{ display: "flex" }}>
        {roleData.grupos.map((grupo, index) => (
          <div key={index} style={{ margin: "10px", textAlign: "center" }}>
            <img src={grupo.img} alt={grupo.name} style={{ width: "100px", borderRadius: "10px" }} />
            <p>{grupo.name}</p>
            <button>{grupo.action}</button>
          </div>
        ))}
      </div>

      <h2>Eventos</h2>
      <div style={{ display: "flex", gap: "10px" }}>
        {roleData.eventos.map((evento, index) => (
          <div key={index} style={{ border: "1px solid #ddd", padding: "10px", borderRadius: "10px", width: "150px" }}>
            <p>{evento.title}</p>
            <p>{evento.schedule}</p>
            <p>{evento.location}</p>
          </div>
        ))}
      </div>

      <h2>Aventuras</h2>
      <div style={{ display: "flex", gap: "10px" }}>
        {roleData.aventuras.map((aventura, index) => (
          <div key={index} style={{ width: "100px", textAlign: "center" }}>
            <img src={aventura.img} alt={aventura.title} style={{ width: "100px", borderRadius: "10px" }} />
            <p>{aventura.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;

