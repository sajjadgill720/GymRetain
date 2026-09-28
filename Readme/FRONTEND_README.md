# GymRetain Frontend Application

GymRetain Frontend is a modern, high-performance Next.js 14 (App Router) single-page application built for gym owners and front-desk reception staff. It provides an intuitive, high-contrast, clean dashboard for tracking member retention, streak gamification, automated WhatsApp nudges, and real-time front-desk check-in kiosk workflows.

---

## 🎨 Design System & Industry Standards

- **Color Scheme**: Deep obsidian/slate canvas (`#090d16`, `#0d111a`, `#11151f`, `#161b26`) paired with emerald brand accents (`#10b981`), amber streak highlights (`#f59e0b`), and rose risk indicators (`#ef4444`).
- **Tactile Depth & Button Shadows**: Every clickable button and interactive control is equipped with elevated shadows (`box-shadow`) and smooth micro-animations (`translateY(-1px)`) to provide unmistakable physical feedback.
- **Clean Dashboard Experience**: Designed around the **30-Second Glance** rule. Gym owners immediately see the single most critical retention metric (at-risk members), followed by clean companion KPIs, actionable member call lists, and 30-day attendance trends.
- **Responsive Layout**: Seamless experience across 375px mobile screens, tablets, and full-width desktop monitors. Includes a fixed desktop sidebar and a slide-over mobile drawer.

---

## 📁 Key Routes & Pages

| Route | Page | Purpose |
| :--- | :--- | :--- |
| `/` | **Owner Retention Hub** | 30-second overview: at-risk member alert hero, today's visits, top streaks, call list, and attendance charts |
| `/retention` | **Churn Prevention** | Deep-dive churn risk scoring engine with tunable weights, inactivity metrics, and WhatsApp nudges |
| `/members` | **Member Directory** | Full member CRUD, search, status filters (Active/Overdue), contact details, and plan assignment |
| `/check-in` | **Front-Desk Kiosk** | Reception attendance terminal: rapid member lookup by code or phone, live streak celebration, milestone alerts |
| `/rewards` | **Rewards & Streaks** | Gamified loyalty program: configure custom milestone rewards (badges, discounts, free items) triggered by streaks |

---

## 🧩 Reusable Component Architecture

- `Header.tsx`: Fixed top bar with tenant walled-workspace badge, quick check-in launcher, and interactive WhatsApp keyword simulator modal (`STREAK`, `STATUS`, `HELP`).
- `Sidebar.tsx`: Persistent navigation with multi-tenant gym switcher (Iron House, K-Town Crossfit, Margalla Heights) and front-desk QR placard modal launcher.
- `AtRiskMembersTable.tsx`: Rules-based churn risk table featuring progress meters, inactive day counters, payment flags, and one-click WhatsApp re-engagement modals.
- `AttendanceChart.tsx`: High-contrast, clean 30-day attendance trend visualization with interactive tooltips and weekly peak indicators.
- `StreakLeaderboard.tsx`: Top gym consistency champions with dynamic flame animations and milestone badges.
- `QuickCheckInModal.tsx`: Instant modal check-in terminal with sound-free instant feedback and celebratory reward milestone displays.
- `FrontDeskQrModal.tsx`: High-resolution, printable front-desk QR placard with secret rotation and browser print dialog trigger.

---

## 🛠 Running the Frontend Locally

```bash
cd frontend
npm install
npm run dev
# Application available at: http://localhost:3000 (or http://localhost:3001)
```

To build production bundle:
```bash
npm run build
npm run start
```
