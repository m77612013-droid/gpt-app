"use client";

import { Gem } from "lucide-react";

/**
 * جنى — Luxury brand logo
 * Blue gradient + Amiri Bold + glow + gem icon
 */
export default function LogoBrand({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { text: "1.25rem", gem: 10, gap: "0.2rem", glow: "0 0 10px rgba(255,255,255,0.35), 0 0 24px rgba(255,255,255,0.12)" },
    md: { text: "1.5rem",  gem: 12, gap: "0.25rem", glow: "0 0 12px rgba(255,255,255,0.40), 0 0 30px rgba(255,255,255,0.14)" },
    lg: { text: "2.2rem",  gem: 16, gap: "0.3rem",  glow: "0 0 18px rgba(255,255,255,0.45), 0 0 40px rgba(255,255,255,0.16)" },
  }[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: sizes.gap,
        fontFamily: "'Amiri', serif",
        fontWeight: 700,
        fontSize: sizes.text,
        lineHeight: 1.1,
        letterSpacing: "0.02em",
        position: "relative",
      }}
    >
      {/* Gem Icon */}
      <Gem
        size={sizes.gem}
        style={{
          color: "#60a5fa",
          filter: "drop-shadow(0 0 4px rgba(96,165,250,0.8))",
          flexShrink: 0,
          marginBottom: "0.05em",
        }}
        strokeWidth={2}
        fill="#3b82f6"
      />

      {/* جنى — gradient text */}
      <span
        style={{
          background: "linear-gradient(45deg, #94a3b8 0%, #ffffff 35%, #f1f5f9 50%, #ffffff 65%, #94a3b8 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: sizes.glow,
          backgroundSize: "200% 200%",
        }}
      >
        جنى
      </span>
    </span>
  );
}
