# Blade & Block — Rowing Training Planner

A single-user PWA for planning erg, on-water, weights, flexibility, running
and cycling sessions across adjustable **training blocks**, with a monthly
calendar as the main view, 500m/1k/2k test tracking, and a countdown to
race day (currently set to **8 Sept 2027**).

Everything is stored locally in the browser via **IndexedDB** — there is no
backend, no login, and no data ever leaves your device. This is why the same
codebase can run either as a static Netlify site or as a local Ubuntu Snap.

---

## Concepts

- **Block** — a multi-week phase (Base Building, Build, Race Prep, Taper,
  Recovery, or Custom). Gives the calendar its background colour band.
  Drag its start/end dates in the Blocks screen any time — e.g. to push a
  Build phase back a week because of weather — without touching the
  sessions inside it.
- **Session** — a single activity on one date: Erg, On Water, Weights,
  Flexibility, Running, Cycling, or Test. Click any day in the Month view
  to add or edit sessions for that day. Status cycles Planned → Done →
  Skipped by clicking the circle icon.
- **Test** — a session type for your monthly 500m / 1k / 2k benchmarks.
  Mark it Done and enter a result time to have it appear in the Tests
  screen, which shows your best, latest, and a trend sparkline per distance.
- **Backup** — Settings → Export backup (.json) / Import backup. Use this to
  move your plan between the Netlify version and the Snap version, or just
  to keep a safety copy.

---

## Option A — Deploy to Netlify

1. In Netlify: **Add new site → Deploy manually**, and drag in this entire
   folder (or connect it as a Git repo and let Netlify build from it —
   there's no build step, `netlify.toml` just sets `publish = "."`).
2. Once deployed, open the site URL. Your browser will offer to
   **install** it as an app (or use the browser menu → "Install app" /
   "Add to Home Screen").
3. Data is stored per-browser via IndexedDB, so it stays on whichever
   device/browser you use it from. Use Export/Import if you switch
   browsers or devices.

No environment variables, functions, or database are needed.

---

## Option B — Package as an Ubuntu Snap (fully local, no Netlify needed)

The `snap/` folder contains a `snapcraft.yaml` that bundles the same static
files plus a tiny zero-dependency Node server (`server/server.js`) which
serves the app on `http://127.0.0.1:8743` and opens it in your default
browser.

### Build it

```bash
sudo snap install snapcraft --classic
cd rowing-planner
snapcraft
```

This produces `blade-and-block_1.0.0_amd64.snap`.

### Install and run

```bash
sudo snap install blade-and-block_1.0.0_amd64.snap --dangerous
blade-and-block
```

This starts the local server and opens the app in your browser. Data is
stored in that browser's IndexedDB, entirely on your machine — no network
access is required for normal use (the `network`/`network-bind` plugs are
only for serving `localhost`).

To stop it, close the terminal it's running in or `killall node`. You can
change the port with `PORT=9000 blade-and-block`.

### Uninstall

```bash
sudo snap remove blade-and-block
```

Note: uninstalling the snap does **not** delete your data — that lives in
your browser's IndexedDB for `127.0.0.1:8743`, not inside the snap. Export a
backup first if you want to move it elsewhere before clearing browser data.

---

## File structure

```
index.html            Main shell — left nav, month view, blocks/tests/settings
css/                   Bootstrap 5, Bootstrap Icons, self-hosted fonts, styles.css
js/
  db.js                IndexedDB wrapper (blocks / sessions / settings stores)
  constants.js          Session types, block colour palette, date helpers
  countdown.js          Race-day countdown (edit target date in Settings)
  blocks.js             Training block CRUD + list view
  sessions.js            Session CRUD (planned + actuals + test results)
  calendar.js            Month grid rendering + day detail panel
  tests.js               500m/1k/2k trend view with sparklines
  app.js                  Navigation, settings, export/import wiring
manifest.json           PWA manifest
service-worker.js       Offline caching of the app shell
netlify.toml            Netlify deploy config
snap/snapcraft.yaml     Snap packaging recipe
server/server.js        Static server used only inside the Snap build
```

## Changing the race date later

Settings → Race day countdown. This updates the date shown in the sidebar
countdown immediately and persists it in IndexedDB.
