import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint requerido por el SDK de MercadoPago Bricks
 * para validar la public key y configuración del cliente
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar que la public key esté configurada
    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

    if (!publicKey) {
      return NextResponse.json(
        { error: "Public key no configurada" },
        { status: 500 }
      );
    }

    // Respuesta que el SDK espera para validar la configuración
    return NextResponse.json({
      public_key: publicKey,
      locale: "es-AR",
      site_id: "MLA", // Argentina
    });
  } catch (error) {
    console.error("Error en endpoint bricks:", error);
    return NextResponse.json(
      { error: "Error de configuración" },
      { status: 500 }
    );
  }
}

/**
 * POST también puede ser llamado por el SDK
 * En este caso, redirigimos al endpoint de preferences principal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Redirigir al endpoint principal de preferences
    const mainEndpoint = new URL('/api/mercadopago/preferences', request.url);

    const response = await fetch(mainEndpoint.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pasar los headers de autenticación
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error en POST bricks:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
