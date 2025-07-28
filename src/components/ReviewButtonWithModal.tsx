import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

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

// Componente de estrellas
const StarRatingInput = ({
  rating,
  setRating,
}: {
  rating: number;
  setRating: (val: number) => void;
}) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1 mb-3">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          onClick={() => setRating(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill={(hover || rating) >= star ? "#C95100" : "#E0E0E0"}
          >
            <path d="M12 .587l3.668 7.57 8.332 1.591-6 5.845 1.42 8.29L12 19.771 4.58 24.293 6 15.593 0 9.748l8.332-1.591z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

// Modal con formulario
const ReviewModal = ({
  show,
  onClose,
  academiaId,
  existingReview,
  onReviewSubmitted,
}: {
  show: boolean;
  onClose: () => void;
  academiaId: string;
  existingReview?: Review | null;
  onReviewSubmitted?: () => void;
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment);
    } else {
      setRating(0);
      setComment("");
    }
  }, [existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return toast.error("Seleccioná una puntuación.");

    try {
      setLoading(true);

      if (existingReview) {
        // Editar reseña existente
        await axios.put(`/api/reviews/academia/${existingReview._id}`, {
          rating,
          comment,
        });

        toast.success("¡Reseña actualizada!");
      } else {
        // Crear nueva reseña
        await axios.post("/api/reviews", { rating, comment, academiaId });
        toast.success("¡Reseña enviada!");
      }

      onClose();
      onReviewSubmitted?.();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Error al enviar la reseña");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white w-[90%] max-w-md p-6 rounded-xl shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-xl font-bold text-gray-500 hover:text-gray-800"
        >
          ×
        </button>

        <h3 className="text-xl font-semibold mb-4">
          {existingReview ? "Editar tu reseña" : "Dejá tu reseña"}
        </h3>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium mb-1">Puntuación</label>
          <StarRatingInput rating={rating} setRating={setRating} />

          <label className="block text-sm font-medium mb-1">Comentario</label>
          <textarea
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Contanos tu experiencia..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-[#C95100] text-white font-semibold py-2 rounded-[20px] transition disabled:opacity-50"
          >
            {loading
              ? existingReview
                ? "Actualizando..."
                : "Enviando..."
              : existingReview
              ? "Actualizar reseña"
              : "Enviar reseña"}
          </button>
        </form>
      </div>
    </div>
  );
};

// Botón + Modal
const ReviewButtonWithModal = ({
  academiaId,
  existingReview,
  onReviewSubmitted,
}: {
  academiaId: string;
  existingReview?: Review | null;
  onReviewSubmitted?: () => void;
}) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-[#eee] w-[90%] text-black px-4 py-2 rounded-[10px] font-semibold transition"
      >
        {existingReview ? "Editar tu reseña" : "Dejar reseña"}
      </button>

      <ReviewModal
        show={showModal}
        onClose={() => setShowModal(false)}
        academiaId={academiaId}
        existingReview={existingReview}
        onReviewSubmitted={onReviewSubmitted}
      />
    </>
  );
};

export default ReviewButtonWithModal;
