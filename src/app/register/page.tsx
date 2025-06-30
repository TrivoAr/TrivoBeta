"use client";
import { FormEvent, useState } from "react";
import axios, { AxiosError } from "axios";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

function Signup() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); // Clear any previous error
    try {
      const formData = new FormData(event.currentTarget);

      const firstname = formData.get("firstname")?.toString();
      const lastname = formData.get("lastname")?.toString();
      const rol = selectedOption;
      const email = formData.get("email")?.toString();
      const password = formData.get("password")?.toString();
      const confirmPassword = formData.get("confirmPassword")?.toString();

      if (!firstname || !lastname || !rol || !email || !password || !confirmPassword) {
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
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleOptionClick = (value: string) => {
    setSelectedOption(value);
    setIsOpen(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#FEFBF9] p-[40px]">
      <form onSubmit={handleSubmit}>
        <div className="text-center mb-12">
          <img
            src="/assets/Logo/trivo_negro-removebg-preview.png"
            alt="Klubo Logo"
            className="mx-auto w-[160px]"
          />
          {/*<h1 className="text-5xl font-medium text-400">Klubo</h1>*/}
          <h1 className="text-2xl font-bold text-600 text-[#F7941F]">Forma parte de la tribu</h1>
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
            className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
          <input
            type="text"
            name="lastname"
            placeholder="Apellido"
            className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmar contraseña"
            className="w-full px-4 py-4 border shadow-sm rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />

          <div className="relative w-full">
            <div
              onClick={toggleDropdown}
              className="w-full px-4 py-4 border shadow-sm text-gray-400 rounded-[15px] bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {selectedOption || "Selecciona un rol"}
            </div>
            {isOpen && (
              <ul className="absolute z-10 w-full mt-1 bg-white border rounded shadow-md">
                <li
                  onClick={() => handleOptionClick("alumno")}
                  className="px-4 py-2 hover:bg-orange-100 cursor-pointer"
                >
                  alumno
                </li>
                <li
                  onClick={() => handleOptionClick("dueño de academia")}
                  className="px-4 py-2 hover:bg-orange-100 cursor-pointer"
                >
                  dueño de academia
                </li>
              </ul>
            )}
          </div>

          <input type="hidden" name="rol" value={selectedOption} />
        </div>

        <div className="flex items-center mt-4 ml-2">
          <input type="checkbox" id="terms" className="mr-2" required />
          <label htmlFor="terms" className="text-sm text-gray-600">
            Acepto los{" "}
            <a href="/terminos-condiciones" className="text-orange-500 underline">
              términos y condiciones
            </a>
          </label>
        </div>

        <button
          type="submit"
          className="w-full mt-6 bg-[#F7941F] text-white py-2 rounded-xl hover:bg-orange-600"
        >
          Crear cuenta
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="w-full mt-2 text-[#F7941F] py-2 rounded-xl border border-[#F7941F] hover:bg-orange-50"
        >
          Atrás
        </button>
      </form>
    </div>
  );
}

export default Signup;
