"use client";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import "./style.css";

function Signin() {
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Usar toast.promise para manejar los estados de la promesa
    toast.promise(
      new Promise(async (resolve, reject) => {
        const res = await signIn("credentials", {
          email: formData.get("email"),
          password: formData.get("password"),
          redirect: false,
        });

        if (res?.error) {
          reject(res.error); // Si hay error, rechazar promesa
        } else if (res?.ok) {
          resolve("¡Inicio de sesión exitoso!"); // Resolver si todo está bien
        } else {
          reject("Ocurrió un error desconocido.");
        }
      }),
      {
        loading: "Autenticando...",
        success: () => {
          router.push("/dashboard"); // Redirigir en éxito
          return "¡Inicio de sesión exitoso!";
        },
        error: (message) => {
          return `Error: ${message}`; // Mostrar mensaje de error específico
        },
      }
    );
  };

  return (
    <div className="signin-container">
      {/* Para notificaciones */}
      <Toaster position="top-center" />

      {/* Logo y título */}
      <div className="signin-logo">
        <Image src="/assets/Group 17.png" alt="Klubo Logo" width={120} height={120} />
        <h1>Klubo</h1>
      </div>

      {/* Formulario */}
      <form className="signin-form" onSubmit={handleSubmit}>
        <div className="signin-input-container">
          <i className="icon-user"></i>
          <input type="email" placeholder="Email" name="email" required />
        </div>

        <div className="signin-input-container">
          <i className="icon-lock"></i>
          <input type="password" placeholder="Password" name="password" required />
          <i className="icon-eye"></i>
        </div>

        <a href="#" className="forgot-password">
          ¿Olvidaste tu contraseña?
        </a>

        <button type="submit" className="signin-button">
          Ingresar
        </button>

        <div className="signin-divider">O ingresar con</div>

        {/* Botón de Google */}
        <button
          type="button"
          className="google-signin-button"
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
        </button>

        <div className="create-account">
          ¿Tienes cuenta? <a href="/register">Crear Cuenta</a>
        </div>
      </form>
    </div>
  );
}

export default Signin;
