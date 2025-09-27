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
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { useSession } from "next-auth/react";
import { Session } from "inspector/promises";
import { se } from "date-fns/locale";

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

// Inicializar MercadoPago
if (typeof window !== "undefined") {
  initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!, {
    locale: "es-AR"
  });
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  salidaId: string;
  precio: string;
  cbu: string;
  alias: string;
  userId: string; // ⚡ Id del usuario que paga
  eventName?: string; // Nombre del evento para mostrar en MercadoPago
}

export default function PaymentModal({
  isOpen,
  onClose,
  salidaId,
  precio,
  cbu,
  alias,
  userId,
  eventName = "Evento",
}: PaymentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"transferencia" | "mercadopago">("mercadopago");
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loadingPreference, setLoadingPreference] = useState(false);
  const { data: session, status } = useSession();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  const createPreference = async () => {
    setLoadingPreference(true);
    try {
      const response = await fetch("/api/mercadopago/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          salidaId,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Error creando preferencia de pago");
      }

      const data = await response.json();
      setPreferenceId(data.preferenceId);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear la preferencia de pago");
    } finally {
      setLoadingPreference(false);
    }
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
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">{eventName}</p>
            <p className="text-2xl font-bold text-primary">
              ${Number(precio).toLocaleString("es-AR")}
            </p>
          </div>

          {/* Selector de método de pago */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Método de pago:</h4>

            <div className="space-y-2">
              {session?.user?.rol === "admin" ? (     <button
                onClick={() => setPaymentMethod("mercadopago")}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  paymentMethod === "mercadopago"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    paymentMethod === "mercadopago" ? "border-primary bg-primary" : "border-muted-foreground"
                  }`} />
                  <div>
                    <p className="font-medium text-foreground">MercadoPago</p>
                    <p className="text-xs text-muted-foreground">Tarjeta de crédito, débito, efectivo</p>
                  </div>
                </div>
              </button>) : null}
         

              <button
                onClick={() => setPaymentMethod("transferencia")}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  paymentMethod === "transferencia"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    paymentMethod === "transferencia" ? "border-primary bg-primary" : "border-muted-foreground"
                  }`} />
                  <div>
                    <p className="font-medium text-foreground">Transferencia Bancaria</p>
                    <p className="text-xs text-muted-foreground">CBU/Alias + comprobante</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {paymentMethod === "transferencia" && (
            <>
              <p className="text-sm text-muted-foreground">
                Transfiere ${precio} a la siguiente cuenta:
              </p>

          <div className="bg-muted rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">CBU:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(cbu)}
              >
                Copiar
              </Button>
            </div>
            <p className="text-sm break-all text-muted-foreground">{cbu}</p>

            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium text-foreground">Alias:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(alias)}
              >
                Copiar
              </Button>
            </div>
            <p className="text-sm break-all text-muted-foreground">{alias}</p>
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
            </>
          )}
        </div>

        <DialogFooter>
          {paymentMethod === "transferencia" ? (
            <Button onClick={handleEnviarPago} disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar comprobante"}
            </Button>
          ) : (
            <div className="w-full space-y-3">
              {!preferenceId ? (
                <Button
                  onClick={createPreference}
                  disabled={loadingPreference}
                  className="w-full"
                >
                  {loadingPreference ? "Preparando pago..." : "Pagar con MercadoPago"}
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Completa tu pago de forma segura:
                  </p>
                  <Wallet
                    initialization={{
                      preferenceId: preferenceId,
                    }}
                    customization={{
                      texts: {
                        valueProp: "smart_option",
                      },
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
