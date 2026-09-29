import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GymRetain — Gym Customer Retention, Streaks & Attendance SaaS',
  description:
    'Multi-tenant SaaS for gym owners to stop silent member churn through automated retention loops, attendance streaks, reward milestones, and WhatsApp nudges.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#111111] text-[#F7F5F2] antialiased selection:bg-[#BFA785] selection:text-[#111111] min-h-screen">
        {children}
      </body>
    </html>
  );
}
