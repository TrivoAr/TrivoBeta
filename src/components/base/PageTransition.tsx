"use client";

import React, { ReactNode } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { usePathname } from "next/navigation";

// Page transition variants
const pageVariants: Record<string, Variants> = {
  // Fade simple y elegante
  fade: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
    },
  },

  // Slide horizontal (como navegación)
  slideHorizontal: {
    initial: { x: "100%", opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        duration: 0.5,
      },
    },
    exit: {
      x: "-100%",
      opacity: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
    },
  },

  // Slide vertical
  slideVertical: {
    initial: { y: "100%", opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        duration: 0.5,
      },
    },
    exit: {
      y: "-100%",
      opacity: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
    },
  },

  // Scale suave
  scale: {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        duration: 0.4,
      },
    },
    exit: {
      scale: 1.1,
      opacity: 0,
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
    },
  },

  // Flip rotación
  flip: {
    initial: { rotateY: -90, opacity: 0 },
    animate: {
      rotateY: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        duration: 0.6,
      },
    },
    exit: {
      rotateY: 90,
      opacity: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
    },
  },

  // Dissolve efecto moderno
  dissolve: {
    initial: { opacity: 0, scale: 0.9, filter: "blur(8px)" },
    animate: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    exit: {
      opacity: 0,
      scale: 1.1,
      filter: "blur(8px)",
      transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
    },
  },
};

export interface PageTransitionProps {
  /**
   * Page content
   */
  children: ReactNode;
  /**
   * Animation variant
   * @default "fade"
   */
  variant?: keyof typeof pageVariants;
  /**
   * Custom CSS classes
   */
  className?: string;
  /**
   * Whether to disable animations
   * @default false
   */
  disabled?: boolean;
  /**
   * Custom animation duration multiplier
   * @default 1
   */
  durationMultiplier?: number;
}

/**
 * PageTransition - Component for smooth page transitions
 *
 * Provides smooth animations between page navigations using Framer Motion.
 * Automatically detects route changes and applies the selected animation.
 *
 * Available variants:
 * - fade: Simple fade in/out (default)
 * - slideHorizontal: Slide left/right
 * - slideVertical: Slide up/down
 * - scale: Scale animation
 * - flip: 3D flip rotation
 * - dissolve: Modern blur + scale effect
 *
 * Usage:
 * Wrap your page content with this component in your layout or individual pages.
 *
 * @example
 * ```tsx
 * // In layout.tsx or individual pages
 * <PageTransition variant="slideHorizontal">
 *   {children}
 * </PageTransition>
 * ```
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  variant = "fade",
  className = "",
  disabled = false,
  durationMultiplier = 1,
}) => {
  const pathname = usePathname();
  const variants = pageVariants[variant];

  // If animations are disabled, just render children
  if (disabled) {
    return <>{children}</>;
  }

  // Create modified variants with duration multiplier
  const modifiedVariants: Variants = React.useMemo(() => {
    if (durationMultiplier === 1) return variants;

    const modified: Variants = { ...variants };

    // Modify animate transition if it exists and has duration
    if (
      modified.animate &&
      typeof modified.animate === "object" &&
      "transition" in modified.animate
    ) {
      const animateObj = modified.animate as any;
      if (
        animateObj.transition &&
        typeof animateObj.transition === "object" &&
        "duration" in animateObj.transition
      ) {
        modified.animate = {
          ...animateObj,
          transition: {
            ...animateObj.transition,
            duration: animateObj.transition.duration * durationMultiplier,
          },
        };
      }
    }

    // Modify exit transition if it exists and has duration
    if (
      modified.exit &&
      typeof modified.exit === "object" &&
      "transition" in modified.exit
    ) {
      const exitObj = modified.exit as any;
      if (
        exitObj.transition &&
        typeof exitObj.transition === "object" &&
        "duration" in exitObj.transition
      ) {
        modified.exit = {
          ...exitObj,
          transition: {
            ...exitObj.transition,
            duration: exitObj.transition.duration * durationMultiplier,
          },
        };
      }
    }

    return modified;
  }, [variants, durationMultiplier]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname} // Re-render when route changes
        variants={modifiedVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`w-full ${className}`}
        style={{
          willChange: "transform, opacity",
          transformStyle: variant === "flip" ? "preserve-3d" : undefined,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Pre-configured page transition components
 */
export const FadePageTransition = (
  props: Omit<PageTransitionProps, "variant">
) => <PageTransition variant="fade" {...props} />;

export const SlidePageTransition = (
  props: Omit<PageTransitionProps, "variant">
) => <PageTransition variant="slideHorizontal" {...props} />;

export const ScalePageTransition = (
  props: Omit<PageTransitionProps, "variant">
) => <PageTransition variant="scale" {...props} />;

export const FlipPageTransition = (
  props: Omit<PageTransitionProps, "variant">
) => <PageTransition variant="flip" {...props} />;

export const DissolvePageTransition = (
  props: Omit<PageTransitionProps, "variant">
) => <PageTransition variant="dissolve" {...props} />;

/**
 * Hook for managing page transition state
 */
export const usePageTransition = () => {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  React.useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return {
    pathname,
    isTransitioning,
  };
};

/**
 * Loading overlay for page transitions
 */
export interface TransitionLoadingProps {
  isLoading?: boolean;
  className?: string;
}

export const TransitionLoading: React.FC<TransitionLoadingProps> = ({
  isLoading = false,
  className = "",
}) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}
        >
          <motion.div
            animate={{
              rotate: 360,
              transition: { duration: 1, repeat: Infinity, ease: "linear" },
            }}
            className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
