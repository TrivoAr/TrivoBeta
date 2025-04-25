"use client";
import { FormEvent, useState } from "react";
import axios, { AxiosError } from "axios";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import user from "../../../public/assets/icons/User.svg";
import lock from "../../../public/assets/icons/Group 2.svg";
import mail from "../../../public/assets/icons/Mail.svg";

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
    <div className="flex items-center justify-center min-h-screen w-[380px] bg-[#FEFBF9] font-sans">
  <form className="w-full h-full px-6 pb-8" onSubmit={handleSubmit}>
    {/* Logo */}
    <div className="flex justify-center pt-6 mb-[32px]">
      <Image
        src="/assets/Isologo - Positivo a color.png"
        alt="Klubo Logo"
        width={150}
        height={150}
      />
    </div>

    {/* Título */}
    <div className="text-center mb-6">
      <h1 className="text-[30px] font-bold text-[#444] font-montserrat">Sumate y unite al movimiento.</h1>
    </div>

    {error && (
      <div className="bg-red-500 text-white text-center py-2 mb-4 rounded">
        {error}
      </div>
    )}

    <div className="space-y-5">
      {/* Nombre */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Image src={user} alt="lock icon" width={24} height={24} />
        </div>
        <input
          type="text"
          name="firstname"
          placeholder="Nombre"
          className="w-full h-[55px] rounded-[4px] bg-[#4444441A] border border-[#444444] py-2 pl-10 pr-4 placeholder-gray-500 focus:outline-none"
          required
        />
      </div>

      {/* Apellido */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Image src={user} alt="lock icon" width={24} height={24} />
        </div>
        <input
          type="text"
          name="lastname"
          placeholder="Apellido"
          className="w-full h-[55px] rounded-[4px] bg-[#4444441A] border border-[#444444] py-2 pl-10 pr-4 placeholder-gray-500 focus:outline-none"
          required
        />
      </div>

      {/* Email */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
        <Image src={mail} alt="lock icon" width={22} height={22} />
        </div>
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full h-[55px] rounded-[4px] bg-[#4444441A] border border-[#444444] py-2 pl-10 pr-4 placeholder-gray-500 focus:outline-none"
          required
        />
      </div>

      {/* Contraseña */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
         <Image src={lock} alt="lock icon" width={16} height={20} />
        </div>
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          className="w-full h-[55px] rounded-[4px] bg-[#4444441A] border border-[#444444] py-2 pl-10 pr-4 placeholder-gray-500 focus:outline-none"
          required
        />
      </div>

      {/* Confirmar contraseña */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
         <Image src={lock} alt="lock icon" width={16} height={20} />
        </div>
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirmar contraseña"
          className="w-full h-[55px] rounded-[4px] bg-[#4444441A] border border-[#444444] py-2 pl-10 pr-4 placeholder-gray-500 focus:outline-none"
          required
        />
      </div>

      {/* Rol Dropdown */}
      {/* <div className="relative">
        <div
          onClick={toggleDropdown}
          className="w-full h-[55px] flex items-center rounded-[4px] bg-[#4444441A] border border-[#444444] px-4 cursor-pointer text-gray-700"
        >
          {selectedOption || "Selecciona un rol"}
        </div>
        {isOpen && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-md">
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
        <input type="hidden" name="rol" value={selectedOption} />
      </div> */}
    </div>

    {/* Términos y condiciones */}
    <div className="flex items-center m-5">
      <input type="checkbox" id="terms" className="mr-2" required />
      <label htmlFor="terms" className="text-sm text-gray-600">
        Acepto los{" "}
        <a href="/terminos-condiciones" className="text-orange-500 underline">
          términos y condiciones
        </a>
      </label>
    </div>

    {/* Botones */}
    <button
      type="submit"
      className="w-full bg-[#F7941F] h-[55px] mb-[26px]  rounded-[4px] hover:bg-[#F7941F] text-white py-2 text-[20px] font-medium transition"
    >
      Crear cuenta
    </button>
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
                src="/assets/google-icon.png"
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
                src="/assets/apple-icon.png"
                alt="Apple"
                width={24}
                height={24}
              />
            </button>
            <button
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
            </button>
          </div>
          <p className="text-center text-sm text-gray-600 mt-4">
            ¿Ya tenes cuenta?{" "}
            <a href="/register" className="text-orange-500 hover:underline">
              Login
            </a>
          </p>
  </form>
</div>
  );
}

export default Signup;
