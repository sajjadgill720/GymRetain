# Light & Dark Theme Full-Stack Expansion

## Overview
This document records the complete overhaul of all non-dashboard pages, terminals, and modals in GymRetain to support the cohesive dual-theme design system:
- **Light Theme (Foxstocks Palette):** Pure crisp white cards (`bg-surface`), soft lilac/slate containers & table headers (`bg-surface-subtle`), subtle borders (`border-surface-border`), deep high-contrast typography (`text-content-primary: #111827`, `text-content-secondary: #4B5563`), and royal purple call-to-actions with soft drop shadows (`btn-shadow`).
- **Dark Theme (Vision Palette):** Matte dark surface cards (`#10141D`), deep subtle containers (`#1D2333`), crisp contrast borders (`#1F2536`), ultra-clear typography (`text-content-primary: #F8FAFC`, `text-content-secondary: #94A3B8`), and neon cyan accents with white primary buttons.

---

## Overhauled Pages & Components

### 1. Members Directory (`frontend/src/app/members/page.tsx`)
- Converted page header, active count chips, and `+ Add Member` button (`btn-shadow`).
- Converted search input and status filter dropdown to `bg-surface-subtle`, `border-surface-border`, and `text-content-primary`.
- Converted member directory table:
  - Table wrapper: `bg-surface border border-surface-border rounded-2xl shadow-sm`.
  - Thead: `bg-surface-subtle border-b border-surface-border text-content-tertiary`.
  - Table rows: `hover:bg-surface-subtle/50 transition-colors`.
  - Member avatars, name labels, contact fonts, status pills, and action buttons.
- Converted Member Story Drawer modal, Quick Trainer Reassign modal, and Add Member modal to theme tokens.

### 2. Retention Risk Engine (`frontend/src/app/retention/page.tsx` & `AtRiskMembersTable.tsx`)
- Summary metric cards (`High Risk`, `Moderate Attention`, `Estimated At-Risk Revenue`) transformed to `bg-surface border-surface-border rounded-2xl` with proper light/dark text contrast.
- At-risk members table with risk score badges, streak pill indicators, and one-click WhatsApp action buttons.
- WhatsApp Re-Engagement dispatch modal with light surface containers, message bubble previews, and emerald action buttons.

### 3. Rewards & Streaks (`frontend/src/app/rewards/page.tsx` & `frontend/src/app/rewards/winners/page.tsx`)
- Milestone configuration cards with progress rings, threshold pills, and edit controls.
- Create Milestone modal with light theme inputs, selects, and action buttons.
- Front-Desk Reward Fulfillment modal with claim verification, gift tags, and confirmation flows.

### 4. Trainers & Nutrition Hub (`frontend/src/app/trainers/page.tsx`)
- Dual-perspective switcher (`My Assigned Clients` vs `Trainer Roster`) with pill tabs.
- Trainer KPI metric cards (`Active Roster`, `Assigned Clients`, `Active Diet Plans`, `Pending Plans`).
- Assigned clients table with meal plan status badges, macro summaries, and streak counters.
- Nutrition Plan Builder modal with template clone pills, structured meal breakdown, calorie/macro inputs, and WhatsApp dispatch preview.
- View Nutrition Protocol modal with macronutrient energy cards and daily meal lists.
- Reassign Member Coach modal.

### 5. Front-Desk Check-In Terminal (`frontend/src/app/check-in/page.tsx`)
- Front-desk attendance kiosk with high-contrast member code / phone input and `btn-shadow` check-in trigger.
- Demo quick tap buttons for rapid check-in testing.
- Attendance confirmation banner with animated checkmark and streak increment pill.
- Real-time recent check-in attendance feed.

### 6. Interactive Global Modals & Widgets
- `QuickCheckInModal.tsx`: Global check-in modal accessible from top navigation.
- `FrontDeskQrModal.tsx`: Reception QR code placard modal for member self-scanning and printing.
- `StreakLeaderboard.tsx`: Top workout streak leaderboard widget.
- `AttendanceChart.tsx`: MoM attendance trend SVG line & area chart.
- `FoxstocksMiddleSection.tsx`: Monthly Workouts card updated to light card surface.

---

## Verification
- Run `npm run build` in `frontend/` to confirm that all 10 Next.js routes compile with 0 TypeScript or lint errors.
