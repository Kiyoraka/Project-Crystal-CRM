# Crystal CRM — Hardcoded Prototype

Software Version: 0.1.0 (hardcoded demo)

## Description
Clickable prototype of the Crystal Inc lead system, rebuilt in plain HTML, CSS and JavaScript from the Claude Design files (v2 Lite brief, RM3,000 scope). No framework, no build step, no backend.

- **Surface A (public):** `index.html` landing page and `semak.html`, the 10-step qualification form that scores each lead HOT / WARM / COLD.
- **Surface B (CRM):** `crm/` with login, dashboard, leads, lead detail, pipeline (drag and drop), analytics, settings (scoring weights and lists) and users.

TNEX Malaysia Sdn Bhd internal ticket.

## How to open
Double-click `index.html` (works from `file://`), or serve the folder:

```
npx serve .
```

## Demo accounts
On `crm/login.html`, use the demo chips:

| Role  | User          | Sees |
|-------|---------------|------|
| Owner | Aiman Hakim   | All leads, dashboard, scoring settings |
| Sales | Farid Mansor  | Only assigned leads, "Hari saya" dashboard |
| Admin | Hana Yusof    | All leads, scoring + lists settings, users |

## Data
- Seed data lives in `assets/js/data.js` (16 leads scored by the real engine).
- Everything you change is saved in the browser's `localStorage` (`crystal.*` keys). A form submitted on `semak.html` appears as a new lead in the CRM.
- **Reset demo** (user menu in the CRM top bar) restores the seed.
- The demo clock is frozen at **4 Okt 2026 15:00 MYT** so "Due hari ini" and "Tertunggak" stay meaningful.
- `?offline=1` on any CRM page shows the offline banner and blocks write actions. `semak.html?debug=1` shows the scoring payload on the success screen.

## Structure
```
index.html, semak.html      Surface A
crm/*.html                  Surface B
assets/css/                 tokens, base, landing, semak, crm
assets/js/                  data, store, ui, shell + one script per page
```
