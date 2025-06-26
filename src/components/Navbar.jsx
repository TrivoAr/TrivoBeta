"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from 'react';

function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const rol = session?.user?.role;

  if (status === "loading") return null;
  if (!session) return null;

  const NavItem = (props) => {
    const { href, icon, label } = props;
    const isActive = pathname === href;
    return (
      <li className="flex flex-col items-center justify-center">
        <Link href={href} className="flex flex-col items-center justify-center">
          <div className={`${isActive ? "text-black" : "text-gray-500"}`}>{icon}</div>
          <span className={`text-sm mt-1 ${isActive ? "text-black font-medium" : "text-gray-500"}`}>
            {label}
          </span>
        </Link>
      </li>
    );
  };
  
  return (
    <nav className="fixed bottom-0 left-0 w-full h-[91px] bg-white border-t shadow-md z-50 flex items-center justify-center rounded-tl-[15px] rounded-tr-[15px]">
      <ul className="flex items-center gap-[60px]">
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
        {rol === "dueño de academia" && (
        <NavItem
          href="/dashboard"
          label="Grupos"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 0 24 24" fill="currentColor">
              <path d="M0 0h24v24H0z" fill="none" />
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          }
        />)}
        <NavItem
          href="/academias"
          label="Buscar"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 0 24 24" fill="currentColor">
              <path d="M0 0h24v24H0z" fill="none" />
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM4 9.5C4 6.47 6.47 4 9.5 4S15 6.47 15 9.5 12.53 15 9.5 15 4 12.53 4 9.5z" />
            </svg>
          }
        />
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
  );
}

export default Navbar;