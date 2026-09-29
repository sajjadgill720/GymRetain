# GymRetain — Structured Diet Plan Builder & Trainer Assignment Architecture

## 1. Overview & Architecture

GymRetain now provides complete support for **(1) Trainer Assignment** and **(2) Structured Diet & Nutrition Plan Builder**, built strictly on a manual/template-driven foundation with **zero AI hallucinations or health-advice liability** (per Phase specifications).

### Key Architectural Tenets
1. **Unified Staff Identity**: Trainers are `gym_staff` records with role `TRAINER`, reusing existing bcrypt hashing, JWT issuance, and multi-tenant session infrastructure.
2. **Query-Level Scoping**: When a trainer logs in, query-level scoping guarantees they only see members actively assigned to them (`WHERE trainer_assignments.trainer_id = current_user.sub AND is_active = true`). They cannot view or manipulate unassigned gym members.
3. **Reassignment History Preservation**: Reassigning a member to a new coach deactivates previous assignment records (`isActive = false`) rather than deleting them, preserving full historical audit logs.
4. **Active Plan Versioning**: Only one diet plan is `isActive = true` per member at a time. Creating a new plan atomically deactivates previous active plans while preserving history.
5. **Direct WhatsApp Delivery via Existing Messaging Provider**: Creating or updating a diet plan formats a clean, meal-by-meal WhatsApp message dispatched via the existing `MessagingProvider` using the established `UTILITY` category, 24-hour deduplication, daily member rate caps, and opt-out compliance.

---

## 2. Database Schema Additions (`PostgreSQL` + `Prisma`)

### A. Staff Role Enum
```prisma
enum StaffRole {
  SUPER_ADMIN
  GYM_OWNER
  GYM_MANAGER
  GYM_STAFF
  TRAINER
}
```

### B. New Tables & Relationships
1. **`trainer_assignments`**:
   - `id`: UUID Primary Key
   - `gym_id`: Foreign Key (`gyms.id` ON DELETE CASCADE)
   - `member_id`: Foreign Key (`members.id` ON DELETE CASCADE)
   - `trainer_id`: Foreign Key (`gym_staff.id` ON DELETE CASCADE)
   - `assigned_at`: Timestamptz
   - `is_active`: Boolean (default `true`)
   - **Partial Unique Index**: `CREATE UNIQUE INDEX "trainer_assignments_active_member_unique" ON "trainer_assignments"("gym_id", "member_id") WHERE is_active = true;`

2. **`diet_plans`**:
   - `id`: UUID Primary Key
   - `gym_id`: Foreign Key (`gyms.id`)
   - `member_id`: Foreign Key (`members.id`)
   - `created_by_id`: Foreign Key (`gym_staff.id`)
   - `title`: VarChar(255)
   - `goal`: Enum `DietGoal` (`WEIGHT_LOSS`, `MUSCLE_GAIN`, `MAINTENANCE`, `CUSTOM`)
   - `custom_goal`: VarChar(100) (free-text fallback)
   - `notes`: Text
   - `is_active`: Boolean (default `true`)

3. **`diet_plan_meals`**:
   - `id`: UUID Primary Key
   - `diet_plan_id`: Foreign Key (`diet_plans.id` ON DELETE CASCADE)
   - `meal_type`: Enum `MealType` (`BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`)
   - `description`: Text (e.g. *"3 egg whites, 1 whole egg, 2 brown toasts"*)
   - `calories`: Int (nullable)
   - `protein_g`, `carbs_g`, `fat_g`: Float (nullable optional manual macro fields)
   - `order_index`: Int (for sequence ordering)

4. **`diet_plan_templates`**:
   - `id`: UUID Primary Key
   - `gym_id`: UUID (nullable: `null` = platform-wide default available to all gyms, matching `whatsapp_templates`)
   - `title`, `goal`, `description`, `meals_json` (JSONB), `is_active`

### C. Row-Level Security (RLS) Policies
Each table has `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`:
- Enforces `gym_id = current_setting('app.current_gym_id')::uuid OR is_super_admin = true`.
- `diet_plan_templates` permits global platform templates where `gym_id IS NULL`.

---

## 3. Trainer-Scoping Authorization Rules

| Role | Member List View | Member Detail View | Assign/Reassign Trainer | Create/Edit Diet Plan |
|---|---|---|---|---|
| **GYM_OWNER** | Full gym roster | Any member in gym | Allowed | Allowed for any member |
| **GYM_MANAGER** | Full gym roster | Any member in gym | Allowed | Allowed for any member |
| **TRAINER** | **Only assigned members** (`WHERE trainer_id = sub AND is_active = true`) | **Only assigned members** (404 if unassigned) | **Forbidden** (403) | **Only assigned members** (403 if unassigned) |
| **SUPER_ADMIN** | Audited cross-tenant access | Audited cross-tenant | Allowed | Allowed |

---

## 4. WhatsApp Nutrition Delivery Pipeline

* **Template**: `diet_plan_assigned` (Meta Category: `UTILITY`, Cost: ~3.50 PKR).
* **Meal Formatting**:
  ```text
  Salam Ali! Your nutrition plan "1,800 kcal Fat Loss Plan" (WEIGHT_LOSS) has been updated by your coach.

  🍳 BREAKFAST: 3 boiled eggs, 1 brown toast, green tea (280 kcal | 20g P)
  🥗 LUNCH: 150g grilled chicken, 1 cup brown rice, salad (450 kcal | 42g P)
  🥩 DINNER: 200g white fish, steamed vegetables (350 kcal | 38g P)

  Coach Notes: Maintain hydration (3.5L/day), do not skip breakfast.
  — Iron House Gym & Fitness
  ```
* **Deduplication**: 24-hour window prevents duplicate dispatches.
* **Opt-Out Compliance**: Members who replied `STOP` are suppressed and logged to `whatsapp_messages_log` with status `FAILED` (`SUPPRESSED_MEMBER_OPTED_OUT`).

---

## 5. UI Implementation & Where to See Diet Plan Details

GymRetain provides two intuitive, 1-click locations to inspect diet plan details:

### 1. In the Trainers & Nutrition Hub (`/trainers`)
- Navigate to **"Trainers & Diets"** in the sidebar.
- In the **"My Assigned Clients"** table, locate any client.
- The **"Nutrition Plan Status"** column displays the active plan badge (e.g. `✓ Tailored Nutrition — Hamza`, `WEIGHT_LOSS • 3 Meals`).
- **Click the plan badge** or click the **"View Plan"** button in the Actions column to open the **Diet Plan Details Modal**.
- **What it shows:**
  - Full Plan Title, Target Goal badge, and Supervising Coach.
  - **Macronutrient Summary Cards**: Dynamically calculated Total Energy (kcal), Protein (g), Carbohydrates (g), and Healthy Fats (g).
  - **Daily Structured Meals**: Visual meal cards for Breakfast, Lunch, Dinner, and Snack with full descriptions and macro tags.
  - **Coach Instructions & Notes**: Hydration targets and meal timing guidance.
  - Quick action buttons with tactile shadows: "Resend via WhatsApp", "Edit Plan", and "Done".

### 2. In the Members Directory (`/members`)
- Navigate to **"Members Directory"** in the sidebar.
- Click on any member row (e.g., Hamza Sheikh, Bilal Ahmed, etc.).
- The right-hand **"Member Story at a Glance"** drawer will slide open.
- Scroll down to the **"Active Nutrition & Diet Protocol"** section.
- **What it shows:**
  - Active plan name, goal badge, and supervising coach.
  - Coach instructions & notes.
  - Daily structured meal breakdown with meal types, descriptions, calories, and protein grams.
  - Quick 1-click template cloning shortcuts (`Cut (1800k)`, `Bulk (2800k)`).
  - Ability to view or reassign the coach.
3. **Style Standards**:
   - Neutral dark canvas (`#09090B`), cards (`#121215`), and inputs (`#18181B`).
   - Tactile button drop shadows (`.btn-shadow` and `.btn-shadow-primary`) on all clickable elements.

---

## 6. Test Suite Coverage

All 57 tests across 8 test suites passing cleanly (`npm test` in `backend`):
* `test/trainers.spec.ts`: 8/8 tests (cross-tenant assignment prevention, duplicate prevention, reassignment history preservation, trainer query scoping, controller role guards).
* `test/diet-plans.spec.ts`: 7/7 tests (assigned trainer authorization, unassigned trainer 403 rejection, versioning deactivation, template cloning, WhatsApp utility dispatch).
* `test/tenant-isolation.spec.ts`: Regression canary verified for `trainer_assignments`, `diet_plans`, and `diet_plan_templates`.
* `test/tenant-isolation.e2e-spec.ts`: Full adversarial integration suite.
* `test/streak-calculation.spec.ts`, `test/risk-scoring.spec.ts`, `test/whatsapp-messaging.spec.ts`, `test/whatsapp-automation.e2e-spec.ts`.
