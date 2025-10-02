"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ImageService } from "@/libs/services/ImageService";

interface Miembro {
  userId: string;
  nombre: string;
  email: string;
  imagen?: string;
}

interface Asistencia {
  _id: string;
  userId: {
    _id: string;
    firstname: string;
    lastname: string;
    imagen?: string;
  };
  asistio: boolean;
  esTrial: boolean;
  suscripcionId: {
    estado: string;
    trial?: {
      estaEnTrial: boolean;
      clasesAsistidas: number;
    };
  };
}

interface AsistenciasModalProps {
  isOpen: boolean;
  onClose: () => void;
  grupoId: string;
  grupoNombre: string;
  fecha?: Date;
}

export default function AsistenciasModal({
  isOpen,
  onClose,
  grupoId,
  grupoNombre,
  fecha = new Date(),
}: AsistenciasModalProps) {
  const [loading, setLoading] = useState(false);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(fecha);
  const [imagenesUsuarios, setImagenesUsuarios] = useState<
    Record<string, string>
  >({});

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarDatos();
    }
  }, [isOpen, grupoId, selectedDate]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const fechaParam = format(selectedDate, "yyyy-MM-dd");
      const response = await axios.get(
        `/api/asistencias/grupo/${grupoId}?fecha=${fechaParam}`
      );

      const miembrosData = response.data.miembros || [];
      setMiembros(miembrosData);
      setAsistencias(response.data.asistencias || []);

      // Cargar imágenes de perfil de Firebase
      const imagenesMap: Record<string, string> = {};
      await Promise.all(
        miembrosData.map(async (miembro: Miembro) => {
          try {
            const imageUrl = await ImageService.getProfileImageWithFallback(
              miembro.userId,
              miembro.nombre
            );
            imagenesMap[miembro.userId] = imageUrl;
          } catch (error) {
            // Fallback a ui-avatars si falla
            imagenesMap[miembro.userId] = ImageService.generateAvatarUrl(
              miembro.nombre
            );
          }
        })
      );
      setImagenesUsuarios(imagenesMap);
    } catch (error: any) {
      console.error("Error cargando asistencias:", error);
      toast.error(error.response?.data?.error || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const registrarAsistencia = async (userId: string, nombre: string) => {
    setProcesando(userId);
    try {
      const response = await axios.post("/api/asistencias/registrar", {
        userId,
        grupoId,
        fecha: selectedDate.toISOString(),
      });

      if (response.data.trialExpirado) {
        toast.warning(
          `Trial de ${nombre} expirado. Se ha creado la suscripción de pago.`,
          { duration: 5000 }
        );
      } else {
        toast.success(`Asistencia de ${nombre} registrada`);
      }

      // Recargar datos
      await cargarDatos();
    } catch (error: any) {
      console.error("Error registrando asistencia:", error);
      toast.error(
        error.response?.data?.error || "Error al registrar asistencia"
      );
    } finally {
      setProcesando(null);
    }
  };

  const verificarAsistencia = (userId: string): Asistencia | undefined => {
    return asistencias.find((a) => a.userId._id === userId && a.asistio);
  };

  const cambiarFecha = (dias: number) => {
    const nuevaFecha = new Date(selectedDate);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    setSelectedDate(nuevaFecha);
  };

  const esHoy = (): boolean => {
    const hoy = new Date();
    return (
      selectedDate.getDate() === hoy.getDate() &&
      selectedDate.getMonth() === hoy.getMonth() &&
      selectedDate.getFullYear() === hoy.getFullYear()
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex flex-col gap-2">
              <span>Registro de Asistencias</span>
              <span className="text-sm font-normal text-muted-foreground">
                {grupoNombre}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Selector de fecha */}
        <div className="flex items-center justify-between py-3 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => cambiarFecha(-1)}
            disabled={loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </Button>

          <div className="flex flex-col items-center">
            <span className="text-sm font-medium">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
            </span>
            {esHoy() && (
              <span className="text-xs text-primary font-semibold">Hoy</span>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => cambiarFecha(1)}
            disabled={loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : miembros.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay miembros en este grupo
          </div>
        ) : (
          <div className="space-y-2">
            {miembros.map((miembro) => {
              const asistencia = verificarAsistencia(miembro.userId);
              const yaAsistio = !!asistencia;
              const esTrial = asistencia?.esTrial || false;
              const estadoSuscripcion = asistencia?.suscripcionId?.estado;

              return (
                <div
                  key={miembro.userId}
                  className="flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Imagen del miembro */}
                    <div
                      className="w-10 h-10 rounded-full bg-muted bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${
                          imagenesUsuarios[miembro.userId] ||
                          ImageService.generateAvatarUrl(miembro.nombre)
                        })`,
                      }}
                    />

                    {/* Información del miembro */}
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {miembro.nombre}
                      </span>
                      {yaAsistio && (
                        <div className="flex gap-1 items-center">
                          {esTrial && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Trial
                            </span>
                          )}
                          {estadoSuscripcion && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                estadoSuscripcion === "activa"
                                  ? "bg-green-100 text-green-700"
                                  : estadoSuscripcion === "trial"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {estadoSuscripcion}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botón de asistencia */}
                  {yaAsistio ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span className="text-sm font-medium">Asistió</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() =>
                        registrarAsistencia(miembro.userId, miembro.nombre)
                      }
                      disabled={procesando === miembro.userId}
                      variant="outline"
                    >
                      {procesando === miembro.userId ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      ) : (
                        "Marcar"
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {asistencias.filter((a) => a.asistio).length} / {miembros.length}{" "}
            asistencias
          </div>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
