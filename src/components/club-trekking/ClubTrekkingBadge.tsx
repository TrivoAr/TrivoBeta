import React from "react";
import { Mountain, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClubTrekkingBadgeProps {
  variant?: "small" | "medium" | "large";
  showLabel?: boolean;
  tipo?: "bronce" | "plata" | "oro";
  className?: string;
  incluidaEnMembresia?: boolean;
}

export function ClubTrekkingBadge({
  variant = "medium",
  showLabel = true,
  tipo = "bronce",
  className,
  incluidaEnMembresia = false,
}: ClubTrekkingBadgeProps) {
  const badgeColors = {
    bronce: {
      bg: "bg-gradient-to-br from-[#CD7F32] to-[#8B5A2B]",
      border: "border-[#CD7F32]",
      text: "text-[#CD7F32]",
      bgLight: "bg-[#CD7F32]/10",
    },
    plata: {
      bg: "bg-gradient-to-br from-[#C0C0C0] to-[#808080]",
      border: "border-[#C0C0C0]",
      text: "text-[#808080]",
      bgLight: "bg-[#C0C0C0]/10",
    },
    oro: {
      bg: "bg-gradient-to-br from-[#FFD700] to-[#DAA520]",
      border: "border-[#FFD700]",
      text: "text-[#DAA520]",
      bgLight: "bg-[#FFD700]/10",
    },
  };

  const sizes = {
    small: {
      container: "px-2 py-1 gap-1",
      icon: "w-3 h-3",
      text: "text-xs",
    },
    medium: {
      container: "px-3 py-1.5 gap-1.5",
      icon: "w-4 h-4",
      text: "text-sm",
    },
    large: {
      container: "px-4 py-2 gap-2",
      icon: "w-5 h-5",
      text: "text-base",
    },
  };

  if (incluidaEnMembresia) {
    // Badge para salidas incluidas en membresía
    return (
      <div
        className={cn(
          "inline-flex items-center rounded-full bg-green-500/10 border border-green-500/20",
          sizes[variant].container,
          className
        )}
      >
        <Check className={cn("text-green-600", sizes[variant].icon)} />
        {showLabel && (
          <span className={cn("font-semibold text-green-700", sizes[variant].text)}>
            Incluida en Club
          </span>
        )}
      </div>
    );
  }

  // Badge de miembro con nivel
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border",
        badgeColors[tipo].bgLight,
        badgeColors[tipo].border,
        sizes[variant].container,
        className
      )}
    >
      <div className={cn("relative", sizes[variant].icon)}>
        <Mountain className={cn("w-full h-full", badgeColors[tipo].text)} />
        {tipo === "oro" && (
          <Sparkles
            className="absolute -top-1 -right-1 w-2 h-2 text-yellow-500"
            fill="currentColor"
          />
        )}
      </div>
      {showLabel && (
        <span className={cn("font-semibold", badgeColors[tipo].text, sizes[variant].text)}>
          Miembro {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
        </span>
      )}
    </div>
  );
}

// Badge para mostrar en perfil de usuario
export function UserClubBadge({ tipo = "bronce" }: { tipo?: "bronce" | "plata" | "oro" }) {
  const badgeInfo = {
    bronce: {
      gradient: "from-[#CD7F32] to-[#8B5A2B]",
      shadow: "shadow-[#CD7F32]/20",
      title: "Miembro Bronce",
      description: "Comenzando tu aventura",
    },
    plata: {
      gradient: "from-[#C0C0C0] to-[#808080]",
      shadow: "shadow-[#C0C0C0]/20",
      title: "Miembro Plata",
      description: "10+ salidas completadas",
    },
    oro: {
      gradient: "from-[#FFD700] to-[#DAA520]",
      shadow: "shadow-[#FFD700]/20",
      title: "Miembro Oro",
      description: "25+ salidas completadas",
    },
  };

  const badge = badgeInfo[tipo];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 shadow-lg",
        badge.gradient,
        badge.shadow
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path
            d="M0,100 L50,70 L100,85 L150,60 L200,75 L200,200 L0,200 Z"
            fill="white"
          />
        </svg>
      </div>

      <div className="relative z-10 flex items-center gap-4">
        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
          <Mountain className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">{badge.title}</h3>
          <p className="text-white/80 text-sm">{badge.description}</p>
        </div>
        {tipo === "oro" && (
          <Sparkles className="ml-auto w-6 h-6 text-white" fill="white" />
        )}
      </div>

      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
    </div>
  );
}

// Badge compacto para lista de miembros
export function CompactClubBadge({ tipo = "bronce" }: { tipo?: "bronce" | "plata" | "oro" }) {
  const colors = {
    bronce: "#CD7F32",
    plata: "#C0C0C0",
    oro: "#FFD700",
  };

  return (
    <div
      className="inline-flex items-center justify-center w-6 h-6 rounded-full"
      style={{ backgroundColor: colors[tipo] + "20" }}
    >
      <Mountain className="w-4 h-4" style={{ color: colors[tipo] }} />
    </div>
  );
}
