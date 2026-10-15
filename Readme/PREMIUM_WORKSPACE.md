# Premium workspace revision

The starting audience is independent gyms in Pakistan, with PKR accounting, Asia/Karachi as the default timezone, front-desk payments and personal WhatsApp follow-up.

## Product and visual changes

- Rebuilt the overview with a forest collections panel, occupancy indicator, attendance rhythm, membership reminders, retention queue, daily tasks and session agenda. Metrics identify their periods and come from their underlying records. A daily brief exports to CSV.
- Kept the ivory, forest and brass theme across the existing pages. Sage, pale red and soft yellow communicate positive, priority and attention states alongside text. Quiet boundaries, restrained typography and generous spacing provide consistent grouping.
- Added an Operations workspace: lead stages and follow-up notes, coach schedules, reservations and capacity limits, monthly expenses and a team checklist. Records can be created, edited and exported. Tasks can be completed and reopened.
- Added real owner signup and sign-in pages connected to the existing account API, plus sign-out. Signup starts the backend's existing 14-day trial. Failed account requests never create a fake session.
- Added an explicit demo banner. Operations demo edits persist in browser storage; authenticated Operations use the database. Guest financial forms require sign-in before recording money or memberships.
- Preserved the member directory, attendance and QR flows, trainers, diet plans, rewards, retention, insights, conversations and settings.

## Reliability repairs

Authenticated API failures now propagate instead of returning client sample data or simulated successful writes. The payment service no longer substitutes fictional subscriptions or receipts when the database is empty or unavailable.

Membership forms now search and select actual member IDs rather than using hardcoded demo identities. The UI reloads saved records instead of forcing every payment or new subscription to ACTIVE. Paid memberships start pending; only sufficient completed payments activate them. Renewal has an explicit fee-received review step. It extends the existing term when paid, or creates a pending term after expiry. An unpaid early renewal cannot suspend an existing paid term. Duplicate receipt references are rejected. Historical payments before the latest pending term do not settle that term. Failed and partial payments do not activate it, and unpaid terms cannot be extended twice.

Operations writes validate allowed fields, calendar dates, monetary amounts, booking capacity, duplicate names and coach conflicts. Each write locks the gym row, checks a workspace version and writes its audit entry in the same transaction. Queries use gym scoping and transaction-local RLS context. Unknown record IDs and stale versions fail without overwriting the workspace. CSV exports escape cells and protect against spreadsheet formula injection.

Plan selection no longer simulates payment success or grants paid entitlements. The existing billing simulation endpoint is disabled unless explicitly enabled outside production; production always rejects it. A real provider and verified webhook flow remain required for paid SaaS checkout.

## Verification

- Frontend: 14 regression tests covering request failures, capacity mapping, member queries, demo/version behavior, reservations, coach conflicts, calendar boundaries and safe CSV exports.
- Backend: the full 75-test unit suite passed. After the final renewal protections, 22 focused payment/operations/billing tests and the final 7-test payment suite passed. Both additional renewal cases are included in the final payment suite.
- Both TypeScript projects and production builds checked. Final results are reported in the chat.
- Browser walkthroughs cover responsive overview, lead-stage changes, reservation persistence across reloads, the Operations tabs, account entry and membership member selection. No real messages or payments are sent. The built preview was checked at 1440px and 390px. At 390px, Overview and Operations each had a 384px document width; the lead board retains its own horizontal scroll. CSV download was verified through the browser.

## Deployment limits

Live database, authentication, RLS and concurrent transaction behavior still need end-to-end verification against a seeded PostgreSQL instance. Unit mocks validate query intent and application rules; they do not establish database-level isolation or payment processing correctness.

Operations use the existing gym.settings JSON field, avoiding a schema migration. Each collection is capped at 500 records. Large gyms need normalized tables, indexed queries, pagination and an archive strategy before increasing those limits. Reservations currently use attendee names and reserve class places; attendance is recorded separately at the front desk. Moving a lead to Joined does not automatically enroll or bill them.

Online payments, automated WhatsApp delivery and email invitations need configured production providers and delivery verification. Expense tracking is an internal PKR ledger, not an accounting or tax system. Financial exports are snapshots rather than reconciled financial statements. Existing demo fixtures and some unrelated backend fallbacks remain and need a broader production hardening pass. Existing dependency vulnerabilities documented in UI_POLISH_AUDIT.md were not resolved by this product revision.

The local preview is suitable for product review. It is not evidence that paid checkout, external delivery or live multi-tenant operations have been commissioned.
