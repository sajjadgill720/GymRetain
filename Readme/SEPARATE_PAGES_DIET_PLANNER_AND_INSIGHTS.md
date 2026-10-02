# Separate Pages Architecture: Diet Planner & AI Insights

## 1. Overview & Business Context
In response to operational workflows and usability feedback, **Diet Planning** and **AI Insights** have been elevated to dedicated, first-class pages in GymRetain rather than sub-tabs or embedded modals:
1. **Diet Planner Page (`/diet-plans`)**: A comprehensive nutrition hub allowing gym operators and trainers to assign meal plans, customize macronutrient profiles, leverage pre-built nutrition templates, calculate BMR/TDEE, and share plans directly via WhatsApp.
2. **Gym Intelligence & AI Insights Page (`/insights`)**: A centralized analytics command center combining an interactive streaming AI Copilot (powered by Groq Llama 3.3 70B with zero member PII), 30-day predictive churn risk modeling, and hourly gym attendance density heatmaps.

---

## 2. Dedicated Diet Planner Page (`/diet-plans`)

### Route & File
- **Route**: `/diet-plans`
- **Component**: [`frontend/src/app/diet-plans/page.tsx`](file:///e:/GymRetain/frontend/src/app/diet-plans/page.tsx)

### Key Capabilities
- **Member Meal Plans Directory**:
  - Filter by fitness objective: Weight Loss, Muscle Gain, Maintenance, or Custom.
  - Quick metrics: Target daily calories, protein, carbs, and fat breakdown per member.
  - Meal schedule drawer: Inspect individual meals with macro distribution.
  - One-click WhatsApp distribution: Pre-formats clean WhatsApp nutrition summaries ready to paste or send.
- **Template Library**:
  - Pre-curated meal blueprints: High-Protein Muscle Hypertrophy (2,600 kcal), Lean Caloric Deficit (1,850 kcal), Desi High-Protein Vegetarian (2,100 kcal), Ketogenic Fat Burner (1,750 kcal).
  - Quick-assign modal: Apply any template directly to a member with one click.
- **Interactive Macro & TDEE Calculator**:
  - Real-time Mifflin-St Jeor BMR calculator accounting for age, weight, height, gender, and activity multiplier.
  - Automatically calculates target calories and macro splits (Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g) based on bulking, cutting, or maintenance goals.
- **Diet Plan Creator Modal**:
  - Interactive multi-meal schedule builder supporting Breakfast, Lunch, Dinner, and Snacks.
  - Live aggregate macro validator to ensure daily macro totals match target goals.

---

## 3. Dedicated Gym Intelligence & AI Insights Page (`/insights`)

### Route & File
- **Route**: `/insights`
- **Component**: [`frontend/src/app/insights/page.tsx`](file:///e:/GymRetain/frontend/src/app/insights/page.tsx)

### Key Capabilities
- **AI Copilot (Groq Llama 3.3 70B Streaming)**:
  - Streaming conversational interface with real-time SSE token delivery.
  - Quick-start prompts: *Retention Diagnosis*, *At-Risk Queue Analysis*, *30-Day Attendance Trends*, *Overdue Renewals*.
  - Strictly scoped to the authenticated gym tenant (`gym_id`).
  - **Zero Member PII**: Transmits only anonymized aggregates and member codes (e.g., `[MEMBER-1002]`), keeping phone numbers, emails, and full names on premise.
- **Predictive Churn Probability Modeling**:
  - Real-time retention benchmark gauge displaying overall member retention health score (e.g. 91.2%).
  - Inactivity spectrum: Active (0-3 days), Slipping (4-7 days), At-Risk (8-14 days), Dormant (>14 days).
  - High-priority intervention recommendations with estimated revenue retention impact.
- **Attendance & Check-in Density Heatmaps**:
  - Hourly check-in distribution chart mapping peak vs. quiet gym floor hours (6 AM to 10 PM).
  - Capacity metrics: Identifies peak usage times (e.g. 7 PM - 9 PM) to optimize trainer staffing schedules.

---

## 4. Navigation & UI Consistency
- **Navigation Integration**:
  - Both routes are prominently featured in the primary desktop and mobile navigation [`frontend/src/components/Sidebar.tsx`](file:///e:/GymRetain/frontend/src/components/Sidebar.tsx):
    - `Insights` (`/insights`) with `Sparkles` icon and `AI` badge.
    - `Diet Planner` (`/diet-plans`) with `Utensils` icon and `Diet` badge.
- **Button Shadow Styling**:
  - In accordance with design standards, all interactive clickable buttons implement explicit shadow classes (`btn-shadow`, `btn-shadow-primary`, or `var(--shadow-btn)`) with smooth hover translations.
- **Dual-Theme Support**:
  - Light mode (Foxstocks-inspired soft canvas `#F5F6FC` and crisp white surfaces) and Dark mode (Vision-inspired deep charcoal `#0A0C10` with cyan accents) are fully supported across both pages.

---

## 5. Verification & Build Status
- **Next.js Production Build**:
  - All 13 routes compile cleanly (`next build` exited with code 0).
  - Zero TypeScript or bundling errors.
- **NestJS Backend Build**:
  - `nest build` completed successfully with code 0.
