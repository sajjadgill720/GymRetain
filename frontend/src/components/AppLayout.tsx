'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthProvider';
import { api } from '@/lib/api';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { QuickCheckInModal } from './QuickCheckInModal';
import { FrontDeskQrModal } from './FrontDeskQrModal';

interface AppLayoutProps {
  children: React.ReactNode;
  onRefreshData?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, onRefreshData }) => {
  const { isLoading: authLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  return (
    <div className="app-shell min-h-screen bg-canvas text-content-primary flex transition-colors duration-200">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-surface focus:p-3 focus:rounded-xl focus:shadow-lg">Skip to content</a>
      {/* 1. Left Sidebar matching Shopeers style */}
      <Sidebar
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenQrModal={() => { setIsMobileMenuOpen(false); setIsQrModalOpen(true); }}
        onOpenCheckInModal={() => { setIsMobileMenuOpen(false); setIsCheckInOpen(true); }}
      />

      {/* 2. Main Viewport & Top Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenQrModal={() => setIsQrModalOpen(true)}
          onOpenCheckInModal={() => setIsCheckInOpen(true)}
        />

        {!authLoading && !api.hasSession() && <div className="studio-demo-bar"><span><strong>Demo workspace</strong><span className="hidden sm:inline"> · Explore with sample data. New Operations records stay in this browser.</span></span><Link href="/login?mode=signup">Start your free trial <span aria-hidden="true">↗</span></Link></div>}
        <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col w-full min-w-0">
          {children}
        </main>
      </div>

      {/* Modals */}
      <QuickCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onCheckInSuccess={() => onRefreshData && onRefreshData()}
      />

      <FrontDeskQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
};
