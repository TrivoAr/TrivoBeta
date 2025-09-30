"use client";
import { FormEvent, useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import lock from "../../../public/assets/icons/Group 2.svg";
import user from "../../../public/assets/icons/User.svg";

export default function Signin() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detectar dark mode del sistema
  useEffect(() => {
    // Verificar si hay clase dark en el HTML
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    // Check inicial
    checkDarkMode();

    // Observer para cambios en la clase dark
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Redirigir si ya hay una sesión activa
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/home");
    }
  }, [status, router]);

  // Mostrar loading mientras se verifica la sesión
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen w-[380px] bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C95100]"></div>
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // No mostrar el formulario si ya está autenticado
  if (status === "authenticated") {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    toast.promise(
      new Promise(async (resolve, reject) => {
        const res = await signIn("credentials", {
          email: formData.get("email"),
          password: formData.get("password"),
          redirect: false,
        });
        if (res?.error) {
          setIsSubmitting(false);
          reject(res.error);
        } else if (res?.ok) {
          resolve("¡Inicio de sesión exitoso!");
        } else {
          reject("Ocurrió un error desconocido.");
          setIsSubmitting(false);
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
    <div className="flex items-center justify-center min-h-screen w-[380px] bg-background font-sans">
      <Toaster position="top-center" />

      <div className="w-full h-full bg-background overflow-hidden">
        {/* Logo */}
        <div className="flex flex-col justify-center items-center pt-6 mb-[52px]">
          <Image
            src={
              isDarkMode
                ? "/assets/Logo/trivoModoOScuro.png"
                : "/assets/Logo/trivo_negro-removebg-preview.png"
            }
            alt="Trivo Logo"
            width={180}
            height={160}
            priority
          />
          <h1 className="text-xl font-bold text-[#C95100]">Iniciar Sesion</h1>
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
              className="w-full h-[55px] rounded-[15px] bg-background border border-input shadow-sm py-2 pl-10 pr-4 text-base placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
              className="w-full h-[55px] rounded-[15px] bg-background border border-input shadow-sm py-2 pl-10 pr-10 placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                  className="h-5 w-5 text-muted-foreground"
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
                  className="h-5 w-5 text-muted-foreground"
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
            <a href="/reset-password" className="text-[15px] text-[#C95100]">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Botón Login */}

          {/*           
          <button
            type="submit"
            className="w-full bg-[#C95100] h-[55px] mb-[26px]  rounded-[15px] hover:bg-[#F7941F] text-white py-2 text-[20px] font-medium transition"
          >
            Iniciar sesion
          </button> */}
          <button
            className="bg-[#C95100] text-white font-bold px-4 py-2 w-full mt-4 rounded-[20px] flex gap-1 justify-center disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Iniciando sesión" : "Iniciar sesión"}
            {isSubmitting && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center text-muted-foreground text-sm my-2 ">
            <hr className="flex-grow border-t border-border" />
            <span className="px-2">- O continua con -</span>
            <hr className="flex-grow border-t border-border" />
          </div>

          {/* Social Buttons */}
          <div className="flex justify-center space-x-6 mt-[20px]">
            <button
              type="button"
              onClick={() =>
                toast.promise(signIn("google", { callbackUrl: "/home" }), {
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
          </div>

          {/* Registro */}
          <p className="text-center text-md text-muted-foreground mt-4">
            ¿Todavía no sos parte?{" "}
            <a href="/register" className="text-[#C95100] hover:underline">
              Unite ahora
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
