import { notFound } from "next/navigation";
import { SalidaSocialRepository } from "@/libs/repository";
import EventPageClient from "./EventPageClient";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Configurar ISR - revalidar cada 60 segundos
export const revalidate = 60;

// Permitir rutas dinámicas no pre-generadas en build time
export const dynamicParams = true;

async function getEventData(id: string) {
  try {
    console.log("[EventPageServer] Fetching event with ID:", id);

    const repository = new SalidaSocialRepository();
    const event = await repository.findWithPopulatedData(id);

    console.log("[EventPageServer] Event found:", event.nombre);
    return event as any;
  } catch (error) {
    console.error("[EventPageServer] Error fetching event:", error);
    return null;
  }
}

async function getMiembros(salidaId: string) {
  try {
    // Import models dinamically to ensure registration in serverless
    const { connectDB } = await import("@/libs/mongodb");
    const MiembroSalida = (await import("@/models/MiembroSalida")).default;
    const User = (await import("@/models/user")).default;
    const Pagos = (await import("@/models/pagos")).default;

    await connectDB();

    const miembros = await MiembroSalida.find({ salidaId })
      .populate("usuario_id", "firstname lastname imagen")
      .populate("pago_id", "estado comprobanteUrl")
      .lean();

    // Filtrar solo aprobados
    const aprobados = miembros.filter(
      (m: any) => m.pago_id?.estado === "aprobado"
    );

    return JSON.parse(JSON.stringify(aprobados));
  } catch (error) {
    console.error("Error fetching miembros:", error);
    return [];
  }
}

export default async function EventPageServer({ params }: PageProps) {
  const { id } = await params;
  console.log("[EventPageServer] Loading page for ID:", id);
  console.log("[EventPageServer] Environment:", process.env.NODE_ENV);
  console.log("[EventPageServer] MongoDB URI exists:", !!process.env.MONGODB_URI);

  // Fetch initial data on the server
  const [initialEvent, initialMiembros] = await Promise.all([
    getEventData(id),
    getMiembros(id),
  ]);

  if (!initialEvent) {
    console.log("[EventPageServer] No event data found, calling notFound()");
    notFound();
  }

  console.log("[EventPageServer] Rendering client component");
  // Pass initial data to client component
  return (
    <EventPageClient
      params={{ id }}
      initialEvent={initialEvent}
      initialMiembros={initialMiembros}
    />
  );
}
