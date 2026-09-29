import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dim cozy backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        className={`relative w-full ${maxWidthStyles[maxWidth]} rounded-2xl bg-[#1A1816] border border-[#2E2A27] shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150`}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-[#A39E98] hover:text-[#F7F5F2] hover:bg-[#24201C] transition-all shadow-sm"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {(title || description) && (
          <div className="mb-5 pr-8">
            {title && (
              <h3 className="text-base sm:text-lg font-bold text-[#F7F5F2] tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-[#A39E98] mt-1 leading-relaxed">{description}</p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};
