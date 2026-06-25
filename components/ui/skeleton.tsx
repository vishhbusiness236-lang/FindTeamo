import React from "react";

interface SkeletonProps {
  className?: string;
  count?: number;
  variant?: "text" | "avatar" | "badge" | "image";
}

const shimmerClass = "bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[200%_200%] animate-shimmer";

export const Skeleton: React.FC<SkeletonProps> = ({ className = "h-4 w-full", count = 1, variant = "text" }) => {
  const baseClass = variant === "text" 
    ? `${shimmerClass} rounded-lg` 
    : variant === "avatar" 
    ? `${shimmerClass} rounded-full` 
    : variant === "badge"
    ? `${shimmerClass} rounded-full`
    : `${shimmerClass} rounded-xl`;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClass} ${className} ${i > 0 ? "mt-2" : ""}`}
          style={{ backgroundSize: "200% 200%" }}
        />
      ))}
    </>
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
    <Skeleton variant="avatar" className="h-12 w-12" />
    <Skeleton variant="text" className="h-5 w-3/4" />
    <Skeleton variant="text" className="h-3.5 w-full" count={2} />
  </div>
);

export const ProfileCardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
    <Skeleton variant="image" className="h-64 w-full" />
    <div className="p-5 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton variant="text" className="h-6 w-3/4" />
        <Skeleton variant="badge" className="h-5 px-2.5 w-16" />
      </div>
      <Skeleton variant="text" className="h-3.5 w-1/2" />
      <div className="flex gap-2 pt-1">
        <Skeleton variant="badge" className="h-6 w-16 rounded-full" />
        <Skeleton variant="badge" className="h-6 w-20 rounded-full" />
      </div>
    </div>
  </div>
);