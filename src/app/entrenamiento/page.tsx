import React from "react";

function Entrenamiento() {
  return (
    <div className="w-[390px]">
    <div className="relative">
    <div className="h-[224px] bg-slate-400 w-[390px]"></div>
    <div className="h-[80px] w-[80px] bg-slate-700 rounded-full absolute top-[185px] left-9"></div>
    <div className="flex flex-col w-[390px] items-center">
        <p className="font-bold text-xl">Entrenamiento</p>
        <p className="font-light text-sm text-slate-500">Matias Piovesan</p>
    </div>
    </div>


    <div className="mt-10 flex w-[390px] justify-center items-center">
    <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#FA861F"><path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"/></svg>

    <div className="text-sm">Entrenamiento de la semana 26/12</div>


    <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#FA861F"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg>     
    </div>

    <div className="mt-5 w-[390px] flex flex-col justify-center items-center gap-3">
        
        <div className="flex items-center gap-5">
        <button className="bg-[#FA861F] h-[40px] w-[290px] text-[#333] rounded-[10px] flex items-center justify-around shadow text-sm">Entrenamiento Lunes<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#333"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg> </button>

        <div className="rounded-full h-[15px] w-[15px] bg-[#78A55A]"></div>
        </div>


        <div className="flex items-center gap-5">
        <button className="bg-[#FA861F] h-[40px] w-[290px] text-[#333] rounded-[10px] flex items-center justify-around shadow text-sm">Entrenamiento Miercoles<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#333"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg> </button>

        
        <div className="rounded-full h-[15px] w-[15px] bg-[#FF3E3E]"></div>
        </div>

        <div className="flex items-center gap-5">

        <button className="bg-[#FA861F] h-[40px] w-[290px] text-[#333] rounded-[10px] flex items-center justify-around shadow text-sm">Entrenamiento Jueves<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#333"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg> </button>

        <div className="rounded-full h-[15px] w-[15px] bg-[#A0AEC0]"></div>
        </div>


        
    </div>

    <div className="flex w-[390px] flex-col items-center mt-10">
    <svg xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 0 24 24" width="50px" fill="#333"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>

        <p className="text-sm">Agregar entrenamiento</p>
    </div>





    </div>
    
  )
}

export default Entrenamiento;


