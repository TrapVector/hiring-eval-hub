# CLAUDE.md — Arcade Hiring Review PWA

## 1. Purpose

Build a small, installable Progressive Web App for **one reviewer** to review job
applications for an arcade in the UK, take notes, and track each applicant through a
hiring pipeline.

Applications are collected via **Google Forms** into a Google Sheet. That sheet is a poor
review surface. This app turns it into a readable review + tracking tool. All persistent
state lives in **Google Sheets** — there is no server and no other database.

## 2. Hard constraints (do not violate)

- **No backend / no server.** The only remote services are the **Google Sheets API** and
  **Google Identity Services** (GIS) for auth. Everything else is client-side TypeScript.
- **No data stored outside Google Sheets**, except local device caching (see §7). The app
  never sends application data anywhere other than the user's own Google Sheets.
- **Public GitHub repo, zero identifying data committed.** No sheet IDs, no OAuth client
  ID, no email addresses, no applicant data, no `.env` with secrets. All identifiers are
  entered by the user at runtime (§8) and stored only on-device.
- **Single reviewer.** No multi-user auth, no per-note attribution, no role model.
- **TypeScript, strict mode**, throughout.
- **Least-privilege OAuth scope:** `https://www.googleapis.com/auth/spreadsheets` only.

## 3. Tech stack
- Node through fnm
  - fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
  - node command should then be available
- **Vite + React + TypeScript**
- **vite-plugin-pwa** (installable, service worker, offline shell)
- **IndexedDB** for local persistence (via `idb` or similar thin wrapper)
- **Google Identity Services** (`google.accounts.oauth2`) token-flow for auth
- **Google Sheets REST API v4** for read/write (fetch directly; no heavy client library)
- No CSS framework requirement — keep styling simple and responsive. A lightweight
  approach (CSS modules or a minimal utility layer) is fine. Prioritise legibility.

## 4. Architecture overview

```
Google Form ──▶ Applications Sheet (read-only source)
                                   │  read (poll)
                                   ▼
                           ┌───────────────┐
   Reviews Sheet ◀── r/w ──│   PWA (React) │──▶ IndexedDB (config + edit queue cache)
 (app-owned, r/w)          └───────────────┘
        ▲                          │
        └────── flush edit queue ──┘
```

- **Applications Sheet**: the existing Form-linked sheet. **READ ONLY. Never write to it.**
- **Reviews Sheet**: a separate spreadsheet the user owns. Holds review state + config.
  The app reads and writes this one.
- The app joins the two by applicant **email** and presents a unified review surface.

## 5. Google Cloud / OAuth — facts the app depends on

The one-time human setup is documented separately in **`GOOGLE_CLOUD_SETUP.md`**. **The
build performs no Cloud setup** — do not script it or duplicate the walkthrough here. The
code only needs to assume these runtime facts:

- **Auth model:** GIS **token flow** via `google.accounts.oauth2.initTokenClient`. Public
  client — **no client secret**, **no redirect URI**.
- **Client type:** Web application. Access is gated by **Authorized JavaScript origins**
  (scheme + host, no path): production `https://<user>.github.io`, dev
  `http://localhost:<vitePort>`.
- **Scope (only):** `https://www.googleapis.com/auth/spreadsheets`. Sensitive scope; the
  app stays in **Testing** publishing status with a single test user.
- **Runtime inputs** (entered at first run, never committed): Applications Sheet ID,
  Applications tab name (optional, defaults to first tab), Reviews Sheet ID, OAuth Client ID.
- **Tokens:** access token ~1 hour, **held in memory only**, re-requested silently via
  `requestAccessToken({ prompt: '' })`; handle occasional interactive re-consent gracefully
  (show a Reconnect control, re-run pending work after re-auth).

## 6. Data model

### 6.1 Applications Sheet (read-only source)

- Assume **row 1 is the header row**; each subsequent row is one submission.
- Google Forms typically adds a `Timestamp` column first and an email column if the form
  collects emails. **Do not hard-code column names** beyond sensible defaults — resolve
  them from the Fields config (§6.3).
- Read the tab named in config (default: the first/only sheet).
- The set of columns can change if the Form is edited; the app must render whatever
  columns exist and not crash on new/removed columns.

### 6.2 Reviews Sheet (app-owned, read/write)

The app creates and maintains these tabs. On first run, if a tab or its header row is
missing, create it. Write by resolving column positions from the header row (never assume
fixed column letters).

**`Reviews` tab** — one row per applicant, keyed by email:

| Column           | Notes                                                            |
|------------------|------------------------------------------------------------------|
| `email`          | Lowercased, trimmed. The join key.                               |
| `stage`          | Must match a value in the `Stages` tab.                          |
| `offeredPosition`| Optional. Must match a value in the `Positions` tab when set.    |
| `note`           | Single running free-text note (not a log).                       |
| `updatedAt`      | ISO 8601 timestamp of the last change.                           |

An applicant present in Applications but **absent from `Reviews`** is treated as being in
the **default stage** (the first data row of `Stages`). This is how "not yet reviewed"
surfaces as work without needing a pre-created row.

**`Stages` tab** — ordered pipeline definition:

| Column          | Notes                                                             |
|-----------------|------------------------------------------------------------------|
| `stage`         | Display name, e.g. `To review`, `Reviewing`, `Shortlisted`, `Interview`, `Offer`, `Hired`, `Rejected`. |
| `isActionQueue` | `TRUE`/`FALSE`. `TRUE` stages are surfaced as work queues (§9).   |

- **Row order = pipeline order** and dashboard display order.
- **First data row = default stage** for un-reviewed applicants (make it an action queue,
  e.g. `To review` / `TRUE`).

**`Positions` tab** — open roles for the "offer" dropdown:

| Column     | Notes                          |
|------------|--------------------------------|
| `position` | One open position per row.     |

**`Fields` tab** — controls how Application columns render:

| Column   | Notes                                                                          |
|----------|--------------------------------------------------------------------------------|
| `column` | Exact header text from the Applications Sheet.                                  |
| `role`   | One of: `key` (email/join key), `name` (display name), `long` (long-form answer, featured prominently), or empty for a normal short field. |
| `show`   | `TRUE`/`FALSE` — whether to display this field at all.                          |
| `order`  | Optional integer for display ordering.                                          |

Rules: exactly one `key` and one `name` row. `long` may apply to multiple columns (there
are ~3 long-form answers, which are the meat of the application).

### 6.3 Seed defaults

On first-run wizard completion, seed `Stages` with a sensible default pipeline (with
`To review` as the default action-queue stage), leave `Positions` for the user to fill,
and pre-populate `Fields` from the detected Applications headers with best-guess roles
(`Timestamp`→short, an email-looking column→`key`, a name-looking column→`name`) for the
user to adjust in the wizard.

## 7. Local persistence (IndexedDB)

Store **only** on-device, never committed, never sent anywhere:

- **Config**: `applicationsSheetId`, `applicationsTabName`, `reviewsSheetId`,
  `oauthClientId`, `pollIntervalMinutes` (default 3).
- **Cached config tables** (Stages / Positions / Fields) for fast startup; refreshed from
  the sheet on each load.
- **Edit queue** (§8.4): pending writes awaiting flush.
- **Last-read snapshot** of Applications + Reviews so the app opens instantly and supports
  offline *viewing*.

The **OAuth access token is kept in memory only** — never persisted. None of the persisted
values are secrets (the client ID is public by design; sheet IDs are pointers protected by
Google auth), so on-device storage carries no meaningful exposure.

## 8. Data flow & sync

### 8.1 First-run setup wizard

- **Step 1 — IDs**: form to enter Applications Sheet ID, Applications tab name (optional,
  default first sheet), Reviews Sheet ID, OAuth Client ID. Persist to IndexedDB.
- **Connect**: trigger GIS sign-in (§8.5).
- **Step 2 — Config**: read the Applications header row and present a form to (a) map
  fields in the `Fields` tab (mark `key`, `name`, `long`, visibility, order), (b) edit the
  `Stages` list and their `isActionQueue` flags, (c) enter `Positions`. On submit, the app
  **writes these into the Reviews Sheet** config tabs (creating tabs as needed).
- Subsequent launches skip the wizard; config is read from the sheet (source of truth) and
  cached. Provide a **Settings** screen to re-open/edit any of the above later.

### 8.2 Reading

- Read Applications (values) and Reviews (values) via
  `spreadsheets.values.get` / `batchGet`.
- Parse header rows; build typed records keyed by column role.

### 8.3 Merge / join

- Left-join **Applications → Reviews** on lowercased/trimmed `email`.
- **Duplicate applications (same email): keep only the latest submission** by `Timestamp`
  (fall back to sheet row order if timestamps tie/absent). Earlier duplicates are ignored.
- An applicant with no Reviews row → synthesise a record at the **default stage**.

### 8.4 Writing (offline edit queue)

All mutations (stage change, note edit, set offered position) go through a queue:

1. **Optimistic**: apply to in-memory state immediately and enqueue an edit in IndexedDB
   as `{ id, email, changes: {stage?, note?, offeredPosition?}, ts }`.
2. **Coalesce**: collapse multiple queued edits for the same email into their latest
   values so replay is minimal and idempotent.
3. **Flush** when online and authenticated: for each email, locate its row in `Reviews`
   (build an email→rowIndex map from the last read); **update** it, or **append** a new row
   if none exists. Set `updatedAt`. Use `spreadsheets.values.update` /
   `...values.append` / `batchUpdate` as appropriate. On success, remove the queue entry.
4. **Conflict rule (single editor, last-write-wins):** queued local edits **take
   precedence** over polled Reviews data until they are confirmed flushed — polling must
   **not** clobber unsynced local edits.
5. Failures stay queued and retry on the next flush/online event.

### 8.5 Auth (GIS token flow)

- Use `google.accounts.oauth2.initTokenClient({ client_id, scope, callback })` with scope
  `https://www.googleapis.com/auth/spreadsheets`.
- Access token held in memory; attach as `Authorization: Bearer` to Sheets API calls.
- On `401`/expiry, request a fresh token (may prompt). Provide a visible **Reconnect**
  control. Expect ~weekly re-consent (Testing mode) and handle it gracefully.

### 8.6 Polling

- On load and every `pollIntervalMinutes` (default 3), re-read Applications and Reviews and
  re-merge, **respecting the queue-precedence rule** in §8.4(4).
- Pause polling when the tab is hidden/offline; resume on focus/online.

## 9. UI / UX requirements

### 9.1 Dashboard (home)

- **Summary**: count of applicants per stage, in pipeline order.
- **Action queues**: for every stage with `isActionQueue = TRUE`, a prominent work list of
  the applicants currently in it. The **default stage** (un-reviewed applicants) is an
  action queue, so "new applications to review" appears here automatically.
- Make it obvious at a glance where work is needed and let the user drill into a queue.

### 9.2 Applicant list / queues

- Sortable/filterable list, groupable by stage. Show display name, current stage, offered
  position (if any), and last-updated.
- Tapping an applicant opens the detail view.

### 9.3 Applicant detail (the core review surface)

- **Feature the long-form answers prominently** — full-width, generous type, near the top;
  they are the substance of the application.
- Render short fields compactly as label/value, honouring `Fields` visibility and order.
- **Note editor**: single running note, autosave (debounced) into the edit queue.
- **Stage selector**: dropdown from `Stages`.
- **Offered-position selector**: dropdown from `Positions` (relevant especially at offer
  stage; optional otherwise).
- Optional prev/next navigation to work through a queue efficiently.

### 9.4 Global states

- **Auth**: clear signed-out vs signed-in state; sign-in / reconnect controls.
- **Offline indicator** and a **pending-sync indicator** showing how many edits are queued;
  a subtle "synced" confirmation when the queue drains.
- Empty, loading, and error states for sheet reads/writes.
- **Responsive**: usable one-handed on a phone and comfortable on a laptop. Installable.

## 10. PWA / GitHub Pages specifics

- Configure Vite `base` to the repo subpath (e.g. `/<repo>/`) so assets and the service
  worker resolve correctly on GitHub Pages.
- Ensure the service worker **scope** matches that base path.
- Provide a manifest (name, icons, theme) so the app is installable on phone and laptop.
- Service worker caches the **app shell** for offline load; it must **not** cache Sheets
  API responses in a way that hides fresh data — data freshness comes from polling, and
  offline data comes from the IndexedDB snapshot, not from SW-cached API calls.
- Include a GitHub Actions workflow to build and deploy to Pages on push to `main`.

## 11. Suggested project structure

```
src/
  auth/            # GIS token client, token state
  sheets/          # Sheets API read/write, header/column resolution, row mapping
  data/            # merge/join, duplicate resolution, types
  store/           # in-memory state + IndexedDB persistence, edit queue, sync loop
  config/          # config tab read/write, first-run wizard logic
  ui/
    dashboard/
    applicants/    # list + detail
    settings/
    components/
  pwa/             # manifest, sw registration
  main.tsx
README.md          # human setup guide (§5)
```

## 12. Coding conventions

- TypeScript **strict**; no `any` in domain code. Model the Sheet schemas as explicit
  types and validate/parse at the boundary (a small runtime validator is welcome).
- Keep Sheets access in one module; the rest of the app talks to a typed data layer, not
  raw API shapes.
- Pure, testable merge/queue logic (duplicate resolution, coalescing, queue-precedence) —
  include unit tests for these.
- No secrets or IDs in source, tests, or fixtures. Use placeholder IDs in any examples.
- Graceful degradation: never crash on unexpected/missing columns; surface a friendly
  message and keep working with what's present.

## 13. Out of scope (v1) / future

- **Google Forms API** field-type auto-detection (`forms.get`) to auto-mark long-form
  fields. Deliberately deferred: it needs a second scope (`forms.body.readonly`), a
  separate Form ID, and title-based column matching. `Fields`-tab config covers this for
  now. Leave a note/hook for adding it later.
- Multi-user / attribution, comment threads, email sending, analytics, publishing the
  OAuth app for non-test users.

## 14. Acceptance criteria

1. Fresh clone contains **no** IDs/secrets/PII; app configures entirely at runtime.
2. First run: user enters 3 IDs, connects Google, completes the config wizard; the app
   writes `Reviews`, `Stages`, `Positions`, `Fields` tabs into the Reviews Sheet.
3. Applications render readably; the ~3 long-form answers are prominently featured.
4. User can set stage, offered position, and edit a running note per applicant; changes
   persist to the `Reviews` tab.
5. New Form submissions appear after the next poll without a manual restart.
6. Duplicate emails collapse to the latest submission only.
7. Edits made offline are queued and replayed correctly on reconnect; polling never
   clobbers unsynced edits.
8. Dashboard shows per-stage counts and action-queue worklists; un-reviewed applicants
   appear in the default action queue.
9. Installable and usable on both phone and laptop.
10. Only Google Sheets + GIS are contacted; no other network destinations.
