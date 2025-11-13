import { notFound } from "next/navigation";
import { connectDB } from "@/libs/mongodb";
import SalidaSocial from "@/models/salidaSocial";
import EventPageClient from "./EventPageClient";

interface PageProps {
  params: {
    id: string;
  };
}

// Configurar ISR - revalidar cada 60 segundos
export const revalidate = 60;

// Permitir rutas dinámicas no pre-generadas en build time
export const dynamicParams = true;

async function getEventData(id: string) {
  try {
    console.log("[EventPageServer] Fetching event with ID:", id);
    await connectDB();
    console.log("[EventPageServer] Database connected");

    const event = await SalidaSocial.findById(id)
      .populate("creador_id", "firstname lastname email imagen")
      .populate("profesorId", "firstname lastname imagen telnumber bio rol")
      .populate("sponsors", "name imagen")
      .lean();

    if (!event) {
      console.log("[EventPageServer] Event not found for ID:", id);
      return null;
    }

    console.log("[EventPageServer] Event found:", event.nombre);
    // Convertir a objeto plano serializable
    return JSON.parse(JSON.stringify(event));
  } catch (error) {
    console.error("[EventPageServer] Error fetching event:", error);
    return null;
  }
}

async function getMiembros(salidaId: string) {
  try {
    await connectDB();

    // Import the model here to avoid circular dependencies
    const MiembroSalida = (await import("@/models/MiembroSalida")).default;

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
  console.log("[EventPageServer] Loading page for ID:", params.id);
  console.log("[EventPageServer] Environment:", process.env.NODE_ENV);
  console.log("[EventPageServer] MongoDB URI exists:", !!process.env.MONGODB_URI);

  // Fetch initial data on the server
  const [initialEvent, initialMiembros] = await Promise.all([
    getEventData(params.id),
    getMiembros(params.id),
  ]);

  if (!initialEvent) {
    console.log("[EventPageServer] No event data found, calling notFound()");
    notFound();
  }

  console.log("[EventPageServer] Rendering client component");
  // Pass initial data to client component
  return (
    <EventPageClient
      params={params}
      initialEvent={initialEvent}
      initialMiembros={initialMiembros}
    />
  );
}
