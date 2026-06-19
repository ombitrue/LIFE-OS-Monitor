# LIFE.OS Monitor

LIFE.OS Monitor is a browser-only personal command deck for tracking quests, daily habits, focus sessions, XP, notes, and lightweight environment status. It is a simple local React project: there is no Vite configuration, no backend server, and no database.

## What this app does

- **Quest deck:** Create, complete, edit, delete, sort, and filter ranked tasks.
- **Urgency scoring:** Combines rank and due date pressure to surface the highest reward targets.
- **XP and levels:** Awards or removes XP when quests are completed or reopened.
- **Daily protocols:** Track repeatable habits and reset completion state once per day.
- **Pomodoro focus field:** Run 25-minute work sessions and 5-minute breaks, with optional browser audio notification.
- **Neural log:** Keep an auto-saved journal or scratchpad.
- **Themes and status:** Switch accent colors, view a live clock, and optionally show geolocation-based weather.

## Requirements

- Node.js 18 or newer.
- npm 9 or newer.
- A modern browser with JavaScript enabled.

## Install from a fresh clone

```bash
git clone <repo-url>
cd LIFE-OS-Monitor
npm install
```

## Launch locally

```bash
npm start
```

The local server prints a URL, usually `http://localhost:4173/`. Open that URL in your browser. Stop it with `Ctrl+C`.
codex/rework-and-patch-repository-for-functionality-j4eai0

> Source changes are not hot-reloaded. Stop and re-run `npm start` after editing files.

## Build a static local bundle

```bash
npm run build
```

This writes the static browser app to `dist/`. The output includes `dist/index.html`, `dist/main.js`, `dist/main.css`, sourcemaps, and copied public assets.

## Type-check only

```bash
npm run typecheck
```



> Source changes are not hot-reloaded. Stop and re-run `npm start` after editing files.

## Build a static local bundle

```bash
npm run build
```

This writes the static browser app to `dist/`. The output includes `dist/index.html`, `dist/main.js`, `dist/main.css`, sourcemaps, and copied public assets.

## Type-check only

```bash
npm run typecheck
```

main
Use this when you want TypeScript validation without generating a browser bundle.

## How local launch works

- `npm start` runs `scripts/dev-server.mjs`.
- The script bundles `src/main.tsx` with esbuild into `dist/main.js`.
- The script copies `index.html` and `public/` into `dist/`.
- A small Node HTTP server serves `dist/` at `http://localhost:4173/`.
- `index.html` loads `/main.js`; it does not reference Vite or `/src/main.tsx`.

 codex/rework-and-patch-repository-for-functionality-j4eai0

## Backup, import, and reset local data

LIFE.OS data lives in browser `localStorage`, so the browser profile controls where the data exists. Use the in-app **DATA VAULT** panel before changing browsers, clearing site data, or moving to another machine.

### Export a backup

1. Open the app with `npm start`.
2. Find the **DATA VAULT** panel.
3. Select **Export JSON**.
4. Save the downloaded `life-os-backup-YYYY-MM-DD.json` file somewhere safe.

The backup includes quests, habits, notes, XP, streak, theme, and the habit reset date.

### Import a backup

1. Open the app in the browser where you want the data restored.
2. Find the **DATA VAULT** panel.
3. Select **Import JSON**.
4. Choose a `life-os-monitor.backup.v1` JSON file created by LIFE.OS.
5. Review quests and habits after import before continuing work.

Import replaces the active in-browser state with the backup contents. Export the current browser state first if you may need it later.

### Reset local data

1. Export a backup first if you need to preserve the current state.
2. Select **Reset Local Data** in the **DATA VAULT** panel.
3. Confirm the browser prompt.

Reset clears LIFE.OS `l2_*` keys from the current browser and returns the app to an empty local state. You can recover previous data only by importing a backup JSON file.

## Data and permissions

- LIFE.OS stores data in browser `localStorage` using `l2_*` keys. The in-app DATA VAULT can export, import, or reset those keys intentionally.

## Data and permissions

- LIFE.OS stores data in browser `localStorage` using `l2_*` keys.
main
- No backend server or database is required.
- Weather is optional. If the browser blocks geolocation or the weather request fails, the app continues running and shows the scanning fallback state.
- Pomodoro audio is optional. Browsers may block audio until the user interacts with the page.

## File labels / project map

| Path | Label | Purpose |
| --- | --- | --- |
| `index.html` | Static browser entry document | Defines the root element, favicon, metadata, and local bundle script. |
| `src/main.tsx` | React bootstrap | Mounts the React app and imports global styles. |
codex/rework-and-patch-repository-for-functionality-j4eai0
| `src/App.tsx` | LIFE.OS app shell | Contains dashboard state, local persistence, data vault export/import/reset, scoring, Pomodoro logic, and UI panels. |

| `src/App.tsx` | LIFE.OS app shell | Contains dashboard state, local persistence, scoring, Pomodoro logic, and UI panels. |
 main
| `src/index.css` | Global stylesheet | Provides the app reset, dark baseline, sizing, and focus states. |
| `src/app-env.d.ts` | Browser type extensions | Adds the WebKit audio fallback type. |
| `scripts/build.mjs` | Production build script | Creates the static `dist/` bundle without Vite. |
| `scripts/dev-server.mjs` | Local launch server | Rebuilds the static app and serves it locally with Node. |
| `public/favicon.svg` | App favicon | Browser tab icon for LIFE.OS Monitor. |
| `package.json` | npm manifest | Defines package metadata, dependencies, and runnable scripts. |
| `package-lock.json` | npm lockfile | Pins exact dependency versions for reproducible installs. |
| `tsconfig.json` | TypeScript config | Type-checks React/browser source files. |

## Cleaned repository notes

Unused starter template assets and Vite-specific files were removed so the repository only keeps files used by the local React app or its build/launch pipeline.
