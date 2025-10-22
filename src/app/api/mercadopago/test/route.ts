import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {

    // Check environment variables
    const accessToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || process.env.MERCADOPAGO_PUBLIC_KEY;



    const body = await request.json();

    return NextResponse.json({
      message: "Test endpoint working",
      env_check: {
        mercadopago_access_token: !!accessToken,
        mercadopago_public_key: !!publicKey,
        nextauth_url: !!process.env.NEXTAUTH_URL,
      },
      body: body,
    });
  } catch (error: any) {

    return NextResponse.json(
      {
        error: "Test endpoint failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
