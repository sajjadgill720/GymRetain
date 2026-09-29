# GymRetain SaaS Design System & Information Architecture (v2)

This document defines the production design system, cohesive neutral & cozy color scheme, button shadow standard, typography, spacing, component primitives, and information architecture for the full rebuild of the GymRetain owner dashboard.

---

## Part 1: Design System (Cozy & Neutral Aesthetic)

### 1. Philosophy: Designed for a "30-Second Glance"
GymRetain is built for busy gym owners and managers checking key metrics on their phones in short bursts between floor duties. The interface avoids complex power-user BI clutter and visual noise, delivering warmth, immediate clarity, and reliable automation.

### 2. Color Palette (Neutral & Cozy)
Strictly constrained to 1 primary brand color, 3 purposeful semantic accents, and warm stone neutrals:

| Role | Name & Hex | Semantic Purpose | Surface / Light Tint |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | Warm Charcoal `#121110` | Deep, comforting base canvas (no harsh eye strain) | `#121110` |
| **Card / Surface 200** | Warm Dark Stone `#181614` | Clean, matte card container surface | `rgba(255, 255, 255, 0.03)` |
| **Surface Inset 100** | Sandstone Inset `#1F1C19` | Inset search bars, table headers, form inputs | `#1F1C19` |
| **Surface Hover 50** | Interactive Stone `#2A2622` | Hover surface for table rows and cards | `#2A2622` |
| **Subtle Borders** | Stone Border `#2E2A27` | Soft separation without stark white grid lines | `#292522` |
| **Primary Brand** | Warm Terracotta `#D96A38` | Primary calls-to-action, active state badges | `rgba(217, 106, 56, 0.12)` |
| **Success Accent** | Soft Meadow Green `#4E9F6E` | Consecutive streaks, attendance wins, paid status | `rgba(78, 159, 110, 0.12)` |
| **Warning Accent** | Warm Honey Amber `#E5A13B` | At-risk members, frequency drop alerts | `rgba(229, 161, 59, 0.12)` |
| **Danger Accent** | Soft Brick Red `#D9534F` | Urgent churn risk, overdue payments | `rgba(217, 83, 79, 0.12)` |
| **Text Primary** | Soft Porcelain `#F7F5F2` | Headings, headline metrics, primary labels | High contrast (14:1) |
| **Text Secondary** | Warm Oatmeal `#A39E98` | Supporting descriptions, table column headers | Legible contrast (7:1) |
| **Text Tertiary** | Drift Stone `#6B6661` | Timestamps, member codes, metadata | Monospace accents |

---

### 3. Universal Button Shadow Standard (`code-style.md`)
Every clickable button and interactive control has physical drop shadows and tactile feedback:
- **Baseline Shadow**: `0 2px 5px 0 rgba(0, 0, 0, 0.35), 0 1px 2px 0 rgba(0, 0, 0, 0.2)`
- **Hover Lift**: `transform: translateY(-1px); box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.45)`
- **Active Press**: `transform: translateY(0); box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3)`
- **Primary Action**: Dedicated glowing drop shadow `shadow-md shadow-[#D96A38]/30`
- **Destructive Action**: Dedicated glowing drop shadow `shadow-md shadow-[#D9534F]/30`
- **Success Action**: Dedicated glowing drop shadow `shadow-md shadow-[#4E9F6E]/30`

---

### 4. Typography Scale (4–5 Sizes Max)
- **Headline Metric**: `text-3xl sm:text-4xl font-extrabold tracking-tight font-mono` (Single most important metric on screen)
- **Section Header**: `text-lg sm:text-xl font-bold tracking-tight text-[#F7F5F2]`
- **Card Title / Subheader**: `text-sm sm:text-base font-semibold text-[#F7F5F2]`
- **Body Text**: `text-xs sm:text-sm text-[#A39E98] leading-relaxed`
- **Metadata / Timestamps**: `text-[11px] font-mono text-[#6B6661]`

---

### 5. Spacing Scale (4px Strict Rhythm)
Applied consistently across cards, modals, and tables:
- `p-1` (4px) / `p-2` (8px): Icon offsets, badge padding
- `p-3` (12px) / `p-4` (16px): Compact cards, mobile row spacing
- `p-6` (24px): Standard card container padding
- `p-8` (32px): Desktop page gutters
- `p-12` (48px): Empty state spacing

---

### 6. Component Primitives (`/components/ui/`)
Built once, fully typed, and reusable across all screens:
1. `Button`: `primary`, `secondary`, `ghost`, `destructive`, `success` with built-in loading spinners and thumb-friendly touch targets (min 40px height).
2. `Card`: Cozy warm stone containers with `default`, `highlight`, `warning`, `danger` variants, plus `CardHeader`, `CardTitle`, `CardDescription`, and `CardContent`.
3. `Badge`: Semantic indicators (`brand`, `success`, `warning`, `danger`, `neutral`) with optional colored status dots.
4. `StatCard`: Headline KPI displays with value, unit, subtitle, icon badge, and weekly trend indicator.
5. `EmptyState`: Friendly, non-blank onboarding prompts with warm copy and direct primary CTA buttons.
6. `Skeleton`: Smooth pulsing placeholders (`Skeleton`, `TableSkeleton`) preventing layout shifts.
7. `Modal`: Accessible dialogs with escape key handling, backdrop dismiss, and clean mobile sizing.

---

## Part 2: Proposed Information Architecture

### Navigation Structure & Screen List

```
GymRetain App Navigation
├── 🏠 1. Dashboard (Overview) — 30-second retention glance & at-risk member call list
├── 👥 2. Members — Member roster, active streaks, and single-screen member detail story
├── 🎁 3. Rewards — Plain-language milestone setup ("After X days, give Y reward")
├── 💬 4. Messages / Automation Log — Outbound WhatsApp delivery log & template previews
└── ⚙️ 5. Settings — Gym branding, reception QR code placard, and churn thresholds
```

### Justification:
1. **Dashboard First**: Gym owners opening the app need to see one thing above all else: **Who is about to drop out today?** The headline alert hero and immediate call list are front-and-center, usable without scrolling on mobile.
2. **Members (List + Detail)**: Separates daily crisis response (Dashboard) from full roster management (Members). The member detail view answers "How is this person doing?" on one screen with attendance streaks, membership status, and messaging history.
3. **Rewards**: Simple, non-technical milestone rules. Plain English configuration encourages owners to turn on the gamification engine that drives retention.
4. **Messages / Automation Log**: Replaces anxiety with transparency. Owners see exact outbound WhatsApp messages sent under their gym name, delivery status, and phone numbers.
5. **Settings**: Houses gym profile, front-desk QR placard (for check-ins), staff management, and churn scoring sensitivity.
6. **Check-In Kiosk Access**: Available as a dedicated quick action in the header and Settings, ensuring front desk staff can check in members rapidly with code/phone search.

---

## Part 3: Screen-by-Screen Implementation Order
1. **Screen 1: Dashboard (Home)** — One large headline metric ("6 members need attention"), prominent at-risk list with inline WhatsApp nudges, secondary attendance trend, and weekly impact summary.
2. **Screen 2: Members (List + Story Detail)** — Scannable rows, instant filter pills, and single-screen member profile story.
3. **Screen 3: Rewards Configuration** — Plain-language setup ("After a 10-day streak, give this reward").
4. **Screen 4: WhatsApp / Messages Log** — Transparent dispatch ledger with delivery status filters and rendered message previews.
5. **Screen 5: Onboarding & First-Run Experience** — Actionable empty states guiding new owners to add members, display QR placard, and set up first reward.
6. **Screen 6: Settings** — Gym branding, reception QR code placard printer, and threshold configuration.
