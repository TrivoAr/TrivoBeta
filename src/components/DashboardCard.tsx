"use client";
import { useRouter } from "next/navigation";
import { QrCode, Users, Pencil, Trash2 } from "lucide-react"; // Íconos elegantes
import Image from "next/image";
import { getDeporteFallbackImage } from "@/utils/imageFallbacks";

type Props = {
  event: {
    _id: string;
    title: string;
    date: string;
    time: string;
    price?: string;
    image: string;
    category: string;
    localidad: string;
    isOwner?: boolean;
    isProfesor?: boolean;
  };
  onDelete?: (id: string) => void;
  withActions?: boolean; // 🔑 para decidir si mostrar o no los botones
};

export default function DashboardCard({
  event,
  onDelete,
  withActions = false,
}: Props) {
  const router = useRouter();

  return (
    <div className="flex-shrink-0 w-[310px] h-[240px] rounded-[20px] overflow-hidden shadow-md relative border bg-white">
      {/* Imagen */}
      <div
        className="h-[115px] bg-slate-200 cursor-pointer"
        onClick={() => router.push(`/social/${event._id}`)}
      >
        <Image
          src={event.image || getDeporteFallbackImage(event.category)}
          alt={event.title}
          width={310}
          height={115}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Etiqueta */}
      <div className="absolute bg-black/60 text-white rounded-full px-3 py-0.5 text-sm top-2 left-2">
        {event.category}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1">
        <h1 className="font-semibold text-lg">{event.title}</h1>
        <p className="text-sm text-slate-600">{event.localidad}</p>
        <p className="text-slate-500 text-sm">
          {event.date}, {event.time} hs
        </p>
      </div>

      {/* Acciones */}
      {withActions && (
        <div className="absolute top-[39%] right-[10px] flex gap-3">
          {/* Ver miembros */}
          <button
            onClick={() => router.push(`/social/miembros/${event._id}`)}
            className="bg-white border w-[38px] h-[38px] rounded-full flex items-center justify-center hover:bg-slate-100"
            title="Ver miembros"
          >
            <Users size={18} className="text-slate-600" />
          </button>

          {/* Escanear tickets */}
          {(event.isOwner || event.isProfesor) && (
            <button
              onClick={() => router.push(`/social/${event._id}/scan`)}
              className="bg-emerald-600 text-white w-[38px] h-[38px] rounded-full flex items-center justify-center hover:bg-emerald-500"
              title="Escanear tickets"
            >
              <QrCode size={18} />
            </button>
          )}

          {/* Editar */}
          {event.isOwner && (
            <button
              onClick={() => router.push(`/social/editar/${event._id}`)}
              className="bg-white border w-[38px] h-[38px] rounded-full flex items-center justify-center hover:bg-slate-100"
              title="Editar"
            >
              <Pencil size={18} className="text-slate-600" />
            </button>
          )}

          {/* Eliminar */}
          {onDelete && (
            <button
              onClick={() => onDelete(event._id)}
              className="bg-white border w-[38px] h-[38px] rounded-full flex items-center justify-center hover:bg-red-50"
              title="Eliminar"
            >
              <Trash2 size={18} className="text-red-500" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
