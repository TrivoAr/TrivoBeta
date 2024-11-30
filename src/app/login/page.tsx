"use client";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "./style.css"; // Asegúrate de importar los estilos

function Signin() {
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const res = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (res?.error) setError(res.error as string);

    if (res?.ok) return router.push("/dashboard");
  };

  return (
    <div className="signin-container">
      {/* Logo y título */}
      <div className="signin-logo">
        <Image src="/assets/Group 17.png" alt="Klubo Logo" width={120} height={120} />
        <h1>Klubo</h1>
      </div>

      {/* Formulario */}
      <form className="signin-form" onSubmit={handleSubmit}>
        {error && <div className="signin-error">{error}</div>}

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
          onClick={() => signIn("google")}
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
