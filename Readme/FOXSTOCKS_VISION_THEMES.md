# Dual Design System: Foxstocks (Light) & Vision (Dark) for GymRetain

## 1. Overview
GymRetain now supports a dual-personality design architecture tailored to the user's reference designs:
- **Light Mode:** Modeled after **Foxstocks** (Image 1) with soft pastel lavender/mint cards, vibrant purple accent cards, workout session volume metrics, mini sparklines, and a range slider snapshot.
- **Dark Mode:** Modeled after **Vision** (Image 2) with an ultra-sleek matte charcoal-black canvas, elevated dark cards, a glossy 3D dark orb, a high-contrast concentric retention goal ring, and high-contrast status badges.
- **100% GymRetain Content:** Check-ins, active members, attendance trends, risk scores, WhatsApp triggers, and streak rewards.

---

## 2. Light Theme Architecture (Foxstocks Reference)
- **Canvas:** `#F5F6FC` soft lavender-slate.
- **Active Navigation Pill:** `#EDE9FE` soft lavender pill with `#6D28D9` deep violet text.
- **Top Pastel Sparkline Cards:**
  - *Today's Check-Ins:* Mint gradient card with green sparkline.
  - *Active Members:* Lavender gradient card with purple sparkline.
  - *At-Risk Alerts:* Warm gold gradient card with amber sparkline.
  - *Top Streak:* Soft lime gradient card with green sparkline.
  - *30D Retention Rate:* Magenta gradient card with pink sparkline.
- **Middle Section:**
  - *Balance Card:* Deep royal violet `#6D28D9` card displaying `₨446,500` monthly membership revenue.
  - *Invested Card:* High-contrast `#18181B` card with quick action link to the Check-In Kiosk.
  - *Top Streak Champion:* Hamza Sheikh (12d streak).
  - *Timeframe Workout Trends:* Interactive SVG line chart with `1D | 5D | 1M | 6M | 1Y` timeframe tabs.
  - *Retention Snapshot:* Dual-slider range metrics (Today's check-in range vs. 30-day range) and timestamp.
- **Bottom Section:**
  - *30-Day Retention Analytics:* Detailed area curve with a pinned purple tooltip showing peak check-in days and revenue.
  - *At-Risk Priority Queue:* Priority watchlist with member avatars, inactivity duration, and color-coded risk badges.
- **Sidebar "Thoughts Time":** Soft lime/mint pastel card with lightbulb icon highlighting retention best practices.

---

## 3. Dark Theme Architecture (Vision Reference)
- **Canvas:** Deep midnight charcoal-black `#0A0C10`.
- **Surfaces & Cards:** Elevated matte panels `#10141D` and `#131722` with subtle borders `#1F2536`.
- **Active Navigation Pill:** High-contrast pure white pill (`bg-white text-black font-extrabold`).
- **Hero Card (`VisionDarkHero.tsx`):**
  - "Dashboard Overview - Hello Bilal 👋"
  - Glossy 3D dark orb (`.vision-dark-orb`) with animated radial gradient and depth.
  - Dual metric badges: Total Revenue (`₨446,500`) and Total Check-Ins (`2,840 Visits`).
- **Concentric Retention Goal Ring:** High-contrast circular progress ring showing `91%` retention rate against an 85% target.
- **Status Badges:** Neon mint/cyan (`#05D5AA`) for healthy active members, neon coral/red (`#FF4D4D`) for high-risk members.

---

## 4. Preserved Features
- Quick Check-in modal
- Front-Desk QR kiosk placard modal
- Inbound WhatsApp simulator modal
- Single-gym tenant isolation badge
- Theme toggle with instant zero-flicker hydration script
- All clickable buttons equipped with tactile `btn-shadow`
