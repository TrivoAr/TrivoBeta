"use client";

import { useState } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Inicializar MercadoPago con tu Public Key
if (typeof window !== "undefined") {
  initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!, {
    locale: "es-AR",
  });
}

interface MercadoPagoCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  salidaId: string;
  precio: string;
  userId: string;
  eventName: string;
}

export default function MercadoPagoCheckout({
  isOpen,
  onClose,
  salidaId,
  precio,
  userId,
  eventName,
}: MercadoPagoCheckoutProps) {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "mercadopago" | "transferencia"
  >("mercadopago");

  const createPreference = async () => {
    setLoading(true);
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
      toast.error("Error al crear la preferencia de pago");
    } finally {
      setLoading(false);
    }
  };

  const handleTransferenciaClick = () => {
    // Cerrar este modal y abrir el modal de transferencia original
    onClose();
    // Aquí puedes llamar a la función que abre el PaymentModal original
    toast.info("Redirigiendo al pago por transferencia...");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pago de inscripción</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">
              {eventName}
            </h3>
            <p className="text-2xl font-bold text-primary">
              ${Number(precio).toLocaleString("es-AR")}
            </p>
          </div>

          {/* Selector de método de pago */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">
              Método de pago:
            </h4>

            <div className="space-y-2">
              <button
                onClick={() => setPaymentMethod("mercadopago")}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  paymentMethod === "mercadopago"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      paymentMethod === "mercadopago"
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}
                  />
                  <div>
                    <p className="font-medium text-foreground">MercadoPago</p>
                    <p className="text-xs text-muted-foreground">
                      Tarjeta de crédito, débito, efectivo
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod("transferencia")}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  paymentMethod === "transferencia"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      paymentMethod === "transferencia"
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}
                  />
                  <div>
                    <p className="font-medium text-foreground">
                      Transferencia Bancaria
                    </p>
                    <p className="text-xs text-muted-foreground">
                      CBU/Alias + comprobante
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Botón de acción */}
          {paymentMethod === "mercadopago" ? (
            <div className="space-y-3">
              {!preferenceId ? (
                <Button
                  onClick={createPreference}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Preparando pago..." : "Pagar con MercadoPago"}
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
          ) : (
            <Button
              onClick={handleTransferenciaClick}
              variant="outline"
              className="w-full"
            >
              Continuar con transferencia
            </Button>
          )}

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>🔒 Pago 100% seguro</p>
            <p>Tu información está protegida</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
