import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("Test endpoint called");

    // Check environment variables
    console.log(
      "MERCADOPAGO_ACCESS_TOKEN:",
      process.env.MERCADOPAGO_ACCESS_TOKEN ? "Set ✓" : "Not set ✗"
    );
    console.log(
      "NEXTAUTH_URL:",
      process.env.NEXTAUTH_URL ? "Set ✓" : "Not set ✗"
    );

    const body = await request.json();
    console.log("Request body:", body);

    return NextResponse.json({
      message: "Test endpoint working",
      env_check: {
        mercadopago_token: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
        nextauth_url: !!process.env.NEXTAUTH_URL,
      },
      body: body,
    });
  } catch (error: any) {
    console.error("Test endpoint error:", error);
    return NextResponse.json(
      {
        error: "Test endpoint failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
