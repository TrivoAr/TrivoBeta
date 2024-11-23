import Loginimagen from '../../public/assets/Login-Imagen.jpg';
import KluboImagen from '../../public/assets/Group 17.png';
import Image from 'next/image';
import Link from 'next/link';

function HomePage() {
  // const { data: session, status } = useSession({
  //   required: true,
  // });
  // console.log(session, status);

  return (
    <div className="relative w-[375px] h-[812px] flex flex-col justify-center items-center overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <Image
          src={Loginimagen}
          alt="imagen de fondo"
          layout="fill"
          objectFit="cover"
        />
        
        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-80"></div>
      </div>

      <div className="text-center w-full h-full p-5 box-border">
        <div className="flex justify-center mb-4">
          <Image
            src={KluboImagen}
            alt="Imagen de Klubo"
            width={150}
            height={150}
          />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Klubo</h1>
        <p className="text-lg text-white mb-8">Iniciar sesión o Registrarse</p>
        <div className="mt-[150px] flex flex-col gap-2.5">
          <Link href="/login">
            <button className="bg-[#FA861F] text-black border-none py-3 px-4 text-lg w-[80%] mx-auto rounded cursor-pointer transition-colors duration-300 hover:bg-orange-500">
              Iniciar sesión
            </button>
          </Link>
          <Link href="/register">
            <button className="border-2 border-[#FA861F] text-[#FA861F] py-3 px-4 text-lg w-[80%] mx-auto rounded cursor-pointer transition-colors duration-300 hover:bg-[#FA861F] hover:text-black">
              Registrarse
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
