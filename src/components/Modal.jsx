import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-coffee-950/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div className="relative w-full max-w-lg bg-coffee-50 dark:bg-darkbg-card rounded-t-3xl sm:rounded-3xl shadow-2xl border border-coffee-200/80 dark:border-darkbg-border overflow-hidden z-10 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* iOS Pull indicator for mobile */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-coffee-300 dark:bg-darkbg-border" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-coffee-200/60 dark:border-darkbg-border/60">
          <h3 className="text-lg font-bold text-coffee-900 dark:text-coffee-100 tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-coffee-500 hover:text-coffee-800 dark:text-coffee-400 dark:hover:text-coffee-100 bg-coffee-200/50 hover:bg-coffee-200 dark:bg-darkbg-input dark:hover:bg-darkbg-cardHover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto pb-safe">
          {children}
        </div>
      </div>
    </div>
  );
};
