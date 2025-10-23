// components/LoginModal.tsx
"use client";
import { signIn } from "next-auth/react";
import { ScaleModal } from "@/components/base/AnimatedModal";
import { usePathname } from "next/navigation";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNight?: boolean;
  callbackUrl?: string; // URL a la que redirigir después del login
}

export default function LoginModal({
  isOpen,
  onClose,
  isNight = false,
  callbackUrl,
}: LoginModalProps) {
  const pathname = usePathname();

  // Usar callbackUrl si se proporciona, sino usar la ruta actual
  const redirectUrl = callbackUrl || pathname || "/home";

  const handleLogin = () => {
    signIn("google", { callbackUrl: redirectUrl });
  };

  return (
    <ScaleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Inicia sesión para continuar"
      size="sm"
      isNight={isNight}
    >
      <div className="space-y-4">
        <p
          className={`text-sm ${
            isNight ? "theme-text-secondary" : "text-muted-foreground"
          }`}
        >
          Debes estar logueado para realizar esta acción.
        </p>
        <button
          onClick={handleLogin}
          className={`w-full py-2 rounded-[20px] font-medium transition ${
            isNight
              ? "seasonal-gradient text-white hover:opacity-90"
              : "bg-[#C95100] text-white hover:bg-[#A03D00]"
          }`}
        >
          Iniciar sesión
        </button>
      </div>
    </ScaleModal>
  );
}
