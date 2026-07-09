# Arcade Hiring Review

An installable Progressive Web App for a single reviewer to turn a Google Forms →
Google Sheet job application feed into a readable review + hiring-pipeline tracker.

No backend. The only remote services are the **Google Sheets API** and **Google Identity
Services** for auth — everything else runs client-side. All persistent state lives in your
own Google Sheets; nothing is committed to this repo, and nothing is sent anywhere else.
See [CLAUDE.md](CLAUDE.md) for the full design spec.

## One-time human setup

Before running the app you need a Google Cloud project, an OAuth Client ID, and two
spreadsheets (your existing Applications sheet + a new Reviews sheet). Follow
**[GOOGLE_CLOUD_SETUP.md](GOOGLE_CLOUD_SETUP.md)** — takes about 10–15 minutes. You'll end
up with four values (Applications Sheet ID, Applications tab name, Reviews Sheet ID, OAuth
Client ID) to paste into the app's first-run setup screen. None of these are secrets, and
none are committed here — they're entered at runtime and stored only on your device.

## Development

Node is managed via [fnm](https://github.com/Schniz/fnm):

```powershell
fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
```

Then:

```sh
npm install
npm run dev        # start the dev server (http://localhost:5173)
npm run test       # run unit tests
npm run typecheck  # strict TypeScript project build check
npm run build       # production build (used by CI, not usually needed locally)
```

Add `http://localhost:5173` (or whatever port `npm run dev` prints) as an Authorized
JavaScript origin on your OAuth client — see GOOGLE_CLOUD_SETUP.md Step 6.

## Deployment

Pushing to `main` builds and deploys to GitHub Pages via
[.github/workflows/deploy.yml](.github/workflows/deploy.yml). Add your Pages origin
(`https://<username>.github.io`) as an Authorized JavaScript origin on the OAuth client too.

## Project structure

```
src/
  auth/       # Google Identity Services token client
  sheets/     # Sheets API read/write, header/column resolution
  data/       # merge/join, duplicate resolution, types (pure, unit-tested)
  store/      # in-memory state, IndexedDB persistence, edit queue, sync loop
  config/     # config tab read/write, first-run wizard logic
  ui/         # dashboard, applicant list/detail, settings
  pwa/        # manifest, service worker registration
```
