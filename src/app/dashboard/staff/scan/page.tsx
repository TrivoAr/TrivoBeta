"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";

type QrScannerProps = {
  onDecode: (decodedText: string) => void;
  onError?: (err: any) => void;
  constraints?: MediaTrackConstraints;
  scanDelay?: number;
};

const QrScanner = dynamic(() => import("@/components/QrScannerShim"), {
  ssr: false,
}) as unknown as React.ComponentType<QrScannerProps>;

function extractCodeFromText(text: string) {
  try {
    const u = new URL(text);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("r");
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
  } catch {}
  return text.trim();
}

export default function StaffScanPage() {
  const [lastCode, setLastCode] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const lastRedeemRef = useRef(0);

  const onDecodeAsync = useCallback(async (result: string) => {
    const now = Date.now();
    if (now - lastRedeemRef.current < 1500) return; // debounce
    lastRedeemRef.current = now;

    const code = extractCodeFromText(result);
    if (!code || code.length < 6) return;

    setLastCode(code);
    setStatusMsg("Verificando / canjeando…");
    setBusy(true);

    try {
      // 1) verificar
      const verRes = await fetch(`/api/tickets/verify/${code}`, {
        cache: "no-store",
      });
      const verData = await verRes.json();

      if (verRes.status === 404) {
        setStatusMsg("❌ Código inválido");
        return;
      }
      if (verData.status === "redeemed") {
        setStatusMsg(
          `⚠️ Ya canjeado: ${verData.redeemedAt ? new Date(verData.redeemedAt).toLocaleString() : "-"}`
        );
        return;
      }
      if (verData.status !== "issued") {
        setStatusMsg("❌ No canjeable (inválido/expirado)");
        return;
      }

      // 2) canjear (endpoint staff protegido)
      const res = await fetch("/api/staff/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "unauthorized" || data?.error === "forbidden") {
          setStatusMsg("🚫 No autorizado. Iniciá sesión con cuenta staff.");
        } else if (data?.error === "already_redeemed") {
          setStatusMsg(
            `⚠️ Ya canjeado: ${data?.redeemedAt ? new Date(data.redeemedAt).toLocaleString() : "-"}`
          );
        } else if (data?.error === "invalid_code") {
          setStatusMsg("❌ Código inválido.");
        } else {
          setStatusMsg("⚠️ Error al canjear.");
        }
      } else {
        setStatusMsg(
          data?.alreadyRedeemed ? "⚠️ Ya estaba canjeado." : "✅ Canje OK"
        );
        if ("vibrate" in navigator) (navigator as any).vibrate?.(100);
      }
    } catch {
      setStatusMsg("⚠️ Error de red.");
    } finally {
      setBusy(false);
    }
  }, []);

  // Wrapper sin async para que el tipo de prop sea correcto
  const onDecode = useCallback(
    (txt: string) => {
      void onDecodeAsync(txt);
    },
    [onDecodeAsync]
  );

  const onError = useCallback((err: any) => {
    setStatusMsg("⚠️ Error de cámara o permisos.");
  }, []);

  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Escáner de Tickets (Staff)</h1>

      <div className="rounded-2xl overflow-hidden border">
        <QrScanner
          onDecode={onDecode}
          onError={onError}
          constraints={{ facingMode: "environment" }}
          scanDelay={300}
        />
      </div>

      <div className="rounded-xl border p-4 space-y-2">
        <p className="text-sm text-slate-500">Último código detectado:</p>
        <p className="font-mono">{lastCode || "-"}</p>
        <p className={`text-sm ${busy ? "text-blue-600" : "text-slate-700"}`}>
          {statusMsg}
        </p>
      </div>
    </main>
  );
}
