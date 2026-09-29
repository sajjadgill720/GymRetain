'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '../components/AppLayout';
import { RetentionSparklineRow } from '../components/dashboard/RetentionSparklineRow';
import { FoxstocksMiddleSection } from '../components/dashboard/FoxstocksMiddleSection';
import { FoxstocksBottomSection } from '../components/dashboard/FoxstocksBottomSection';
import { VisionDarkHero } from '../components/dashboard/VisionDarkHero';
import { AiAssistantCard } from '../components/AiAssistantCard';
import { AiRetentionIntelligenceModal } from '../components/dashboard/AiRetentionIntelligenceModal';
import { api } from '../lib/api';
import { DashboardSummary } from '../types';
import {
  Calendar,
  ChevronDown,
  Download,
  Plus,
  QrCode,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const sum = await api.getDashboardSummary();
      setSummary(sum);
    } catch {
      // Fallback gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppLayout onRefreshData={loadData}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] w-full mx-auto animate-in fade-in duration-300">
        {/* Dark Mode Specific Vision Hero Section (Image 2) */}
        <VisionDarkHero summary={summary} />

        {/* Top Header Controls (Light & Dark) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-content-primary font-sans">
              Retention Overview
            </h2>
            <p className="text-xs text-content-tertiary">
              Real-time attendance streaks, silent churn prevention, and WhatsApp automation loops.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 dark:from-cyan-500 dark:to-blue-600 text-white dark:text-black text-xs font-bold transition-all shadow-md btn-shadow cursor-pointer"
              id="ai-assistant-btn"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>AI Assistant &amp; Analytics</span>
            </button>

            <Link
              href="/check-in"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 dark:bg-white text-white dark:text-black text-xs font-bold transition-all shadow-sm btn-shadow"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>+ Check-In Kiosk</span>
            </Link>

            <Link
              href="/retention"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-semibold text-content-primary transition-all shadow-sm btn-shadow"
            >
              <span>At-Risk Queue (6)</span>
            </Link>
          </div>
        </div>

        {/* 1. Top Sparkline Cards (Foxstocks Pastel in Light Mode, Vision Dark Matte in Dark Mode) */}
        <RetentionSparklineRow summary={summary} />

        {/* 2. Middle Section: Revenue Card + Workout Trends Chart + Retention Snapshot Sliders */}
        <FoxstocksMiddleSection summary={summary} />

        {/* 3. Bottom Section: Detailed Retention Analytics Area Chart + At-Risk Watchlist */}
        <FoxstocksBottomSection summary={summary} />

        {/* 4. AI Retention Assistant Section */}
        <div className="pt-2">
          <AiAssistantCard onOpenModal={() => setIsAiModalOpen(true)} />
        </div>

        {/* Deep Retention Analytics & AI Reasoning Modal */}
        <AiRetentionIntelligenceModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
        />
      </div>
    </AppLayout>
  );
}
