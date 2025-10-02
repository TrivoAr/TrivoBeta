"use client";
import { FormEvent, useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";

function Signup() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detectar dark mode del sistema
  useEffect(() => {
    // Verificar si hay clase dark en el HTML
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    // Check inicial
    checkDarkMode();

    // Observer para cambios en la clase dark
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
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
      <div className="flex items-center justify-center min-h-screen bg-background">
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
    setError(null); // Clear any previous error
    try {
      const formData = new FormData(event.currentTarget);

      const firstname = formData.get("firstname")?.toString();
      const lastname = formData.get("lastname")?.toString();
      const rol = "alumno";
      const email = formData.get("email")?.toString();
      const password = formData.get("password")?.toString();
      const confirmPassword = formData.get("confirmPassword")?.toString();

      if (
        !firstname ||
        !lastname ||
        !rol ||
        !email ||
        !password ||
        !confirmPassword
      ) {
        setError("All fields must be filled");
        return;
      }

      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        return;
      }

      const signupResponse = await axios.post("/api/auth/signup", {
        email,
        password,
        firstname,
        lastname,
        rol,
      });

      const res = await signIn("credentials", {
        email: signupResponse.data.email,
        password,
        redirect: false,
      });

      toast.success("¡Cuenta creada exitosamente!");

      if (res?.ok) return router.push("/home");
    } catch (error) {
      console.log(error);
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data.message;
        setError(errorMessage);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-[40px]">
      <form onSubmit={handleSubmit}>
        <div className="text-center mb-12">
          <Image
            src={
              isDarkMode
                ? "/assets/Logo/trivoModoOScuro.png"
                : "/assets/Logo/trivo_negro-removebg-preview.png"
            }
            alt="Trivo Logo"
            width={160}
            height={160}
            className="mx-auto"
            priority
          />
          {/*<h1 className="text-5xl font-medium text-400">Klubo</h1>*/}
          <h1 className="text-2xl font-bold text-600 text-[#C95100]">
            Encuentra a tú tribu
          </h1>
        </div>

        {error && (
          <div className="bg-red-500 text-white text-center py-2 mb-4 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            name="firstname"
            placeholder="Nombre"
            className="w-full px-4 py-4 border border-border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-[#C95100] bg-background text-foreground placeholder:text-muted-foreground"
          />
          <input
            type="text"
            name="lastname"
            placeholder="Apellido"
            className="w-full px-4 py-4 border border-border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-[#C95100] bg-background text-foreground placeholder:text-muted-foreground"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full px-4 py-4 border border-border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-[#C95100] bg-background text-foreground placeholder:text-muted-foreground"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            className="w-full px-4 py-4 border border-border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-[#C95100] bg-background text-foreground placeholder:text-muted-foreground"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmar contraseña"
            className="w-full px-4 py-4 border border-border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-[#C95100] bg-background text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center mt-4 ml-2">
          <input type="checkbox" id="terms" className="mr-2" required />
          <label htmlFor="terms" className="text-sm text-muted-foreground">
            Acepto los{" "}
            <a
              href="/terminos-condiciones"
              className="text-[#C95100] underline hover:text-[#A03D00]"
            >
              términos y condiciones
            </a>
          </label>
        </div>

        <button
          className="bg-[#C95100] text-white font-bold px-4 py-2 w-full mt-4 rounded-[20px] flex gap-1 justify-center disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
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

        <button
          type="button"
          onClick={() => router.back()}
          className="w-full mt-2 text-[#C95100] py-2 rounded-xl font-medium hover:bg-accent transition-colors"
        >
          Atrás
        </button>
      </form>
    </div>
  );
}

export default Signup;
