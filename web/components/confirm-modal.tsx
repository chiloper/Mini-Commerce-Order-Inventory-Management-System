"use client";

import React, { useEffect } from "react";

export type ModalVariant = "danger" | "warning" | "info" | "success";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: React.ReactNode;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string | null; // Pass null to make it an Alert modal (single OK button)
  variant?: ModalVariant;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  message,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  variant = "info",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const isAlertOnly = cancelText === null;

  // Icon & color styling per variant
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-rose-100 text-rose-600 border border-rose-200",
          btnConfirm:
            "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs focus:ring-rose-500",
          icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          ),
        };
      case "warning":
        return {
          iconBg: "bg-amber-100 text-amber-700 border border-amber-200",
          btnConfirm:
            "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs focus:ring-amber-500",
          icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
        };
      case "success":
        return {
          iconBg: "bg-emerald-100 text-emerald-700 border border-emerald-200",
          btnConfirm:
            "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs focus:ring-emerald-500",
          icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ),
        };
      case "info":
      default:
        return {
          iconBg: "bg-accent/10 text-accent border border-accent/20",
          btnConfirm:
            "bg-accent hover:bg-accent-600 active:bg-accent-700 text-white shadow-xs focus:ring-accent",
          icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          ),
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => !isLoading && onCancel()}
    >
      <div
        className="w-full max-w-md bg-surface border border-divider rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        {/* Close Icon Button */}
        {!isLoading && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-bg transition-colors cursor-pointer"
            title="ปิด"
          >
            ✕
          </button>
        )}

        {/* Modal Header & Icon */}
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${styles.iconBg}`}>
            {styles.icon}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 id="confirm-modal-title" className="text-base sm:text-lg font-bold text-text m-0 leading-tight">
              {title}
            </h3>
            <div className="text-xs sm:text-sm text-neutral-600 font-medium mt-1.5 leading-relaxed break-words whitespace-pre-line">
              {description ?? message}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-divider mt-2">
          {!isAlertOnly && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onCancel}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-divider bg-surface hover:bg-bg text-text transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${styles.btnConfirm}`}
          >
            {isLoading && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10" />
              </svg>
            )}
            <span>{isLoading ? "กำลังดำเนินการ..." : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
