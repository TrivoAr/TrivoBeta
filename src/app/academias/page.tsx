"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";

type Academia = {
  _id: string;
  nombre_academia: string;
  descripcion: string;
  tipo_disciplina: string;
  telefono: string;
};

export default function AcademiasPage() {
  const [academias, setAcademias] = useState<Academia[]>([]);

  useEffect(() => {
    const fetchAcademias = async () => {
      try {
        const response = await axios.get("/api/academias");
        setAcademias(response.data);
      } catch (error) {
        console.error("Error fetching academias:", error);
      }
    };

    fetchAcademias();
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Explorar Academias</h1>
        
        {academias.map((academia) =>(
          <div key={academia._id}>

<Link href={`/academias/${academia._id}`}>

<div className="w-[250px] h-[218px] rounded-[10px] border flex flex-col justify-between shadow-lg">


            
        <div className="portada h-[100px] rounded-t-[10px]"></div>

        <div className="nombre">
            <h1 className="text-l font-bold text-center">{academia.nombre_academia}</h1>
        </div>

        <div className="nombre flex flex-col p-3">
            <p className="text-sm flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" height="17px" viewBox="0 -960 960 960" width="17px" fill="#333"><path d="M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-386q31 31 65 57.5t72 48.5l94-94q9-9 23.5-13.5T670-390l138 28q14 4 23 14.5t9 23.5v162q0 18-12 30t-30 12ZM241-600l66-66-17-94h-89q5 41 14 81t26 79Zm358 358q39 17 79.5 27t81.5 13v-88l-94-19-67 67ZM241-600Zm358 358Z"/></svg>{academia.telefono}</p>

            <p className="text-sm flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" height="17px" viewBox="0 -960 960 960" width="17px" fill="#333"><path d="M520-40v-240l-84-80-40 176-276-56 16-80 192 40 64-324-72 28v136h-80v-188l158-68q35-15 51.5-19.5T480-720q21 0 39 11t29 29l40 64q26 42 70.5 69T760-520v80q-66 0-123.5-27.5T540-540l-24 120 84 80v300h-80Zm20-700q-33 0-56.5-23.5T460-820q0-33 23.5-56.5T540-900q33 0 56.5 23.5T620-820q0 33-23.5 56.5T540-740Z"/></svg>{academia.tipo_disciplina}</p>

            <p className="text-sm flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" height="17px" viewBox="0 -960 960 960" width="17px" fill="#333"><path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/></svg>{academia.descripcion}</p>
            
        </div>

        </div>


        </Link>


             </div>
             

          
        ))}




   














    </div>
  );
}