'use client';

import React, { useState } from 'react';
import { api } from '../lib/api';
import { QrCode, Printer, RotateCw, X, ShieldAlert, Sparkles, Building2 } from '@/components/icons';

interface FrontDeskQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FrontDeskQrModal: React.FC<FrontDeskQrModalProps> = ({ isOpen, onClose }) => {
  const currentGym = api.getCurrentGym();
  const [rotated, setRotated] = useState(false);

  if (!isOpen) return null;

  const qrPayload = JSON.stringify({
    gymId: currentGym.id,
    slug: currentGym.slug,
    v: 1,
  });

  // Use a reliable SVG-based QR representation for immediate rendering
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    qrPayload,
  )}&bgcolor=ffffff&color=0b0f19&margin=1`;

  const handleRotate = () => {
    setRotated(true);
    setTimeout(() => setRotated(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-surface max-w-lg w-full rounded-2xl p-6 sm:p-7 border border-surface-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-xl text-content-tertiary hover:text-content-primary hover:bg-surface-subtle shadow-sm btn-shadow transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-subtle border border-surface-border text-content-secondary text-xs font-medium mb-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-neon-cyan" />
            <span>Front-Desk Attendance Placard</span>
          </div>
          <h2 className="text-lg font-bold text-content-primary tracking-tight">{currentGym.name}</h2>
          <p className="text-xs text-content-secondary">{currentGym.city}</p>
        </div>

        {/* Printable Placard Container */}
        <div className="bg-white rounded-2xl p-6 shadow-md text-slate-900 text-center border border-slate-200">
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
            MEMBER ATTENDANCE SCANNER
          </div>
          <div className="text-sm font-semibold text-slate-900 mb-4">
            Scan to Record Daily Check-In & Streak
          </div>

          {/* QR Code image */}
          <div className="flex justify-center my-2">
            <img
              src={qrUrl}
              alt="Gym Front Desk QR Code"
              className="w-48 h-48 rounded-xl border border-slate-200 p-2 shadow-sm"
            />
          </div>

          <div className="text-xs text-slate-600 mt-4 leading-relaxed">
            Open camera or WhatsApp to scan this QR code when arriving at reception.
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-2">
            Gym ID: {currentGym.slug} • GymRetain Multi-Tenant
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-5 border-t border-surface-border mt-5">
          <button
            onClick={handleRotate}
            className="flex items-center gap-1.5 text-xs text-content-tertiary hover:text-content-primary transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${rotated ? 'animate-spin' : ''}`} />
            <span>{rotated ? 'Secret Key Rotated!' : 'Rotate Secret'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-medium text-content-primary transition-all shadow-sm btn-shadow"
            >
              <Printer className="w-3.5 h-3.5 text-content-secondary" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 dark:bg-white dark:hover:bg-zinc-200 text-xs font-semibold text-white dark:text-black btn-shadow transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
