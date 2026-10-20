# Personal member mode

The member app no longer exposes gym passes or QR check-in. `/portal/pass` is removed from the frontend route allowlist, and its rotating-pass component and timers have been deleted. Owner check-in and backend security remain unchanged.

## Use without a participating gym

Open `/portal` without a member session to start a personal tracker. An existing gym member can choose **Take my training into personal mode** in Account. This copies their loaded workouts, personal records, measurements, name, and goals into browser storage, without copying payment, gym, or trainer records. Repeating the transfer merges entry IDs instead of duplicating history. Preview starts an empty tracker rather than copying sample records.

Personal mode provides workout logging and history, records, measurements, weekly goals, a profile, and JSON backup/restore. It uses browser storage independently of the member API or gym owner subscription. Weekly counts come from logged workouts in the browser's local timezone. Connected-gym classes, rewards, memberships, and messaging are optional and are not presented as personal features.

## Storage limits

Personal data is saved in this browser, not synced to a cloud account. Export a backup before clearing browser storage or changing devices. Import validates the backup before replacing current data and requires a confirmation in the UI. Invalid imports and invalid writes leave existing storage intact. Storage errors are reported rather than displayed as successful saves.

The loaded tracker can save entries without contacting the server. Loading the application on a fresh device still requires the website to be reachable; this change does not promise a fully cached offline application.

Switching back to a gym uses the existing OTP login and tenant-scoped backend. Personal mode does not alter staff credentials or server-side authorization, and real API failures do not silently become personal-mode successes.

## Checks

Frontend tests cover persistent local entries, goal edits, backup restore, invalid writes/imports, repeated history transfer, unsupported connected-gym actions, and switching the client transport back to authenticated requests. Production build includes TypeScript and lint checks.

All 32 frontend tests, TypeScript, ESLint, and the production build passed. REA browser evidence `ev_54636d2cb6af23a1a132d3cac146c49c1d6913a53892c95f8edbf5e51cfa88b5` verifies a fresh personal home, logging a workout without an account, preserving it after a full navigation/reload, and accessing backup controls. All actions completed with no page errors. A direct request to `/portal/pass` returned HTTP 404.

![Personal home](assets/member-experience/personal-home.png)

![Persistent session history](assets/member-experience/personal-history.png)
