"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { getProfileImage } from "@/app/api/profile/getProfileImage"; 


const TopContainer = () => {
  const { data: session, status } = useSession();
  const horaActual = new Date().getHours();
  const [formData, setFormData] = useState({
    fullname: session?.user.fullname || "",
    email: session?.user.email || "",
  });
  const [profileImage, setProfileImage] = useState(null); 

  useEffect(() => {
    if (session?.user) {
      setFormData({
        fullname: session.user.fullname || "",
        email: session.user.email || "",
      });

      // Intentar obtener la imagen del perfil
      const loadProfileImage = async () => {
        try {
          const imageUrl = await getProfileImage("profile-image.jpg", session.user.id);
          setProfileImage(imageUrl);
        } catch (error) {
          console.error("Error al obtener la imagen del perfil:", error);
          // Puedes agregar una imagen predeterminada en caso de error
          setProfileImage("https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg");
        }
      };

      loadProfileImage();
    }
  }, [session]);

  let saludo;
  if (horaActual >= 6 && horaActual < 12) {
    saludo = "Buen día";
  } else if (horaActual >= 12 && horaActual < 20) {
    saludo = "Buenas tardes";
  } else {
    saludo = "Buenas noches";
  }

  if (status === "loading") {
    return <p>Cargando...</p>;
  }

  return (
    <div className="containerTop m-1 bg-[#E5E5E5] h-[90px] w-[380px] flex justify-around items-center rounded-[30px] border shadow-xl">
      <div className="w-[30%] h-[100%] flex justify-center items-center">
        <img
          className="h-[75px] w-[75px] rounded-full"
          src={profileImage || "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg"} // Usa la imagen del perfil
          alt="User Profile"
        />
      </div>
      <div className="flex flex-col items-center mr-[5%]">
        <p className="text-slate-500 text-[12px]">{saludo}</p>
        <p className="flex font-normal text-sm">{session?.user?.fullname || "Usuario no identificado"}</p>
      </div>
      <div className="rounded-full border border-[#999999] shadow-xl h-[40px] w-[40px] flex justify-center items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="25px"
          viewBox="0 0 24 24"
          width="25px"
          fill="#999"
        >
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
      </div>
    </div>
  );
};

export default TopContainer;
