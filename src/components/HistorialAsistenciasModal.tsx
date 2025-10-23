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

interface Asistencia {
  _id: string;
  fecha: Date;
  asistio: boolean;
  esTrial: boolean;
  userId: {
    _id: string;
    firstname: string;
    lastname: string;
    imagen?: string;
  };
  suscripcionId: {
    estado: string;
  };
}

interface HistorialAsistenciasModalProps {
  isOpen: boolean;
  onClose: () => void;
  grupoId: string;
  grupoNombre: string;
  userId?: string; // Si se especifica, muestra solo las asistencias de ese usuario
}

export default function HistorialAsistenciasModal({
  isOpen,
  onClose,
  grupoId,
  grupoNombre,
  userId,
}: HistorialAsistenciasModalProps) {
  const [loading, setLoading] = useState(false);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [imagenesUsuarios, setImagenesUsuarios] = useState<
    Record<string, string>
  >({});
  const [mesActual, setMesActual] = useState(new Date());

  useEffect(() => {
    if (isOpen) {
      cargarHistorial();
    }
  }, [isOpen, grupoId, userId, mesActual]);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mes: mesActual.getMonth().toString(),
        anio: mesActual.getFullYear().toString(),
      });

      if (userId) {
        params.append("userId", userId);
      }

      const response = await axios.get(
        `/api/asistencias/historial/${grupoId}?${params.toString()}`
      );

      const asistenciasData = response.data.asistencias || [];
      setAsistencias(asistenciasData);

      // Cargar imágenes de perfil
      const imagenesMap: Record<string, string> = {};
      const usuariosUnicos = Array.from(
        new Set(asistenciasData.map((a: Asistencia) => a.userId._id))
      );

      await Promise.all(
        usuariosUnicos.map(async (uid: string) => {
          const asistencia = asistenciasData.find(
            (a: Asistencia) => a.userId._id === uid
          );
          if (asistencia) {
            const nombre = `${asistencia.userId.firstname} ${asistencia.userId.lastname}`;
            try {
              const imageUrl = await ImageService.getProfileImageWithFallback(
                uid,
                nombre
              );
              imagenesMap[uid] = imageUrl;
            } catch (error) {
              imagenesMap[uid] = ImageService.generateAvatarUrl(nombre);
            }
          }
        })
      );
      setImagenesUsuarios(imagenesMap);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al cargar historial");
    } finally {
      setLoading(false);
    }
  };

  const cambiarMes = (direccion: number) => {
    const nuevoMes = new Date(mesActual);
    nuevoMes.setMonth(nuevoMes.getMonth() + direccion);
    setMesActual(nuevoMes);
  };

  const agruparPorFecha = () => {
    const grupos: Record<string, Asistencia[]> = {};
    asistencias.forEach((asistencia) => {
      const fechaKey = format(new Date(asistencia.fecha), "yyyy-MM-dd");
      if (!grupos[fechaKey]) {
        grupos[fechaKey] = [];
      }
      grupos[fechaKey].push(asistencia);
    });
    return grupos;
  };

  const gruposPorFecha = agruparPorFecha();
  const fechasOrdenadas = Object.keys(gruposPorFecha).sort().reverse();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex flex-col gap-2">
              <span>Historial de Asistencias</span>
              <span className="text-sm font-normal text-muted-foreground">
                {grupoNombre}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Selector de mes */}
        <div className="flex items-center justify-between py-3 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => cambiarMes(-1)}
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

          <span className="text-sm font-medium">
            {format(mesActual, "MMMM yyyy", { locale: es })}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => cambiarMes(1)}
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
        ) : fechasOrdenadas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay asistencias registradas en este mes
          </div>
        ) : (
          <div className="space-y-4">
            {fechasOrdenadas.map((fechaKey) => {
              const asistenciasDia = gruposPorFecha[fechaKey];
              const fecha = new Date(fechaKey);

              return (
                <div key={fechaKey} className="border rounded-lg p-3 bg-card">
                  {/* Encabezado de fecha */}
                  <div className="font-medium text-sm mb-2 pb-2 border-b">
                    {format(fecha, "EEEE, d 'de' MMMM", { locale: es })}
                  </div>

                  {/* Lista de asistentes */}
                  <div className="space-y-2">
                    {asistenciasDia.map((asistencia) => {
                      const nombre = `${asistencia.userId.firstname} ${asistencia.userId.lastname}`;
                      return (
                        <div
                          key={asistencia._id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {/* Avatar */}
                            <div
                              className="w-8 h-8 rounded-full bg-muted bg-cover bg-center"
                              style={{
                                backgroundImage: `url(${
                                  imagenesUsuarios[asistencia.userId._id] ||
                                  ImageService.generateAvatarUrl(nombre)
                                })`,
                              }}
                            />
                            <span className="text-sm">{nombre}</span>
                          </div>

                          {/* Badges */}
                          <div className="flex gap-1">
                            {asistencia.esTrial && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                Trial
                              </span>
                            )}
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                asistencia.suscripcionId.estado === "activa"
                                  ? "bg-green-100 text-green-700"
                                  : asistencia.suscripcionId.estado === "trial"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {asistencia.suscripcionId.estado}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Resumen del día */}
                  <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                    {asistenciasDia.length} asistencia
                    {asistenciasDia.length !== 1 ? "s" : ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Total: {asistencias.length} asistencia
            {asistencias.length !== 1 ? "s" : ""}
          </div>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
