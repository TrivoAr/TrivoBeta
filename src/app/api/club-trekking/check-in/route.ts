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

/**
 * POST /api/club-trekking/check-in
 * Realizar check-in en una salida
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
    const { membershipId, salidaId, ubicacion } = body;

    if (!membershipId || !salidaId || !ubicacion) {
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

    // Obtener salida
    const salida = await SalidaSocial.findById(salidaId);
    if (!salida) {
      return NextResponse.json(
        { error: "Salida no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario está inscrito
    const miembro = await MiembroSalida.findOne({
      usuario_id: user._id,
      salida_id: salidaId,
      usaMembresiaClub: true,
    });

    if (!miembro) {
      return NextResponse.json(
        { error: "No estás inscrito en esta salida" },
        { status: 404 }
      );
    }

    // Verificar si ya hizo check-in
    if (miembro.checkIn?.realizado) {
      return NextResponse.json(
        {
          error: "Ya realizaste el check-in",
          checkIn: miembro.checkIn,
        },
        { status: 400 }
      );
    }

    // Validar ubicación (proximidad al punto de encuentro)
    if (!salida.locationCoords?.lat || !salida.locationCoords?.lng) {
      // Si no hay coordenadas, permitir check-in sin validación
      console.warn("Salida sin coordenadas, permitiendo check-in sin validación");
    } else {
      const estaEnRadio = clubTrekkingHelpers.estaEnRadioCheckIn(
        ubicacion,
        salida.locationCoords
      );

      if (!estaEnRadio) {
        const distancia = clubTrekkingHelpers.calcularDistancia(
          ubicacion,
          salida.locationCoords
        );
        return NextResponse.json(
          {
            error: "Debes estar en el punto de encuentro para hacer check-in",
            distancia: Math.round(distancia),
            distanciaPermitida: config.CHECK_IN.RADIO_METROS,
          },
          { status: 400 }
        );
      }
    }

    // Validar tiempo (puede hacer check-in desde 30 min antes hasta 15 min después)
    const fechaHoraSalida = new Date(`${salida.fecha}T${salida.hora}`);
    const ahora = new Date();

    const estaEnTiempo = clubTrekkingHelpers.estaEnTiempoCheckIn(
      fechaHoraSalida,
      ahora
    );

    if (!estaEnTiempo) {
      return NextResponse.json(
        {
          error:
            "El check-in solo está disponible 30 minutos antes o 15 minutos después de la hora de salida",
          horaSalida: salida.hora,
        },
        { status: 400 }
      );
    }

    // Realizar check-in
    miembro.checkIn = {
      realizado: true,
      fecha: ahora,
      ubicacion: {
        lat: ubicacion.lat,
        lng: ubicacion.lng,
      },
    };

    await miembro.save();

    // Agregar al historial de la membresía
    membership.agregarSalida(salidaId, fechaHoraSalida, true);
    await membership.save();

    return NextResponse.json(
      {
        success: true,
        message: "Check-in realizado exitosamente",
        checkIn: {
          fecha: miembro.checkIn.fecha,
          salida: {
            nombre: salida.nombre,
            fecha: salida.fecha,
            hora: salida.hora,
          },
        },
        salidasRealizadas: membership.usoMensual.salidasRealizadas,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al realizar check-in:", error);
    return NextResponse.json(
      { error: "Error al realizar el check-in" },
      { status: 500 }
    );
  }
}
