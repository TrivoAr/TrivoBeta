"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import ReviewCard from "@/components/ReviewCard";
import RatingStars from "@/components/RatingStars";
import { useRouter } from "next/navigation";
import { getProfileImage } from "@/app/api/profile/getProfileImage";

type Review = {
  _id: string;
  author: {
    _id: string;
    firstname: string;
    lastname: string;
    imagen?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
};

export default function ReseñasPage() {
  const params = useParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const router = useRouter();
  const reviewsPerPage = 5;
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get(`/api/reviews/academia/${params.id}`);
        const allReviews = res.data.reviews as Review[];

        // Agregar imagen de perfil a cada autor
        const reviewsConImagen = await Promise.all(
          allReviews.map(async (review) => {
            try {
              const profileImage = await getProfileImage(
                "profile-image.jpg",
                review.author._id
              );

              return {
                ...review,
                author: {
                  ...review.author,
                  imagen: profileImage,
                },
              };
            } catch (error) {
              return {
                ...review,
                author: {
                  ...review.author,
                  imagen:
                    "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg",
                },
              };
            }
          })
        );

        // Ordenar por fecha descendente
        const sorted = reviewsConImagen.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setReviews(sorted);
        setAverageRating(res.data.average);
        setFilteredReviews(sorted);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchReviews();
    }
  }, [params.id]);

  const handleFilterChange = (rating: number | null) => {
    setSelectedRating(rating);
    setCurrentPage(1); // reset page
    if (rating === null) {
      setFilteredReviews(reviews);
    } else {
      setFilteredReviews(reviews.filter((r) => r.rating === rating));
    }
  };

  // Paginación
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  );

  return (
    <div className="mx-auto w-[390px]">
      <div className="relative h-[30px] w-full flex">
        <button
          type="button"
          onClick={() => router.back()}
          className="btnFondo absolute top-2 left-2 text-white p-2 rounded-full shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="black"
            viewBox="0 0 16 16"
            width="24"
            height="24"
          >
            <path
              fillRule="evenodd"
              d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
            />
          </svg>
        </button>
      </div>

      <h1 className="text-xl font-semibold mt-2 mb-2 text-center">
        Reseñas de los usuarios
      </h1>

      {/* Promedio */}
      <div className="flex items-center justify-center mb-6 gap-2">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-medium">
            {averageRating.toFixed(2)}
          </span>
          <RatingStars rating={averageRating} />
        </div>
      </div>

      {/* Filtro por estrellas */}
      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        <button
          className={`px-3 py-1 rounded-full text-sm ${
            selectedRating === null
              ? "bg-[#C95100] text-white"
              : "bg-white text-gray-700 border shadow-md"
          }`}
          onClick={() => handleFilterChange(null)}
        >
          Todas
        </button>
        {[5, 4, 3, 2, 1].map((star) => (
          <button
            key={star}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedRating === star
                ? "bg-[#C95100] text-white"
                : "bg-white text-gray-700 border shadow-md"
            }`}
            onClick={() => handleFilterChange(star)}
          >
            {star}★
          </button>
        ))}
      </div>

      {/* Contenido */}
      {loading ? (
        <p className="text-center text-gray-500">Cargando reseñas...</p>
      ) : filteredReviews.length === 0 ? (
        <p className="text-center text-gray-500">
          No hay reseñas para este filtro.
        </p>
      ) : (
        <div className="space-y-4 p-4">
          {paginatedReviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <button
                key={pageNum}
                className={`px-3 py-1 rounded-md text-sm ${
                  pageNum === currentPage
                    ? "bg-[#C95100] text-white"
                    : "bg-white border shadow-md text-gray-700"
                }`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            )
          )}
        </div>
      )}

      <div className="pb-[120px]"></div>
    </div>
  );
}
