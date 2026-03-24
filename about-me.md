# About Me

## Who I am

Jean-Mikaël Bigeat. Solo founder, Abneg@tion (société : Exosquelette). Paris. Zero technical background. I build a SaaS career positioning tool by writing specs in Claude.ai and implementing via Claude Code. L'IA code, je décide.

CDI at Api Restauration (Workplace Hospitality) in parallel. Abneg@tion is a side project turned product.

## What I do

Abneg@tion extracts professional proof from candidates, stress-tests it across 4 axes (Blindage), and generates calibrated deliverables (CV, LinkedIn posts, contact scripts, interview prep, salary negotiation). The candidate sees ATMT (Accroche, Tension, Méthode, Transfert), never the internal 4-case Blindage.

Business model B2C2B: free Éclaireur (job offer analysis) → free Forge (proof extraction + density scoring) → subscription ~19€/month (calibrated deliverables + Brew weekly cockpit) → opt-in visibility to recruitment firms.

10 roles across 4 sectors. 169 smoke tests. 21 shipped chantiers. Domain: abnegation.eu.

## How I work

- I write specs and prompts in markdown via Claude.ai (strategy, arbitrage, architecture decisions).
- I copy prompts to Claude Code for implementation.
- I review every diff before approving. One commit at a time. Co-Authored-By: Claude.
- I approve Claude Code commands one by one (option 1, never option 2).
- I use three mental models (first principles, inversion, second-order consequences) for structural decisions.
- The project state snapshot (etat-du-projet-abnegation.md) is the source of truth, not chronological logs.
- The Harel statechart is the source of truth for all UI states and transitions.

## Examples of my work

- Built extractBrickCore fast path: brick.fields.result for direct number extraction, heuristic fallback for legacy bricks. Caught a subtle bug where correction path would have stored stale structured fields.
- Shipped Éclaireur V2: paste a job offer → detect role → reveal hidden KPI → optional CV audit (5 cross-tests) → conversion to Forge.
- Designed the Brew V2 spec: weekly strategic cockpit for LinkedIn proof deployment. Architecture "Brew prépare, Forge exécute."
- Ran a full production risk analysis using three mental models across 8 system blocks. Identified sessionStorage bridge fragility, Brew crash risk, and extractBrickCore silent number corruption — all resolved.
- LinkedIn 360 post quality filters (ch21): 8 automated heuristic tests (Marie Hook + Méroé frameworks) + 7 qualitative checklist questions. No LLM dependency. Client-side only.
- Contact script generator with 4 channel variants (email, LinkedIn DM, N+1 manager, HR) + 6-test commercial scoring grid.

## Stack

Next.js 14, Supabase (auth + persistence), Stripe (payments), Vercel, OVH (domain + email). Repo: ~/Downloads/exosquelette.
