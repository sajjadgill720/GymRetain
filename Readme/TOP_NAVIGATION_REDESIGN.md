# GymRetain — Top Navigation Redesign (Amazon / Modern SaaS Architecture)

## 1. Overview & Rationale

Per owner requirements (`"thisshould be on top llike amazon and other websites and not on the side"`), GymRetain has moved away from the vertical left sidebar layout in favor of an **Amazon/Stripe-style 2-tier sticky top navigation bar**.

### Why Top Navigation?
1. **Full-Viewport Breathing Room**: Reclaiming the 256px (`16rem`) horizontal footprint previously consumed by the sidebar allows dense data screens (At-Risk Member churn queues, Member Directory rosters, Attendance trends) to span the full browser viewport (`max-w-[1600px]`) without horizontal scrollbars or cramped columns.
2. **Amazon / E-Commerce Pattern**: Gym owners and staff immediately recognize the top-tier structure:
   - Left: Brand Logo & Tenant Gym Selector (analogous to Amazon's "Deliver to / Location" selector).
   - Center/Right: Quick Actions (QR placard modal, WhatsApp member simulator, fast Check-In CTA, staff account avatar).
   - Bottom Strip (Tier 2): Fast, thumb-friendly category tabs with high-contrast active indicator pills and status counters (e.g. `6 High` churn alert).
3. **Ergonomic Front-Desk Workflow**: Quick Check-In and Front-Desk QR Placards are permanently accessible from the top header regardless of which screen the owner is viewing.

---

## 2. Component Architecture: `TopNavbar.tsx`

Located at: [`frontend/src/components/TopNavbar.tsx`](file:///e:/GymRetain/frontend/src/components/TopNavbar.tsx)

### Tier 1 — Primary Header (`bg-[#111111]/95 backdrop-blur-md border-b border-[#26221E]`)
- **Brand Identifier**: Flame icon in champagne-bronze gradient (`#8B7454` → `#BFA785` → `#E2D2BC`) + bold `GymRetain` + `PRO` badge.
- **Tenant Gym Selector Dropdown**:
  - Displays currently selected gym: e.g. **Iron House Gym & Fitness (Lahore)**.
  - Dropdown allows fast instant switching between multi-tenant gym spaces:
    - *Iron House Gym & Fitness* (`iron-house-lahore`)
    - *K-Town Crossfit & Performance* (`ktown-crossfit`)
    - *Margalla Heights Fitness Club* (`margalla-heights`)
  - Updates client-side API tenant context and localStorage automatically.
- **Quick Action Group**:
  - **Front-Desk QR Placard**: Launches printable placard modal with live check-in QR code.
  - **Test WhatsApp**: Inbound keyword simulator modal to demo the member WhatsApp experience (`STREAK`, `STATUS`, `HELP`) with zero member app installs.
  - **Quick Check-In Button**: High-visibility CTA in champagne bronze (`#BFA785`) with tactile drop shadow (`btn-shadow-primary`).
  - **Staff Avatar Pill**: `BC` (Bilal Chaudhry, OWNER).
  - **Mobile Hamburger Toggle**: Touch-optimized toggle for tablets and smartphones.

### Tier 2 — Horizontal Navigation Strip (`bg-[#161310]/95 border-t border-[#26221E]`)
- **Active Navigation Tabs**:
  1. `Overview` (`/`) — 30-second glance hub, retention alerts, daily stats.
  2. `At-Risk Members` (`/retention`) — High-priority member churn rescue table with `6 High` badge.
  3. `Members Directory` (`/members`) — Full member roster, join dates, streaks, and plan management.
  4. `Check-In Kiosk` (`/check-in`) — Reception kiosk for barcode scanning and manual check-ins.
  5. `Rewards & Streaks` (`/rewards`) — Gamification engine for streak milestone badges and discount perks.
- **Security Badge (Right Side)**:
  - `[tenant-slug].gymretain.app` `WALLED` badge in emerald green (`#4E9F6E`), communicating 0 cross-tenant data leakage.

### Responsive Mobile Drawer (`lg:hidden`)
- Collapsible slide-down panel containing full navigation links, current tenant selector, and quick utility buttons for screen viewports < 1024px.

---

## 3. Style Guidelines Compliance (`code-style.md`)

- **Industry Standard Palette**: Warm charcoal (`#111111`), deep bento surfaces (`#161310` / `#1C1814`), champagne bronze accents (`#BFA785`), warning terracotta (`#D9534F`), and emerald confirmation (`#4E9F6E`).
- **Tactile Button Shadows**: Every clickable button and interactive navigation link is equipped with `.btn-shadow` or `.btn-shadow-primary` for tactile depth and feedback.
- **Clean Dashboard Scannability**: Eliminates layout clutter, providing clear visual hierarchy and quick scannability.
- **Documentation Location**: Saved in `Readme/TOP_NAVIGATION_REDESIGN.md` and referenced in `Readme/README.md`.

---

## 4. Modified Files

| File | Change |
|---|---|
| [`frontend/src/components/TopNavbar.tsx`](file:///e:/GymRetain/frontend/src/components/TopNavbar.tsx) | Created 2-tier sticky top navigation bar with tenant switcher and quick actions |
| [`frontend/src/app/page.tsx`](file:///e:/GymRetain/frontend/src/app/page.tsx) | Replaced vertical sidebar/header with `TopNavbar` + context ribbon |
| [`frontend/src/app/retention/page.tsx`](file:///e:/GymRetain/frontend/src/app/retention/page.tsx) | Replaced vertical sidebar/header with `TopNavbar` + context ribbon |
| [`frontend/src/app/members/page.tsx`](file:///e:/GymRetain/frontend/src/app/members/page.tsx) | Replaced vertical sidebar/header with `TopNavbar` + context ribbon |
| [`frontend/src/app/rewards/page.tsx`](file:///e:/GymRetain/frontend/src/app/rewards/page.tsx) | Replaced vertical sidebar/header with `TopNavbar` + context ribbon |
| [`frontend/src/app/check-in/page.tsx`](file:///e:/GymRetain/frontend/src/app/check-in/page.tsx) | Replaced vertical sidebar/header with `TopNavbar` + context ribbon |
