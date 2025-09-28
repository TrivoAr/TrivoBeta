"use client";

import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface LoadingSkeletonProps {
  variant?: "default" | "card" | "text" | "avatar" | "button" | "image";
  count?: number;
  height?: string | number;
  width?: string | number;
  borderRadius?: string | number;
  className?: string;
  circle?: boolean;
  inline?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = "default",
  count = 1,
  height,
  width,
  borderRadius,
  className,
  circle = false,
  inline = false,
}) => {
  // Configuración de colores para tema claro y oscuro
  const lightTheme = {
    baseColor: "#ebebeb",
    highlightColor: "#f5f5f5",
  };

  const darkTheme = {
    baseColor: "#374151", // gray-700
    highlightColor: "#4b5563", // gray-600
  };

  // Función para detectar el modo oscuro
  const detectDarkMode = (): boolean => {
    if (typeof window === "undefined") return false;

    // Verificar si hay clase 'dark' en el documento (Tailwind CSS)
    const hasDarkClass = document.documentElement.classList.contains("dark");

    // Verificar data-theme attribute
    const dataTheme = document.documentElement.getAttribute("data-theme");
    const hasNightTheme = dataTheme === "night";

    // Verificar CSS media query como fallback
    const prefersDark = window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    return hasDarkClass || hasNightTheme || prefersDark;
  };

  const currentTheme = detectDarkMode() ? darkTheme : lightTheme;

  // Configuraciones predefinidas por variante
  const variantConfigs: Record<string, {
    height?: string | number;
    width?: string | number;
    borderRadius?: string | number;
    circle?: boolean;
  }> = {
    default: {},
    card: {
      height: height || 120,
      borderRadius: borderRadius || "0.75rem",
    },
    text: {
      height: height || "1em",
      borderRadius: borderRadius || "0.25rem",
    },
    avatar: {
      height: height || 40,
      width: width || 40,
      circle: true,
    },
    button: {
      height: height || 40,
      width: width || 120,
      borderRadius: borderRadius || "0.5rem",
    },
    image: {
      height: height || 200,
      borderRadius: borderRadius || "0.5rem",
    },
  };

  const config = variantConfigs[variant] || {};

  return (
    <SkeletonTheme
      baseColor={currentTheme.baseColor}
      highlightColor={currentTheme.highlightColor}
    >
      <Skeleton
        count={count}
        height={config.height || height}
        width={config.width || width}
        borderRadius={config.borderRadius || borderRadius}
        circle={config.circle || circle}
        inline={inline}
        className={className}
      />
    </SkeletonTheme>
  );
};

export default LoadingSkeleton;

// Componentes específicos para casos comunes
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSkeleton variant="card" className={className} />
);

export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 1, className }) => (
  <LoadingSkeleton variant="text" count={lines} className={className} />
);

export const SkeletonAvatar: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 40, className }) => (
  <LoadingSkeleton
    variant="avatar"
    height={size}
    width={size}
    className={className}
  />
);

export const SkeletonButton: React.FC<{
  width?: number | string;
  className?: string;
}> = ({ width, className }) => (
  <LoadingSkeleton
    variant="button"
    width={width}
    className={className}
  />
);

export const SkeletonImage: React.FC<{
  height?: number | string;
  width?: number | string;
  className?: string;
}> = ({ height, width, className }) => (
  <LoadingSkeleton
    variant="image"
    height={height}
    width={width}
    className={className}
  />
);