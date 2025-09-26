// "use client";

// import { useEffect, useState } from "react";

// type VerifyState = {
//   loading: boolean;
//   status?: "issued" | "redeemed" | "invalid";
//   redeemedAt?: string | null;
//   error?: string;
// };

// export default function QRVerifyPage({ params }: { params: { code: string } }) {
//   const { code } = params;
//   // const [state, setState] = useState<VerifyState>({ loading: true });
//   const [state, setState] = useState<{
//     loading: boolean;
//     status?: string;
//     redeemedAt?: string | null;
//     salidaNombre?: string | null;
//     error?: string;
//   }>({ loading: true });
//   const [redeeming, setRedeeming] = useState(false);
//   const [msg, setMsg] = useState<string>("");

//   // === fetch de estado ===
//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await fetch(`/api/tickets/verify/${code}`, {
//           cache: "no-store",
//         });
//         const data = await res.json();
//         setState({ loading: false, ...data });
//       } catch {
//         setState({ loading: false, status: "invalid", error: "network_error" });
//       }
//     })();
//   }, [code]);

//   // === canje (sólo pruebas) ===
//   async function handleRedeem() {
//     try {
//       setRedeeming(true);
//       setMsg("");
//       const res = await fetch(`/api/staff/redeem`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           // clave de test para ambiente local
//           "x-scanner-key": process.env.NEXT_PUBLIC_SCANNER_TEST_KEY || "",
//         },
//         body: JSON.stringify({ code }),
//       });

//       const data = await res.json();
//       if (!res.ok) {
//         if (data?.error === "already_redeemed") {
//           setMsg(
//             `⚠️ Ya estaba canjeada${
//               data.redeemedAt
//                 ? ` (${new Date(data.redeemedAt).toLocaleString()})`
//                 : ""
//             }`
//           );
//         } else if (data?.error === "invalid_code") {
//           setMsg("❌ Código inválido");
//         } else if (
//           data?.error === "forbidden" ||
//           data?.error === "unauthorized"
//         ) {
//           setMsg("🚫 No autorizado para canjear");
//         } else if (data?.error === "not_issuable") {
//           setMsg("⚠️ No canjeable");
//         } else {
//           setMsg("⚠️ Error al canjear");
//         }
//       } else {
//         setMsg("✅ Canjeado correctamente");
//       }

//       // refrescar estado
//       const res2 = await fetch(`/api/tickets/verify/${code}`, {
//         cache: "no-store",
//       });
//       setState({ loading: false, ...(await res2.json()) });

//       // vibración sutil si está disponible
//       (navigator as any)?.vibrate?.(80);
//     } catch {
//       setMsg("⚠️ Error de red");
//     } finally {
//       setRedeeming(false);
//     }
//   }

//   // === helpers UI ===
//   const isIssued = state.status === "issued";
//   const isRedeemed = state.status === "redeemed";
//   const isInvalid = !isIssued && !isRedeemed;

//   function StatusChip() {
//     if (isIssued)
//       return (
//         <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
//           <span className="h-2 w-2 rounded-full bg-emerald-500" /> Válida
//         </span>
//       );
//     if (isRedeemed)
//       return (
//         <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
//           <span className="h-2 w-2 rounded-full bg-rose-500" /> Ya canjeada
//         </span>
//       );
//     return (
//       <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
//         <span className="h-2 w-2 rounded-full bg-slate-500" /> Inválida
//       </span>
//     );
//   }

//   // === loading skeleton ===
//   if (state.loading) {
//     return (
//       <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col bg-neutral-50">
//         <header className="p-4">
//           <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
//           <div className="mt-3 h-7 w-48 animate-pulse rounded bg-slate-200" />
//           <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-200" />
//         </header>
//         <section className="mx-4 mt-4 rounded-xl border bg-white p-4">
//           <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
//           <div className="mt-3 h-4 w-24 animate-pulse rounded bg-slate-200" />
//         </section>
//         <footer className="sticky bottom-0 z-10 mt-auto border-t bg-white p-4">
//           <div className="h-11 w-full animate-pulse rounded-lg bg-slate-200" />
//         </footer>
//       </main>
//     );
//   }

//   return (
//     <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col bg-neutral-50">
//       {/* Header */}
//       <header className="px-4 pb-3 pt-5">
//         <StatusChip />

//         <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-slate-900">
//           {isIssued && "Entrada válida"}
//           {isRedeemed && "Entrada ya canjeada"}
//           {isInvalid && "Entrada inválida"}
//         </h1>
//           {state.salidaNombre && (
//             <p className="mt-1 text-base  font-medium text-slate-700">
//               {state.salidaNombre}
//             </p>
//           )}

//         <p className="mt-1 text-sm text-slate-600">
//           {isIssued && "Mostrá esta pantalla al staff para canjear."}
//           {isRedeemed &&
//             `Fecha de canje: ${
//               state.redeemedAt
//                 ? new Date(state.redeemedAt).toLocaleString()
//                 : "-"
//             }`}
//           {isInvalid &&
//             "El código no es válido. Verificá que el enlace sea correcto."}
//         </p>
//       </header>

//       {/* Details card (solo si hay info) */}
//       {(isRedeemed || msg) && (
//         <section className="mx-4 mt-2 rounded-xl border border-slate-200 bg-white p-4">
//           {isRedeemed && (
//             <div className="flex items-center justify-between">
//               <div className="text-sm font-medium text-slate-700">Estado</div>
//               <div className="text-sm font-semibold text-rose-600">
//                 Canjeada
//               </div>
//             </div>
//           )}

//           {msg && (
//             <div
//               className={`mt-3 rounded-lg px-3 py-2 text-sm ${
//                 msg.startsWith("✅")
//                   ? "bg-emerald-50 text-emerald-700"
//                   : msg.startsWith("⚠️")
//                     ? "bg-amber-50 text-amber-800"
//                     : msg.startsWith("🚫") || msg.startsWith("❌")
//                       ? "bg-rose-50 text-rose-700"
//                       : "bg-slate-50 text-slate-700"
//               }`}
//             >
//               {msg}
//             </div>
//           )}
//         </section>
//       )}

//       {/* Spacer para no tapar contenido con el botón sticky */}
//       <div className="h-20" />

//       {/* Sticky action (solo pruebas) */}
//       <footer className="sticky bottom-0 z-10 mt-auto border-t border-slate-200 bg-white/90 p-4 backdrop-blur">
//         <button
//           onClick={handleRedeem}
//           disabled={redeeming || !isIssued}
//           className={`h-12 w-full rounded-xl text-[15px] font-medium shadow-sm transition ${
//             isIssued
//               ? "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-900 disabled:opacity-40"
//               : "bg-slate-200 text-slate-500"
//           }`}
//         >
//           {redeeming ? "Canjeando…" : "Canjear (solo pruebas)"}
//         </button>

//         <p className="mt-2 text-center text-[11px] text-slate-500">
//           Este botón existe solo en desarrollo. En producción canjea el staff
//           desde su app.
//         </p>
//       </footer>
//     </main>
//   );
// }

"use client";

import { useEffect, useState } from "react";

export default function TicketPage({ params }: { params: { code: string } }) {
  const { code } = params;
  const [state, setState] = useState<any>({ loading: true });
  const [redeeming, setRedeeming] = useState(false);
  const [msg, setMsg] = useState("");

  // === fetch estado ===
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/tickets/verify/${code}`, {
          cache: "no-store",
        });
        const data = await res.json();
        setState({ loading: false, ...data });
      } catch {
        setState({ loading: false, status: "invalid", error: "network_error" });
      }
    })();
  }, [code]);

  // === canje staff ===
  async function handleRedeem() {
    try {
      setRedeeming(true);
      setMsg("");
      const res = await fetch(`/api/staff/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "already_redeemed") {
          setMsg(
            `⚠️ Ya estaba canjeada ${data.redeemedAt ? `(${new Date(data.redeemedAt).toLocaleString()})` : ""}`
          );
        } else if (data?.error === "forbidden") {
          setMsg("🚫 No autorizado para canjear");
        } else if (data?.error === "invalid_code") {
          setMsg("❌ Código inválido");
        } else {
          setMsg("⚠️ Error al canjear");
        }
      } else {
        setMsg("✅ Canjeado correctamente");
      }

      // refrescar estado
      const res2 = await fetch(`/api/tickets/verify/${code}`, {
        cache: "no-store",
      });
      setState({ loading: false, ...(await res2.json()) });
    } finally {
      setRedeeming(false);
    }
  }

  const isIssued = state.status === "issued";
  const isRedeemed = state.status === "redeemed";
  const isInvalid = !isIssued && !isRedeemed;

  function StatusChip() {
    if (isIssued)
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Válida
        </span>
      );
    if (isRedeemed)
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700">
          <span className="h-2 w-2 rounded-full bg-rose-500" /> Ya canjeada
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
        <span className="h-2 w-2 rounded-full bg-slate-500" /> Inválida
      </span>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[420px] flex-col bg-neutral-50">
      <header className="px-4 pb-3 pt-5">
        <StatusChip />
        {state.salidaNombre && (
          <h2 className="mt-1 text-base font-semibold text-slate-900">
            {state.salidaNombre}
          </h2>
        )}
        <h1 className="mt-2 text-[22px] font-semibold tracking-tight text-slate-900">
          {isIssued && "Entrada válida"}
          {isRedeemed && "Entrada ya canjeada"}
          {isInvalid && "Entrada inválida"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {isIssued && "Mostrá esta pantalla al staff para canjear."}
          {isRedeemed &&
            `Canjeada el ${state.redeemedAt ? new Date(state.redeemedAt).toLocaleString() : "-"}`}
          {isInvalid && "El código no es válido o ya venció."}
        </p>
      </header>

      {/* feedback msg */}
      {msg && (
        <div className="mx-4 mt-2 rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-700">
          {msg}
        </div>
      )}

      {/* botón solo staff */}
      <footer className="sticky bottom-0 z-10 mt-auto border-t border-slate-200 bg-white/90 p-4 backdrop-blur">
        <button
          onClick={handleRedeem}
          disabled={redeeming || !isIssued}
          className={`h-12 w-full rounded-xl text-[15px] font-medium shadow-sm transition ${
            isIssued
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          {redeeming ? "Canjeando…" : "Canjear entrada"}
        </button>
        <p className="mt-2 text-center text-[11px] text-slate-500">
          Solo el creador o profesor de la salida pueden canjear esta entrada.
        </p>
      </footer>
    </main>
  );
}
