# SaaS Dashboard Redesign — Clean Product Conventions

## 1. Design Philosophy
GymRetain's authenticated dashboard has been redesigned from a decorative marketing landing page into a clean, daily-use SaaS product (referencing **Linear, Stripe Dashboard, and Vercel**).

### Core Changes:
1. **Zero Marketing Copy Post-Login**: Removed the 60px+ hero section, marketing headline (*"Member retention, redefined for your gym"*), and sales pitch copy.
2. **Eliminated Redundant Navigation**: Removed the duplicate 4-card navigation grid and marketing ticker strip. The persistent top navigation bar serves as the single source of truth for routing.
3. **Immediate Real Data Above the Fold**: The dashboard opens directly with real retention data: headline metric status badge and the **Member Churn Risk Detection Queue**, followed by compact secondary stat tiles (`Attendance`, `Active Members`, `Top Streak`, `30-Day Retention`).

---

## 2. Design System Tokens

### Neutral Color Palette (Cool-Toned Dark Mode)
- **App Canvas**: `#09090B` (neutral near-black base)
- **Card / Surface**: `#121215` (elevated dark surface)
- **Subtle Borders**: `border-zinc-800` (`#27272A`, 1px low opacity)
- **Primary Text**: `text-zinc-100` (`#FAFAFA`)
- **Secondary Text / Labels**: `text-zinc-400` (`#A1A1AA`)
- **Muted Metadata**: `text-zinc-500` (`#71717A`)
- **Functional Accents Only**:
  - Critical Churn / High Risk: `text-red-400` / `bg-red-500/10` / `border-red-500/20`
  - Medium Risk / Streak: `text-amber-400` / `bg-amber-500/10`
  - Attendance Trends / Check-Ins: `text-blue-500` / `text-emerald-400`
  - Primary Action Buttons: Crisp high-contrast white `bg-white text-zinc-950 hover:bg-zinc-200`

### Typography Scale
- **Headline / Title**: 20px–24px (`text-xl` to `text-2xl`, `font-bold tracking-tight`) — no 60px+ hero titles
- **KPI Metric Numbers**: 24px–30px (`text-2xl` to `text-3xl`, `font-semibold font-mono`)
- **Card & Section Headers**: 13px–15px (`text-sm font-semibold`)
- **Body & Table Content**: 12px–13px (`text-xs` to `text-sm text-zinc-300`)
- **Metadata / Badges / Captions**: 10px–11px (`text-[10px]` to `text-[11px]`)

### Spacing & Borders
- **Card Radius**: `rounded-lg` (8px standard, not oversized)
- **Button Radius**: `rounded-md` (6px)
- **Containers**: Modest internal padding (`p-3.5` to `p-5`)
- **Button Shadows**: Subtle elevation shadows on all clickable elements (`.btn-shadow`, `.btn-shadow-primary`).
