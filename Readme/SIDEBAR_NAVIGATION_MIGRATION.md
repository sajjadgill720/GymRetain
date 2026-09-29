# GymRetain — Sidebar Navigation Architecture & Top Bar Simplification

## 1. Overview & Rationale

Per user instruction:
`"move the pages button from top to sidebar"`

GymRetain has relocated all core page navigation buttons from the top horizontal navbar into an ergonomic, modern vertical sidebar layout (matching Linear, Stripe Dashboard, and Vercel standards), while keeping a clean, low-profile top header for tenant status, front-desk QR placard, WhatsApp tester, and quick check-in actions.

---

## 2. Updated Navigation Architecture

### A. Dedicated Left Sidebar (`frontend/src/components/Sidebar.tsx`)
- **Location**: Fixed 64 (w-64 = 256px) left-hand navigation column on desktop viewports (`hidden lg:flex flex-col`), with an animated overlay slide-out drawer on mobile screens (`lg:hidden`).
- **Brand & Tenant Branch Selector**:
  - Logo with flame icon and bold `GymRetain` brand header.
  - Multi-tenant gym branch switcher dropdown (e.g., *Iron House Gym & Fitness*, *K-Town Crossfit*, *Margalla Heights*).
- **Categorized Page Navigation Links**:
  - **OPERATIONS**:
    - **Overview** (`/`) — Daily check-ins, retention velocity, today's schedule glance.
    - **At-Risk Members** (`/retention`) — Member churn queue with alert badge (`6 High`).
    - **Members Directory** (`/members`) — Full member roster, join dates, and trainer indicators.
    - **Check-In Kiosk** (`/check-in`) — Front-desk check-in terminal.
  - **RETENTION & REWARDS**:
    - **Reward Rules** (`/rewards`) — Streak milestones, discount vouchers, and badge tiers.
    - **Streak Winners** (`/rewards/winners`) — Dedicated queue of members with pending or fulfilled streak rewards (`6 Won` counter).
- **Front-Desk Quick Actions**:
  - High-visibility `+ Quick Check-In` button with tactile drop shadow (`.btn-shadow-primary`).
  - `Front-Desk QR Placard` trigger (`.btn-shadow`).
  - `Test WhatsApp` inbound simulator (`.btn-shadow`).
- **Footer**:
  - Active tenant domain indicator (`iron-house-lahore.gymretain.app` with `SECURE` badge).
  - Staff user badge (`BC`, `Bilal C.`, `OWNER`).

### B. Clean Minimalist Top Header (`frontend/src/components/TopNavbar.tsx`)
- Stripped of redundant horizontal tabs.
- Focused solely on:
  - Mobile menu toggle (hamburger) for small devices.
  - Active tenant branch indicator pill.
  - Front-Desk QR placard and WhatsApp simulator shortcuts.
  - `+ Check-In` quick button (`.btn-shadow-primary`).
  - Staff avatar.

### C. Unified Shell Wrapper (`frontend/src/components/AppLayout.tsx`)
- Coordinates the `Sidebar`, `TopNavbar`, mobile drawer states, and global modals (`QuickCheckInModal`, `FrontDeskQrModal`).
- Applied across all application routes:
  - `frontend/src/app/page.tsx`
  - `frontend/src/app/retention/page.tsx`
  - `frontend/src/app/members/page.tsx`
  - `frontend/src/app/check-in/page.tsx`
  - `frontend/src/app/rewards/page.tsx`
  - `frontend/src/app/rewards/winners/page.tsx`

---

## 3. Style Compliance (`code-style.md`)
- Neutral dark canvas (`#09090B`), sidebar (`#0C0C0E`), and card backgrounds (`#121215`).
- Tactile button drop shadows (`.btn-shadow` and `.btn-shadow-primary`) on all clickable elements.
- Zero clutter, clear visual hierarchy, and fast keyboard/mouse scannability.
