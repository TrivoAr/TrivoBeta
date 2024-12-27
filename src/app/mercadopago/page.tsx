import MercadoPagoimagen from "../../../public/assets/MercadoPago.png";

function Mp() {
  return (
    <div className="flex justify-center min-h-screen">
      <div className="w-[389px] p-4 shadow-md bg-[#F4F4F4] overflow-y-auto">
        <div className="pb-2">
          <h1 className="w-[157px] h-[22px] font-medium text-[20px]">
            Metodo de pago
          </h1>
        </div>
        <div className="w-[339px] h-[473px] bg-[#E5E5E5] rounded-xl">
          <div className="w-[100%] p-4">
            <div className="flex items-center gap-1">
              <div className="w-[53px] h-[53px]">
                <img
                  src="https://i.pinimg.com/736x/33/3c/3b/333c3b3436af10833aabeccd7c91c701.jpg"
                  className="rounded-full"
                  alt="Logo"
                />
              </div>
              <div className="flex flex-col">
                <h2 className="w-[139px] h-[22px] font-medium text-[20px]">
                  Running Sport
                </h2>
                <span className="w-[70px] h-[22px] font-medium text-[11px] text-[#A0AEC0] pt-1">
                  Profe Manuel
                </span>
              </div>
            </div>
          </div>
          <div className="w-[100%] p-2 flex flex-col items-start gap-1">
            <span className="w-[135px] h-[22px] font-semibold text-[32px]">
              $25.000
            </span>

            <span className="w-[183px] h-[22px] font-medium text-[11px] text-[#A0AEC0] pt-3">
              Martes, 17 Septiembre, 18:18hs
            </span>

            <span className="w-[58px] h-[22px] font-bold text-[14px] text-[#000000] pt-3">
              Detalles
            </span>

            {/* Tarjeta y Visa 4052 alineados */}
            <div className="w-full flex justify-between items-start pt-3">
              <span className="font-normal text-[10px] text-[#333333]">
                Tarjeta
              </span>
              <span className="font-normal text-[10px] text-[#333333]">
                Visa 4052
              </span>
            </div>
            
            <div className="w-full flex justify-between items-start">
            <span className="font-normal text-[10px] text-[#333333]">
                Trasccion Nº
              </span>
              <span className="font-normal text-[10px] text-[#333333]">
                #123456789
              </span>
            </div>

            <div className="flex justify-center mt-4 w-[100%]">
              <button className="w-[80%] h-[40px] bg-[#C2C9D2] rounded-xl">
                Pagar
              </button>
            </div>
            <div className="flex justify-center w-[100%]">
              <button className="font-medium text-[11px] text-[#A0AEC0]">
                Otro Metodo de pago
              </button>
            </div>
            <div className="flex justify-center w-[100%] mt-2">
              <img
                src={MercadoPagoimagen.src}
                alt="Mercado Pago"
                className="w-[100px] h-[26px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Mp;
