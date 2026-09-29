# Streak Reward Winners — Dedicated Retention & Redemption Screen

## 1. Overview & Purpose
GymRetain features a dedicated operational screen for gym owners and front-desk staff to track, verify, and fulfill rewards won by members for achieving check-in streaks:
- **Route**: [`/rewards/winners`](file:///e:/GymRetain/frontend/src/app/rewards/winners/page.tsx)
- **Top Navigation Tab**: `Streak Winners` with live badge (`6 Won`)
- **Direct Cross-Links**: Accessible from the dashboard's [`StreakLeaderboard`](file:///e:/GymRetain/frontend/src/components/StreakLeaderboard.tsx) and the [`/rewards`](file:///e:/GymRetain/frontend/src/app/rewards/page.tsx) rules configuration page.

---

## 2. Key Features

### 1. Information-Dense Metric Row
Four compact stat tiles summarize the current redemption queue above the fold:
1. **Total Rewards Won**: Aggregate count of streak milestones unlocked by members.
2. **Pending Claim**: Number of unlocked rewards waiting for physical fulfillment or discount application at reception.
3. **Fulfilled**: Lifetime claimed rewards marked complete by staff.
4. **Top Streak Member**: Highlights the current record holder in the gym (e.g., *Hamza Sheikh • 12 Days*).

### 2. Live Search & Status Filtering
- **Keyword Search**: Instant client-side search across member name, code (`GR-XXXX`), phone number, and reward title.
- **Filter Tabs**:
  - `All Winners`
  - `Ready to Claim` (Pending front-desk fulfillment)
  - `Claimed` (Historical redemptions)

### 3. Desktop Table & Mobile Card Views
- **Member Identity**: Avatar, full name, member code, phone number.
- **Streak Qualification**: Milestone achieved (e.g. `10-Day Streak`, `15-Day Streak`, `25-Day Streak`) and member's current active streak count.
- **Reward Won**: Clear badges distinguishing `Digital Badge`, `Free Item` (e.g. Protein shake), or `Renewal Discount` (e.g. 20% off).
- **Date Unlocked**: Timestamp when the member hit the streak.
- **Status Indicator**: Neutral amber badge for `Ready to Claim` vs. emerald badge for `Claimed`.

### 4. Front-Desk Fulfillment Modal
When staff click **"Fulfill Reward"** on a pending item:
- A clean modal opens displaying the member summary, streak record, and reward item.
- Optional staff notes input (e.g., *"Handed chocolate whey shake at reception bar"*).
- Confirming fulfillment marks the record as `REDEEMED` via `PATCH /rewards/redemptions/:redemptionId/redeem`, records the staff timestamp, and shows an instant success toast.

---

## 3. SaaS UI Conventions
- **Palette**: Cool-toned neutral dark mode (`#09090B` canvas, `#121215` card surfaces, `border-zinc-800`).
- **Button Shadows**: All interactive buttons utilize subtle elevation shadows (`.btn-shadow`, `.btn-shadow-primary` per [code-style.md](file:///e:/GymRetain/.agents/rules/code-style.md)).
- **Zero Decorative Fluff**: Direct operational SaaS utility for day-to-day gym reception.
