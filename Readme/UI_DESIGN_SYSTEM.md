# UI Design System, Button Shadow Standard & Clean Dashboard Architecture

This document outlines the GymRetain UI design system, color tokens, button shadow elevation rules, and clean dashboard design principles conforming to modern B2B SaaS industry standards.

---

## 1. Industry-Standard Color Palette

GymRetain uses a curated, high-contrast dark palette engineered for low eye strain in gym reception environments and high legibility on mobile devices:

| Token | Hex / HSL | Semantic Role | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#090d16` | Main App Background | Deep slate canvas with subtle ambient blur |
| **Surface 100** | `#161b26` | Card Background | Primary card & table container background |
| **Surface 200** | `#11151f` | Inset / Input Background | Form inputs, search fields, recessed containers |
| **Surface 50** | `#1e2433` | Hover Surface | Interactive card and row hover states |
| **Brand Primary** | `#10b981` (Emerald 500) | Primary Brand Accent | Active status, check-ins, success confirmations |
| **Brand Dark** | `#059669` (Emerald 600) | Brand Accent Hover | Primary button hover background |
| **Streak Flame** | `#f97316` (Orange 500) | Gamification & Streaks | Consecutive day badges, flame icons, leaderboards |
| **Milestone Gold** | `#f59e0b` (Amber 500) | Milestone Rewards | Unlocked perks, gift milestones, VIP tiers |
| **Risk / Churn Alert**| `#ef4444` / `#f43f5e` | High Churn Warning | Inactivity badges, payment overdue notices, urgent alerts |
| **Text Primary** | `#ffffff` / `#f8fafc` | Headings & Emphasized Text | High readability, high contrast |
| **Text Secondary** | `#94a3b8` (Slate 400) | Subtitles & Meta Details | Context labels, timestamps, secondary metrics |

---

## 2. Universal Button Shadow Standard (`code-style.md`)

According to the workspace design rule:
> *"The UI should be according to industry standards with clear color scheme and all the clickable buttons will have shadow. The dashboard should also be clean."*

### Global Shadow Enforcement:
Every interactive `<button>`, `a[role="button"]`, and `.btn-shadow` element automatically inherits a tactile drop shadow with micro-interaction depth transitions:

```css
/* Base tactile elevation on all clickable buttons */
button,
[role="button"],
.btn-shadow {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Hover state: 1px lift with expanded soft shadow */
button:hover:not(:disabled),
[role="button"]:hover,
.btn-shadow:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.25);
}

/* Active press state: physical indentation */
button:active:not(:disabled),
[role="button"]:active,
.btn-shadow:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
```

### Specialized Elevated Shadow Classes:
For high-emphasis action buttons, color-coordinated glow shadows provide immediate visual hierarchy:

- **Primary Action (Brand Emerald)**: `shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/35`
- **Urgent Action (Rose Alert)**: `shadow-md shadow-rose-500/25 hover:shadow-lg hover:shadow-rose-500/35`
- **Secondary Action (Surface Slate)**: `shadow-sm shadow-black/40 hover:shadow-md hover:shadow-black/60`
- **WhatsApp Action (Emerald 600)**: `shadow-md shadow-emerald-600/30 hover:shadow-lg hover:shadow-emerald-600/40`
- **Gamification Action (Amber Gold)**: `shadow-md shadow-amber-500/25 hover:shadow-lg hover:shadow-amber-500/35`

---

## 3. Clean Dashboard Architecture

The dashboard is engineered around the **30-Second Glance** rule for busy gym owners:

1. **One Headline Metric Hero**:
   - Displays the single most critical retention number: **Members at immediate risk of silent dropout**.
   - Quantifies the business impact (e.g. *"Saves an estimated PKR 35,000/mo"*).
   - Features a primary elevated CTA button (`Review At-Risk Call List`).
2. **Three Compact Companion Metric Cards**:
   - Today's Front-Desk Attendance visits.
   - Top active workout streak in the gym.
   - Total active paying members.
3. **Action-First At-Risk Call List**:
   - Immediately presents the top 5 at-risk members needing attention today.
   - Visual progress bar for churn risk score (0 to 100).
   - Instant WhatsApp re-engagement button with pre-filled Urdu/English friendly messages.
4. **Secondary Insights Row**:
   - 30-Day Attendance Trend chart with clean tooltips and weekend annotations.
   - Streak Champions leaderboard celebrating consistent members.

---

## 4. Mobile & Touch Ergonomics

- All clickable buttons have minimum touch targets of **40px × 40px** for comfortable tapping on mobile devices and reception tablets.
- Walled tenant badge (`iron-house-lahore.gymretain.app [WALLED]`) is visible in the top header on all screen sizes to reinforce data privacy.
- Navigation collapses into a smooth slide-over drawer on screens smaller than 1024px.
