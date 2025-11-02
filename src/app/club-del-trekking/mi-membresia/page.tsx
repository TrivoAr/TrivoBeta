"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ChevronLeft,
  Calendar,
  Clock,
  Mountain,
  AlertCircle,
  Check,
  X,
  XCircle,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClubMembership } from "@/hooks/useClubMembership";
import { UserClubBadge } from "@/components/club-trekking/ClubTrekkingBadge";
import toast, { Toaster } from "react-hot-toast";
import { formatClubPrice } from "@/utils/clubTrekkingPricing";

export default function MiMembresiaPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { membership, loading, error, isActive, salidasRestantes, puedeReservar, refetch } =
    useClubMembership();
  const [actionLoading, setActionLoading] = useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleCancelMembership = async () => {
    if (!membership) return;

    const confirmCancel = window.confirm(
      "¿Estás seguro de que deseas cancelar tu membresía? Esta acción no se puede deshacer."
    );

    if (!confirmCancel) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/club-trekking/cancel/${membership._id}`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Membresía cancelada");
        setTimeout(() => {
          router.push("/club-del-trekking");
        }, 2000);
      } else {
        toast.error(data.error || "Error al cancelar membresía");
      }
    } catch (error) {
      toast.error("Error al cancelar membresía");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusInfo = (estado: string) => {
    switch (estado) {
      case "activa":
        return {
          label: "Activa",
          color: "bg-green-500",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          textColor: "text-green-700 dark:text-green-400",
        };
      case "vencida":
        return {
          label: "Vencida",
          color: "bg-red-500",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          textColor: "text-red-700 dark:text-red-400",
        };
      case "cancelada":
        return {
          label: "Cancelada",
          color: "bg-gray-500",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          textColor: "text-gray-700 dark:text-gray-400",
        };
      default:
        return {
          label: estado,
          color: "bg-gray-500",
          bgColor: "bg-gray-50",
          textColor: "text-gray-700",
        };
    }
  };

  const getBadgeTipo = (totalSalidas: number): "bronce" | "plata" | "oro" => {
    if (totalSalidas >= 25) return "oro";
    if (totalSalidas >= 10) return "plata";
    return "bronce";
  };

  if (loading || status === "loading") {
    return (
      <main className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen text-foreground w-[390px] mx-auto flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#C95100] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando membresía...</p>
        </div>
      </main>
    );
  }

  if (!membership) {
    return (
      <main className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen text-foreground w-[390px] mx-auto">
        <Toaster position="top-center" />
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
          <div className="px-5 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Volver"
            >
              <ChevronLeft size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Mi Membresía</h1>
          </div>
        </div>

        {/* No Membership State */}
        <div className="px-5 py-20 text-center space-y-6">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <Mountain className="w-10 h-10 text-gray-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No tienes una membresía activa
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Únete al Club del Trekking y disfruta de aventuras ilimitadas
            </p>
          </div>
          <Button
            onClick={() => router.push("/club-del-trekking/suscribirse")}
            className="bg-[#C95100] hover:bg-[#A03D00] text-white rounded-full h-12 px-8"
          >
            Suscribirme ahora
          </Button>
        </div>
      </main>
    );
  }

  const statusInfo = getStatusInfo(membership.estado);
  const badgeTipo = getBadgeTipo(membership.historialSalidas.length);

  return (
    <>
      <Toaster position="top-center" />
      <main className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen text-foreground w-[390px] mx-auto pb-24">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
          <div className="px-5 py-4 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Volver"
            >
              <ChevronLeft size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Mi Membresía</h1>
          </div>
        </div>

        <div className="px-5 py-6 space-y-6">
          {/* Status Badge Card */}
          <div className="space-y-3">
            <UserClubBadge tipo={badgeTipo} />

            {/* Status Indicator */}
            <div
              className={`flex items-center justify-between p-4 rounded-2xl ${statusInfo.bgColor}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusInfo.color}`}></div>
                <span className={`font-semibold ${statusInfo.textColor}`}>
                  {statusInfo.label}
                </span>
              </div>
              {isActive && (
                <span className="text-xs px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                  Válida hasta {formatDate(membership.fechaFin)}
                </span>
              )}
            </div>
          </div>

          {/* Weekly Usage */}
          {isActive && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white">Tus salidas</h3>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Salidas disponibles
                  </span>
                  <span className="text-2xl font-bold text-[#C95100]">{salidasRestantes}</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-[#C95100] h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((membership.usoMensual.limiteSemanal - salidasRestantes) /
                          membership.usoMensual.limiteSemanal) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {membership.usoMensual.salidasRealizadas} {membership.usoMensual.salidasRealizadas === 1 ? 'salida realizada' : 'salidas realizadas'} esta semana
                </p>
              </div>

              {!puedeReservar && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Has alcanzado el límite de salidas para esta semana
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white">Información de pago</h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Precio mensual</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatClubPrice()}</span>
              </div>

              {membership.estado === "activa" && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Próximo pago
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatDate(membership.proximaFechaPago)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Inicio</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(membership.fechaInicio)}
                </span>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">Historial de salidas</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {membership.historialSalidas.length} total
              </span>
            </div>

            {membership.historialSalidas.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aún no has completado ninguna salida
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {membership.historialSalidas
                  .sort(
                    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
                  )
                  .map((salida, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => router.push(`/social/${salida.salidaId}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            salida.checkInRealizado
                              ? "bg-green-100 dark:bg-green-900/20"
                              : "bg-gray-200 dark:bg-gray-600"
                          }`}
                        >
                          {salida.checkInRealizado ? (
                            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <X className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(salida.fecha)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {salida.checkInRealizado ? "Check-in realizado" : "Sin check-in"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {membership.estado === "activa" && (
            <Button
              onClick={handleCancelMembership}
              disabled={actionLoading}
              variant="outline"
              className="w-full h-12 rounded-full border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancelar membresía
            </Button>
          )}

          {(membership.estado === "vencida" || membership.estado === "cancelada") && (
            <Button
              onClick={() => router.push("/club-del-trekking/suscribirse")}
              className="w-full h-12 rounded-full bg-[#C95100] hover:bg-[#A03D00] text-white"
            >
              Renovar membresía
            </Button>
          )}
        </div>
      </main>
    </>
  );
}
