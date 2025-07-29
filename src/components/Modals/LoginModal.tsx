// components/LoginModal.tsx
"use client";
import { useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { signIn } from "next-auth/react";
import { X } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  useEffect(() => {
    const closeOnEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEsc);
    return () => window.removeEventListener("keydown", closeOnEsc);
  }, [onClose]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center bg-black/50 p-4">
      <Dialog.Panel className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black">
          <X />
        </button>
        <Dialog.Title className="text-lg font-semibold mb-4">Inicia sesión para continuar</Dialog.Title>
        <p className="text-sm text-gray-600 mb-6">Debes estar logueado para realizar esta acción.</p>
        <button
          onClick={() => signIn("google")} // o "credentials", según tu setup
          className="bg-[#C95100] text-white w-full py-2 rounded-[20px] font-medium transition"
        >
          Iniciar sesión
        </button>
      </Dialog.Panel>
    </Dialog>
  );
}
