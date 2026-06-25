import React from "react";

interface PaginationProps {
  current: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ current, total, onPageChange }) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(current - 1)}
        disabled={current === 1}
        className="px-3 py-2 rounded-lg border border-slate-300 text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
      >
        Previous
      </button>
      <span className="text-sm text-slate-600">
        Page {current} of {total}
      </span>
      <button
        onClick={() => onPageChange(current + 1)}
        disabled={current === total}
        className="px-3 py-2 rounded-lg border border-slate-300 text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
      >
        Next
      </button>
    </div>
  );
};
