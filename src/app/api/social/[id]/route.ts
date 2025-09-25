import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";
import { SalidaSocialRepository, NotFoundError, UnauthorizedError } from "@/libs/repository";
import { ImageService } from "@/libs/services/ImageService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("API GET /social/[id] called with ID:", params.id);

  try {
    const repository = new SalidaSocialRepository();
    const { id } = params;
    console.log("ID recibido:", id);

    const salida = await repository.findWithPopulatedData(id);
    console.log("Salida social encontrada y preparada:", salida.nombre);

    return NextResponse.json(salida, { status: 200 });

  } catch (error) {
    console.error("[GET_SALIDA_BY_ID] Error:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    return NextResponse.json({
      message: "Server Error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
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
    console.error("[PATCH_SALIDA] Error:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    return NextResponse.json({
      message: "Error al actualizar",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
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

    await repository.deleteWithOwnerCheck(
      params.id,
      session.user.id
    );

    return NextResponse.json({ message: "Salida eliminada" }, { status: 200 });
  } catch (error) {
    console.error("[DELETE_SALIDA] Error:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    return NextResponse.json({
      message: "Error al eliminar",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}