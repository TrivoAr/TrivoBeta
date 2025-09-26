"use client";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useState } from "react";

export default function ScanPage({ params }: { params: { id: string } }) {
  const [result, setResult] = useState<string | null>(null);

  const handleScan = (codes: { rawValue: string }[]) => {
    if (codes.length > 0) {
      setResult(codes[0].rawValue);
      window.location.href = `/r/${codes[0].rawValue}`;
    }
  };

  return (
    <main className="p-4 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4">Escanear tickets</h1>
      <div className="w-full max-w-xs rounded-lg overflow-hidden shadow-md">
        <Scanner onScan={handleScan} />
      </div>
      {result && (
        <p className="mt-3 text-sm text-slate-600">Escaneado: {result}</p>
      )}
    </main>
  );
}
