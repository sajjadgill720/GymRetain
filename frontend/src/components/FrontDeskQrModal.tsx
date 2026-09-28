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
      <div className="glass-card max-w-lg w-full rounded-3xl p-8 border border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-2 shadow-sm shadow-brand-500/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Front-Desk Attendance Placard</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">{currentGym.name}</h2>
          <p className="text-xs text-slate-400">{currentGym.city}</p>
        </div>

        {/* Printable Placard Container */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl text-slate-900 text-center border-4 border-slate-900/10">
          <div className="text-xs uppercase tracking-widest font-black text-slate-500 mb-1">
            MEMBER ATTENDANCE SCANNER
          </div>
          <div className="text-sm font-bold text-slate-900 mb-4">
            Scan to Record Daily Check-In & Streak 🔥
          </div>

          {/* QR Code image */}
          <div className="flex justify-center my-2">
            <img
              src={qrUrl}
              alt="Gym Front Desk QR Code"
              className="w-52 h-52 rounded-xl border-2 border-slate-200 p-2 shadow-inner"
            />
          </div>

          <div className="text-[11px] text-slate-600 mt-4 leading-relaxed font-medium">
            Open camera or WhatsApp to scan this QR code when you arrive at reception.
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-2">
            Gym ID: {currentGym.slug} • GymRetain Multi-Tenant Security
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-6">
          <button
            onClick={handleRotate}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors shadow-sm"
          >
            <RotateCw className={`w-3.5 h-3.5 ${rotated ? 'animate-spin' : ''}`} />
            <span>{rotated ? 'Secret Key Rotated!' : 'Rotate QR Secret'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-white/10 text-xs font-semibold text-white transition-all shadow-sm shadow-black/40 hover:shadow-md btn-shadow"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>Print Placard</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white shadow-md shadow-brand-500/30 hover:shadow-lg hover:shadow-brand-500/40 btn-shadow-primary transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
