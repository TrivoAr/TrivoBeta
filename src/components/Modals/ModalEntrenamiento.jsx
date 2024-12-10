import React from "react";

const ModalEntrenamiento = ({children, estado, cambiarEstado}) =>{
    return(
        <>
        {estado &&
       
       
            <div className="overlay w-screen h-screen fixed top-0 left-0 flex justify-center items-center">
                <div className="contenedorModal w-[370px] h-[400px] bg-[#f4f4f4] rounded-[20px] relative">
                  <div className="encabezadoModal flex items-center justify-between border-b h-[60px] p-5">
                    <h1 className="font-semibold">Asignar entrenamiento</h1>
                    </div>  

                    <div onClick={()=> cambiarEstado(false)} className="botonCerrar absolute bg-[#FF9A3D] h-[30px] w-[30px] rounded-full flex justify-center items-center font-bold top-2 right-2"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#333"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg></div>

                    {children}
                


                </div>

            </div>

}
            
            
        </>

    );
}

export default ModalEntrenamiento;