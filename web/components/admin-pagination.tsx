"use client";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  loading?: boolean;
}

export default function AdminPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  loading = false,
}: AdminPaginationProps) {
  if (total === 0) {
    return null;
  }

  const startItem = Math.min((page - 1) * limit + 1, total);
  const endItem = Math.min(page * limit, total);

  // Generate pagination buttons with smart ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include page 1
      pages.push(1);

      if (page > 3) {
        pages.push("...");
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push("...");
      }

      // Always include last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-divider text-xs text-neutral-700">
      <div className="font-medium">
        แสดงรายการ <strong className="text-text font-bold">{startItem.toLocaleString("th-TH")}</strong> ถึง{" "}
        <strong className="text-text font-bold">{endItem.toLocaleString("th-TH")}</strong> จากทั้งหมด{" "}
        <strong className="text-text font-bold">{total.toLocaleString("th-TH")}</strong> รายการ
      </div>

      <div className="flex items-center gap-1 self-center sm:self-auto flex-wrap">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="px-2.5 py-1.5 rounded-lg border border-divider bg-surface hover:bg-bg disabled:opacity-40 disabled:cursor-not-allowed text-text font-semibold transition-colors cursor-pointer"
        >
          ‹ ก่อนหน้า
        </button>

        {/* Page Buttons */}
        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-neutral-400 select-none">
                …
              </span>
            );
          }

          const pageNum = Number(p);
          const isActive = pageNum === page;

          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              disabled={loading || isActive}
              className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                isActive
                  ? "bg-accent !text-white shadow-2xs border border-accent"
                  : "border border-divider bg-surface hover:bg-bg text-text"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || loading}
          className="px-2.5 py-1.5 rounded-lg border border-divider bg-surface hover:bg-bg disabled:opacity-40 disabled:cursor-not-allowed text-text font-semibold transition-colors cursor-pointer"
        >
          ถัดไป ›
        </button>
      </div>
    </div>
  );
}
