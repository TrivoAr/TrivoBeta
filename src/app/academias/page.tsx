"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getProfileImage } from "@/app/api/profile/getProfileImage";
import Link from "next/link";
import axios from "axios";
import "./style.css";

type Academia = {
  _id: string;
  nombre_academia: string;
  descripcion: string;
  tipo_disciplina: string;
  telefono: string;
};

export default function AcademiasPage() {
  const { data: session } = useSession();
  const [academias, setAcademias] = useState<Academia[]>([]);
  const [academiasRunning, setAcademiasRunning] = useState<Academia[]>([]);
  const [academiasTrekking, setAcademiasTrekking] = useState<Academia[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("running");
  const [formData, setFormData] = useState({
    fullname: session?.user.fullname || "",
    email: session?.user.email || "",
  });

  const [profileImage, setProfileImage] = useState<string | null>(null); 

  useEffect(() => {
    const fetchAcademias = async () => {
      try {
        const response = await axios.get("/api/academias");
        const runningAcademias = response.data.filter(
          (academia: Academia) => academia.tipo_disciplina === "running"
        );
        const trekkingAcademias = response.data.filter(
          (academia: Academia) => academia.tipo_disciplina === "trekking"
        );

        setAcademiasRunning(runningAcademias);
        setAcademiasTrekking(trekkingAcademias);
        setAcademias(response.data);
      } catch (error) {
        console.error("Error fetching academias:", error);
      }
    };

    const loadProfileImage = async () => {
      try {
        if (session?.user?.id) {
          const imageUrl = await getProfileImage(
            "profile-image.jpg",
            session.user.id
          );
          setProfileImage(imageUrl);
        }
      } catch (error) {
        console.error("Error al obtener la imagen del perfil:", error);
        setProfileImage(
          "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg"
        );
      }
    };

    if (session?.user) {
      setFormData({
        fullname: session.user.fullname || "",
        email: session.user.email || "",
      });
      loadProfileImage();
      fetchAcademias();
    }
  }, [session]);

  const handleDisciplineClick = (discipline: string) => {
    setSelectedDiscipline(discipline);
  };

  const filteredAcademias = academias.filter(
    (academia) => academia.tipo_disciplina === selectedDiscipline
  );

  return (
    <div className="flex flex-col gap-3 items-center">
      {/* Top Section */}
      <div className="containerTop m-1 bg-[#E5E5E5] h-[90px] w-[380px] flex justify-around items-center rounded-[30px] border shadow-xl">
        <div className="w-[30%] h-[100%] flex justify-center items-center">
          <img
            className="h-[75px] w-[75px] rounded-full"
            src={profileImage || "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg"}
            alt=""
          />
        </div>
        <div className="flex flex-col items-center">
          <p className="text-slate-500 text-[12px]">Ubicación</p>
          <p className="flex font-normal items-center text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="16px"
              viewBox="0 -960 960 960"
              width="16px"
              fill="#ff3d00"
            >
              <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Zm0-480Z" />
            </svg>
            San Miguel de Tucumán
          </p>
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

      {/* Filter Buttons */}
      <div className="w-[390px] flex justify-center">
        <div className="bg-[#f4f4f4] border-2 w-[360px] h-[50px] rounded-full flex flex-row justify-center items-center pl-[3.5%]">
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" href="http://www.w3.org/1999/xlink">
        <rect width="25" height="25" fill="url(#pattern0_446_46)"/>
        <defs>
        <pattern id="pattern0_446_46" patternContentUnits="objectBoundingBox" width="1" height="1">
        <use href="#image0_446_46" transform="scale(0.01)"/>
        </pattern>
        <image id="image0_446_46" width="100" height="100" href="data:image/png;base64,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"/>
        </defs>
        </svg>

        <form action="" className="w-[360px]">
          <input
            className="w-[315px] h-[45px] bg-transparent pl-[1%]"
            type="text"
            placeholder="Buscar academia"
          />
        </form>
        </div>
      </div>
      <div className="w-[390px] flex justify-center gap-7">
      {["running", "ciclismo", "trekking"].map((discipline) => (
      <div key={discipline} className="flex flex-col justify-center items-center">
      <button
        className={`border-2 rounded-full w-[45px] h-[45px] flex justify-center items-center ${
          selectedDiscipline === discipline ? "bg-orange-300" : ""
        }`}
        onClick={() => handleDisciplineClick(discipline)}
      >
        {discipline === "running" && (
          <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="#999"
        >
          <path d="M520-40v-240l-84-80-40 176-276-56 16-80 192 40 64-324-72 28v136h-80v-188l158-68q35-15 51.5-19.5T480-720q21 0 39 11t29 29l40 64q26 42 70.5 69T760-520v80q-66 0-123.5-27.5T540-540l-24 120 84 80v300h-80Zm20-700q-33 0-56.5-23.5T460-820q0-33 23.5-56.5T540-900q33 0 56.5 23.5T620-820q0 33-23.5 56.5T540-740Z" />
        </svg>
        )}
        {discipline === "ciclismo" && (
          <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 0 24 24"
          width="24px"
          fill="#999"
        >
          <path d="M0 0h24v24H0V0z" fill="none" />
          <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z" />
        </svg>
        )}
        {discipline === "trekking" && (
           <svg
           xmlns="http://www.w3.org/2000/svg"
           enable-background="new 0 0 24 24"
           height="24px"
           viewBox="0 0 24 24"
           width="24px"
           fill="#999"
         >
           <rect fill="none" height="24" width="24" />
           <path d="M13.5,5.5c1.1,0,2-0.9,2-2s-0.9-2-2-2s-2,0.9-2,2S12.4,5.5,13.5,5.5z M17.5,10.78c-1.23-0.37-2.22-1.17-2.8-2.18l-1-1.6 c-0.41-0.65-1.11-1-1.84-1c-0.78,0-1.59,0.5-1.78,1.44S7,23,7,23h2.1l1.8-8l2.1,2v6h2v-7.5l-2.1-2l0.6-3c1,1.15,2.41,2.01,4,2.34V23 H19V9h-1.5L17.5,10.78z M7.43,13.13l-2.12-0.41c-0.54-0.11-0.9-0.63-0.79-1.17l0.76-3.93c0.21-1.08,1.26-1.79,2.34-1.58l1.16,0.23 L7.43,13.13z" />
         </svg>
        )}
      </button>
      <p className="text-[11px] text-slate-500 capitalize">{discipline}</p>
    </div>
  ))}
</div>
      <h1 className="text-lg font-bold mb-2">Academias de  Recomendadas</h1>
      {/* Filtered Academias */}
      <div className="w-[390px]">
      <div className="scroll-container p-3">
        {filteredAcademias.map((academia) => (
                  <div key={academia._id} className="academia-card">
                  <Link href={`/academias/${academia._id}`}>
                    <div className="w-[250px] h-[218px] rounded-[10px] border flex flex-col justify-between shadow-lg">
                      <div
                        className="portada h-[100px] rounded-t-[10px] bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${academia || "/default.jpg"})`,
                        }}
                      ></div>
                      <h1 className="text-l font-bold text-center p-2">
                        {academia.nombre_academia}
                      </h1>
                      <div className="p-3">
                        <p className="text-sm flex items-center gap-2">
                          {/* Reemplaza el ícono si es necesario */}
                          <svg xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 -960 960 960" width="15px" fill="#333"><path d="M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-386q31 31 65 57.5t72 48.5l94-94q9-9 23.5-13.5T670-390l138 28q14 4 23 14.5t9 23.5v162q0 18-12 30t-30 12ZM241-600l66-66-17-94h-89q5 41 14 81t26 79Zm358 358q39 17 79.5 27t81.5 13v-88l-94-19-67 67ZM241-600Zm358 358Z"/></svg>
                          {academia.telefono}
                        </p>
                        <p className="text-sm flex items-center gap-2">
                          <span className="font-bold">Disciplina:</span>{" "}
                          {academia.tipo_disciplina}
                        </p>
                        <p className="text-sm flex items-center gap-2">
                          <span className="font-bold">Descripción:</span>{" "}
                          {academia.descripcion}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
        ))}
        </div>
      </div>
    </div>
  );
}
