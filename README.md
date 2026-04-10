# Vigilo Dashboard Workspace

This workspace contains a Next.js dashboard frontend and a FastAPI backend for live placement-risk monitoring.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- FastAPI (Python backend in `vigilo-backend`)
- Supabase data store

## Active frontend structure

```text
app/
  dashboard/
    page.tsx
    analytics/page.tsx
    segmentation/page.tsx
    students/page.tsx
    risk-alerts/page.tsx
    interventions/page.tsx
    nudges/page.tsx
    settings/page.tsx
    help/page.tsx
  api/
    dashboard/live/route.ts   # Aggregates live backend data for dashboard pages
  globals.css
  layout.tsx
  page.tsx

components/
  dashboard/
  ui/
  tpc-layout.tsx

lib/
  constants.ts
  dashboard/
    dashboard-view.ts
    use-live-dashboard-data.ts
  server/
    backend-client.ts

vigilo-backend/
  app/
    routers/
    auth/
    services/
```

## Live data flow

1. Dashboard pages call `useLiveDashboardData`.
2. The hook fetches `GET /api/dashboard/live`.
3. The route aggregates backend endpoints under `vigilo-backend` (`/api/v1/analytics`, `/students`, `/alerts`, `/interventions`, `/notifications`).
4. UI receives mapped, chart-ready datasets with fallback constants if backend is unavailable.

## Local run

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd vigilo-backend
uvicorn app.main:app --reload
```

Optional environment variable for frontend backend target:

- `VIGILO_BACKEND_URL` (default: `http://127.0.0.1:8000`)

## Scripts

- `npm run dev` - Start frontend dev server
- `npm run build` - Build frontend for production
- `npm run start` - Run production frontend
- `npm run lint` - Run ESLint

## Notes on legacy folders

- `src/` and `legacy-src/` exist from earlier iterations and merges.
- The active runtime and TypeScript include paths are rooted at `app/`, `components/`, and `lib/`.
