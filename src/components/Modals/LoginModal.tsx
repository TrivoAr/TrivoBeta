// components/LoginModal.tsx
"use client";
import { signIn } from "next-auth/react";
import { ScaleModal } from "@/components/base/AnimatedModal";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  return (
    <ScaleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Inicia sesión para continuar"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Debes estar logueado para realizar esta acción.
        </p>
        <button
          onClick={() => signIn("google")}
          className="bg-[#C95100] text-white w-full py-2 rounded-[20px] font-medium transition hover:bg-[#A03D00]"
        >
          Iniciar sesión
        </button>
      </div>
    </ScaleModal>
  );
}
