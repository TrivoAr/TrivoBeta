"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") return null;
  if (!session) return null;

  const NavItem = ({ href, icon, label, onClick }) => {
    const isActive = pathname === href;

    const content = (
      <>
        <div className={`${isActive ? "text-orange-500" : "text-gray-500"}`}>{icon}</div>
        <span className={`text-sm mt-1 ${isActive ? "text-orange-400 font-semibold" : "text-gray-500"}`}>
          {label}
        </span>
      </>
    );

    console.log(session.user.role);

    return (
      <li className="flex flex-col items-center justify-center">
        {href ? (
          <Link href={href} className="flex flex-col items-center justify-center">
            {content}
          </Link>
        ) : (
          <button onClick={onClick} className="flex flex-col items-center justify-center focus:outline-none">
            {content}
          </button>
        )}
      </li>
    );
  };

  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-4/5 max-w-sm shadow-lg text-center">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">¿Qué deseas crear?</h2>
            <div className="flex flex-col gap-3">
              <Link
                href="/social/crear"
                onClick={() => setIsModalOpen(false)}
                className=" py-2 rounded-[15px] bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] text-white font-bold shadow-md"
              >
                Salida
              </Link>
              {session.user.role === "dueño de academia" ? (<>
               <Link
                href="/team-social/crear"
                onClick={() => setIsModalOpen(false)}
                className="py-2 rounded-[15px] bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] text-white font-bold shadow-md"
              >
                Social Team
              </Link>
              <Link
                href="/academias/crear"
                onClick={() => setIsModalOpen(false)}
                className="py-2 rounded-[15px] bg-gradient-to-r from-[#C76C01] to-[#FFBD6E] text-white font-bold shadow-md"
              >
                Grupo de entrenamiento
              </Link></>) : null}
           
              <button onClick={() => setIsModalOpen(false)} className="mt-2 text-sm text-gray-500 hover:underline">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 w-full h-[95px] bg-white border-t shadow-md z-50 flex items-center justify-center rounded-tl-[15px] rounded-tr-[15px]">
        <ul className="flex items-center gap-[28px]">
          {/* Inicio */}
          <NavItem
            href="/home"
            label="Inicio"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            }
          />

          {/* Tu tribu */}
          <NavItem
            href="/dashboard"
            label="Tu tribu"
            icon={
              <svg fill="currentColor" height="30" width="30" viewBox="0 0 512 512">
                <polygon points="170.669,512.004 341.335,512.004 256.002,351.194" />
                <path d="M490.669,469.338h-29.483L279.853,106.671l37.909-75.797c5.269-10.539,0.981-23.339-9.557-28.629
                  c-10.539-5.248-23.317-0.981-28.629,9.557L256.002,58.97l-23.573-47.168c-5.291-10.539-18.091-14.805-28.629-9.557
                  c-10.539,5.291-14.827,18.091-9.557,28.629l37.909,75.797L50.818,469.338H21.335c-11.797,0-21.333,9.557-21.333,21.333
                  s9.536,21.333,21.333,21.333h103.381L236.503,290.01c3.435-7.701,11.051-12.672,19.499-12.672
                  c8.448,0,16.064,4.971,19.499,12.672l111.787,221.995h103.381c11.797,0,21.333-9.557,21.333-21.333
                  S502.466,469.338,490.669,469.338z"
                />
              </svg>
            }
          />

          {/* Crear salida */}
          <NavItem
            label="Crear salida"
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path d="M15 12H9M12 9v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
            onClick={() => setIsModalOpen(true)}
          />

          {/* Buscar */}
          <NavItem
            href="/academias"
            label="Buscar"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5
                  4.99L20.49 19l-4.99-5zM4 9.5C4 6.47 6.47 4 9.5 4S15 6.47 15 9.5 12.53 15 9.5 15 4 12.53 4 9.5z"
                />
              </svg>
            }
          />

          {/* Perfil */}
          <NavItem
            href="/dashboard/profile"
            label="Perfil"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            }
          />
        </ul>
      </nav>
    </>
  );
}

export default Navbar;
