// // app/api/reviews/route.js
// import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import Review from "@/models/Review";
// import { authOptions } from "../../../libs/authOptions";
// import User from "@/models/user";
// import Academia from "@/models/academia";
// import { connectDB } from "@/libs/mongodb";

// export async function POST(req) {
//   await connectDB();
//  const session = await getServerSession(authOptions);

//   if (!session?.user) {
//     return NextResponse.json({ error: "No autenticado" }, { status: 401 });
//   }

//   const { rating, comment, profesorId, academiaId } = await req.json();

//   if (!rating || rating < 1 || rating > 5) {
//     return NextResponse.json({ error: "Puntuación inválida" }, { status: 400 });
//   }

//   if (!profesorId && !academiaId) {
//     return NextResponse.json({ error: "Debe reseñar un profesor o una academia" }, { status: 400 });
//   }

//   if (profesorId && academiaId) {
//     return NextResponse.json({ error: "Solo puede reseñar uno a la vez" }, { status: 400 });
//   }

//   try {
//     const newReview = await Review.create({
//       author: session.user.id,
//       rating,
//       comment,
//       profesor: profesorId || undefined,
//       academia: academiaId || undefined,
//     });

//     return NextResponse.json(newReview, { status: 201 });
//   } catch (err) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

// app/api/reviews/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Review from "@/models/Review";
import { authOptions } from "../../../libs/authOptions";
import { connectDB } from "@/libs/mongodb";

export async function POST(req) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { rating, comment, profesorId, academiaId } = await req.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Puntuación inválida" }, { status: 400 });
  }

  if (!profesorId && !academiaId) {
    return NextResponse.json(
      { error: "Debe reseñar un profesor o una academia" },
      { status: 400 }
    );
  }

  if (profesorId && academiaId) {
    return NextResponse.json(
      { error: "Solo puede reseñar uno a la vez" },
      { status: 400 }
    );
  }

  try {
    // 🔐 Verificar si ya existe una reseña previa
    const existingReview = await Review.findOne({
      author: session.user.id,
      ...(academiaId && { academia: academiaId }),
      ...(profesorId && { profesor: profesorId }),
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Ya dejaste una reseña. Solo podés editarla." },
        { status: 400 }
      );
    }

    // ✅ Crear reseña si no existe una previa
    const newReview = await Review.create({
      author: session.user.id,
      rating,
      comment,
      profesor: profesorId || undefined,
      academia: academiaId || undefined,
    });

    return NextResponse.json(newReview, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json(
        { error: "Reseña no encontrada" },
        { status: 404 }
      );
    }

    if (review.author.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "No autorizado para editar esta reseña" },
        { status: 403 }
      );
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    return NextResponse.json(review, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
