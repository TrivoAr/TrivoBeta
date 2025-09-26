import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ReviewCardProps {
  review: {
    comment: string;
    rating: number;
    createdAt: string;
    author: {
      firstname: string;
      lastname: string;
      imagen?: string;
      _id: string;
    };
  };
  compact?: boolean;
}

const ReviewCard = ({ review, compact = false }: ReviewCardProps) => {
  const { comment, rating, createdAt, author } = review;

  const renderStars = () => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width="10"
            height="10"
            viewBox="0 0 24 24"
            className={
              star <= rating ? "text-[#C95100]" : "text-muted-foreground"
            }
            fill="currentColor"
          >
            <path d="M12 .587l3.668 7.57 8.332 1.591-6 5.845 1.42 8.29L12 19.771 4.58 24.293 6 15.593 0 9.748l8.332-1.591z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col gap-2 p-4 bg-card rounded-[20px] shadow-md border border-border
        ${compact ? "h-[190px] w-[230px]" : "w-full"}`}
    >
      <div className="flex items-center gap-4">
        <img
          src={
            author.imagen || // lo que llega desde el backend
            `https://ui-avatars.com/api/?name=${author.firstname}+${author.lastname}`
          }
          alt={author.firstname}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-medium text-foreground">
            {author.firstname}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(createdAt), "d MMM yyyy", { locale: es })}
          </p>
        </div>
      </div>

      {renderStars()}

      <p
        className={`text-sm text-muted-foreground break-words w-full
          ${compact ? "line-clamp-4" : ""}`}
      >
        {comment}
      </p>
    </div>
  );
};

export default ReviewCard;
