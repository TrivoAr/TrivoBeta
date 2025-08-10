'use client';
const  RatingStars = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <svg key={"full" + i} width="16" height="16" fill="#C95100" viewBox="0 0 24 24">
          <path d="M12 .587l3.668 7.57L24 9.748l-6 5.845 1.42 8.29L12 19.771l-7.42 4.112L6 15.593 0 9.748l8.332-1.591z" />
        </svg>
      ))}
      {hasHalfStar && (
        <svg width="16" height="16" fill="#C95100" viewBox="0 0 24 24">
          <path d="M12 .587l3.668 7.57L24 9.748l-6 5.845 1.42 8.29L12 19.771V.587z" />
        </svg>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <svg key={"empty" + i} width="16" height="16" fill="#ddd" viewBox="0 0 24 24">
          <path d="M12 .587l3.668 7.57L24 9.748l-6 5.845 1.42 8.29L12 19.771l-7.42 4.112L6 15.593 0 9.748l8.332-1.591z" />
        </svg>
      ))}
    </div>
  );
};

export default RatingStars;
