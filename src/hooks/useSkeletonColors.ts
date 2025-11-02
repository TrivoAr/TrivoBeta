import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Hook para obtener colores de skeleton según el tema actual
 * Resuelve el problema de skeletons que no se adaptan al tema oscuro
 *
 * @returns {Object} Colores base y highlight para react-loading-skeleton
 */
export const useSkeletonColors = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mientras carga, usar colores por defecto (tema claro)
  if (!mounted) {
    return {
      baseColor: "#e0e0e0",
      highlightColor: "#f5f5f5",
    };
  }

  // Tema oscuro
  if (resolvedTheme === "dark") {
    return {
      baseColor: "#1f2937", // gray-800
      highlightColor: "#374151", // gray-700
    };
  }

  // Tema claro (por defecto)
  return {
    baseColor: "#e0e0e0",
    highlightColor: "#f5f5f5",
  };
};
