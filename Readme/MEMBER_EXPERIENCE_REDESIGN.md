# Member experience redesign

## Research and boundaries

The user requested REA analysis of Planet Fitness and a stronger GymRetain member experience. Research used the [official Planet Fitness app page](https://www.planetfitness.com/mobileapp) and [published App Store listing and screenshots](https://apps.apple.com/us/app/planet-fitness/id399857015). No authenticated Planet Fitness account or private application internals were accessed.

REA evidence:

- Public website capture `ev_ac137b8e7cfa5d974a0948a102375f9777d60372b6bde55ea53985f55476704e`: security challenge blocked browser inspection; no bypass attempted.
- App Store capture `ev_6530f38a7209d5e11d538e39a117cbb8e9314338200ab33ef787bfc9c4e62bed`: public listing and app screenshots, including home/club, training, and fitness profile presentation.
- GymRetain before capture `ev_08b24820ff79dd3394265e1ae7c8e26eaa91b1a0aa226e4cda8a8d578a3aaca8`: account page at 390 × 844, with a repetitive card hierarchy and floating navigation.

Observed public patterns include prominent digital check-in, club crowd information, a workout destination, and scannable activity milestones. These observations informed the design; signed-in workflows and performance remain unverified. GymRetain retains its own green/brass theme, name, copy, and abstract CSS illustration. No Planet Fitness assets were copied.

## Implemented experience

- Home: personal greeting, abstract illustration, club occupancy, gym pass, four everyday shortcuts, weekly activity, trainer plan, booked class, and gym announcements.
- Workouts: assigned trainer plan, trainer messaging, workout history, and a direct log-workout action.
- Account: member identity, membership summary, pass access, and grouped settings with concise descriptions.
- Classes: upcoming/booked filters, dates in the gym timezone, available spots, and a confirmation before cancellation.
- Navigation: desktop navigation, a fixed mobile dock, clear parent links, keyboard focus indicators, and preview-preserving URLs.

Existing APIs, member/staff session separation, backend authorization, and read-only preview behavior are retained. No unsupported video library, crowd forecast, fabricated daily attendance, or membership entitlement was added. The preview uses explicitly labeled sample data; real member workflows require the existing backend and database.

The production build uses one worker to reduce local CPU pressure. The running frontend uses production mode, without development watchers.

## Validation

- TypeScript, ESLint, and 28 frontend tests passed. Tests cover preview URL preservation, parent navigation, and crowd-meter boundaries alongside the existing API/session checks.
- Production compilation and standalone packaging passed after retrying with Windows filesystem access.
- REA mobile home capture (390 × 844): `ev_1bc5b07565dd61bc256ca39933f6b8bdf4d3c315694f0d179bef68f19095e3f0`.
- REA mobile account → workouts → history → workout dialog: `ev_16bc3bea514059e3b5d416c6695e86cd8181d857c34c4b93ede85207753c5131`; no page errors; preview query retained.
- REA desktop light theme, class management, keeping a place, and booked-class filtering: `ev_4175daa404b5bd8507ae857d7767331df1ac22286d6acee739fa70a2c04e0a70`; no page errors.
- REA narrow 320px class-booking attempt: `ev_ea77e6448320974e0976bd68feaeba0e04eeaf7205f5b47f6e3e578f6b90884d`; read-only preview blocked the action and kept the booking available. This capture prompted moving the notice above mobile navigation and naming the icon-only check-in link.
- Final desktop photo-crop verification: `ev_2927fac98f7015217cb8258824fde3f60bc05ae79dda547d1465f73c9f79caa4`. Final 320px notice position and named check-in verification: `ev_d71c01d96d0321693d55937c8569729807f16c4ca6666fe570860ae8fe940d2f`. Both complete, with no page errors.

The localhost PostgreSQL service was offline, so authenticated database-backed mutations were not retested. Public preview and navigation checks do not establish live booking or authentication success. Existing manifest-scope/deprecation and missing-favicon console warnings are outside this redesign; no page exceptions appeared in the exercised flows.

## Reviewed screenshots

[Mobile account](assets/member-experience/member-account-mobile.png)

The member home hero uses CSS rings and a dumbbell icon. Person photography was removed at the user’s request, along with the unused public image and superseded home screenshots.
