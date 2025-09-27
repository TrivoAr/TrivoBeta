// components/LoginModal.tsx
"use client";
import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Inicia sesión para continuar
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}
