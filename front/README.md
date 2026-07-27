# NexusCRM — Frontend

Next.js 16 (App Router) frontend for [NexusCRM](../README.md) — the pipeline board, clients, tasks, analytics, and settings UI.

> For deployment (Vercel) and the project overview, see the [root README](../README.md).

## Local development

```bash
cp .env.example .env   # set NEXT_PUBLIC_API_URL to your running backend
npm install
npm run dev            # → http://localhost:3000
```

Requires the [backend](../back) running (or pointed at) for anything beyond the login screen to work.

## Notable structure

```
app/              Routes (App Router) — one folder per page, grouped by (auth) / (dashboard)
features/         Feature-sliced modules (deals, clients, tasks, analytics, ...) —
                  each owns its components, hooks, service calls, and Zod schemas
components/       Shared UI primitives (components/ui), layout chrome, and the
                  brand mark (components/brand)
lib/              API client, Zustand stores, the i18n system (lib/i18n), and utils
```

## Design system

Colors, typography, radius, and shadows are all CSS custom properties defined once in
[`app/globals.css`](./app/globals.css) — see the comment block at the top of that file
for the design rationale (the "Momentum" concept: the pipeline's own stage-color scale
doubles as the brand gradient).
