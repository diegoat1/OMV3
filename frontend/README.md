# Omega Medicina — Frontend

Vite + React + TypeScript app. Targets desktop, mobile web, and (eventually) native Android/iOS via Capacitor.

## Setup

```bash
npm install        # first time only
npm run dev        # http://localhost:5173 — proxies /api to http://localhost:8000
```

The backend Flask API must be running on port 8000 (see root `CLAUDE.md`).

## Build

```bash
npm run build      # → dist/
npm run preview    # serves the built dist/ locally for verification
```

## Project layout

```
src/
├── components/     ← Sidebar, Topbar, Icon, atoms (KPI, Avatar, Chip, Progress)
├── screens/        ← Login, PatientHome, Placeholder (one per route)
├── services/       ← apiClient (fetch wrapper + token), authService
├── styles/         ← desktop.css (design system), responsive.css (breakpoints)
├── types/          ← api.ts (Role, AuthUser, ApiResponse<T>)
├── App.tsx         ← root: auth guard + state-based screen routing
└── main.tsx        ← entry point

_design-reference/  ← Original Claude Design mockups (HTML/JSX/CSS) — NOT built, reference only
public/assets/      ← logos, static images
```

## API integration

- Dev: `/api/*` is proxied by Vite to `http://localhost:8000` (no CORS hassle).
- Prod: set `VITE_API_URL` (defaults to the PythonAnywhere URL).
- Token stored in `localStorage` under `omd.token`.
- All requests use the v3 envelope `{ success, data, meta }`.

## Roadmap

- [x] Shell (Sidebar + Topbar + role switcher)
- [x] Login → `/api/v3/auth/login`
- [x] Bootstrap from existing token (`/api/v3/auth/me`)
- [x] Responsive breakpoints (desktop, tablet, mobile portrait + landscape)
- [ ] Port screens from `_design-reference/` (patient home, doctor panel, etc.)
- [ ] Wire each screen to its v3 endpoint
- [ ] Capacitor integration (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`)
