export { default } from "./EventPageServer";

// Configurar metadata dinámica
export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
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
