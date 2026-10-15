# GymRetain color system

The application uses one restrained palette across the dashboard, Operations, members, memberships, check-in, retention, trainers, diet plans, rewards, streak winners, insights, chat, settings and account entry. Business behavior and navigation are unchanged.

## Palette and usage

| Role | Light theme | Purpose |
| --- | --- | --- |
| Warm ivory | `#F4F1E9` | Workspace background |
| Porcelain | `#FFFEFA` | Tables, forms, cards and dialogs |
| Forest | `#234F3D` | Primary actions, page headings and links |
| Deep forest | `#193D30` | Persistent navigation and account story |
| Pale sage | `#EDF2E4` | Page context bands and table headers |
| Mint | `#D7E8B9` | Selected navigation and dashboard primary action |
| Antique brass | `#806735` | Fine header borders and small editorial accents |
| Botanical green | `#E9F1DE` / `#35582F` | Success surfaces and text |
| Muted champagne | `#F8EED3` / `#75591F` | Warning surfaces and text |
| Soft terracotta | `#F8E8E2` / `#943F37` | Danger surfaces and text |

Dark mode pairs deep green canvas and surfaces with ivory text, pale sage actions and softened status colors. Foreground, background and boundary tokens change together. Brass is an accent; it is not the main text color on dense content. Status meaning continues to use text labels and icons in addition to color.

## Implementation

- `frontend/src/app/globals.css` owns semantic light/dark tokens and the shared page context treatment.
- `frontend/tailwind.config.ts` maps legacy blue utilities into the forest/sage family, orange utilities into ochre and cool neutral utilities into warm botanical neutrals. Existing red, amber and emerald utilities remain semantic status colors. Muted plum remains available for distinct chart categories.
- Every management page has an explicit `page-context` header hook. The overview retains its contrasting forest hero.
- Shared `Card` variants use sage, champagne and terracotta surfaces with corresponding borders. The previously missing success variant is now defined.
- Inputs, tables, dialogs, badges and primary buttons inherit the shared tokens. QR images retain their original black/white image content for scanning.

## Verification

The frontend regression suite passes all 19 tests. The production build passes compilation, lint/type validation and generation of all 17 static pages. All 14 application/account routes were opened in the browser and checked at 390px: none exceeded the viewport width. The management page context bands resolved to the same sage token. The member directory was also visually reviewed in dark mode, where the header resolves to deep sage and the heading to pale mint. This revision makes no API, database or authorization changes.

Previews: [member directory](previews/premium-palette-members.png), [dark theme](previews/premium-palette-dark.png), [mobile](previews/premium-palette-mobile.png), [dashboard](previews/premium-palette-dashboard.png).

## Membership ledger refinement

The membership workspace uses a quieter treatment after review of a crowded desktop layout. Four large colored metric cards are replaced by a single porcelain summary with four values. The header no longer repeats a Payment Register badge, and the assignment action no longer displays two plus signs. Tabs are shortened to Memberships, Payments and Plans. A labeled status selector replaces five simultaneous filter buttons.

The membership table shows member, plan/price, end date, status and actions. Contact details, full date range, renewal preference and last payment are preserved in an accessible Membership details dialog. Renew and Record Fee remain in the row; cancellation is available in Details with its existing confirmation. Payment entry, plan selection, assignment and renewal workflows are unchanged. The hardcoded unpaid amount is removed, and recorded collections no longer claim a monthly period because the source metric covers all completed records.

Browser review found the demo subscription API ignored the requested status, so the page now applies status and search together to the returned rows. The server query remains in place. The redesigned ledger has an explicit empty result state and labeled search/status controls.

Verification: the final production build and all 19 frontend regressions passed. In the built preview, pending payment showed only Omer Farooq; member-code search returned one row; Details retained phone, billing, dates and last payment; renewal, payment and assignment forms opened without submitting records. Payments and Plans views remained available. Light/dark themes were inspected, and the document stayed within a 390px mobile viewport. Updated previews: [desktop](previews/memberships-simplified-desktop.png), [mobile](previews/memberships-simplified-mobile.png).

## Retention workspace refinement

Retention follows the same compact operational layout as memberships. A short title and one-line description replace the large editorial hero. A three-value porcelain summary replaces the large colored cards and repeated guidance banner. The values still describe the full queue: priority follow-ups, changing routines and members with payments up to date. Loading values remain explicit dashes.

The follow-up queue now appears immediately below this summary. Search and a labeled Risk level selector share one toolbar, replacing a second row of filter tabs. Priority and Slipping options retain the previous filter behavior, including dashboard deep links. The visible queue count follows the current search and risk filter. Table dividers and row color strips are reduced; semantic badges still convey risk and payment status. Mobile retains stacked member cards and the existing follow-up dialog. Refresh, drafts, outreach outcomes, notes, follow-up dates and save behavior are preserved.

Verification: all 19 frontend tests and the production build passed. Browser checks confirmed Slipping returns Sana Tariq, member-code search and the priority/member deep link return Ayesha Malik, refresh restores the queue, and the member follow-up dialog retains its fields and actions. No message or intervention was submitted. Light and dark modes were inspected; the mobile document measured 384px within a 390px viewport. Previews: [desktop](previews/retention-simplified-desktop.png), [mobile](previews/retention-simplified-mobile.png).

Border follow-up: the summary now defines its border token locally, so its perimeter and metric dividers render when reused outside the memberships workspace. The retention table also retains 1px semantic boundary lines between columns. Borders inherit light/dark palette values.
