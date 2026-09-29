'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { QuickCheckInModal } from './QuickCheckInModal';
import { FrontDeskQrModal } from './FrontDeskQrModal';

interface AppLayoutProps {
  children: React.ReactNode;
  onRefreshData?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, onRefreshData }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas text-content-primary flex transition-colors duration-200">
      {/* 1. Left Sidebar matching Shopeers style */}
      <Sidebar
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenCheckInModal={() => setIsCheckInOpen(true)}
      />

      {/* 2. Main Viewport & Top Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenQrModal={() => setIsQrModalOpen(true)}
          onOpenCheckInModal={() => setIsCheckInOpen(true)}
        />

        <main className="flex-1 flex flex-col w-full overflow-x-hidden">
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
