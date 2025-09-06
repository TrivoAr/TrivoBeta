"use client";

import { useEffect, useState } from "react";

export default function TicketStaffPage({ params }: { params: { code: string } }) {
  const { code } = params;
  const [state, setState] = useState<any>({ loading: true });
  const [redeeming, setRedeeming] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/tickets/verify/${code}`, { cache: "no-store" });
      const data = await res.json();
      setState({ loading: false, ...data });
    })();
  }, [code]);

  async function handleRedeem() {
    setRedeeming(true);
    setMsg("");
    const res = await fetch(`/api/staff/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setRedeeming(false);

    if (!res.ok) {
      setMsg("⚠️ " + (data.error || "Error al canjear"));
    } else {
      setMsg("✅ Canjeado correctamente");
    }

    const res2 = await fetch(`/api/tickets/verify/${code}`, { cache: "no-store" });
    setState({ loading: false, ...(await res2.json()) });
  }

  const isIssued = state.status === "issued";
  const isRedeemed = state.status === "redeemed";

  return (
    <main className="mx-auto max-w-[420px] min-h-dvh bg-neutral-50 flex flex-col">
      <header className="p-6">
        <h2 className="text-sm font-medium text-slate-500">Control de acceso</h2>
        {state.salidaNombre && (
          <h1 className="mt-1 text-lg font-bold text-slate-900">
            {state.salidaNombre}
          </h1>
        )}
        <p className="mt-1 text-sm text-slate-600">
          {isIssued && "Entrada lista para canjear."}
          {isRedeemed &&
            `Ya fue canjeada el ${
              state.redeemedAt ? new Date(state.redeemedAt).toLocaleString() : "-"
            }`}
          {!isIssued && !isRedeemed && "El código es inválido o vencido."}
        </p>
      </header>

      {/* Mensaje feedback */}
      {msg && (
        <div className="mx-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
          {msg}
        </div>
      )}

      {/* Botón sticky */}
      <footer className="mt-auto sticky bottom-0 border-t border-slate-200 bg-white/90 p-4 backdrop-blur">
        <button
          onClick={handleRedeem}
          disabled={redeeming || !isIssued}
          className={`h-12 w-full rounded-xl text-[15px] font-semibold shadow-sm transition ${
            isIssued
              ? "bg-emerald-600 text-white hover:bg-emerald-500"
              : "bg-slate-300 text-slate-500"
          }`}
        >
          {redeeming ? "Canjeando…" : "Canjear entrada"}
        </button>
      </footer>
    </main>
  );
}
