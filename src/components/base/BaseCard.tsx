'use client';

import React, { forwardRef, ReactNode } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface BaseCardProps {
  /**
   * Card content
   */
  children?: ReactNode;
  /**
   * Card title
   */
  title?: string;
  /**
   * Card subtitle or description
   */
  subtitle?: string;
  /**
   * Image source URL
   */
  image?: string;
  /**
   * Image alt text
   */
  imageAlt?: string;
  /**
   * Image aspect ratio
   * @default "16/9"
   */
  imageAspectRatio?: "1/1" | "4/3" | "16/9" | "3/2";
  /**
   * Card variant
   * @default "default"
   */
  variant?: "default" | "bordered" | "elevated" | "flat";
  /**
   * Card size
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
  /**
   * Whether the card is clickable
   * @default false
   */
  clickable?: boolean;
  /**
   * Whether the card is in loading state
   * @default false
   */
  loading?: boolean;
  /**
   * Click handler
   */
  onClick?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Header content (replaces title/subtitle if provided)
   */
  header?: ReactNode;
  /**
   * Footer content
   */
  footer?: ReactNode;
  /**
   * Actions in top-right corner
   */
  actions?: ReactNode;
  /**
   * Badge or tag content
   */
  badge?: ReactNode;
  /**
   * Whether to show image skeleton when loading
   * @default true
   */
  showImageSkeleton?: boolean;
}

/**
 * BaseCard - A flexible, reusable card component
 *
 * Features:
 * - Multiple variants and sizes
 * - Image support with aspect ratios
 * - Loading states
 * - Clickable cards
 * - Customizable header/footer
 * - Action buttons support
 * - Badge/tag support
 *
 * @example
 * ```tsx
 * <BaseCard
 *   title="Event Title"
 *   subtitle="Event description"
 *   image="/event-image.jpg"
 *   imageAlt="Event"
 *   variant="elevated"
 *   clickable
 *   onClick={() => router.push('/event/123')}
 *   badge={<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">New</span>}
 *   actions={
 *     <button onClick={(e) => { e.stopPropagation(); handleFavorite(); }}>
 *       ❤️
 *     </button>
 *   }
 * >
 *   <p>Additional content goes here</p>
 * </BaseCard>
 * ```
 */
export const BaseCard = forwardRef<HTMLDivElement, BaseCardProps>(
  (
    {
      children,
      title,
      subtitle,
      image,
      imageAlt,
      imageAspectRatio = "16/9",
      variant = "default",
      size = "default",
      clickable = false,
      loading = false,
      onClick,
      className,
      header,
      footer,
      actions,
      badge,
      showImageSkeleton = true,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: "bg-white border border-gray-200 shadow-sm",
      bordered: "bg-white border-2 border-gray-300",
      elevated: "bg-white shadow-lg border border-gray-100",
      flat: "bg-gray-50"
    };

    const sizes = {
      sm: "w-[280px]",
      default: "w-[320px]",
      lg: "w-[380px]"
    };

    const aspectRatios = {
      "1/1": "aspect-square",
      "4/3": "aspect-[4/3]",
      "16/9": "aspect-[16/9]",
      "3/2": "aspect-[3/2]"
    };

    const baseClasses = cn(
      // Base styles
      "rounded-xl overflow-hidden transition-all duration-200",
      // Variant styles
      variants[variant],
      // Size styles
      sizes[size],
      // Clickable styles
      clickable && [
        "cursor-pointer",
        "hover:shadow-md hover:scale-[1.02]",
        "active:scale-[0.98]",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      ],
      // Loading styles
      loading && "animate-pulse",
      className
    );

    const handleClick = (e: React.MouseEvent) => {
      if (clickable && onClick) {
        onClick();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (clickable && onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    };

    return (
      <div
        ref={ref}
        className={baseClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={clickable ? 0 : undefined}
        role={clickable ? "button" : undefined}
        aria-disabled={loading}
        {...props}
      >
        {/* Image Section */}
        {image && (
          <div className={cn("relative w-full", aspectRatios[imageAspectRatio])}>
            {loading && showImageSkeleton ? (
              <div className="w-full h-full bg-gray-200 animate-pulse" />
            ) : (
              <Image
                src={image}
                alt={imageAlt || title || "Card image"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            )}

            {/* Badge */}
            {badge && (
              <div className="absolute top-3 left-3 z-10">
                {badge}
              </div>
            )}

            {/* Actions */}
            {actions && (
              <div className="absolute top-3 right-3 z-10">
                {actions}
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Header */}
          {header ? (
            <div className="mb-3">
              {header}
            </div>
          ) : (
            (title || subtitle) && (
              <div className="mb-3">
                {title && (
                  <h3 className={cn(
                    "font-semibold text-gray-900 line-clamp-2",
                    size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base"
                  )}>
                    {loading ? (
                      <div className="h-5 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      title
                    )}
                  </h3>
                )}
                {subtitle && (
                  <p className={cn(
                    "text-gray-600 line-clamp-2",
                    size === "sm" ? "text-xs" : "text-sm",
                    title && "mt-1"
                  )}>
                    {loading ? (
                      <div className="h-4 bg-gray-200 rounded animate-pulse mt-1" />
                    ) : (
                      subtitle
                    )}
                  </p>
                )}
              </div>
            )
          )}

          {/* Children Content */}
          {children && (
            <div className="flex-1">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              ) : (
                children
              )}
            </div>
          )}

          {/* Footer */}
          {footer && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              {footer}
            </div>
          )}
        </div>

        {/* Actions in no-image cards */}
        {!image && actions && (
          <div className="absolute top-4 right-4">
            {actions}
          </div>
        )}
      </div>
    );
  }
);

BaseCard.displayName = "BaseCard";

/**
 * Card Grid Container
 * Use this to create responsive grids of cards
 */
export interface CardGridProps {
  children: ReactNode;
  /**
   * Number of columns for different breakpoints
   */
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /**
   * Gap between cards
   * @default "md"
   */
  gap?: "sm" | "md" | "lg";
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = "md",
  className
}) => {
  const gapClasses = {
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6"
  };

  const gridClasses = cn(
    "grid",
    gapClasses[gap],
    columns.sm && `grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

/**
 * Card Skeleton for loading states
 */
export const CardSkeleton: React.FC<{ count?: number; variant?: BaseCardProps['variant'] }> = ({
  count = 1,
  variant = "default"
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <BaseCard
          key={index}
          variant={variant}
          loading
          showImageSkeleton
          image="/placeholder-image.jpg" // This won't load due to loading state
          title="Loading..."
          subtitle="Please wait..."
        />
      ))}
    </>
  );
};