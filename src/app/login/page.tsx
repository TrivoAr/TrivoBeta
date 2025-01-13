"use client";
import { FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";

function Signin() {
  const router = useRouter();

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
          router.push("/dashboard");
          return "¡Inicio de sesión exitoso!";
        },
        error: (message) => `Error: ${message}`,
      }
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#F4F4F4] font-sans">
      <Toaster position="top-center" />

      {/* Logo y título */}
      <div className="text-center mb-6">
        <Image src="/assets/Group 17.png" alt="Klubo Logo" width={120} height={120} />
        <h1 className="text-xl font-bold text-black mt-2">Klubo</h1>
      </div>

      {/* Formulario */}
      <form className="w-80 flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* Email */}
        <div className="relative border-b border-gray-300 pb-2 flex items-center">
          <i className="icon-user text-gray-400 mr-2"></i>
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full border-none outline-none text-sm p-1 bg-[#F4F4F4]"
            required
          />
        </div>

        {/* Contraseña */}
        <div className="relative border-b border-gray-300 pb-2 flex items-center">
          <i className="icon-lock text-gray-400 mr-2"></i>
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full border-none outline-none text-sm p-1 bg-[#F4F4F4]"
            required
          />
          <i className="icon-eye text-gray-400"></i>
        </div>

        <a href="#" className="text-xs text-orange-500 hover:underline text-right">
          ¿Olvidaste tu contraseña?
        </a>

        {/* Botón de inicio de sesión */}
        <button
          type="submit"
          className="bg-orange-500 text-white py-2 rounded-full font-medium text-base hover:bg-orange-600"
        >
          Ingresar
        </button>

        {/* <div className="text-center text-sm text-gray-400">O ingresar con</div> */}

        {/* Botón de Google */}
        {/* <button
          type="button"
          className="flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-full py-2 px-4 text-sm font-medium text-gray-600 hover:bg-gray-100"
          onClick={() =>
            toast.promise(signIn("google"), {
              loading: "Conectando con Google...",
              success: "¡Inicio de sesión con Google exitoso!",
              error: "No se pudo iniciar sesión con Google.",
            })
          }
        >
          <Image src="/assets/google-icon.png" alt="Google Icon" width={20} height={20} />
          <span>Ingresar con Google</span>
        </button> */}

        <div className="text-center text-sm text-gray-600">
          ¿Tienes cuenta?{" "}
          <a href="/register" className="text-orange-500 hover:underline">
            Crear Cuenta
          </a>
        </div>
      </form>
    </div>
  );
}

export default Signin;