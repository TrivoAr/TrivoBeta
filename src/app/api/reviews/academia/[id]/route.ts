import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import Review from "@/models/Review";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/authOptions";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const { id } = params;

  try {
    const reviews = await Review.find({ academia: id })
      .populate("author", "firstname lastname imagen")
      .sort({ createdAt: -1 });

    const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
    const average = reviews.length > 0 ? totalRatings / reviews.length : 0;

    return NextResponse.json(
      { reviews, average: Number(average.toFixed(2)), count: reviews.length },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener reseñas" },
      { status: 500 }
    );
  }
}


export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = params;
  const { rating, comment } = await req.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Puntuación inválida" }, { status: 400 });
  }

  try {
    const review = await Review.findById(id);

    if (!review) {
      return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
    }

    if (review.author.toString() !== session.user.id) {
      return NextResponse.json({ error: "No autorizado para editar esta reseña" }, { status: 403 });
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    return NextResponse.json(review, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


