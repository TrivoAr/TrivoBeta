"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import { FaInstagram } from "react-icons/fa";
import { toast } from "sonner";
import PaymentReviewModal from "@/components/PaymentReviewModal";
import ExportUsuarios from "@/app/utils/ExportUsuarios";

export default function EventPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
 

  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<
    "todos" | "aprobado" | "rechazado" | "pendiente"
  >("todos");
  const [selectedMiembro, setSelectedMiembro] = useState<any>(null);
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    miembroId?: string;
    pagoId?: string;
  }>({ open: false });

  // // 🔹 Query evento
  // const {
  //   data: event,
  //   isLoading: loadingEvent,
  //   error: errorEvent,
  // } = useQuery({
  //   queryKey: ["event", params.id],
  //   queryFn: async () => {
  //     const res = await axios.get(`/api/social/${params.id}`);
  //     return res.data;
  //   },
  // });

  // // 🔹 Query miembros
  // const {
  //   data: miembros = [],
  //   isLoading: loadingMiembros,
  //   error: errorMiembros,
  // } = useQuery({
  //   queryKey: ["miembros", params.id],
  //   queryFn: async () => {
  //     const res = await fetch(`/api/social/miembros?salidaId=${params.id}`);
  //     return res.json();
  //   },
  //   enabled: !!params.id,
  // });

  const { data: event, isLoading: loadingEvent,  error: errorEvent, } = useQuery({
  queryKey: ["event", params.id],
  queryFn: async () => {
    const res = await axios.get(`/api/social/${params.id}`);
    return res.data;
  },
});

const { data: miembros = [], isLoading: loadingMiembros, error: errorMiembros } = useQuery({
  queryKey: ["miembros", params.id],
  queryFn: async () => {
    const res = await fetch(`/api/social/miembros?salidaId=${params.id}`);
    return res.json();
  },
  enabled: !!event,
});


  const loading = loadingEvent || loadingMiembros;
  const error = errorEvent || errorMiembros;

  const isOwner = session?.user?.id === event?.creador_id?._id;
   const safeMiembros = Array.isArray(miembros) ? miembros : [];

  // const filteredMiembros = miembros.filter((miembro: any) => {
  //   const matchName = miembro.nombre
  //     .toLowerCase()
  //     .includes(searchQuery.toLowerCase());

  //   if (isOwner) {
  //     const matchPago =
  //       paymentFilter === "todos" || miembro.pago_id.estado === paymentFilter;
  //     return matchName && matchPago;
  //   }
  //   return matchName && miembro.pago_id.estado === "aprobado";
  // });


  
const filteredMiembros = safeMiembros.filter((miembro: any) => {
  const matchName = miembro.nombre?.toLowerCase().includes(searchQuery.toLowerCase());
  if (isOwner) {
    const matchPago =
      paymentFilter === "todos" || miembro.pago_id?.estado === paymentFilter;
    return matchName && matchPago;
  }
  return matchName && miembro.pago_id?.estado === "aprobado";
});

  const deleteMiembroMutation = useMutation({
    mutationFn: async (miembroId: string) => {
      const res = await axios.delete(`/api/social/miembros/${miembroId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Miembro borrado correctamente ✅");
      queryClient.invalidateQueries({ queryKey: ["miembros", params.id] });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("❌ No se pudo borrar al miembro");
    },
  });

function handleDelete(miembroId: string) {
  toast.warning("¿Seguro que quieres borrar este miembro?", {
    description: "Esta acción no se puede deshacer",
    action: {
      label: "Confirmar",
      onClick: () => {
        deleteMiembroMutation.mutate(miembroId);
      },
    },
    cancel: {
      label: "Cancelar",
      onClick: () => {
        toast.dismiss();
      },
    },
    duration: Infinity, 
  });
}


  // 🔹 Loading UI
  if (loading) return <Skeleton height={200} count={5} />;

  if (error || !event) {
    return (
      <main className="py-20 text-center">
        {String(error) || "Evento no encontrado"}
      </main>
    );
  }

  const miembrosAprobados = miembros
    .filter((miembro) => miembro.pago_id.estado === "aprobado")
    .map((miembro) => ({
      dni: miembro.dni,
      nombre: miembro.nombre,
      telefono: miembro.telnumber,
      email: miembro.email,
      imagen: miembro.imagen,
      estado: miembro.pago_id.estado as "pendiente" | "aprobado" | "rechazado",
    }));

  return (
    <div className="w-[390px] p-4 relative flex flex-col">
      <button
        onClick={() => router.back()}
        className="text-[#C76C01] relative bg-white shadow-md rounded-full w-[40px] h-[40px] flex justify-center items-center left-[10px]"
      >
        <img
          src="/assets/icons/Collapse Arrow.svg"
          alt="callback"
          className="h-[20px] w-[20px]"
        />
      </button>

      <p className="font-bold text-orange-500 text-2xl mb-3 mt-3">
        Participantes
      </p>

      <div className="px-1 mb-5">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar participante..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      {/* 🎯 filtro por estado */}

      {session?.user?.id === event?.creador_id?._id ? (
        <div className="px-1 mb-5">
          <select
            value={paymentFilter}
            onChange={(e) =>
              setPaymentFilter(
                e.target.value as
                  | "todos"
                  | "aprobado"
                  | "rechazado"
                  | "pendiente"
              )
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="todos">Todos</option>
            <option value="aprobado">Aprobados ✅</option>
            <option value="rechazado">Rechazados ❌</option>
            <option value="pendiente">Pendientes ⏳</option>
          </select>
        </div>
      ) : null}

      <table className="w-[370px]">
        <thead>
          <tr>
            <th className="font-bold">Foto</th>
            <th className="font-bold">Nombre</th>
            {event?.creador_id?._id &&
              session?.user?.id === event.creador_id._id && (
                <th className="font-bold">Acciones</th>
              )}
          </tr>
        </thead>
        <tbody>
          {filteredMiembros.map((miembro, index) => (
            <tr
              key={index}
              className="w-full h-[90px]  text-center cursor-pointer hover:bg-gray-100"
            >
              <td className="flex justify-center">
                <img
                  src={miembro.imagen}
                  alt={miembro.nombre}
                  className="w-[60px] h-[60px] rounded-full object-cover"
                  onClick={() => setSelectedMiembro(miembro)}
                />
              </td>
              <td className="">{miembro.nombre}</td>
              {session?.user?.id === event?.creador_id?._id ? (
                <td className="flex justify-center items-center gap-2 h-full w-full">
                  <button
                    onClick={() => handleDelete(miembro._id)}
                    disabled={deleteMiembroMutation.isPending}
                    className=""
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      height={25}
                      width={25}
                    >
                      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <path
                          d="M9.1709 4C9.58273 2.83481 10.694 2 12.0002 2C13.3064 2 14.4177 2.83481 14.8295 4"
                          stroke="#1C274C"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        ></path>{" "}
                        <path
                          d="M20.5001 6H3.5"
                          stroke="#1C274C"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        ></path>{" "}
                        <path
                          d="M18.8332 8.5L18.3732 15.3991C18.1962 18.054 18.1077 19.3815 17.2427 20.1907C16.3777 21 15.0473 21 12.3865 21H11.6132C8.95235 21 7.62195 21 6.75694 20.1907C5.89194 19.3815 5.80344 18.054 5.62644 15.3991L5.1665 8.5"
                          stroke="#1C274C"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        ></path>{" "}
                        <path
                          d="M9.5 11L10 16"
                          stroke="#1C274C"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        ></path>{" "}
                        <path
                          d="M14.5 11L14 16"
                          stroke="#1C274C"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        ></path>{" "}
                      </g>
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setReviewModal({
                        open: true,
                        miembroId: miembro._id,
                        pagoId: miembro.pago_id._id,
                      })
                    }
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      height={25}
                      width={25}
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                      <g
                        id="SVGRepo_tracerCarrier"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></g>
                      <g id="SVGRepo_iconCarrier">
                        {" "}
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25ZM9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12C14.25 13.2426 13.2426 14.25 12 14.25C10.7574 14.25 9.75 13.2426 9.75 12Z"
                          fill="#000"
                        ></path>{" "}
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M12 3.25C7.48587 3.25 4.44529 5.9542 2.68057 8.24686L2.64874 8.2882C2.24964 8.80653 1.88206 9.28392 1.63269 9.8484C1.36564 10.4529 1.25 11.1117 1.25 12C1.25 12.8883 1.36564 13.5471 1.63269 14.1516C1.88206 14.7161 2.24964 15.1935 2.64875 15.7118L2.68057 15.7531C4.44529 18.0458 7.48587 20.75 12 20.75C16.5141 20.75 19.5547 18.0458 21.3194 15.7531L21.3512 15.7118C21.7504 15.1935 22.1179 14.7161 22.3673 14.1516C22.6344 13.5471 22.75 12.8883 22.75 12C22.75 11.1117 22.6344 10.4529 22.3673 9.8484C22.1179 9.28391 21.7504 8.80652 21.3512 8.28818L21.3194 8.24686C19.5547 5.9542 16.5141 3.25 12 3.25ZM3.86922 9.1618C5.49864 7.04492 8.15036 4.75 12 4.75C15.8496 4.75 18.5014 7.04492 20.1308 9.1618C20.5694 9.73159 20.8263 10.0721 20.9952 10.4545C21.1532 10.812 21.25 11.2489 21.25 12C21.25 12.7511 21.1532 13.188 20.9952 13.5455C20.8263 13.9279 20.5694 14.2684 20.1308 14.8382C18.5014 16.9551 15.8496 19.25 12 19.25C8.15036 19.25 5.49864 16.9551 3.86922 14.8382C3.43064 14.2684 3.17374 13.9279 3.00476 13.5455C2.84684 13.188 2.75 12.7511 2.75 12C2.75 11.2489 2.84684 10.812 3.00476 10.4545C3.17374 10.0721 3.43063 9.73159 3.86922 9.1618Z"
                          fill="#000"
                        ></path>{" "}
                      </g>
                    </svg>
                  </button>
                  <div
                    className={`w-[20px] h-[20px]  rounded-full ${
                      miembro.pago_id.estado === "aprobado"
                        ? "bg-green-600"
                        : miembro.pago_id.estado === "rechazado"
                          ? "bg-red-600"
                          : "bg-yellow-600"
                    }`}
                  ></div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Popup modal */}
      {selectedMiembro && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          onClick={() => setSelectedMiembro(null)}
        >
          <div
            className="relative w-[300px] h-[450px] rounded-xl overflow-hidden shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen clara de fondo */}
            <img
              src={selectedMiembro.imagen}
              alt={selectedMiembro.nombre}
              className="object-cover w-full h-full"
            />

            {/* Overlay SOLO en parte inferior */}
            <div className="absolute inset-0 flex flex-col justify-end">
              <div className="w-full p-4 bg-gradient-to-t from-black/60 via-black/80 to-transparent">
                <p
                  className="text-white text-xl font-semibold mb-1"
                  onClick={() => router.push(`/profile/${selectedMiembro._id}`)}
                >
                  {selectedMiembro.nombre}
                </p>
                <p className="text-white text-sm opacity-80">
                  {selectedMiembro.email}
                </p>
                <p className="text-white text-xs mt-2">
                  {selectedMiembro.instagram && (
                    <a
                      href={`https://instagram.com/${selectedMiembro.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaInstagram />
                    </a>
                  )}
                </p>
              </div>
            </div>

            {/* Botón cerrar */}
            <button
              className="absolute top-2 right-2 text-white text-xl bg-red-700 w-8 h-8 rounded-full"
              onClick={() => setSelectedMiembro(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <PaymentReviewModal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal({ open: false })}
        miembroId={reviewModal.miembroId || ""}
        pagoId={reviewModal.pagoId || ""}
      />

      {session?.user?.id === event?.creador_id?._id ? (
        <ExportUsuarios usuarios={miembrosAprobados} />
      ) : null}

      <div className="pb-[100px]"></div>
    </div>
  );
}
