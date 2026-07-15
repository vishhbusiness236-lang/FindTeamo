"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  seed?: string;
}

const sizeStyles = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const textSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-xl",
};

const fallbackColors = [
  "from-blue-500 to-blue-600",
  "from-indigo-500 to-indigo-600",
  "from-emerald-500 to-emerald-600",
  "from-purple-500 to-purple-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-cyan-500 to-cyan-600",
  "from-pink-500 to-pink-600",
];

function getInitials(name?: string): string {
  if (!name || name.trim() === "") return "?";
  return name
    .trim()
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getFallbackColor(seed?: string): string {
  const base = seed || "default";
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return fallbackColors[Math.abs(hash) % fallbackColors.length];
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "Avatar",
  name,
  size = "md",
  className = "",
  seed,
}) => {
  const [hasError, setHasError] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(src ?? null);
  const [isImageLoading, setIsImageLoading] = useState(!!resolvedSrc);

  useEffect(() => {
    setResolvedSrc(src ?? null);
    setHasError(false);
    setIsImageLoading(!!src);
  }, [src]);

  const initials = getInitials(name ?? alt);
  const fallbackClass = getFallbackColor(seed ?? `${name ?? alt ?? "user"}`);
  const shouldShowImage = Boolean(resolvedSrc) && !hasError;

  return (
    <div
      className={`relative flex-shrink-0 overflow-hidden rounded-full border border-white/20 bg-gradient-to-br ${fallbackClass} shadow-md ${sizeStyles[size]} ${className}`.trim()}
    >
      {shouldShowImage && resolvedSrc ? (
        <>
          {isImageLoading && (
            <div className="absolute inset-0 animate-pulse bg-white/20" />
          )}
          <Image
            src={resolvedSrc}
            alt={alt}
            fill
            sizes="64px"
            unoptimized
            className="object-cover transition-opacity duration-300"
            onLoad={() => setIsImageLoading(false)}
            onError={() => {
              setHasError(true);
              setIsImageLoading(false);
            }}
          />
        </>
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center font-bold uppercase tracking-widest text-white ${textSizes[size]}`}
        >
          {initials}
        </span>
      )}
    </div>
  );
};
