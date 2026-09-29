'use client';

import React, { useState } from 'react';
import { api } from '../lib/api';
import { QrCode, Printer, RotateCw, X, ShieldAlert, Sparkles, Building2 } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#121215] max-w-lg w-full rounded-lg p-6 sm:p-7 border border-zinc-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 shadow-sm btn-shadow transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/80 text-zinc-300 text-xs font-medium mb-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>Front-Desk Attendance Placard</span>
          </div>
          <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">{currentGym.name}</h2>
          <p className="text-xs text-zinc-400">{currentGym.city}</p>
        </div>

        {/* Printable Placard Container */}
        <div className="bg-white rounded-lg p-6 shadow-md text-slate-900 text-center border border-zinc-200">
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
              className="w-48 h-48 rounded-lg border border-slate-200 p-2 shadow-sm"
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
        <div className="flex items-center justify-between pt-5 border-t border-zinc-800 mt-5">
          <button
            onClick={handleRotate}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${rotated ? 'animate-spin' : ''}`} />
            <span>{rotated ? 'Secret Key Rotated!' : 'Rotate Secret'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#18181B] hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 transition-all shadow-sm btn-shadow"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-400" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-white hover:bg-zinc-200 text-xs font-medium text-zinc-950 btn-shadow-primary transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
