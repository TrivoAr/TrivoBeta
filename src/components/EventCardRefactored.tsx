"use client";

import React from "react";
import { Clock, MapPin, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BaseCard, BaseButton, IconButton, useModal } from "@/components/base";
import { useFavorites, useMembers } from "@/hooks";
import EventModal from "@/components/EventModal";
import LoginModal from "@/components/Modals/LoginModal";

export interface EventType {
  _id: string;
  title: string;
  date: string; // formato: "YYYY-MM-DD"
  time: string;
  price?: string;
  image: string;
  location: string;
  creadorId: string;
  localidad: string;
  category: string;
  locationCoords?: {
    lat: number;
    lng: number;
  };
  teacher?: string;
  dificultad?: string;
  stravaMap?: {
    id: string;
    summary_polyline: string;
    polyline: string;
    resource_state: number;
  };
  cupo: number;
}

interface ModalEvent {
  id: any;
  locationCoords: { lat: number; lng: number } | string | string[] | null;
  stravaMap?: {
    id: string;
    summary_polyline: string;
    polyline: string;
    resource_state: number;
  };
}

interface EventCardProps {
  event: EventType;
  onJoin?: (event: EventType) => void;
  onMap?: (coords: { lat: number; lng: number }) => void;
}

/**
 * Refactored EventCard using new base components and hooks
 *
 * Improvements:
 * - Uses BaseCard for consistent styling
 * - Uses useFavorites hook for favorites management
 * - Uses useMembers hook for member count
 * - Uses useModal hook for modal state
 * - Cleaner, more maintainable code
 * - Better error handling and loading states
 */
export default function EventCardRefactored({
  event,
  onJoin,
  onMap,
}: EventCardProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // Modal states using the new hook
  const loginModal = useModal();
  const eventModal = useModal();

  // Favorites management with the new hook
  const {
    isFavorite,
    isLoading: favoritesLoading,
    toggleFavorite,
  } = useFavorites("sociales", event._id, {
    showLoginModal: loginModal.open,
    onFavoriteChange: (isFav, itemId) => {
    },
  });

  // Members management with the new hook
  const {
    memberCount,
    availableSpots,
    isLoading: membersLoading,
  } = useMembers(event._id, "social", {
    onlyApproved: true,
    refreshInterval: 30000, // Auto-refresh every 30 seconds
  });

  /**
   * Parse date to local format
   */
  const parseLocalDate = (isoDateString: string): string => {
    const [year, month, day] = isoDateString.split("-");
    const localDate = new Date(Number(year), Number(month) - 1, Number(day));
    return localDate.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  /**
   * Handle join button click
   */
  const handleJoin = () => {
    if (!session?.user?.id) {
      loginModal.open();
      return;
    }

    // Use the onJoin prop or navigate to event page
    if (onJoin) {
      onJoin(event);
    } else {
      router.push(`/social/${event._id}`);
    }
  };

  /**
   * Handle map button click
   */
  const handleMapClick = () => {
    if (event.locationCoords) {
      // Use the onMap prop if provided
      if (onMap) {
        onMap(event.locationCoords);
      }
    }

    // Open event modal with map
    eventModal.open();
  };

  /**
   * Handle favorite button click with loading state
   */
  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    await toggleFavorite();
  };

  /**
   * Calculate spots availability color
   */
  const getSpotsColor = () => {
    const available = availableSpots(event.cupo);
    const ratio = available / event.cupo;

    if (ratio > 0.5) return "bg-green-100 text-green-800";
    if (ratio > 0.2) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  /**
   * Format price display
   */
  const formatPrice = () => {
    if (!event.price) return null;
    if (event.price === "0") return "Gratis";
    return `$${Number(event.price).toLocaleString("es-AR")}`;
  };

  /**
   * Prepare modal event data
   */
  const modalEventData: ModalEvent = {
    id: event._id,
    locationCoords: event.locationCoords || null,
    stravaMap: event.stravaMap,
  };

  return (
    <>
      <BaseCard
        image={event.image}
        imageAlt={event.title}
        variant="elevated"
        size="default"
        clickable
        onClick={handleJoin}
        className="w-[360px]"
        badge={
          <span className="text-xs text-foreground bg-muted px-3 py-1 rounded-full">
            {event.localidad}
          </span>
        }
        actions={
          <IconButton
            icon={
              isFavorite ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="red"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 3.5 4 5.5 4c1.54 0 3.04.99 3.57 2.36h1.87C13.46 4.99 14.96 4 16.5 4 18.5 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="black"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                >
                  <path
                    d="M12.1 21.35l-1.1-1.05C5.14 15.24 2 12.32 2 8.5 2 6 3.98 4 6.5 4c1.74 0 3.41 1.01 4.13 2.44h1.74C14.09 5.01 15.76 4 17.5 4 20.02 4 22 6 22 8.5c0 3.82-3.14 6.74-8.9 11.8l-1 1.05z"
                    strokeWidth="2"
                  />
                </svg>
              )
            }
            onClick={handleFavoriteClick}
            loading={favoritesLoading}
            size="sm"
            variant="ghost"
            className="bg-white/80 hover:bg-white/90"
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          />
        }
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <h2 className="font-bold text-md leading-snug flex-1 mr-2">
            {event.title}
          </h2>
        </div>

        {/* Category and Difficulty */}
        <div className="flex w-full justify-between mb-2">
          <p className="text-sm text-muted-foreground capitalize">
            {event.category} · {event.dificultad}
          </p>
          <span
            className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${getSpotsColor()}`}
          >
            Cupos:{" "}
            {membersLoading
              ? "..."
              : `${availableSpots(event.cupo)}/${event.cupo}`}
          </span>
        </div>

        {/* Date and Time */}
        <div className="flex items-center gap-1 text-sm text-foreground mb-2">
          <Clock size={16} />
          {parseLocalDate(event.date)} {event.time} hs
        </div>

        {/* Price */}
        {event.price && (
          <div className="flex items-center gap-1 text-sm font-semibold text-orange-600 mb-4">
            <Tag size={16} />
            {formatPrice()}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <BaseButton
            variant="primary"
            size="default"
            onClick={(e) => {
              e.stopPropagation();
              handleJoin();
            }}
            className="flex-1"
            disabled={availableSpots(event.cupo) === 0}
          >
            {availableSpots(event.cupo) === 0 ? "Sin Cupos" : "Unirse"}
          </BaseButton>

          <BaseButton
            variant="outline"
            size="default"
            onClick={(e) => {
              e.stopPropagation();
              handleMapClick();
            }}
            leftIcon={<MapPin size={16} />}
            className="flex-1"
          >
            Mapa
          </BaseButton>
        </div>
      </BaseCard>

      {/* Login Modal */}
      <LoginModal isOpen={loginModal.isOpen} onClose={loginModal.close} />

      {/* Event Modal */}
      <EventModal
        isOpen={eventModal.isOpen}
        onClose={eventModal.close}
        event={modalEventData}
      />
    </>
  );
}

/**
 * Example of how to use the refactored component with loading and error states
 */
export function EventCardWithStates({
  event,
  loading = false,
  error,
}: {
  event?: EventType;
  loading?: boolean;
  error?: string;
}) {
  if (loading) {
    return (
      <BaseCard
        variant="elevated"
        size="default"
        loading
        title="Loading event..."
        subtitle="Please wait..."
        image="/placeholder.jpg"
        className="w-[360px]"
      />
    );
  }

  if (error) {
    return (
      <BaseCard
        variant="bordered"
        size="default"
        className="w-[360px] border-red-200"
      >
        <div className="text-center p-4">
          <p className="text-red-600 font-medium">Error loading event</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <BaseButton
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => window.location.reload()}
          >
            Try Again
          </BaseButton>
        </div>
      </BaseCard>
    );
  }

  if (!event) {
    return (
      <BaseCard variant="flat" size="default" className="w-[360px]">
        <div className="text-center p-4">
          <p className="text-muted-foreground">No event data available</p>
        </div>
      </BaseCard>
    );
  }

  return <EventCardRefactored event={event} />;
}
