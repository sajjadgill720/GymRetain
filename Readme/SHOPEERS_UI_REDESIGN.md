# Shopeers-Inspired UI Redesign with GymRetain Domain & Light/Dark Theme

## 1. Overview & Reference Match
This redesign transforms the GymRetain interface to mirror the modern, high-conversion SaaS aesthetic seen in the **Shopeers** design reference, populated **100% with GymRetain gym retention & attendance data**:
- **Brand Emblem & Typography:** Custom geometric faceted blue hexagon emblem (`GymLogo.tsx`) with bold `GymRetain` typography.
- **Top Bar Header:**
  - Pill-shaped global search bar with `⌘K` keyboard shortcut indicator.
  - Interactive Theme Toggle (Sun/Moon) with smooth rotation micro-animation.
  - Notification bell with unread indicator dot.
  - Staff user avatar with initials badge (`BC / Bilal C.`).
- **Top 4 KPI Stat Cards (GymRetain Metrics):**
  - **Today's Attendance:** `38 Visits` (`+12.4%` green badge), `vs. 34 same day last week`, with top-right blue UserCheck icon pill.
  - **Active Members:** `142 Enrolled` (`+8.2%` green badge), `89.4% membership utilization`, with top-right blue Users icon pill.
  - **At-Risk Churn Alerts:** `6 High Risk` (`Needs Nudge` amber badge), `Absent > 7-14 days without notice`, with top-right blue AlertTriangle icon pill.
  - **Top Workout Streak:** `12 Days` (`+4.4%` green badge), `Hamza S. (Free Shake next)`, with top-right blue Flame icon pill.
- **Middle Section:**
  - **Monthly Attendance & Retention Trends Chart:** Smooth SVG cubic spline curve with translucent blue gradient fill, dotted guidelines, interactive hover tooltips showing daily workout volumes, and bottom 3-part membership breakdown segments (*Monthly Gold: 84*, *Annual VIP Elite: 42*, *Quarterly Flex: 16*).
  - **Peak Workout Days Weekly Bar Chart:** Interactive weekday bars showing check-in volumes with highlighted electric blue "Tue" (`84 Peak`) pill.
  - **30-Day Member Retention Rate Gauge:** Semicircular speedometer with animated dashed green arc (`91.4% - Exceeding 85% industry benchmark`) and tactile "View At-Risk Queue (6 High)" button with shadow.
- **Bottom Section:**
  - **At-Risk Members & Silent Churn Table:** Real GymRetain member codes (`GR-1002`, `GR-1007`, `GR-1005`, `GR-1001`), names, inactivity durations, active plans, and color-coded risk score badges.
  - **AI Retention Assistant Card (Matching Image 3):** 4 glowing 3D-styled animated spheres with keyframe floating effects (`@keyframes float`, `@keyframes pulse-glow`), plus an interactive pill-shaped prompt input with paperclip attachment, microphone icon, and electric blue circular send button.

---

## 2. Dynamic Bright & Dark Theme System

### Bright / Light Theme
- **Canvas Background:** Soft, clean airy slate `#F4F6FA`.
- **Surfaces & Cards:** Crisp white `#FFFFFF` with subtle `#E2E8F0` borders and soft elevation shadows.
- **Text:** Deep charcoal slate `#0F172A` for high readability.
- **Accent:** Royal electric blue `#2563EB`.

### Rich Modern Dark Theme
- **Canvas Background:** Deep midnight sapphire-black `#090D16`.
- **Surfaces & Cards:** Elevated sapphire slate `#12192B` and `#172138` with glowing translucent borders `#1E293D`.
- **Text:** Crisp light slate `#F8FAFC`.
- **Accent:** Luminous electric sapphire `#3B82F6` with subtle outer glow.

### Theme Persistence & Transition
- State is managed via `ThemeProvider.tsx` and persisted in `localStorage` (`gymretain_theme`).
- Smooth CSS transitions (`transition-colors duration-200`) prevent jarring theme switches.
- Inline script in `layout.tsx` eliminates theme flickering on reload.

---

## 3. Micro-Animations & Tactile Button Shadows
- **All Clickable Buttons:** Styled with custom `btn-shadow` and `btn-shadow-primary` for tactile depth and feedback.
- **AI 3D Spheres:** Keyframed with `@keyframes float` and `@keyframes pulse-glow`.
- **Speedometer Gauge:** Dynamic stroke-dashoffset transition.
- **Bar Chart:** Interactive day selection with floating count badges.
