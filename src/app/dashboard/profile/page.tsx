"use client";
import { useSession, signOut } from "next-auth/react";

function ProfilePage() {
  const { data: session, status } = useSession();


  const horaActual = new Date().getHours();


  let saludo;
  if (horaActual >= 6 && horaActual < 12) {
    saludo = "Buen día";
  } else if (horaActual >= 12 && horaActual < 20) {
    saludo = "Buenas tardes";
  } else {
    saludo = "Buenas noches";
  }

  console.log(session);

  return (
    <div className="flex flex-col justify-between items-center gap-10">
      <div className="containerTop bg-[#E5E5E5] w-[351px] h-[90px] rounded-[30px] flex justify-between items-center shadow-xl">
        <div className="w-[30%] h-[100%] flex justify-center items-center">
          <img
            className="h-[75px] w-[75px] rounded-full"
            src="https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg"
            alt="Avatar"
          />
        </div>
        
        
        <div className="w-[50%]">
          <p className="text-xs text-[#A0AEC0]">{saludo}</p>
          <p className="font-bold text-xl">{session?.user.fullname}</p>
        </div>
        
        <div className="w-[20%] flex justify-center items-center">
          <div className="rounded-full border border-[#999999] shadow-xl h-[40px] w-[40px] flex justify-center items-center">
            <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 0 24 24" width="30px" fill="#999999">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="containerBtnPerfil flex flex-col gap-5">

        <button className="w-[351px] flex items-center justify-between p-5 h-[60px] bg-[#E5E5E5]  rounded-[10px] shadow-lg font-bold">Datos Personales<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#999"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg></button>
        <button className="w-[351px] flex items-center justify-between p-5 h-[60px] bg-[#E5E5E5]  rounded-[10px] shadow-lg font-bold">Metodos de pago<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#999"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg></button>
        <button className="w-[351px] flex items-center justify-between p-5 h-[60px] bg-[#E5E5E5]  rounded-[10px] shadow-lg font-bold">Objetivos<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#999"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg></button>

      </div>

      <button
        className="w-[120px] h-[40px] bg-[#E5E5E5] text-[#333] rounded-[10px] shadow-lg"
        onClick={() => {
          signOut();
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}

export default ProfilePage;

