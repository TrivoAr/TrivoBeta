"use client";

import React, { useState } from "react";
import { SlideUpModal } from "@/components/base/AnimatedModal";
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
import { useQueryClient } from "@tanstack/react-query";

// CSS styles for MercadoPago night theme
const mercadoPagoNightStyles = `
  .mercadopago-night-theme .mp-wallet-container,
  .mercadopago-night-theme .mp-wallet-container * {
    color: #e2e8f0 !important;
  }
  .mercadopago-night-theme .mp-wallet-container p,
  .mercadopago-night-theme .mp-wallet-container span,
  .mercadopago-night-theme .mp-wallet-container div {
    color: #e2e8f0 !important;
  }
  .mercadopago-night-theme button {
    color: #ffffff !important;
  }
`;

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
    locale: "es-AR",
  });
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  salidaId?: string; // Opcional para eventos sociales
  academiaId?: string; // Opcional para academias
  precio: string;
  cbu: string;
  alias: string;
  userId: string; // ⚡ Id del usuario que paga
  eventName?: string; // Nombre del evento para mostrar en MercadoPago
  onProcessingChange?: (isProcessing: boolean) => void; // Para comunicar el estado de procesamiento
  isNight?: boolean; // Para tema nocturno
}

export default function PaymentModal({
  isOpen,
  onClose,
  salidaId,
  academiaId,
  precio,
  cbu,
  alias,
  userId,
  eventName = "Evento",
  onProcessingChange,
  isNight = false,
}: PaymentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "transferencia" | "mercadopago" | "transferencia_mp"
  >("mercadopago");
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loadingPreference, setLoadingPreference] = useState(false);
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();

  // Inject CSS styles for night theme
  React.useEffect(() => {
    if (isNight && isOpen) {
      const styleId = "mercadopago-night-styles";
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;

      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = styleId;
        styleElement.textContent = mercadoPagoNightStyles;
        document.head.appendChild(styleElement);
      }
    }
  }, [isNight, isOpen]);

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
          academiaId,
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
      onProcessingChange?.(true); // Comunicar que se está procesando

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
          academiaId,
          userId,
          comprobanteUrl: url,
        }),
      });

      if (!resPago.ok) {
        toast.error("Error al enviar comprobante.");
        return;
      }

      const pagoData = await resPago.json();

      // 3️⃣ Crear solicitud de unirse con estado pendiente y asociando el pago
      const apiUrl = salidaId ? "/api/social/unirse" : "/api/academias/unirse";
      const bodyData = salidaId
        ? { salidaId, pago_id: pagoData.pago._id }
        : {
            academia_id: academiaId,
            user_id: userId,
            pago_id: pagoData.pago._id,
          };

      const resUnirse = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (resUnirse.ok) {
        toast.success("Solicitud enviada. Espera aprobación del organizador.");

        // Invalidar queries para actualizar la UI
        if (salidaId) {
          queryClient.invalidateQueries({
            queryKey: ["payment-status", salidaId],
          });
          queryClient.invalidateQueries({
            queryKey: ["unido", salidaId, userId],
          });
          queryClient.invalidateQueries({ queryKey: ["miembros", salidaId] });
        } else if (academiaId) {
          queryClient.invalidateQueries({
            queryKey: ["payment-status-academia", academiaId],
          });
          queryClient.invalidateQueries({
            queryKey: ["miembro-academia", academiaId, userId],
          });
          queryClient.invalidateQueries({
            queryKey: ["miembros-academia", academiaId],
          });
        }

        onClose(); // cerrar modal
      } else {
        const msg = await resUnirse.text();
        toast.error("Pago guardado pero fallo al enviar solicitud: " + msg);
      }
    } catch (error) {
      toast.error("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
      onProcessingChange?.(false); // Comunicar que ya no se está procesando
    }
  };

  /**
   * Maneja la confirmación de transferencia a CVU de MercadoPago
   * Crea el pago pendiente ANTES de que el usuario transfiera
   */
  const handleConfirmarTransferenciaMP = async () => {
    try {
      setIsLoading(true);
      onProcessingChange?.(true);

      // 1. Crear pago pendiente en BD
      const response = await fetch("/api/pagos/pending-transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          salidaId,
          academiaId,
          amount: Number(precio),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al registrar pago");
      }

      const data = await response.json();

      console.log("✅ Pago pendiente creado:", data.pagoId);
      console.log("📌 External Reference:", data.externalReference);

      // 2. Invalidar queries para actualizar UI
      queryClient.invalidateQueries({
        queryKey: ["payment-status", salidaId],
      });
      queryClient.invalidateQueries({
        queryKey: ["unido", salidaId, userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["miembros", salidaId]
      });

      // 3. Mostrar mensaje de éxito
      toast.success(
        "Pago registrado correctamente. Ahora transfiere al CVU mostrado y recibirás notificación automática cuando se apruebe.",
        { duration: 7000 }
      );

      // 4. Cerrar modal
      onClose();

    } catch (error) {
      console.error("❌ Error al registrar pago pendiente:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al registrar el pago. Intenta de nuevo."
      );
    } finally {
      setIsLoading(false);
      onProcessingChange?.(false);
    }
  };

  return (
    <SlideUpModal
      isOpen={isOpen}
      onClose={onClose}
      title="Pago de inscripción"
      size="default"
      isNight={isNight}
      footer={
        // Footer para transferencia manual (solo salidas sociales)
        paymentMethod === "transferencia" && salidaId ? (
          <div className="flex justify-end">
            <Button onClick={handleEnviarPago} disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar comprobante"}
            </Button>
          </div>
        ) : paymentMethod === "transferencia_mp" && salidaId ? (
          // Footer para transferencia MP automática
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleConfirmarTransferenciaMP}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Registrando pago..." : "Entendido, voy a transferir"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Recibirás notificación automática al completar la transferencia
            </p>
          </div>
        ) : (
          // Footer para MercadoPago (salidas sociales y academias)
          <div className="w-full space-y-3">
            {!preferenceId ? (
              <Button
                onClick={createPreference}
                disabled={loadingPreference}
                className="w-full"
              >
                {loadingPreference
                  ? "Preparando pago..."
                  : academiaId
                    ? "Configurar Suscripción"
                    : "Pagar con MercadoPago"}
              </Button>
            ) : (
              <div className="space-y-2">
                <p
                  className={`text-sm text-center ${
                    isNight ? "theme-text-secondary" : "text-muted-foreground"
                  }`}
                >
                  {academiaId
                    ? "Configura tu suscripción mensual de forma segura:"
                    : "Completa tu pago de forma segura:"}
                </p>
                <div className={isNight ? "mercadopago-night-theme" : ""}>
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
              </div>
            )}
          </div>
        )
      }
    >
      <div className="space-y-4">
        <div className="text-center">
          <p
            className={`text-lg font-semibold ${
              isNight ? "theme-text-primary" : "text-foreground"
            }`}
          >
            {eventName}
          </p>
          <p
            className={`text-2xl font-bold ${
              isNight ? "text-orange-400" : "text-primary"
            }`}
          >
            ${Number(precio).toLocaleString("es-AR")}
          </p>
        </div>

        {/* Selector de método de pago - Solo para salidas sociales */}
        {salidaId && (
          <div className="space-y-3">
            <h4
              className={`text-sm font-medium ${
                isNight ? "theme-text-primary" : "text-foreground"
              }`}
            >
              Método de pago:
            </h4>

            <div className="space-y-2">
              <button
                onClick={() => setPaymentMethod("mercadopago")}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  paymentMethod === "mercadopago"
                    ? isNight
                      ? "border-orange-400 bg-orange-400/10"
                      : "border-primary bg-primary/5"
                    : isNight
                      ? "border-gray-600 hover:bg-gray-700"
                      : "border-border hover:bg-muted"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      paymentMethod === "mercadopago"
                        ? isNight
                          ? "border-orange-400 bg-orange-400"
                          : "border-primary bg-primary"
                        : isNight
                          ? "border-gray-400"
                          : "border-muted-foreground"
                    }`}
                  />
                  <div>
                    <p
                      className={`font-medium ${
                        isNight ? "theme-text-primary" : "text-foreground"
                      }`}
                    >
                      MercadoPago
                    </p>
                    <p
                      className={`text-xs ${
                        isNight
                          ? "theme-text-secondary"
                          : "text-muted-foreground"
                      }`}
                    >
                      Tarjeta de crédito, débito, efectivo
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod("transferencia_mp")}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  paymentMethod === "transferencia_mp"
                    ? isNight
                      ? "border-orange-400 bg-orange-400/10"
                      : "border-primary bg-primary/5"
                    : isNight
                      ? "border-gray-600 hover:bg-gray-700"
                      : "border-border hover:bg-muted"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      paymentMethod === "transferencia_mp"
                        ? isNight
                          ? "border-orange-400 bg-orange-400"
                          : "border-primary bg-primary"
                        : isNight
                          ? "border-gray-400"
                          : "border-muted-foreground"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-medium ${
                          isNight ? "theme-text-primary" : "text-foreground"
                        }`}
                      >
                        Transferencia a CVU MercadoPago
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 font-semibold">
                        ⚡ Automático
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-0.5 ${
                        isNight
                          ? "theme-text-secondary"
                          : "text-muted-foreground"
                      }`}
                    >
                      Aprobación instantánea sin comprobante
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod("transferencia")}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  paymentMethod === "transferencia"
                    ? isNight
                      ? "border-orange-400 bg-orange-400/10"
                      : "border-primary bg-primary/5"
                    : isNight
                      ? "border-gray-600 hover:bg-gray-700"
                      : "border-border hover:bg-muted"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      paymentMethod === "transferencia"
                        ? isNight
                          ? "border-orange-400 bg-orange-400"
                          : "border-primary bg-primary"
                        : isNight
                          ? "border-gray-400"
                          : "border-muted-foreground"
                    }`}
                  />
                  <div>
                    <p
                      className={`font-medium ${
                        isNight ? "theme-text-primary" : "text-foreground"
                      }`}
                    >
                      Transferencia Bancaria Tradicional
                    </p>
                    <p
                      className={`text-xs ${
                        isNight
                          ? "theme-text-secondary"
                          : "text-muted-foreground"
                      }`}
                    >
                      CBU/Alias + comprobante (aprobación manual)
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Para academias: solo MercadoPago (suscripciones) */}
        {academiaId && (
          <div className="space-y-3">
            <div
              className={`p-4 rounded-lg ${
                isNight
                  ? "bg-gray-700/50 border border-gray-600"
                  : "bg-muted border border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={isNight ? "text-orange-400" : "text-primary"}
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <div className="flex-1">
                  <p
                    className={`font-medium text-sm ${
                      isNight ? "theme-text-primary" : "text-foreground"
                    }`}
                  >
                    Pago mediante suscripción
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isNight ? "theme-text-secondary" : "text-muted-foreground"
                    }`}
                  >
                    El pago de academias se procesa automáticamente mediante
                    Mercado Pago con cobro mensual
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transferencia a CVU de MercadoPago (NUEVO - Automático) */}
        {paymentMethod === "transferencia_mp" && (
          <>
            <div
              className={`rounded-lg p-4 border-2 ${
                isNight
                  ? "bg-green-900/20 border-green-500/50"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className="flex-1">
                  <h4
                    className={`font-bold text-sm mb-1 ${
                      isNight ? "text-green-300" : "text-green-800"
                    }`}
                  >
                    ⚡ Aprobación Automática
                  </h4>
                  <p
                    className={`text-xs ${
                      isNight ? "text-green-200" : "text-green-700"
                    }`}
                  >
                    Al transferir al CVU de MercadoPago, tu pago será aprobado
                    automáticamente en segundos. No necesitas subir comprobante.
                  </p>
                </div>
              </div>
            </div>

            <p
              className={`text-sm font-medium ${
                isNight ? "theme-text-primary" : "text-foreground"
              }`}
            >
              Transfiere ${precio} a la siguiente cuenta de MercadoPago:
            </p>

            <div
              className={`rounded-lg p-4 space-y-3 border ${
                isNight
                  ? "bg-gray-700 border-gray-600"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    isNight ? "theme-text-primary" : "text-foreground"
                  }`}
                >
                  CVU MercadoPago:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleCopy(
                      process.env.NEXT_PUBLIC_MP_CVU || "CVU_NO_CONFIGURADO"
                    )
                  }
                  className={isNight ? "border-gray-500 hover:bg-gray-600" : ""}
                >
                  📋 Copiar
                </Button>
              </div>
              <p
                className={`text-sm break-all font-mono font-bold ${
                  isNight ? "text-blue-300" : "text-blue-700"
                }`}
              >
                {process.env.NEXT_PUBLIC_MP_CVU || "CVU_NO_CONFIGURADO"}
              </p>

              <div className="flex items-center justify-between mt-2">
                <span
                  className={`text-sm font-medium ${
                    isNight ? "theme-text-primary" : "text-foreground"
                  }`}
                >
                  Alias MercadoPago:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleCopy(
                      process.env.NEXT_PUBLIC_MP_ALIAS || "ALIAS_NO_CONFIGURADO"
                    )
                  }
                  className={isNight ? "border-gray-500 hover:bg-gray-600" : ""}
                >
                  📋 Copiar
                </Button>
              </div>
              <p
                className={`text-sm break-all font-bold ${
                  isNight ? "text-blue-300" : "text-blue-700"
                }`}
              >
                {process.env.NEXT_PUBLIC_MP_ALIAS || "ALIAS_NO_CONFIGURADO"}
              </p>

              <div className="flex items-center justify-between mt-2">
                <span
                  className={`text-sm font-medium ${
                    isNight ? "theme-text-primary" : "text-foreground"
                  }`}
                >
                  Monto:
                </span>
                <span
                  className={`text-lg font-bold ${
                    isNight ? "text-green-400" : "text-green-600"
                  }`}
                >
                  ${Number(precio).toLocaleString("es-AR")}
                </span>
              </div>
            </div>

            <div
              className={`rounded-lg p-3 border ${
                isNight
                  ? "bg-yellow-900/20 border-yellow-500/50"
                  : "bg-yellow-50 border-yellow-200"
              }`}
            >
              <p
                className={`text-xs ${
                  isNight ? "text-yellow-200" : "text-yellow-800"
                }`}
              >
                <strong>📌 Importante:</strong> Una vez que realices la
                transferencia, recibirás una notificación de aprobación en
                segundos. El pago se procesará automáticamente.
              </p>
            </div>
          </>
        )}

        {/* Transferencia Bancaria Tradicional (Manual) */}
        {paymentMethod === "transferencia" && (
          <>
            <p
              className={`text-sm ${
                isNight ? "theme-text-secondary" : "text-muted-foreground"
              }`}
            >
              Transfiere ${precio} a la siguiente cuenta:
            </p>

            <div
              className={`rounded-lg p-3 space-y-2 ${
                isNight ? "bg-gray-700" : "bg-muted"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    isNight ? "theme-text-primary" : "text-foreground"
                  }`}
                >
                  CBU:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(cbu)}
                  className={isNight ? "border-gray-500 hover:bg-gray-600" : ""}
                >
                  Copiar
                </Button>
              </div>
              <p
                className={`text-sm break-all ${
                  isNight ? "theme-text-secondary" : "text-muted-foreground"
                }`}
              >
                {cbu}
              </p>

              <div className="flex items-center justify-between mt-2">
                <span
                  className={`text-sm font-medium ${
                    isNight ? "theme-text-primary" : "text-foreground"
                  }`}
                >
                  Alias:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(alias)}
                  className={isNight ? "border-gray-500 hover:bg-gray-600" : ""}
                >
                  Copiar
                </Button>
              </div>
              <p
                className={`text-sm break-all ${
                  isNight ? "theme-text-secondary" : "text-muted-foreground"
                }`}
              >
                {alias}
              </p>
            </div>

            <div
              className={`rounded-lg p-3 border ${
                isNight
                  ? "bg-yellow-900/20 border-yellow-500/50"
                  : "bg-yellow-50 border-yellow-200"
              }`}
            >
              <p
                className={`text-xs ${
                  isNight ? "text-yellow-200" : "text-yellow-800"
                }`}
              >
                ⚠️ Este método requiere aprobación manual del organizador.
                Puede demorar horas o días.
              </p>
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
    </SlideUpModal>
  );
}
