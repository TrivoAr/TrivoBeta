"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { PDFDocumentProxy } from "pdfjs-dist";

interface Pago {
  _id: string;
  comprobanteUrl: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  userId: string;
}

interface PaymentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  miembroId: string;
  pagoId?: string;
}

const Document = dynamic<{
  file: string | File | Uint8Array;
  onLoadSuccess?: (pdf: PDFDocumentProxy) => void;
  children: React.ReactNode;
}>(
  () => import("react-pdf/dist/esm/entry.webpack").then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic<{ pageNumber: number; width?: number }>(
  () => import("react-pdf/dist/esm/entry.webpack").then((mod) => mod.Page),
  { ssr: false }
);

export default function PaymentReviewModal({
  isOpen,
  onClose,
  miembroId,
  pagoId,
}: PaymentReviewModalProps) {
  const [pago, setPago] = useState<Pago | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pagoId) return;
    const fetchPago = async () => {
      try {
        const res = await fetch(`/api/pagos/${pagoId}`);
        if (!res.ok) throw new Error("Error al cargar pago");
        const data = await res.json();
        setPago(data);
      } catch (error) {
        toast.error("No se pudo cargar el pago");
      }
    };
    fetchPago();
  }, [pagoId]);

  const handleUpdateEstado = async (nuevoEstado: "aprobado" | "rechazado") => {
    if (!pago) return;
    try {
      setLoading(true);

      const resPago = await fetch(`/api/pagos/${pago._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!resPago.ok) throw new Error("Error al actualizar pago");

      toast.success(`Pago ${nuevoEstado} con éxito`);
      setPago({ ...pago, estado: nuevoEstado });

      onClose();
      window.location.reload();
    } catch (error) {
      toast.error("No se pudo actualizar el estado del pago");
    } finally {
      setLoading(false);
    }
  };

  if (!pagoId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisión de Pago</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Este participante todavía no subió un comprobante de pago.
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Revisión de Pago</DialogTitle>
        </DialogHeader>

        {pago ? (
          <div className="space-y-4">
            <p className="text-sm">
              Estado actual:{" "}
              <span
                className={`font-bold capitalize ${
                  pago.estado === "aprobado"
                    ? "text-green-600"
                    : pago.estado === "rechazado"
                      ? "text-red-600"
                      : "text-yellow-600"
                }`}
              >
                {pago.estado}
              </span>
            </p>

            <div className="border rounded-lg max-h-[400px] overflow-auto">
              <p className="text-sm mb-2">Comprobante:</p>
              {pago.comprobanteUrl.endsWith(".pdf") ? (
                <div className="border rounded-lg overflow-auto">
                  <Document file={pago.comprobanteUrl}>
                    <Page pageNumber={1} width={500} />
                  </Document>
                </div>
              ) : (
                <a
                  href={pago.comprobanteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={pago.comprobanteUrl}
                    alt="Comprobante de pago"
                    className="max-h-[380px] w-auto mx-auto rounded-lg border object-contain"
                  />
                </a>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Cargando datos del pago...</p>
        )}

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={() => handleUpdateEstado("rechazado")}
            disabled={loading}
            className="mt-4"
          >
            Rechazar
          </Button>
          <Button
            onClick={() => handleUpdateEstado("aprobado")}
            disabled={loading}
          >
            Aprobar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
