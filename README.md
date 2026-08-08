# Lawn Journal

A personal, single-user lawn care journal PWA. Tracks mow/treatment history,
yard zones, a bentgrass (mesotrione) treatment tracker, a nitrogen budget,
a seasonal plan, and live weather (Open-Meteo) including soil temperature.

No login, no backend — everything is stored in `localStorage` on your
device. Deployed as a static site to GitHub Pages and installable to your
phone's home screen as a PWA.

## Stack

- React + Vite
- `vite-plugin-pwa` for offline support and installability
- `react-router-dom` (`HashRouter`, so it works on GitHub Pages without server rewrites)
- `localStorage` for all data persistence
- [Open-Meteo](https://open-meteo.com/) for weather + soil temperature (no API key)
- [Zippopotam.us](https://api.zippopotam.us/) for zip → lat/long geocoding (no API key)

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview   # serve the production build locally
```

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the app
and publishes `dist/` to GitHub Pages via GitHub's official Pages actions.

**One-time setup in the GitHub repo:** go to **Settings → Pages** and set
**Source** to **GitHub Actions**. After that, every push to `main` deploys
automatically. The app will be available at:

```
https://<owner>.github.io/Lawn-Care-Journal/
```

The Vite `base` and the PWA manifest's `start_url`/`scope` are set to
`/Lawn-Care-Journal/` to match this path — if you rename the repo, update
those in `vite.config.js` to match.

## Installing to your phone

Open the deployed URL in Safari (iOS) or Chrome (Android) and use
"Add to Home Screen" — the app installs with its own icon and runs in
standalone mode (no browser chrome).

## First-time setup in the app

Open **Settings** and enter your zip code (or lat/long) so the Weather tab
and home screen mow-conditions card can fetch local weather and soil
temperature. You can also tune the bentgrass season application cap and
the nitrogen annual cap there.

## Backup

Since data lives only in this browser's `localStorage`, use
**Settings → Backup → Export** periodically to save a JSON snapshot, and
**Import** to restore it (e.g. after clearing browser data or switching
devices).
