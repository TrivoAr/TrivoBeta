"use client";

import { useEffect, useState } from "react";

export default function TicketUserPage({
  params,
}: {
  params: { code: string };
}) {
  const { code } = params;
  const [state, setState] = useState<{
    loading: boolean;
    status?: "issued" | "redeemed" | "invalid";
    redeemedAt?: string | null;
    salidaNombre?: string | null;
  }>({ loading: true });

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/tickets/verify/${code}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setState({ loading: false, ...data });
    })();
  }, [code]);

  if (state.loading) {
    return (
      <main className="mx-auto max-w-[420px] min-h-dvh p-6 bg-neutral-50">
        <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-7 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-200" />
      </main>
    );
  }

  const isIssued = state.status === "issued";
  const isRedeemed = state.status === "redeemed";

  return (
    <main className="mx-auto max-w-[420px] min-h-dvh p-6 bg-neutral-50 flex flex-col">
      {/* Estado */}
      <div className="mb-4">
        {isIssued && (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Válida
          </span>
        )}
        {isRedeemed && (
          <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-700">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Ya canjeada
          </span>
        )}
        {!isIssued && !isRedeemed && (
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700">
            <span className="h-2 w-2 rounded-full bg-slate-500" /> Inválida
          </span>
        )}
      </div>

      {/* Nombre salida */}
      {state.salidaNombre && (
        <h2 className="text-xl font-bold text-slate-900">
          {state.salidaNombre}
        </h2>
      )}

      {/* Título */}
      <h1 className="mt-2 text-[22px] font-semibold text-slate-900">
        {isIssued && "Entrada válida"}
        {isRedeemed && "Entrada ya canjeada"}
        {!isIssued && !isRedeemed && "Entrada inválida"}
      </h1>

      {/* Subtexto */}
      <p className="mt-1 text-sm text-slate-600">
        {isIssued && "Mostrá esta pantalla al staff para ingresar."}
        {isRedeemed &&
          `Fue canjeada el ${
            state.redeemedAt ? new Date(state.redeemedAt).toLocaleString() : "-"
          }`}
        {!isIssued && !isRedeemed && "El código no es válido o ya expiró."}
      </p>
    </main>
  );
}
