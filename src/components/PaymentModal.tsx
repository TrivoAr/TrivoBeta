"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";

// ⚡ Configura tu Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  salidaId: string;
  precio: string;
  cbu: string;
  alias: string;
  userId: string; // ⚡ Id del usuario que paga
}

export default function PaymentModal({
  isOpen,
  onClose,
  salidaId,
  precio,
  cbu,
  alias,
  userId,
}: PaymentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  const handleEnviarPago = async () => {
    if (!file) {
      toast.error("Debes subir un comprobante");
      return;
    }

    try {
      setIsLoading(true);

      // 1️⃣ Subir comprobante a Firebase Storage
      const fileRef = ref(
        storage,
        `comprobantes/${userId}-${Date.now()}-${file.name}`
      );
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      // 2️⃣ Guardar pago en tu API
      const resPago = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salidaId,
          userId,
          comprobanteUrl: url,
          estado: "pendiente", // opcional, depende de tu API de pagos
        }),
      });

      if (!resPago.ok) {
        toast.error("Error al enviar comprobante.");
        return;
      }

      const pagoData = await resPago.json();

      // 3️⃣ Crear solicitud de unirse con estado pendiente y asociando el pago
      const resUnirse = await fetch("/api/social/unirse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salidaId,
          pago_id: pagoData.pago._id, // ⚡ importante: asociar pago al miembro
        }),
      });

      if (resUnirse.ok) {
        toast.success("Solicitud enviada. Espera aprobación del organizador.");
        onClose(); // cerrar modal
        window.location.reload(); // recargar página
      } else {
        const msg = await resUnirse.text();
        toast.error("Pago guardado pero fallo al enviar solicitud: " + msg);
      }
    } catch (error) {
      toast.error("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pago de inscripción</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Para confirmar tu lugar debes transferir{" "}
            <span className="font-bold">${precio}</span>.
          </p>

          <div className="bg-gray-100 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">CBU:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(cbu)}
              >
                Copiar
              </Button>
            </div>
            <p className="text-sm break-all">{cbu}</p>

            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium">Alias:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(alias)}
              >
                Copiar
              </Button>
            </div>
            <p className="text-sm break-all">{alias}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comprobante">Comprobante de pago</Label>
            <Input
              id="comprobante"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleEnviarPago} disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
