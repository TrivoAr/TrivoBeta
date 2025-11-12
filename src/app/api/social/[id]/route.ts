import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import {
  SalidaSocialRepository,
  NotFoundError,
  UnauthorizedError,
} from "@/libs/repository";
import { ImageService } from "@/libs/services/ImageService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {


  try {
    const repository = new SalidaSocialRepository();
    const { id } = params;

    const salida = await repository.findWithPopulatedData(id);

    // Configurar headers de caching para mejorar performance
    // Los datos de salidas no cambian muy frecuentemente
    return NextResponse.json(salida, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        // s-maxage=60: Cache en CDN/edge por 60 segundos
        // stale-while-revalidate=120: Servir cache stale hasta 120s mientras revalida en background
      }
    });
  } catch (error) {
   

    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const repository = new SalidaSocialRepository();

    const actualizada = await repository.updateWithOwnerCheck(
      params.id,
      data,
      session.user.id
    );

    return NextResponse.json(actualizada, { status: 200 });
  } catch (error) {

    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    return NextResponse.json(
      {
        message: "Error al actualizar",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const repository = new SalidaSocialRepository();

    await repository.deleteWithOwnerCheck(params.id, session.user.id);

    return NextResponse.json({ message: "Salida eliminada" }, { status: 200 });
  } catch (error) {

    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    return NextResponse.json(
      {
        message: "Error al eliminar",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
