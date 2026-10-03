# Premium Futuristic UI & Member Retention System Architecture

## 1. Executive Mission & Core Purpose
GymRetain is built exclusively to solve the primary profit-drain of modern fitness centers: **silent member disengagement**. 

Traditional gym software only alerts management after a customer has cancelled or their recurring card has failed. GymRetain identifies members during **habit decay**—when their weekly attendance frequency drops 50%+, or when they miss 3–14 consecutive days—enabling staff to intervene proactively while the member is still salvageable.

---

## 2. Cohesive Futuristic Visual System
The application adheres to an industry-standard, high-end futuristic dashboard aesthetic:
- **Foundational Backgrounds:** Deep midnight charcoal (`#080A0F`, `#0B0E17`) and midnight navy (`#10141D`, `#131722`).
- **Electric-Cyan Primary Accents:** Electric cyan (`#00F2FE`, `#06B6D4`, `#22D3EE`) for verified attendance signals, active radars, streak milestones, and primary action buttons.
- **Glassmorphism:** Multi-layered `.glass-panel` and `.glass-panel-elevated` panels featuring subtle 1px high-contrast borders (`rgba(255, 255, 255, 0.08)` / `rgba(0, 242, 254, 0.15)`), 20px backdrop blurs, and deep box shadows.
- **Urgency Color Coding:**
  - **Red (`#EF4444` / `#DC2626`):** Critical churn hazard (>14 days inactive or immediate payment lapse, 85-95% probability of permanent churn).
  - **Amber (`#F59E0B` / `#D97706`):** Slipping habit / moderate attention (50%+ drop in visit frequency vs usual routine).
  - **Electric Cyan (`#00F2FE`):** Consistent active habit / healthy routine.
  - **Purple (`#A855F7`):** AI intelligence, Groq LLM copilot insights, and habit disruption signals.
- **Accessibility & Motion:**
  - Full `@media (prefers-reduced-motion: reduce)` support that disables radar sweeping and canvas rotations.
  - Accessible HTML table alternative for 3D visualizers.
  - Explicit high-contrast `:focus-visible` outlines for keyboard navigability.
  - Tactile shadows (`btn-shadow`, `btn-shadow-primary`) applied to **all** interactive buttons across every route per project rule.

---

## 3. Dashboard Architecture: "Who Needs Your Attention Today?"
The central dashboard has been restructured around an immediate operational triage question:
1. **Critical Triage Alert Banner:** Live counts of critical and slipping members requiring staff outreach today.
2. **Explainable Revenue at Risk Card:**
   - **Formula Displayed:** `(4 High Risk × ₨5,000 avg) + (1 Overdue @ ₨4,500) = ₨24,500/mo at risk`.
   - **Projected 6-Month LTV Loss:** `₨147,000` lifetime loss if unrecovered.
   - **Recovery Rate Benchmark:** ~72% historical recovery rate with proactive WhatsApp outreach within 48 hours.
3. **Interactive 3D Retention Orbital Radar:**
   - Real-time 60 FPS Canvas 3D isometric segmented orbital radar.
   - Segments: `URGENT` (Inner high-risk orbit), `SLIPPING` (Mid habit-decay orbit), `DISRUPTED` (Habit fluctuation orbit), and `HEALTHY` (Outer stable orbit).
   - Raycasting hover tooltips with member details and disengagement risk scores.
   - **Interactive Segment Filtering:** Clicking any 3D orbital segment instantly filters the prioritized member intervention table below.
   - Includes accessible HTML table view toggle and SSR hydration safety.
4. **Prioritized Member Intervention List:**
   - Sortable by Risk Score, Absence Duration, and Revenue at Risk.
   - Behavioral evidence summaries (e.g. *Down from 4.5 days/wk to 0 days/wk*).
   - Staff handler assignment and direct 1-click **Prepare Outreach** trigger.
5. **Live Staff Action Audit Trail:**
   - Real-time event log tracking staff interventions, automated WhatsApp recovery messages, and membership renewals.
6. **Attendance Dynamics Curve:**
   - High-precision SVG wave chart comparing actual daily check-in volume against baseline 30-day capacity.

---

## 4. End-to-End Proactive Retention Workflow
Staff can move naturally through the 4-stage retention lifecycle:
1. **Identify Disengagement:** Radar or At-Risk Queue flags habit decay.
2. **Examine Evidence:** Review customary weekly cadence vs recent check-in drop, days inactive, and payment status.
3. **Prepare Personalized Intervention:**
   - Select channel: WhatsApp, Direct Phone Call, or Desk Reception Note.
   - Assign staff coach / handler.
   - Set follow-up accountability date.
   - **Editable Message Draft:** Staff can customize auto-generated drafts addressing the member's specific routine before sending.
4. **Confirm & Track Outcome:**
   - Two-step confirmation barrier prevents accidental dispatches.
   - Logs outcome into audit trail and updates member notes.

---

## 5. Enhanced Application Routes
- **`/` (Main Command Center):** 3D Retention Radar, Revenue at Risk formula card, Prioritized Intervention List, Staff Action Audit Log, Attendance Dynamics curve.
- **`/retention` (At-Risk Queue Hub):** 4-stage disengagement recovery playbook, churn diagnostic scanner, multi-factor habit filters, and batch triage.
- **`/members` (Member Directory & Detail Drawer):**
  - Search by code, name, and phone.
  - Interactive **Attendance Habit Timeline & 30-Day Punch Card Matrix** inside the Member Story Drawer.
  - Disengagement velocity diagnosis and direct modal trigger for proactive staff interventions.
- **`/insights` (AI Intelligence & Copilot):**
  - Groq LLM streaming copilot answering natural-language queries against isolated gym data with zero PII leakage.
  - Predictive Churn analytics and Attendance heatmaps.
- **`/subscriptions` (Billing & Internal Register):**
  - Counter cash, bank transfer, JazzCash, and EasyPaisa internal payment recording.
  - Expiry tracking and renewal automation (no external gateway dependencies).
- **`/trainers` (Staff & Client Roster):**
  - Trainer assignment management, client retention health, and nutrition protocol tracking.
- **`/diet-plans` (Nutrition Protocol Planner):**
  - High-protein Desi templates (hypertrophy, fat loss, maintenance) with 1-click cloning.
- **`/rewards` & `/rewards/winners`:**
  - Streak milestone gamification rules and winner leaderboard.
- **`/check-in` (Front Desk Kiosk):**
  - High-speed check-in terminal with instant streak verification, milestone reward unlocks, and recent log.
