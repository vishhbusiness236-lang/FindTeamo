import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  clickable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, clickable }) => (
  <div
    className={`rounded-xl border border-slate-200 bg-white shadow-sm transition-all ${
      clickable ? "cursor-pointer hover:shadow-md hover:border-slate-300" : ""
    } ${className}`}
  >
    {children}
  </div>
);
