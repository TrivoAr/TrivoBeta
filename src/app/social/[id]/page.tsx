export { default } from "./EventPageServer";

// Permitir rutas dinámicas no pre-generadas en build time
export const dynamicParams = true;

// Configurar metadata dinámica
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params in Next.js 15+
    const resolvedParams = await params;

    const { connectDB } = await import("@/libs/mongodb");
    const SalidaSocial = (await import("@/models/salidaSocial")).default;

    await connectDB();

    const event = await SalidaSocial.findById(params.id)
      .select("nombre descripcion imagen localidad")
      .lean();

    if (!event) {
      return {
        title: "Evento no encontrado - Trivo",
      };
    }

    return {
      title: `${event.nombre} - Trivo`,
      description: event.descripcion?.substring(0, 160) || "Únete a esta salida deportiva",
      openGraph: {
        title: event.nombre,
        description: event.descripcion?.substring(0, 160),
        images: event.imagen ? [{ url: event.imagen }] : [],
      },
    };
  } catch (error) {
    return {
      title: "Trivo - Eventos Deportivos",
    };
  }
}
