import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { connectDB } from "@/libs/mongodb";
import SalidaSocial from "@/models/salidaSocial";

// MercadoPago client will be initialized inside the function

export async function POST(request: NextRequest) {
  try {
    // Debug environment variables
    console.log("Environment check:");
    console.log(
      "MP_ACCESS_TOKEN:",
      process.env.MP_ACCESS_TOKEN ? "Set ✓" : "Not set ✗"
    );
    console.log(
      "NEXTAUTH_URL:",
      process.env.NEXTAUTH_URL ? "Set ✓" : "Not set ✗"
    );

    if (!process.env.MP_ACCESS_TOKEN) {
      return NextResponse.json(
        {
          error: "Configuración de MercadoPago incompleta",
        },
        { status: 500 }
      );
    }

    // Initialize MercadoPago client
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
      options: { timeout: 10000, idempotencyKey: undefined },
    });

    const preference = new Preference(client);

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { salidaId, userId } = await request.json();

    if (!salidaId || !userId) {
      return NextResponse.json(
        {
          error: "salidaId y userId son requeridos",
        },
        { status: 400 }
      );
    }

    // Conectar a la base de datos y obtener la salida
    await connectDB();
    const salida = await SalidaSocial.findById(salidaId);

    if (!salida) {
      return NextResponse.json(
        {
          error: "Salida no encontrada",
        },
        { status: 404 }
      );
    }

    // Validar y convertir el precio
    if (!salida.precio) {
      return NextResponse.json(
        {
          error: "El evento no tiene precio definido",
        },
        { status: 400 }
      );
    }

    const precio = parseFloat(
      salida.precio
        .toString()
        .replace(/[^\d.,]/g, "")
        .replace(",", ".")
    );
    if (isNaN(precio) || precio <= 0) {
      console.error("Precio inválido:", salida.precio, "Convertido a:", precio);
      return NextResponse.json(
        {
          error: "Precio inválido",
          details:
            process.env.NODE_ENV === "development"
              ? { original: salida.precio, converted: precio }
              : undefined,
        },
        { status: 400 }
      );
    }

    // Validar datos requeridos
    if (!salida.nombre || salida.nombre.trim() === "") {
      return NextResponse.json(
        {
          error: "El evento debe tener un nombre válido",
        },
        { status: 400 }
      );
    }

    if (!session.user.email) {
      return NextResponse.json(
        {
          error: "Email de usuario requerido para el pago",
        },
        { status: 400 }
      );
    }

    // Crear la preferencia de pago
    const preferenceData = {
      items: [
        {
          id: salidaId,
          title: salida.nombre.substring(0, 256), // MercadoPago tiene límite de caracteres
          description: `Inscripción a ${salida.nombre}`.substring(0, 600),
          quantity: 1,
          unit_price: precio,
          currency_id: "ARS", // Argentina
        },
      ],
      payer: {
        email: session.user.email,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/social/${salidaId}?payment=success`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/social/${salidaId}?payment=failure`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/social/${salidaId}?payment=pending`,
      },
      auto_return: "approved" as const,
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mercadopago/webhook`,
      external_reference: `${salidaId}-${userId}`,
      statement_descriptor: "TRIVO EVENTOS",
      expires: true,
      date_of_expiration: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString(),
    };

    console.log(
      "Creating preference with data:",
      JSON.stringify(preferenceData, null, 2)
    );

    const response = await preference.create({ body: preferenceData });

    console.log("MercadoPago preference created successfully:", response.id);

    return NextResponse.json({
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point,
    });
  } catch (error: any) {
    console.error("Error creando preferencia MercadoPago:", error);

    // Si es un error de MercadoPago, devolver más información
    if (error?.response?.data) {
      console.error(
        "MercadoPago API Error:",
        JSON.stringify(error.response.data, null, 2)
      );
      return NextResponse.json(
        {
          error: "Error al procesar el pago",
          details:
            process.env.NODE_ENV === "development"
              ? error.response.data
              : undefined,
        },
        { status: 500 }
      );
    }

    if (error instanceof Error) {
      console.error("Error details:", error.message);
      return NextResponse.json(
        {
          error: "Error al procesar el pago",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
