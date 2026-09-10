# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Abneg@tion is a French-language career development sprint platform built by Exosquelette. Users authenticate, pay 49€ via Stripe, then go through a multi-step sprint that uses Claude AI to analyze their CV against job offers and extract proof of value, hidden KPIs, and negotiation leverage.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm start          # Start production server
npm test           # Run the 53 tests in tests/
```

## Environment

Requires `.env.local` with keys for Supabase, Stripe, Anthropic, and app URL. See `.env.example` for the template.

## Architecture

**Next.js 14 App Router** with vanilla JavaScript (no TypeScript). Path aliases via `@/*` (jsconfig.json).

### User Flow

Auth (`/auth`) → Paywall check → Stripe checkout (`/api/checkout`) → Webhook confirms payment (`/api/webhook`) → Sprint UI loads → AI scan (`/api/scan`) → Sprint state auto-saves to Supabase every 2s.

### API Routes (`app/api/`)

- **`scan/route.js`** — POST endpoint. Sends CV + job offers to Claude Sonnet 4 (max 3000 chars each, 1500 max tokens). Returns extracted bricks, KPIs, skills, gaps.
- **`checkout/route.js`** — Creates a Stripe checkout session for the 49€ product.
- **`webhook/route.js`** — Receives Stripe `checkout.session.completed` events, marks user as `paid` in Supabase profiles table.

### Pages (`app/`)

- **`page.js`** — Redirects to `/sprint`.
- **`auth/page.js`** — Email/password login and signup via Supabase Auth.
- **`sprint/page.js`** — Server-side auth check, loads/saves sprint state, renders paywall or Sprint component. Auto-save uses a 2-second debounce.

### Sprint Module (19 files)

`Sprint.jsx` (429 lines) is the orchestrator. The former monolithic component has been split into:

- **`components/sprint/`** — 7 React components (UI for each sprint step).
- **`lib/sprint/`** — 12 pure function modules (scoring, validation, KPI logic, report generation, etc.).

### Content Filters

Three named filters apply to generated output:
- **Méroé** — style filter.
- **Marie Hook** — hook/accroche filter.
- **Luis Enrique** — audit filter.

### Libraries (`lib/`)

- **`supabase.js`** — Exports two Supabase clients: `createClient()` for browser-side and `createServerClient()` for server-side (uses `SUPABASE_SERVICE_ROLE_KEY`).
- **`stripe.js`** — Stripe client singleton.
- **`sprint-db.js`** — `loadSprint()`, `saveSprint()`, `checkPaid()` utilities for Supabase operations.

### Database (`supabase/schema.sql`)

Three tables with row-level security:
- **`profiles`** — User metadata + `paid` boolean. Auto-created on signup via trigger.
- **`sprints`** — Stores entire sprint state as JSONB. One row per user.
- **`payments`** — Stripe transaction log.

## Key Conventions

- **Langue française obligatoire** dans toutes les strings user-facing. Maintenir les accents français.
- Styling is inline CSS objects (no CSS framework). Dark theme (`#0a0a1a` background, `#e94560` accent red, Inter font).
- React Strict Mode is disabled (`next.config.js`).
- Deployed on Vercel. Stripe webhook only works in production (not localhost).
