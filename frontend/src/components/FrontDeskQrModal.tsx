'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { QrCode, Printer, RotateCw, X, ShieldAlert, Sparkles, Building2, CheckCircle2 } from '@/components/icons';

interface FrontDeskQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FrontDeskQrModal: React.FC<FrontDeskQrModalProps> = ({ isOpen, onClose }) => {
  const currentGym = api.getCurrentGym();
  const [rotating, setRotating] = useState(false);
  const [rotatedMessage, setRotatedMessage] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchQr = async () => {
    setLoading(true);
    try {
      const res = await api.getFrontDeskQrCode();
      if (res?.qrDataUrl) {
        setQrDataUrl(res.qrDataUrl);
      }
    } catch {
      // Keep existing or fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQr();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRotate = async () => {
    setRotating(true);
    try {
      const res = await api.rotateFrontDeskQrCode();
      if (res?.qrDataUrl) {
        setQrDataUrl(res.qrDataUrl);
      } else {
        await fetchQr();
      }
      setRotatedMessage('Secret Key Rotated! Old placards invalidated.');
      setTimeout(() => setRotatedMessage(null), 3000);
    } catch (err: any) {
      setRotatedMessage(err?.message || 'Rotation failed');
      setTimeout(() => setRotatedMessage(null), 3000);
    } finally {
      setRotating(false);
    }
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
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-subtle border border-surface-border text-content-secondary text-xs font-medium mb-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brass-400" />
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

          {/* QR Code image - generated server-side or vector SVG */}
          <div className="flex justify-center my-2">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Gym Front Desk QR Code"
                className="w-52 h-52 rounded-xl border border-slate-200 p-2 shadow-sm object-contain"
              />
            ) : (
              <div className="w-52 h-52 rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col items-center justify-center bg-slate-50">
                <QrCode className="w-16 h-16 text-slate-400 mb-2 animate-pulse" />
                <span className="text-xs text-slate-500 font-mono">
                  {loading ? 'Generating QR...' : 'Internal QR Ready'}
                </span>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-600 mt-4 leading-relaxed">
            Member scans this placard at reception to verify their location challenge.
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-2">
            Gym Slug: {currentGym.slug} • Internal Cryptographic Challenge
          </div>
        </div>

        {rotatedMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-700 dark:text-brass-400 text-xs font-semibold flex items-center justify-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{rotatedMessage}</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between pt-5 border-t border-surface-border mt-5">
          <button
            onClick={handleRotate}
            disabled={rotating}
            className="flex items-center gap-1.5 text-xs text-content-tertiary hover:text-content-primary transition-colors disabled:opacity-50 btn-shadow px-2.5 py-1.5 rounded-lg border border-surface-border bg-surface-subtle"
          >
            <RotateCw className={`w-3.5 h-3.5 ${rotating ? 'animate-spin' : ''}`} />
            <span>{rotating ? 'Rotating Secret...' : 'Rotate Secret'}</span>
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
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 dark:bg-white dark:hover:bg-zinc-200 text-xs font-semibold text-white dark:text-black shadow-sm btn-shadow transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
