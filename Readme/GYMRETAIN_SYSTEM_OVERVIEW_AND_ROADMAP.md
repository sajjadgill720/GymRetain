# GymRetain — System Overview, UI Walkthrough & Dual-Persona Roadmap

This document provides a complete breakdown of the **current GymRetain implementation**, a detailed tour of **what is visible on screen**, and an architectural roadmap to expand GymRetain into a **dual-persona platform for both Gym Owners and Gym Customers (Members)**.

---

## 1. What Is Implemented (Backend & Core Architecture)

GymRetain is built as a production-grade multi-tenant B2B SaaS platform designed to eliminate member churn in fitness centers.

### Architecture Highlights
- **Backend Stack**: NestJS (TypeScript), PostgreSQL, Prisma ORM, JWT Authentication.
- **Tenant Isolation**: Dual-layer defense-in-depth:
  - Application-level scoping via `TenantAccessGuard` and `TenantPrismaService`.
  - Database-level PostgreSQL Row-Level Security (`RLS`) enforcing tenant boundary even on direct queries.
- **Data Models**:
  - `Gym` & `GymStaff`: Multi-tenant business profiles with Role-Based Access Control (`SUPER_ADMIN`, `GYM_OWNER`, `GYM_MANAGER`, `GYM_STAFF`, `TRAINER`).
  - `Member` & `Membership`: Member directory, auto-generated member codes, membership packages (Monthly, Quarterly, Annual, Session passes), minor-unit currency amounts.
  - `CheckIn` & `Streak`: Fast QR scanning, manual desk check-in, real-time occupancy counting, automatic session checkout, continuous streak counter, and streak freeze logic.
  - `Reward` & `RewardRedemption`: Streak milestone badges, free items, discount vouchers with redemption lifecycle (`UNLOCKED` -> `REDEEMED`).
  - `Trainer` & `TrainerAssignment`: Personal trainer profiles, bio, specialties, active client rosters, and client reassignment workflows.
  - `DietPlan`, `DietPlanMeal`, `DietPlanTemplate`: Macro-balanced meal plans (protein, carbs, fats, calories) linked to members and trainers.
  - `Operations`: CRM lead pipeline, class/session scheduling, daily operating expense logs, and staff task management checklists.
  - `Payment`: Cash, Bank Transfer, JazzCash, EasyPaisa, and Stripe ledger.
  - `WhatsAppMessageLog` & `WhatsAppTemplate`: WhatsApp nudges for streaks, payment reminders, and churn prevention.
  - `ChatConversation` & `ChatMessage`: Conversational AI assistant powered by Gemini for churn analytics and gym management queries.
  - `SaaSBillingRecord`: GymRetain subscription billing for gym owners (Trial, Starter, Pro, Enterprise) with sandbox simulator.

---

## 2. What Is Shown On Screen (Frontend & UI Walkthrough)

The frontend is built with **Next.js (App Router)** and styled with **custom design tokens** adhering to industry UI standards (consistent color schemes, elevated card surfaces, and button shadows).

### Primary Screens & Components
1. **Executive Dashboard (`/`)**:
   - **Live KPI Strip**: Active members count, today's unique visitors, and real-time gym occupancy percentage vs. max capacity.
   - **Attendance Trends Chart**: Interactive 14-day or 30-day visit volume bar charts.
   - **Daily Focus Queue**: Filterable alerts categorized into Retention, Pending Payments, Expiring Renewals, Follow-up Leads, and Due Tasks.
   - **Financial Ledger Summary**: Period-based collections, logged operating expenses, and net balance.
   - **Quick Actions**: Desk QR Check-in trigger and CSV daily brief report download.

2. **Check-In Terminal (`/check-in`)**:
   - **Capacity Status Gauge**: Displays remaining slots, occupancy percentage, and enforcement mode (Warning vs. Hard Block).
   - **Instant Lookup / Scanner**: Phone number or Member Code lookup with auto-detected active pass and current session status.
   - **One-Click Check-In / Check-Out**: Real-time session timer and badge alert notifications.

3. **Members Directory (`/members`)**:
   - **Search & Filter Bar**: Search by name, phone, or code; filter by status or assigned trainer.
   - **Member Story Drawer**: Slide-over panel displaying membership validity, check-in history, QR credential generator, trainer reassignments, and assigned diet plans.

4. **Trainers Hub (`/trainers`)**:
   - **Trainer Cards & Roster**: Specialties, contact information, client load, and active client roster.
   - **Client Performance Indicators**: View each client's current streak, longest streak, and diet plan status.
   - **Reassignment Modal**: Transfer clients between trainers with audit logs.

5. **Diet Plans Hub (`/diet-plans`)**:
   - **Interactive Meal Builder**: Categorized meals (Breakfast, Lunch, Dinner, Snack) with calorie and macronutrient breakdown (protein, carbs, fats).
   - **Templates Library**: Pre-built plans for Weight Loss, Muscle Gain, and Maintenance.
   - **WhatsApp Export**: Formats the meal plan into clean WhatsApp text for instant sharing.

6. **Retention Queue (`/retention`)**:
   - **AI Churn Prediction Cards**: High, Medium, and Low churn risk indicators based on visit lapses and payment delays.
   - **Direct WhatsApp Intervention**: Pre-populated motivational message templates.

7. **Rewards & Milestones (`/rewards`)**:
   - **Gamification Rules**: Threshold configurations (e.g., 7-day streak, 30-day streak) rewarding badges or discounts.
   - **Redemption Logs**: History of member claimed perks.

8. **Subscriptions & Ledger (`/subscriptions`)**:
   - **Membership Ledger**: Active, pending payment, and expired packages.
   - **Payment Recording**: Record payments via Cash, Bank Transfer, JazzCash, EasyPaisa, or Stripe with receipts.

9. **Operations & CRM (`/operations`)**:
   - **Lead Pipeline**: Kanban/list stages (`NEW`, `CONTACTED`, `TRIAL`, `JOINED`, `LOST`).
   - **Class Schedule**: Group fitness sessions and capacity tracking.
   - **Expense Tracker**: Categorized business overheads (Rent, Payroll, Utilities, Equipment).
   - **Team Checklist**: Front-desk and maintenance tasks.

10. **AI Insights & Chat (`/insights` & `/chat`)**:
    - **Conversational Analytics**: Natural language query interface to ask questions about attendance dips, revenue trends, and churn causes.

11. **Settings & SaaS Billing (`/settings`)**:
    - **Gym Profile & Capacity Limits**: Configure max capacity and admittance policies.
    - **Team Roles & Invitations**: Invite managers, staff, and trainers.
    - **GymRetain SaaS Plan**: Manage tier subscription, billing cycles, and invoice history.

---

## 3. Roadmap: Transforming GymRetain for Both Owners and Customers

Currently, the interface is tailored for **Gym Staff and Owners**. To serve **Gym Customers (Members)**, GymRetain requires a dedicated Member Experience layer.

### Phase 1: Customer Authentication & Profile
- **Passwordless Customer Login**:
  - Login via Phone + SMS/WhatsApp OTP or Magic Link (matches existing phone numbers stored in `Member` model).
- **Member Persona Switcher / Separate Portal**:
  - Separate mobile-first portal at `/portal` or dedicated Customer Mobile/PWA.
  - Customers see only their own data (enforced by Member-scoped JWT).

### Phase 2: Customer-Facing Screens ("My GymRetain")
1. **Digital Access Card**:
   - Dynamic, anti-screenshot QR code for self-scanning at turnstiles or front desk kiosk.
2. **Live Gym Traffic Meter**:
   - Real-time "How crowded is the gym right now?" meter to help members plan their workout times.
3. **Streak & Gamification Center**:
   - Visual streak calendar, fire badge animations, milestone achievements, and available discount rewards.
   - Streak freeze activation if taking sick leave or traveling.
4. **Interactive Diet & Nutrition Companion**:
   - View assigned meals, check off eaten meals, view daily macro progress rings (Protein, Carbs, Fat, Kcal).
5. **Class & Session Booking**:
   - Browse upcoming fitness classes (HIIT, Yoga, CrossFit) and reserve slots directly.
6. **Self-Service Subscriptions & In-App Payments**:
   - View expiring memberships and renew immediately via JazzCash, EasyPaisa, or Stripe.
7. **Workout Tracking & PR Logger**:
   - Record personal bests (Bench, Squat, Deadlift) and view workout plans assigned by their personal trainer.
8. **Trainer Chat & Feedback**:
   - Direct two-way messaging between the member and their assigned personal trainer.

### Phase 3: Owner-Facing Enhancements to Support Customers
- **Member Mobile App Push Notifications**: Notify members automatically when a streak is at risk or when classes are starting.
- **In-App Class Attendance Tracking**: Automatic attendance check-in when a booked member scans their QR code.
- **Member Feedback & Rating (NPS)**: Post-workout ratings and satisfaction reviews visible on the owner's dashboard.
- **Digital Storefront / Self-Onboarding**: Public QR code at the gym reception allowing walk-ins to register, pick a plan, and pay immediately on their own phone.
