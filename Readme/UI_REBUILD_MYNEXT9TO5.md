# GymRetain — UI Rebuild & Visual Transformation
**Aesthetic Benchmark:** Inspired by [mynext9to5.com](https://www.mynext9to5.com/)  
**Role Target:** Non-technical Gym Owner & General Manager  
**Platform:** Next.js 14 + Tailwind CSS + Lucide Icons  
**Frontend URL:** `http://localhost:3001`  
**Backend API URL:** `http://localhost:4000/api/v1`

---

## 1. Aesthetic DNA from mynext9to5.com

Following the analysis of `https://www.mynext9to5.com/`, the owner retention dashboard was redesigned from cold default blue-grays to a warm, editorial, luxury dark aesthetic with crisp contrast, rounded bento cards, and tactile interactive elements:

| Token / Element | Old Styling | New mynext9to5-Inspired Styling | Purpose |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#090d16` (cold blue-black) | `#111111` (warm deep charcoal) | Warm, luxurious backdrop reducing eye fatigue for owners checking at night |
| **Bento Surface 1** | `#0d121d` | `#161310` (warm charcoal stone) | Primary container surface with `border-[#2A2520]` |
| **Bento Surface 2** | `#141926` | `#1C1814` (elevated stone) | Interactive items, inputs, table rows, and filters |
| **Primary Accent** | Blue / Cold Emerald | `#BFA785` (Champagne Bronze / Muted Gold) | Signature luxury accent from mynext9to5 |
| **Primary Button** | Flat Blue | `bg-[#BFA785] text-[#111111] font-bold` with Champagne Glow Shadow | High-visibility primary action button |
| **Streak Momentum** | Orange `#F97316` | `#BFA785` flame with `#F7F5F2` numerals | Elevated celebratory tone without neon clash |
| **Inactivity Warning** | Orange `#F59E0B` | Honey Amber `#E5A13B` | Clear warning tone |
| **Critical Drop-Out** | Bright Red `#EF4444` | Brick Red `#D9534F` | Urgent yet refined danger indicator |

---

## 2. Universal Button Shadow Implementation (`code-style.md`)

In strict accordance with the repository rule:
> *"The ui should be according to industry standards with clear color scheme and all the clickable buttons will have shadow. The dashboard should also be clean."*

Every clickable interactive button across the application has dedicated drop shadows and tactile feedback:

```css
/* All clickable buttons have shadow and tactile depth */
button,
[role="button"],
.btn-shadow {
  box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.35), 0 1px 2px 0 rgba(0, 0, 0, 0.2);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

button:hover:not(:disabled),
[role="button"]:hover,
.btn-shadow:hover {
  box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.45), 0 2px 4px 0 rgba(0, 0, 0, 0.25);
  transform: translateY(-1px);
}

/* mynext9to5 Champagne Gold Button Shadow (#BFA785) */
.btn-shadow-primary {
  box-shadow: 0 4px 16px 0 rgba(191, 167, 133, 0.28), 0 1px 2px 0 rgba(0, 0, 0, 0.4) !important;
}
.btn-shadow-primary:hover:not(:disabled) {
  box-shadow: 0 6px 22px 0 rgba(191, 167, 133, 0.42), 0 2px 4px 0 rgba(0, 0, 0, 0.3) !important;
}
```

---

## 3. Screen-by-Screen Architecture

### 1. Dashboard (`/`) — 30-Second Glance for Gym Owners
- **Hero Alert Metric**: Immediate Action card featuring `6 Members at risk of silent drop-out` with projected revenue save (`PKR 35,000/mo`) and primary champagne CTA button linking directly to the call list.
- **Companion Bento Metrics**:
  - Today's Front-Desk Attendance (`38 visits`, green indicator `#4E9F6E`).
  - Top Workout Streak (`12 Days`, champagne flame `#BFA785`).
  - Total Active Members (`142 members`).
- **Lead Section**: At-Risk Call List with one-click automated WhatsApp nudge triggers.
- **Secondary Analytics**: Attendance volume trends chart (14D / 30D toggles) and Streak Leaderboard.

### 2. At-Risk Members & Churn Prevention (`/retention`)
- **Rules Weight Breakdown**: 4 transparent cards detailing weights (Days Since Last Check-In 35%, 4-Week Frequency Drop 35%, Overdue Payment 15%, Broken Streak 15%).
- **Mobile-Responsive List**: Dedicated card layout on mobile (`375px`) without horizontal scrollbars, and comprehensive table on desktop.
- **WhatsApp Nudge Modal**: Preview personalized messages sent to members via Meta Business API.

### 3. Member Directory (`/members`)
- Clean search bar with instant filter pills (All, Active, Inactive, Frozen).
- Scannable member cards with active plan, expiration date, and quick check-in actions.
- Add Member dialog modal styled with stone surfaces and tactile primary buttons.

### 4. Front-Desk Reception Kiosk (`/check-in`)
- High-contrast reception barcode & member code entry terminal (`GR-1001` or phone number).
- Live attendance stream on the right showing real-time member arrivals.
- Instant streak celebration and milestone unlock banners upon verified check-in.
- Front-Desk QR placard generator for counter display.

### 5. Gamified Milestone Rewards (`/rewards`)
- Milestone cards showcasing required streaks (e.g. 10-day, 15-day, 21-day).
- Clean redemption counters and automated rule configuration modal.

---

## 4. Port Configuration Note

- **Frontend**: Runs on `http://localhost:3001` (configured via `package.json`: `next dev -p 3001`).
- **Backend**: Runs on `http://localhost:4000/api/v1` (NestJS REST API).
- Opening `http://localhost:3000` previously returned backend data rather than the styled Next.js application. Always navigate to `http://localhost:3001` to view the owner retention hub.
