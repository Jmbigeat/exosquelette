---
name: abnegation-dev
description: Skill for developing Abneg@tion, a SaaS career positioning tool built with Next.js 14, Supabase, Stripe, and Vercel. Use this skill whenever the user mentions Abneg@tion, Exosquelette, chantier, briques, blindage, cauchemars, densité, ATMT, Forge, Établi, Arsenal, Éclaireur, Duel, signature, cicatrice, élastique, piliers, or any reference to implementing features, fixing bugs, writing prompts for Claude Code, or working on the codebase. Also trigger when the user pastes code from Sprint.jsx, panels.jsx, generators.js, or any module from the repo. This skill contains all conventions, architecture, glossary, and workflow rules needed to work on the product.
---

# Abneg@tion Development Skill

## Identity

- **Product**: Abneg@tion (the tool)
- **Company**: Exosquelette (the entity)
- **Owner**: JM
- **Repo**: ~/Downloads/exosquelette
- **Stack**: Next.js 14, Vercel, Supabase (auth), Stripe, GitHub
- **Implementation tool**: Claude Code (prompts written in Claude.ai, copied to terminal)

---

## Language Conventions

### Absolute Rules

1. **Code**: English only. Variable names, function names, comments, file names.
2. **UI strings**: French with accents. Every user-facing string uses proper accents (é, è, ê, à, ù, ç, etc.).
3. **No unicode escapes**: Write `é` not `\u00E9`. Write `€` not `\u20AC`. Write `🪙` not `\uD83E\uDE99`. This applies to ALL files.
4. **Commit messages**: English prefix (`feat:`, `fix:`, `refactor:`), French body allowed.
5. **Co-author**: Every commit includes `Co-Authored-By: Claude Opus 4.6`.

### Commit Workflow

- One commit per logical unit. Never bundle unrelated changes.
- JM reviews each diff before approving. Never auto-commit.
- Branch naming: `chantier-{N}-{slug}` (e.g., `chantier-14-pieces`).
- Merge to main: `git checkout main && git merge {branch} --no-ff -m "merge: chantier {N} — {description}"`.
- Vercel deploys automatically from main.

---

## Architecture Overview

Read [references/architecture.md](./references/architecture.md) for the full module map and state flow.

### Forge Flow (3 stages)

```
Extraction → Assemblage → Calibration
```

- **Extraction**: Briques brutes. IA generates hypotheses from profile × market. User validates.
- **Assemblage**: Blindage 4 cases. Stress test 5 angles. Cauchemars. Density scoring.
- **Calibration**: Duel écrit. ATMT analysis. duelTested flag.

### Continuous Outputs (not stages)

- **Établi**: Produces deliverables (CV, DM, email, bio, etc.). Available from first brick.
- **Arsenal**: GPS of gaps. Radar + next action + simulation. Available from Assemblage.
- **Signature**: Unfair advantage detection. Triggers at 3 armored bricks × 2+ cauchemars.

### Key Modules

| File | Role |
|------|------|
| `app/sprint/page.js` | Route entry, auth, user prop |
| `components/Sprint.jsx` | Main orchestrator, composes hooks |
| `components/sprint/hooks/usePersistence.js` | localStorage + Supabase save/load with retry |
| `components/sprint/hooks/useBrewNotif.js` | Brew notification state |
| `components/sprint/hooks/useBricks.js` | Brick lifecycle (forge, correct, mission, skip) |
| `components/sprint/panels.jsx` | WorkBench (Établi) + Arsenal |
| `components/sprint/Toast.jsx` | Toast notifications |
| `lib/generators/index.js` | Re-exports all generators (split from monolith) |
| `lib/generators/helpers.js` | Shared helpers (extractBrickCore, applyHints, etc.) |
| `lib/sprint/generators.js` | Proxy → lib/generators/index.js (retrocompat) |
| `lib/sprint/references.js` | KPI_REFERENCE, STEPS, DUEL_QUESTIONS, MARKET_DATA, CAUCHEMAR_TEMPLATES_BY_ROLE |
| `lib/sprint/scoring.js` | Density score, cauchemar coverage, effort |
| `lib/sprint/offers.js` | parseOfferSignals, buildActiveCauchemars |
| `lib/sprint/bricks.js` | generateAdaptiveSeeds, matchKpiToReference |
| `lib/sprint/analysis.js` | Maturity level, brick markers (hasNumbers, hasDecisionMarkers, hasInfluenceMarkers) |
| `lib/sprint/redac.js` | cleanRedac |
| `lib/sprint/dilts.js` | Dilts progression analysis |
| `lib/sprint/linkedin.js` | Weekly posts, sleep comments |
| `lib/sprint/migrations.js` | State migrations |
| `lib/eclaireur/audit-cv.js` | CV audit 5 cross-tests + English detection |
| `components/Onboarding.jsx` | 5-state onboarding |
| `components/Duel.jsx` | Self-contained Duel component |
| `components/eclaireur/Eclaireur.jsx` | Free tool: job offer analysis + CV audit |
| `components/brew/Brew.jsx` | LinkedIn 360 Brew cockpit |
| `app/eclaireur/page.js` | Éclaireur route |
| `app/brew/page.jsx` | Brew route |
| `app/paywall/page.js` | Paywall route (redirect → /onboarding) |

---

## Glossary

Read [references/glossary.md](./references/glossary.md) for the complete glossary of product terms.

Key terms to never confuse:

- **Forge** = the product experience (formerly "Sprint" in UI). Code still uses Sprint internally.
- **Brique** = a proof unit. 4 types: Preuve 🧱, Cicatrice 🩹, Élastique 🎯, Mission 📋.
- **Blindage** = 4-case internal checklist (Chiffre, Décision, Influence, Transférabilité). Candidate never sees this.
- **ATMT** = candidate-facing delivery language (Accroche, Tension, Méthode, Transfert). Sequence matters.
- **Cauchemar** = recruiter nightmare. 5 per role. Each has a sector cost.
- **Densité** = 6-axis weighted score. 70% = armed. 100% = ideal. 120%+ = exceeds.
- **Pièces** = DEAD MECHANISM. Ch14 code exists but is disabled. No consumption tokens. No Mode Vitrine.
- **Mode Vitrine** = DEAD. Linked to pièces mechanism.
- **Piliers** = 4 thematic LinkedIn pillars per candidate. Each pillar = semantic magnet for specific profile types.
- **Proof deposit** = a LinkedIn post that leaves a trace of evidence (chiffres, décisions, méthodes). Not content for reach.
- **Brew** = weekly strategic cockpit for LinkedIn proof deployment (V2, after ch21). Separate page /brew. Part of subscription.
- **Quality gate B2B** = density ≥70% + blindage ≥3/4. Only armed profiles visible to cabinets.

### Bio LinkedIn — Framework D (Fait Anchor)

The generateBio generator follows Framework D:

- **Bloc 1** (≤ 210 chars, before "voir plus"): Strongest fact. Brick with best armorScore + hasNumbers. Action verb + number + context. Never starts with "je" / "j'ai" / "mon" / "mes".
- **Bloc 2** (≤ 400 chars): Dominant cauchemar reformulated as lived context. Implicit, not named. Past tense. Ends with a reversal word ("ailleurs", "personne ne posait").
- **Bloc 3** (≤ 300 chars): Behavioral pattern from verb recurrence in bricks. Opens with "Mon réflexe :". Signature filter (ch9) enriches this block in post-processing.
- **Bloc 4** (fixed): "Un message suffit."
- **Forbidden words**: passionné, dynamique, proactif, orienté résultats, fort de, doté de, riche expérience, reconnu pour, expert en, n'hésitez pas, ouvert aux opportunités.
- **Fallbacks**: 0 bricks → "Profil en cours de construction." No cauchemar → bloc 2 omitted. No pattern → bloc 3 omitted.
- **Known bug**: Bloc 1 exceeds 210 chars, no compressed format. In fix backlog.
- **Actual signature**: `generateBio(bricks, vault, trajectoryToggle)`. Uses `getActiveCauchemars()` in body. Returns via `cleanRedac()`.

---

## Frameworks

### ATMT (replaces RAC)

| Letter | Name | Definition |
|--------|------|------------|
| A | Accroche | The hard number. The fact that stops the reader. |
| T | Tension | The nightmare, the constraint. What made the result hard. |
| M | Méthode | What the candidate did. Decision, action, mobilization. |
| T | Transfert | What it proves for the target role. |

- Blindage 4 cases = internal engine (checklist, order irrelevant).
- ATMT = candidate delivery language (sequence).
- Tension comes from the cauchemar. Influence merges into Méthode.
- The Duel analyzes responses in ATMT format.

### Density Score (6 axes)

| Axis | Weight |
|------|--------|
| Blindage | 25% |
| Couverture cauchemars | 20% |
| Matériau brut | 15% |
| Singularité | 15% |
| CV prêt | 15% |
| Duel | 10% |

- Zero blocking gates. Calibrated warnings only.
- Plancher 70% (armé), 100% (idéal), 120%+ (dépassement).

### Signature (3 screens)

- Trigger: 3 armored bricks × 2+ different cauchemars.
- 3 semantic layers: raw words (candidate speaks here), behavioral pattern (signature lives here), abstract concept (recruiter buys here — tool NEVER names layer 3).
- 3 meta-pattern axes: Reactive/Proactive, Direct/Transverse, Short tempo/Long tempo.
- 4 archetypes: Pompier, Médiateur, Bâtisseur, Catalyseur.
- FREE. Not behind paywall. Creates word-of-mouth.

### Dilts (6 levels)

Progression of LinkedIn posts by logical levels. Used in ch19 (posts), ch20 (contact scripts), ch21 (filters), and Brew.

| Level | Name | Content | Linguistic Markers |
|-------|------|---------|-------------------|
| 1 | Environnement | Where, when, with whom | Places, dates, companies, raw numbers |
| 2 | Comportement | What I do | Action verbs ("j'ai fait", "j'ai lancé", "j'ai réduit") |
| 3 | Capacités | How I do it | Methods, processes ("ma méthode", "mon approche", "le système") |
| 4 | Croyances | Why I do it | Convictions ("je crois que", "le vrai sujet est", "ce qui compte") |
| 5 | Identité | Who I am | Positioning ("je suis le genre de", "mon rôle est") |
| 6 | Mission | What for | Impact ("pour que", "l'impact sur", "contribuer à") |

- Progression: 1-2 first (prove), then 3-4 (explain), then 5-6 (inspire).
- Stagnation detection: 3 posts at same level triggers alert.
- Contact script (ch20): diltsClosingLevel aligns DM closure with published post level.

---

## Prompt Writing for Claude Code

When JM asks to write a prompt for Claude Code:

1. **Format**: Markdown. Clear sections. One instruction per paragraph.
2. **Start with context**: Branch name, files affected, current state.
3. **Specify diffs**: Show exactly what changes. Old → New.
4. **Build verification**: Always end with `npm run build` check.
5. **Unicode rule**: Remind to write accented characters directly.
6. **Commit template**: Include the exact commit message.
7. **Lessons at startup**: Read `lessons.md` at the start of every session. When a correction is rejected or a non-trivial bug is caught during the session, propose a new entry in `lessons.md` with format: Bug → Context → Rule. Wait for validation before writing.

Example structure:
```markdown
# Chantier {N} — {Name}

## Branche
git checkout -b chantier-{N}-{slug}

## Contexte
{What exists. What changes. Why.}

## Fichiers modifiés
### {filename}
{Exact changes with before/after}

## Vérification
npm run build

## Commit
git add . && git commit -m "{message}" --trailer "Co-Authored-By: Claude Opus 4.6"
```

A reusable template exists: `template-prompt-claude-code.md` (in project files).

### Mandatory sections in every prompt

1. **Branche**: `git checkout -b {type}-{N}-{slug}`
2. **Contexte**: What exists. What changes. Why. 3-5 sentences.
3. **Opérations**: Numbered. Each starts with "Lire l'existant" before any modification.
4. **Ce que tu ne fais pas**: Explicit guardrails against regressions.
5. **Tests manuels**: Numbered scenarios. Action + expected result. Executable on localhost. NEVER optional.
6. **Conventions**: Fixed block (language, accents, no console.log, JSDoc, no unicode escapes).
7. **Vérification finale**: Checklist. Each item verifiable by grep, build, or inspection. Ends with `npm run build` + `npm run smoke`.
8. **Commit**: Exact message with `Co-Authored-By: Claude Opus 4.6`.
9. **Merge**: Exact command + `npm run smoke` post-merge.

### Rules

- Prompts are written in Claude.ai, reviewed by JM, then copied to Claude Code.
- Each prompt targets one logical unit. Never bundle unrelated changes.
- `npm run smoke` after every merge to catch route-level regressions.

---

## Design System

Read [references/design.md](./references/design.md) for the full design tokens.

Quick reference:
- **Background**: #06060f (bg), #0d0d1a (surface), #111125 (card)
- **Borders**: #1a1a3e (border), #495670 (dim)
- **Accent**: #e94560 (red), #4ecca3 (green), #ff9800 (gold), #0f3460 (blue)
- **Text**: #ccd6f6 (primary), #8892b0 (muted), #f0f0ff (white)
- **Fonts**: JetBrains Mono (metrics, code), Instrument Serif (titles), DM Sans (body)

---

## Current State (March 2026)

- **Shipped**: 21 chantiers + 2 refactorings (generators split, Sprint hooks) + 15 micro-fixes. All merged to main.
- **Pricing**: Forge gratuite (B2C2B). Pièces mortes. Paywall 49€ bypassé. Abonnement 19€/mois à activer (prérequis: micro-entreprise + Stripe).
- **Éclaireur**: Free tool. Paste offer → detect role → reveal 1 KPI → optional CV audit (5 cross-tests + English detection) → CTA Forge.
- **Smoke tests**: 169 tests via `npm run smoke`.
- **Domain**: abnegation.eu (live).
- **Key files**: `lessons.md` (bug rules), `etat-du-projet-abnegation.md` (source of truth snapshot), `CODEMAP.md` (51 files documented).

### Roadmap

| Priority | Feature | Status |
|----------|---------|--------|
| Now | 10 real candidates on Éclaireur | Distribution phase |
| Stripe activation | Subscription 19€/mois | Blocked by micro-entreprise SIRET |
| V2 | Generator comparatif salarial | Planned |
| V2 | ROLE_VARIANTS — alternative titles per role | Planned |
| V3 | Intelligence économique locale | Needs web agents or API |
| V3 | Scoring LLM | Subscription feature |
| V3 | Éclaireur B2B — offer audit for firms/DRH | Same engine, different packaging |

### Known Minor Bugs

1. "Sprint" remains in internal code (filenames, variables) — cosmetic, accepted.
2. Bio LinkedIn bloc 1 exceeds 210 chars — no compressed format yet.

---

## Anti-Patterns

Things that have caused bugs before. Avoid them.

1. **Unicode escapes**: Never write `\u00E9`. Write `é`. Build passes both ways but readability suffers.
2. **Missing email in fetch**: Always pass `user.email` and `user.id` in POST body to `/api/checkout`.
3. **Hardcoded piece counts**: Use state, not literals. `pieces` state is the single source of truth.
4. **Sprint Éclair references**: Deleted. Do not re-add. No 3-piece refill mechanism.
5. **RAC references**: Replaced by ATMT everywhere. Do not use RAC in new code or UI.
6. **Sprint in UI strings**: Use "Forge" in all user-facing text. "Sprint" stays in code internals only.
