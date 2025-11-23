import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/libs/mongodb";
import ClubTrekkingMembership from "@/models/ClubTrekkingMembership";
import SalidaSocial from "@/models/salidaSocial";
import MiembroSalida from "@/models/MiembroSalida";
import User from "@/models/user";
import { authOptions } from "@/libs/authOptions";
import { clubTrekkingHelpers } from "@/config/clubTrekking.config";
import { getClubConfig } from "@/services/clubTrekkingConfigService";
import Pago from "@/models/pagos";
import { trackServerClubTrekkingSalidaReserved } from "@/libs/mixpanelServer";

/**
 * POST /api/club-trekking/reservar
 * Reservar una salida usando la membresía del Club del Trekking
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectDB();
    const config = await getClubConfig();

    const body = await req.json();
    const { membershipId, salidaId } = body;

    if (!membershipId || !salidaId) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Obtener membresía
    const membership = await ClubTrekkingMembership.findById(membershipId);
    if (!membership) {
      return NextResponse.json(
        { error: "Membresía no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la membresía pertenece al usuario
    if (membership.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar que la membresía está activa
    if (!membership.estaActiva()) {
      return NextResponse.json(
        { error: "Tu membresía no está activa" },
        { status: 400 }
      );
    }

    // Verificar si tiene penalización activa
    if (membership.tienePenalizacionActiva()) {
      return NextResponse.json(
        {
          error: `Tienes una penalización activa por ${membership.penalizacion.diasRestantes} días más por inasistencias consecutivas`,
          penalizacionActiva: true,
          diasRestantes: membership.penalizacion.diasRestantes,
          fechaFin: membership.penalizacion.fechaFin,
        },
        { status: 403 }
      );
    }

    // Obtener salida
    const salida = await SalidaSocial.findById(salidaId);
    if (!salida) {
      return NextResponse.json(
        { error: "Salida no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que sea una salida de Trekking
    if (salida.deporte !== config.DEPORTE_PERMITIDO) {
      return NextResponse.json(
        {
          error: "El Club del Trekking solo incluye salidas de Trekking. Esta salida es de " + salida.deporte,
          deporteIncorrecto: true,
        },
        { status: 400 }
      );
    }

    // Verificar que la salida está incluida en la membresía
    if (!salida.clubTrekking?.incluidaEnMembresia) {
      return NextResponse.json(
        { error: "Esta salida no está incluida en la membresía" },
        { status: 400 }
      );
    }

    // Verificar límite semanal
    const fechaSalida = new Date(salida.fecha);
    if (!membership.puedeReservarSalida(fechaSalida)) {
      return NextResponse.json(
        {
          error: "Has alcanzado el límite de 2 salidas por semana",
          limiteSemanal: true,
        },
        { status: 400 }
      );
    }

    // Verificar si ya está inscrito
    const yaInscrito = await MiembroSalida.findOne({
      usuario_id: user._id,
      salida_id: salidaId,
    });

    if (yaInscrito) {
      return NextResponse.json(
        { error: "Ya estás inscrito en esta salida" },
        { status: 400 }
      );
    }

    // Verificar cupo
    const miembros = await MiembroSalida.find({
      salida_id: salidaId,
    }).populate("pago_id");

    const miembrosValidos = miembros.filter((m) => {
      const pagoAprobado = m.pago_id?.estado === "aprobado";
      const esClub = m.usaMembresiaClub;
      // Consideramos válidos (ocupan cupo) a los aprobados o club, 
      // y también a los pendientes si queremos reservarles el lugar (depende de la lógica de negocio).
      // El código original filtraba { estado: { $ne: "rechazado" } }, lo que incluía pendientes y aprobados.
      // Así que mantenemos esa lógica: si NO es rechazado (y asumimos que sin pago es pendiente/aprobado dependiendo del contexto).
      // Si tiene pago, miramos el estado. Si es rechazado, no cuenta.
      // Si es Club, cuenta.

      if (esClub) return true;
      if (m.pago_id) {
        return m.pago_id.estado !== "rechazado";
      }
      // Si no tiene pago ni es club, asumimos que cuenta (pendiente)
      return true;
    });

    if (miembrosValidos.length >= salida.cupo) {
      return NextResponse.json(
        { error: "No hay cupo disponible" },
        { status: 400 }
      );
    }

    // Crear la reserva
    const reserva = new MiembroSalida({
      usuario_id: user._id,
      salida_id: salidaId,
      rol: "miembro",
      usaMembresiaClub: true,
    });

    await reserva.save();

    // Actualizar contador de miembros en la salida
    salida.clubTrekking.miembrosActuales = (salida.clubTrekking.miembrosActuales || 0) + 1;
    await salida.save();

    // Agregar al historial de la membresía (pendiente de confirmación)
    membership.historialSalidas.push({
      salidaId: salida._id,
      fecha: salida.fecha,
      checkInRealizado: false,
      asistenciaConfirmada: null, // Pendiente de confirmar después del evento
    });
    await membership.save();

    // Calcular salidas restantes esta semana
    const { inicio, fin } = clubTrekkingHelpers.obtenerSemana(fechaSalida);
    const salidasEstaSemana = membership.historialSalidas.filter((h: any) => {
      const fecha = new Date(h.fecha);
      return fecha >= inicio && fecha <= fin;
    }).length;

    const salidasRestantes = membership.usoMensual.limiteSemanal - salidasEstaSemana - 1;

    // Track en Mixpanel
    trackServerClubTrekkingSalidaReserved(
      user._id.toString(),
      membership._id.toString(),
      salidaId,
      salidasEstaSemana + 1
    );

    return NextResponse.json(
      {
        success: true,
        message: "Reserva realizada exitosamente",
        reserva: {
          _id: reserva._id,
          usaMembresiaClub: true,
        },
        salidasRestantesEstaSemana: salidasRestantes,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al reservar salida:", error);
    return NextResponse.json(
      { error: "Error al realizar la reserva" },
      { status: 500 }
    );
  }
}
