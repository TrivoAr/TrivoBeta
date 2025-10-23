"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ImageService } from "@/libs/services/ImageService";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Miembro {
  userId: string;
  nombre: string;
  email: string;
  imagen?: string;
  suscripcionId?: string;
  estado?: string;
  trial?: {
    estaEnTrial: boolean;
    clasesAsistidas: number;
    fechaFin: string;
  };
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
  const queryClient = useQueryClient();
  const [procesando, setProcesando] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(fecha);
  const [imagenesUsuarios, setImagenesUsuarios] = useState<
    Record<string, string>
  >({});
  const [trialExpiradoModal, setTrialExpiradoModal] = useState<{
    open: boolean;
    nombre: string;
    mercadoPagoLink?: string;
  }>({ open: false, nombre: "" });

  // Usar TanStack Query para cargar datos con cache control
  const fechaParam = format(selectedDate, "yyyy-MM-dd");
  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ["asistencias-grupo", grupoId, fechaParam],
    queryFn: async () => {

      const response = await axios.get(
        `/api/asistencias/grupo/${grupoId}?fecha=${fechaParam}`
      );

      return response.data;
    },
    enabled: isOpen,
    staleTime: 0, // Siempre considerar datos como stale
    gcTime: 0, // No mantener en cache
  });

  const miembros = data?.miembros || [];
  const asistencias = data?.asistencias || [];

  // Cargar imágenes cuando cambien los miembros
  useEffect(() => {
    const cargarImagenes = async () => {
      const imagenesMap: Record<string, string> = {};
      await Promise.all(
        miembros.map(async (miembro: Miembro) => {
          try {
            const imageUrl = await ImageService.getProfileImageWithFallback(
              miembro.userId,
              miembro.nombre
            );
            imagenesMap[miembro.userId] = imageUrl;
          } catch (error) {
            imagenesMap[miembro.userId] = ImageService.generateAvatarUrl(
              miembro.nombre
            );
          }
        })
      );
      setImagenesUsuarios(imagenesMap);
    };

    if (miembros.length > 0) {
      cargarImagenes();
    }
  }, [miembros]);

  const registrarAsistencia = async (userId: string, nombre: string) => {
    setProcesando(userId);
    try {

      const response = await axios.post("/api/asistencias/registrar", {
        userId,
        grupoId,
        fecha: selectedDate.toISOString(),
      });

      // Invalidar query y refetch INMEDIATAMENTE
      await queryClient.invalidateQueries({
        queryKey: ["asistencias-grupo", grupoId, fechaParam],
      });
      await refetch();

      if (response.data.trialExpirado) {
        setTrialExpiradoModal({
          open: true,
          nombre,
          mercadoPagoLink: response.data.mercadoPago?.initPoint,
        });
      } else {
        toast.success(`✅ Asistencia de ${nombre} registrada`, {
          duration: 3000,
          position: "top-center",
        });
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Error al registrar asistencia",
        {
          position: "top-center",
        }
      );
    } finally {
      setProcesando(null);
    }
  };

  const verificarAsistencia = (userId: string): Asistencia | undefined => {
    const asistencia = asistencias.find((a) => a.userId._id === userId && a.asistio);
    return asistencia;
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
    <>
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
                  className={`flex items-center justify-between p-3 bg-card border rounded-lg transition-all duration-300 ${
                    yaAsistio
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Imagen del miembro */}
                    <div
                      className={`w-10 h-10 rounded-full bg-muted bg-cover bg-center transition-all ${
                        yaAsistio
                          ? "ring-2 ring-green-500 ring-offset-2"
                          : ""
                      }`}
                      style={{
                        backgroundImage: `url(${
                          imagenesUsuarios[miembro.userId] ||
                          ImageService.generateAvatarUrl(miembro.nombre)
                        })`,
                      }}
                    />

                    {/* Información del miembro */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {miembro.nombre}
                        </span>
                        {/* Mostrar "Clase gratis" si está en trial */}
                        {miembro.estado === "trial" &&
                          miembro.trial?.estaEnTrial && (
                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">
                              Clase gratis
                            </span>
                          )}
                      </div>
                      {yaAsistio && (
                        <div className="flex gap-1 items-center mt-1">
                          {esTrial && (
                            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded">
                              Trial
                            </span>
                          )}
                          {estadoSuscripcion && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                estadoSuscripcion === "activa"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                                  : estadoSuscripcion === "trial"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
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
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 animate-in fade-in zoom-in duration-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="drop-shadow-sm"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span className="text-sm font-semibold">Asistió</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() =>
                        registrarAsistencia(miembro.userId, miembro.nombre)
                      }
                      disabled={procesando === miembro.userId}
                      variant="outline"
                      className="hover:bg-green-100 dark:hover:bg-green-950/30"
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

      {/* Modal de trial expirado */}
      <AlertDialog
        open={trialExpiradoModal.open}
        onOpenChange={(open) =>
          setTrialExpiradoModal({ ...trialExpiradoModal, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>✅ Asistencia registrada</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                La asistencia de{" "}
                <span className="font-semibold">{trialExpiradoModal.nombre}</span>{" "}
                ha sido registrada exitosamente.
              </p>
              <p className="text-amber-600 dark:text-amber-500 font-medium">
                ⚠️ Su clase gratis ha sido utilizada.
              </p>
              {trialExpiradoModal.mercadoPagoLink ? (
                <p>
                  Para seguir asistiendo a las clases, el alumno debe activar su
                  suscripción mensual.
                </p>
              ) : (
                <p className="text-red-600 dark:text-red-500 font-medium">
                  ⚠️ Debes configurar tus credenciales de MercadoPago en tu perfil
                  para que el alumno pueda activar su suscripción.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setTrialExpiradoModal({ open: false, nombre: "" })
              }
            >
              Cerrar
            </AlertDialogCancel>
            {trialExpiradoModal.mercadoPagoLink && (
              <AlertDialogAction
                onClick={() => {
                  window.open(trialExpiradoModal.mercadoPagoLink, "_blank");
                  setTrialExpiradoModal({ open: false, nombre: "" });
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Configurar pago
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
