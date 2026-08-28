# Fahrizal & Salsa

Halaman web kenangan interaktif untuk anniversary Fahrizal & Salsa (jadian 29 November 2025).
Dibangun sebagai project **Vite + Three.js** (bukan lagi 1 file HTML biasa) supaya Three.js
ikut ter-bundle langsung ke dalam build — jadi model 3D-nya nggak bergantung ke CDN eksternal
dan pasti muncul di browser manapun.

## Stack

- [Vite](https://vitejs.dev) — dev server & build tool
- [Three.js](https://threejs.org) — render galaksi bintang & model hati 3D
- `vite-plugin-singlefile` — build production-nya dijadiin **1 file HTML tunggal** (semua JS/CSS
  ter-inline), jadi hasil akhirnya tetap bisa langsung dibuka dobel klik atau di-hosting di mana
  saja tanpa build step tambahan.

## Struktur

```
index.html       # markup halaman (hero, timeline, countdown, surat)
src/main.js      # logic: countdown, reveal on scroll, galaksi partikel + model hati 3D (Three.js)
src/style.css    # semua styling
```

## Menjalankan di lokal

```bash
npm install
npm run dev       # buka http://localhost:5173, auto-reload tiap edit
```

## Build untuk production

```bash
npm run build      # hasil di dist/index.html — 1 file, siap deploy
npm run preview     # cek hasil build secara lokal
```

`dist/index.html` adalah file tunggal yang sudah membawa semua kode (termasuk Three.js) di
dalamnya — tinggal upload ke hosting statis mana saja (Vercel, Netlify, GitHub Pages, dll),
atau dibuka langsung di browser.

## Konten yang masih perlu diisi

Cari `[ISI DI SINI]` di `index.html` — itu placeholder foto & cerita timeline yang masih perlu
diganti dengan konten asli. Tanggal countdown & "sudah berapa hari bareng" bisa diubah di
`src/main.js` (variabel `JADIAN_DATE` dan `TARGET_ANNIV`).
