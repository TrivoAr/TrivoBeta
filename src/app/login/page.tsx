"use client";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import lock from "../../../public/assets/icons/Group 2.svg"
import user from "../../../public/assets/icons/User.svg"

export default function Signin() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    toast.promise(
      new Promise(async (resolve, reject) => {
        const res = await signIn("credentials", {
          email: formData.get("email"),
          password: formData.get("password"),
          redirect: false,
        });
        if (res?.error) {
          reject(res.error);
        } else if (res?.ok) {
          resolve("¡Inicio de sesión exitoso!");
        } else {
          reject("Ocurrió un error desconocido.");
        }
      }),
      {
        loading: "Autenticando...",
        success: () => {
          router.push("/home");
          return "¡Inicio de sesión exitoso!";
        },
        error: (msg) => `Error: ${msg}`,
      }
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-[380px] bg-[#FEFBF9] font-sans">
      <Toaster position="top-center" />

      <div className="w-full h-full bg-[#FEFBF9] overflow-hidden">
        {/* Logo */}
        <div className="flex flex-col justify-center items-center pt-6 mb-[52px]">
          <Image
            src="/assets/Logo/trivo_negro-removebg-preview.png"
            alt="Klubo Logo"
            width={180}
            height={160}
          />
          <h1 className="text-xl font-bold text-[#F7941F]">Iniciar Sesion</h1>
        </div>

        <form className="px-6 pb-8 " onSubmit={handleSubmit}>
          {/* Usuario o Email */}
          <div className="relative mb-[26px]">
            {/* Icono a la izquierda */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Image src={user} alt="lock icon" width={24} height={24} /> 
              </div>

            <input
              type="text"
              name="email"
              placeholder="Email"
              className="w-full h-[55px]  rounded-[15px] bg-white border-[1px] shadow-sm py-2 pl-10 pr-4 text-base placeholder-gray-500 focus:outline-none"
              required
            />
          </div>

         {/* Contraseña */}
         <div className="relative mb-[19px]">
            
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Image src={lock} alt="lock icon" width={16} height={20} /> 
              </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Contraseña"
              className="w-full h-[55px]  rounded-[15px] bg-white border-[1px] shadow-sm py-2 pl-10 pr-10 placeholder-gray-500 focus:outline-none"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                /* Ojo abierto */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                /* Ojo cerrado */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.27 21.27 0 0 1 5-5" />
                  <path d="M1 1l22 22" />
                </svg>
              )}
            </button>
          </div>


          {/* Olvidaste contraseña */}
          <div className="text-left mb-[26px]">
            <a
              href="#"
              className="text-[15px] text-orange-500 hover:underline "
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Botón Login */}
          <button
            type="submit"
            className="w-full bg-[#F7941F] h-[55px] mb-[26px]  rounded-[15px] hover:bg-[#F7941F] text-white py-2 text-[20px] font-medium transition"
          >
            Iniciar sesion
          </button>

          {/* Divider */}
          <div className="flex items-center text-gray-400 text-sm my-2 ">
            <hr className="flex-grow border-t" />
            <span className="px-2">- O continua con -</span>
            <hr className="flex-grow border-t" />
          </div>

          {/* Social Buttons */}
          <div className="flex justify-center space-x-6 mt-2 mt-[20px]">
            <button
              type="button"
              onClick={() =>
                toast.promise(signIn("google"), {
                  loading: "Conectando con Google...",
                  success: "¡Listo!",
                  error: "No se pudo conectar con Google.",
                })
              }
            >
              <Image
                src="/assets/google.png"
                alt="Google"
                width={24}
                height={24}
              />
            </button>
            <button
              type="button"
              onClick={() =>
                toast.promise(signIn("apple"), {
                  loading: "Conectando con Apple...",
                  success: "¡Listo!",
                  error: "No se pudo conectar con Apple.",
                })
              }
            >
              <Image
                src="/assets/logotipo-de-apple.png"
                alt="Apple"
                width={24}
                height={24}
              />
            </button>
            {/* <button
              type="button"
              onClick={() =>
                toast.promise(signIn("facebook"), {
                  loading: "Conectando con Facebook...",
                  success: "¡Listo!",
                  error: "No se pudo conectar con Facebook.",
                })
              }
            >
              <Image
                src="/assets/facebook-icon.png"
                alt="Facebook"
                width={24}
                height={24}
              />
            </button> */}
          </div>

          {/* Registro */}
          <p className="text-center text-sm text-gray-600 mt-4">
            ¿Todavía no sos parte?{" "}
            <a href="/register" className="text-orange-500 hover:underline">
              Unite ahora
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
