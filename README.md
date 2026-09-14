# Fahrizal & Salsa

An interactive memory web page for Fahrizal & Salsa's anniversary (together since November 29, 2025).
Built as a **Vite + Three.js** project so that Three.js is bundled directly into the build — ensuring the 3D model does not depend on external CDNs and renders reliably across all browsers.

## Stack

- [Vite](https://vitejs.dev) — dev server & build tool
- [Three.js](https://threejs.org) — renders star galaxy & 3D celestial astrolabe
- `vite-plugin-singlefile` — compiles production into a **single standalone HTML file** (all JS/CSS inlined), making the output directly openable with a double-click or hostable anywhere without extra build steps.

## Structure

```
index.html       # page markup (hero, timeline, countdown, letter)
src/main.js      # logic: countdown, reveal on scroll, particle galaxy + 3D celestial astrolabe (Three.js)
src/style.css    # all styling
src/photos/      # 5 selected & optimized photos used in each timeline section
src/gallery/     # photos displayed in the memory gallery section
```

The `src/image/` folder (if present on your machine) is used to store raw original photos (large HEIC/JPG files) — it is intentionally gitignored. If you want to replace any photo in `src/photos/`, simply process the new photo (convert HEIC → JPG if needed, resize to max ~1400px on the longest edge) and overwrite the corresponding file in `src/photos/`.

## Running Locally

```bash
npm install
npm run dev       # opens http://localhost:5173 with hot-reload on every edit
```

## Production Build

```bash
npm run build      # output in dist/index.html — 1 file, ready to deploy
npm run preview     # preview build output locally
```

`dist/index.html` is a single file bundled with all code (including Three.js) — simply upload to any static hosting service (Vercel, Netlify, GitHub Pages, etc.), or open directly in your browser.

## Personalization

The timeline stories in `index.html` are written to match the photos in `src/photos/`, but can be further customized anytime. The countdown and "together since" dates can be adjusted in `src/main.js` (`JADIAN_DATE` and `TARGET_ANNIV` variables).
