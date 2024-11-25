"use client";
import { FormEvent, useState } from "react";
import axios, { AxiosError } from "axios";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

function Signup() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const formData = new FormData(event.currentTarget);

      // Validación de campos obligatorios
      const firstname = formData.get("firstname")?.toString();
      const lastname = formData.get("lastname")?.toString();
      const rol = formData.get("rol")?.toString();
      const email = formData.get("email")?.toString();
      const password = formData.get("password")?.toString();

      if (!firstname || !lastname || !rol || !email || !password) {
        setError("All fields must be filled");
        return;
      }

      const signupResponse = await axios.post("/api/auth/signup", {
        email,
        password,
        firstname,
        lastname,
        rol,
      });

      console.log(signupResponse);

      const res = await signIn("credentials", {
        email: signupResponse.data.email,
        password,
        redirect: false,
      });

      if (res?.ok) return router.push("/dashboard/profile");
    } catch (error) {
      console.log(error);
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data.message;
        setError(errorMessage);
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-6 w-80"
      >
        <div className="text-center mb-6">
          <img
            src="/assets/Group 17.png"
            alt="Klubo Logo"
            className="mx-auto w-25 h-25"
          />
          <h1 className="text-xl font-bold text-gray-800">Crear cuenta</h1>
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
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            type="text"
            name="lastname"
            placeholder="Apellido"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmar contraseña"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
  
          <select
            name="rol"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="" disabled selected>
              Selecciona un rol
            </option>
            <option value="alumno">Alumno</option>
            <option value="profe">Profe</option>
            <option value="dueño de academia">Dueño de Academia</option>
          </select>
        </div>
  
        <div className="flex items-center mt-4">
          <input type="checkbox" id="terms" className="mr-2" />
          <label htmlFor="terms" className="text-sm text-gray-600">
            Acepto los{" "}
            <a href="#" className="text-orange-500 underline">
              términos y condiciones
            </a>
          </label>
        </div>
  
        <button
          type="submit"
          className="w-full mt-6 bg-orange-500 text-white py-2 rounded hover:bg-orange-600"
        >
          Crear cuenta
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="w-full mt-2 text-orange-500 py-2 rounded border border-orange-500 hover:bg-orange-50"
        >
          Atrás
        </button>
      </form>
    </div>
  );
  

}

export default Signup;
