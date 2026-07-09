# Google Cloud Setup — Arcade Hiring Review PWA

**Goal:** one-time configuration so the PWA can read and write *your* Google Sheets
directly from the browser. Takes ~10–15 minutes. You finish with **one value to paste into
the app: an OAuth Client ID** (plus your two spreadsheet IDs).

**Do this with the Google account that owns the sheets.** A personal Gmail account is fine.

> **UI note (2026):** Since 2024 the old "OAuth consent screen" menu is gone. It now lives
> under **Google Auth Platform**, split into four tabs: **Branding**, **Audience**,
> **Data Access**, **Clients**. Older tutorials that say "OAuth consent screen" mean this.
> The Google Auth Platform section only appears **after** you've enabled an API (Step 2).

---

## Step 1 — Create a project

1. Go to <https://console.cloud.google.com>.
2. Top bar → **project picker** → **New Project**.
3. Name it something like `arcade-hiring`. No billing account or organisation is needed.
4. Click **Create**, then **select the new project** in the picker (easy to forget — if you
   skip it, later steps configure the wrong project).

## Step 2 — Enable the Google Sheets API

1. **APIs & Services → Library** (direct: <https://console.cloud.google.com/apis/library/sheets.googleapis.com>).
2. Search **"Google Sheets API"** → open it → **Enable**.

This is also what makes the **Google Auth Platform** menu appear.

## Step 3 — Configure Google Auth Platform (the consent screen)

1. **APIs & Services → Google Auth Platform** (direct: <https://console.cloud.google.com/auth/branding>).
2. If you see "Google Auth platform not configured yet", click **Get started**. Complete the
   short wizard:
   - **App Information** — App name (e.g. `Arcade Hiring Review`) and your support email.
   - **Audience** — choose **External**. ⚠️ This can't be changed later without a new
     project. (Internal isn't offered on personal Gmail anyway.)
   - **Contact Information** — an email for Google policy notices.
   - **Finish** — agree to the User Data Policy → **Continue**.
3. **Leave the publishing status as "Testing".** Do **not** click "Publish app". Testing
   mode keeps you out of Google's verification process for the sensitive Sheets scope.

## Step 4 — Add yourself as a test user

1. **Google Auth Platform → Audience** (direct: <https://console.cloud.google.com/auth/audience>).
2. Under **Test users → Add users**, add the Google address you'll sign in with → **Save**.

While the app is in Testing, **only listed test users can sign in.**

## Step 5 — (Optional) declare the scope

1. **Google Auth Platform → Data Access → Add or remove scopes**.
2. Add `https://www.googleapis.com/auth/spreadsheets` → **Update**.

Optional in Testing (the app requests this scope at runtime regardless), but it documents
intent. It's a **sensitive** scope — fine in Testing; it would only trigger verification if
you ever published to Production.

## Step 6 — Create the OAuth Client ID

1. **Google Auth Platform → Clients → Create client** (direct: <https://console.cloud.google.com/auth/clients>).
2. **Application type:** **Web application**.
3. **Name:** e.g. `arcade-hiring-web`.
4. **Authorized JavaScript origins** — click **Add URI** for each. An origin is
   **scheme + host only — no path, no trailing slash**:
   - `https://<your-github-username>.github.io`  ← your GitHub Pages origin
   - `http://localhost:5173`  ← local development (match the port `npm run dev` prints; Vite
     defaults to 5173)
5. **Authorized redirect URIs** — **leave empty.** This app uses the browser **token flow**,
   which validates the JavaScript origin, not a redirect URI.
6. **Create** → copy the **Client ID** (ends in `.apps.googleusercontent.com`). This is the
   value you paste into the app's first-run setup. A client secret is also shown — **you
   don't need it**; browser apps don't use one.

**Gotchas**
- For a GitHub *project* site served at `https://user.github.io/repo/`, the origin is still
  `https://user.github.io` — **no `/repo`, no trailing slash**.
- Origin/client changes can take **5 minutes to a few hours** to propagate. If you get
  `origin_mismatch` right after editing, wait and retry before assuming something's wrong.
- If you later use a **custom domain**, add that origin too.
- Google auto-deletes OAuth clients after a long stretch of no use (it emails ~30 days
  first). Normal use prevents this.

## Step 7 — Prepare the spreadsheets

1. **Reviews sheet:** in Google Sheets (same account), create a **blank spreadsheet**, name
   it e.g. `Arcade Hiring — Reviews`. The app creates its tabs on first run.
2. Copy each spreadsheet **ID** from its URL — the long string between `/d/` and `/edit`:
   `https://docs.google.com/spreadsheets/d/`**`THIS_IS_THE_ID`**`/edit`
3. Also grab the **Applications sheet ID** — the responses sheet linked to your Google Form.

---

## What you paste into the app (first run)

| Field                     | Where it came from            |
|---------------------------|-------------------------------|
| Applications Sheet ID     | Step 7 (the Form's sheet)     |
| Applications tab name     | optional — defaults to first tab |
| Reviews Sheet ID          | Step 7 (the blank sheet)      |
| OAuth Client ID           | Step 6                        |

None of these are secrets, and none are committed to the repo — they live only on your
device.

## What to expect at sign-in

- The first time, Google shows a consent screen (and, because the app is unverified/Testing,
  a "Google hasn't verified this app" notice — expected; proceed as the test user).
- Access tokens last about **an hour** and are refreshed **silently** in the background.
- You'll see the consent popup again only occasionally — on a new device or browser, after
  clearing cookies, or when the Testing-mode grant lapses (roughly weekly). It's the same
  account each time; just click through.

## Quick checklist

- [ ] Project created and selected
- [ ] Google Sheets API enabled
- [ ] Google Auth Platform configured — **External**, left in **Testing**
- [ ] Your account added under **Test users**
- [ ] OAuth **Web application** client created
- [ ] JavaScript origins added (GitHub Pages + localhost); **redirect URIs empty**
- [ ] Client ID copied
- [ ] Reviews sheet created; Reviews + Applications sheet IDs copied
