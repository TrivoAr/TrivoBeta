// "use client";
// import { useState } from "react";
// import toast, { Toaster } from "react-hot-toast";
// import Image from "next/image";
// import { useRouter } from "next/navigation";

// export default function ResetPassword() {
//   const [email, setEmail] = useState("");
//   const [resetCode, setResetCode] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     const res = await fetch("/api/auth/reset-password", {
//       method: "POST",
//       body: JSON.stringify({ email, resetCode, newPassword }),
//       headers: { "Content-Type": "application/json" },
//     });

//     const data = await res.json();
//     setLoading(false);

//     if (res.ok) {
//       setMessage("Contraseña restablecida correctamente.");
//       toast.success("Contraseña restablecida correctamente.");
//       router.push("/login")
//     } else {
//       setMessage(data.message || "Hubo un error al restablecer la contraseña.");
//       toast.error(data.message || "Hubo un error.");
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center h-screen bg-[#F4F4F4] font-sans">
//       <Toaster position="top-center" />

//       {/* Logo y título */}
//       <Image src="/assets/Isologo - Positivo a color.png" alt="Klubo Logo" width={120} height={120} />
//       <div className="text-center mb-6 mt-6">
      
//         <h1 className="text-xl font-bold text-black mt-2">Restablecer Contraseña</h1>
//       </div>

//       {/* Formulario */}
//       <form className="w-80 flex flex-col gap-4" onSubmit={handleSubmit}>
//         {/* Email */}
//         <div className="relative border-b border-gray-300 pb-2 flex items-center">
//           <i className="icon-user text-gray-400 mr-2"></i>
//           <input
//             type="email"
//             placeholder="Correo electrónico"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             className="w-full border-none outline-none text-sm p-1 bg-[#F4F4F4]"
//             required
//           />
//         </div>

//         {/* Código de recuperación */}
//         <div className="relative border-b border-gray-300 pb-2 flex items-center">
//           <i className="icon-key text-gray-400 mr-2"></i>
//           <input
//             type="text"
//             placeholder="Código de recuperación"
//             value={resetCode}
//             onChange={(e) => setResetCode(e.target.value)}
//             className="w-full border-none outline-none text-sm p-1 bg-[#F4F4F4]"
//             required
//           />
//         </div>

//         {/* Nueva contraseña */}
//         <div className="relative border-b border-gray-300 pb-2 flex items-center">
//           <i className="icon-lock text-gray-400 mr-2"></i>
//           <input
//             type="password"
//             placeholder="Nueva contraseña"
//             value={newPassword}
//             onChange={(e) => setNewPassword(e.target.value)}
//             className="w-full border-none outline-none text-sm p-1 bg-[#F4F4F4]"
//             required
//           />
//         </div>

//         {/* Botón de restablecer */}
//         <button
//           type="submit"
//           className="bg-orange-500 text-white py-2 rounded-full font-medium text-base hover:bg-orange-600"
//           disabled={loading}
//         >
//           {loading ? "Restableciendo..." : "Restablecer Contraseña"}
//         </button>

//         {/* Mensaje de estado */}
//         {message && <p className="text-center text-sm text-gray-600 mt-4">{message}</p>}
//       </form>
//     </div>
//   );
// }

"use client";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const [step, setStep] = useState<"requestCode" | "reset">("requestCode"); // Paso actual
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Paso 1: solicitar el código
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/send-reset-code", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        toast.success("Código enviado al correo.");
        setStep("reset");
      } else {
        toast.error(data.message || "No se pudo enviar el código.");
        setMessage(data.message || "Error al enviar el código.");
      }
    } catch (error) {
      setLoading(false);
      toast.error("Error al conectar con el servidor.");
      setMessage("Error al conectar con el servidor.");
    }
  };

  // Paso 2: restablecer contraseña
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, resetCode, newPassword }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        toast.success("Contraseña restablecida correctamente.");
        router.push("/login");
      } else {
        toast.error(data.message || "No se pudo restablecer la contraseña.");
        setMessage(data.message || "Error al restablecer la contraseña.");
      }
    } catch (error) {
      setLoading(false);
      toast.error("Error al conectar con el servidor.");
      setMessage("Error al conectar con el servidor.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#FEFBF9] font-sans">
      <Toaster position="top-center" />

      {/* Logo y título */}
      <Image src="/assets/Logo/Trivo T.png" alt="Klubo Logo" width={120} height={120} />
      <div className="text-center mb-6 mt-6">
        <h1 className="text-xl font-bold text-black mt-2">Restablecer Contraseña</h1>
      </div>

      {/* Paso 1: solicitar código */}
      {step === "requestCode" && (
        <form className="w-80 flex flex-col gap-4" onSubmit={handleRequestCode}>
          <div className="">
            <i className=""></i>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 border shadow-md rounded-[20px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#C95100] h-[55px] mb-[26px]  rounded-[20px] hover:bg-[#F7941F] text-white py-2 text-[20px] font-medium transition"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar Código"}
          </button>

          {message && <p className="text-center text-sm text-gray-600 mt-4">{message}</p>}
        </form>
      )}

      {/* Paso 2: ingresar código + nueva contraseña */}
      {step === "reset" && (
        <form className="w-80 flex flex-col gap-4" onSubmit={handleResetPassword}>
          <div className="">
            <i className=""></i>
            <input
              type="text"
              placeholder="Código de recuperación"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
              required
            />
          </div>

          <div className="">
            <i className=""></i>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-4 border shadow-md rounded-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-slate-400"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#C95100] h-[55px] mb-[26px]  rounded-[15px] text-white py-2 text-[20px] font-medium transition"
            disabled={loading}
          >
            {loading ? "Restableciendo..." : "Restablecer Contraseña"}
          </button>

          <button
            type="button"
            className="text-gray-500 text-md underline"
            onClick={() => setStep("requestCode")}
          >
            Volver a pedir código
          </button>

          {message && <p className="text-center text-sm text-gray-600 mt-4">{message}</p>}
        </form>
      )}
    </div>
  );
}
