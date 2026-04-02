# CLAUDE.md — Abneg@tion

## Identité du projet
Abneg@tion est une plateforme de positionnement carrière qui structure des preuves vérifiables pour les candidats. Marché SaaS français. Cible : candidats en transition ou négociation qui veulent des arguments factuels, pas du coaching flou. Construit par Exosquelette.

## Stack
- Framework : Next.js 14 (App Router), Vanilla JavaScript (pas de TypeScript), path aliases @/*
- Base de données : Supabase (Auth email/password, PostgreSQL, RLS sur toutes les tables, Edge Functions)
- Paiement : Stripe (Checkout 49€, webhooks, webhook fonctionne uniquement en production)
- IA : Claude API Sonnet 4 (max 3000 chars input, 1500 max tokens output)
- Déploiement : Vercel (deploy auto sur push main)
- Domaine : abnegation.eu (OVH, DNS → Vercel)
- Style : CSS inline objets (pas de framework CSS). Dark theme #0a0a1a, accent #e94560, Inter font
- React Strict Mode désactivé

## Commandes
```bash
npm install        # Dépendances
npm run dev        # Server local localhost:3000
npm run build      # Build production
npm start          # Server production
npm test           # 53 tests (vitest)
npm run smoke      # 258 smoke tests structurels
npm run qa         # 15 checks QA agent post-merge
npx eslint .       # Lint
npx prettier --write .  # Format
npm audit          # Vulnérabilités
```

## Environnement
Requiert `.env.local` avec : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, ANTHROPIC_API_KEY. Voir `.env.example`.

## Architecture

### Flow utilisateur
Auth (/auth) → Paywall check → Stripe checkout (/api/checkout) → Webhook confirme paiement (/api/webhook) → Sprint UI → AI scan (/api/scan) → Auto-save Supabase toutes les 2s.

### Flow produit (verrouillé)
Extraction → Établi → Assemblage → Arsenal → Signature → filtre

### Modules et choix LLM vs déterministe
- Scoring briques : DÉTERMINISTE. scoreBricksByCauchemar, selectGreedyCoverage, selectBestBrick. Pas de LLM.
- Blindage (4 cases) : DÉTERMINISTE. Validation structurelle.
- Densité (6 axes pondérés) : DÉTERMINISTE. Calcul algorithmique.
- ATMT (2 couches candidat) : DÉTERMINISTE. Extraction de patterns.
- Signature comportementale cross-brique : DÉTERMINISTE. 38 marqueurs vocabulaire.
- Generators (One-Pager, CV, DM, scripts, bio) : LLM. Claude Sonnet 4 au dernier kilomètre. Le moteur est 80% déterministe, l'API Claude intervient uniquement pour la génération finale.
- Scan initial (/api/scan) : LLM. Envoie CV + offres à Claude, extrait briques, KPIs, compétences, gaps.

### Routes API
- `app/api/scan/route.js` — POST. CV + offres → Claude Sonnet 4 → briques extraites. Zod validation.
- `app/api/checkout/route.js` — Crée session Stripe 49€. Rate limit 5/15min. Zod validation.
- `app/api/webhook/route.js` — Reçoit checkout.session.completed, marque paid dans Supabase.
- `app/api/auth/register/route.js` — Rate limit 5/15min. Zod (email, password min 6).
- `app/api/recommend-pillars/route.js` — Zod (pillars array min 1).

### Pages
- `app/page.js` — Redirige vers /sprint.
- `app/auth/page.js` — Login/signup Supabase Auth.
- `app/sprint/page.js` — Auth check serveur, charge/sauve sprint, paywall ou Sprint component. Auto-save debounce 2s.

### Sprint Module (19 fichiers)
`Sprint.jsx` (429 lignes) est l'orchestrateur. Décomposé en :
- `components/sprint/` — 7 composants React (UI par étape du sprint).
- `lib/sprint/` — 12 modules fonctions pures (scoring, validation, KPI, génération rapports).

### Libraries
- `lib/supabase.js` — createClient() (browser) + createServerClient() (serveur, SUPABASE_SERVICE_ROLE_KEY).
- `lib/stripe.js` — Singleton Stripe.
- `lib/sprint-db.js` — loadSprint(), saveSprint(), checkPaid().

### Base de données (supabase/schema.sql)
Trois tables, RLS actif sur chacune :
- `profiles` — Métadonnées user + booléen paid. Auto-créé au signup via trigger.
- `sprints` — État sprint complet en JSONB. Une ligne par user.
- `payments` — Log transactions Stripe.

## Glossaire
- Exosquelette : le livrable candidat complet (l'ensemble des outputs générés)
- Coffre-Fort : l'espace où les briques extraites sont stockées
- Blindage : validation structurelle en 4 cases, vérifie la solidité des arguments
- Densité : score sur 6 axes pondérés, mesure la richesse des preuves
- ATMT : deux couches d'analyse candidat
- Forge : le moteur de transformation des briques brutes en arguments structurés
- Établi : première étape de travail, se déclenche sur la première brique
- Arsenal : collection d'arguments prêts à l'emploi
- Signature : empreinte comportementale cross-brique (38 marqueurs vocabulaire)
- Chantier : un lot de travail sur le produit
- Briques : unités atomiques d'information extraites du CV et des offres
- Cauchemars : les problèmes récurrents par rôle que le candidat doit résoudre
- Piliers : les axes de contenu (4 piliers verrouillés)
- Cicatrice : preuve vécue, marque d'expérience réelle
- Élastique : capacité d'adaptation démontrée par les preuves

## Filtres de contenu
Trois filtres nommés s'appliquent aux outputs générés :
- Méroé — filtre de style
- Marie Hook — filtre d'accroche
- Luis Enrique — filtre d'audit

## Décisions verrouillées
- Architecture 80% déterministe. Le LLM intervient au dernier kilomètre uniquement. Ne pas ajouter de LLM là où un algorithme suffit.
- Polissage supprimé. Ne pas recréer cette feature.
- Sprint Éclair supprimé définitivement. Ne pas recréer.
- Blindage = 4 cases. Ne pas modifier la structure.
- Densité = 6 axes. Ne pas ajouter d'axes.
- Établi se déclenche sur la première brique. Ne pas modifier ce trigger.
- 4 piliers content verrouillés. Ne pas en ajouter.
- Pricing 49€ via Stripe Checkout. Paywall bypassé pour le moment.

## Ce que Claude ne fait PAS
- Ne réécrit jamais les generators sans passer par les filtres Méroé/MarieHook/LuisEnrique.
- Ne fait jamais référence au recrutement ou au headhunting. Abneg@tion positionne le candidat, pas le recruteur.
- N'ajoute aucune feature sans passer par Kano (basique/performance/attractif/indifférent/inverse).
- N'utilise jamais les mots bannis dans le contenu user-facing : approfondir, favoriser, complexe, très, vraiment, littéralement, game-changer, disruptif, révolutionner.
- Ne touche pas au scoring déterministe pour y injecter du LLM.
- Ne modifie pas Sprint.jsx sans vérifier l'impact sur les 19 fichiers du module.

## Conventions spécifiques
- Langue française obligatoire dans toutes les strings user-facing. Maintenir les accents.
- CSS inline objets. Pas de framework CSS.
- Contenu LinkedIn : filtres Méroé/MarieHook/LuisEnrique, Dilts + funnel sur chaque post.
- Accroches : in media res. Règle du three interdite.
- 4 piliers content : Silence = prix / Chiffre ouvre + cicatrice ferme / Se forge / Périssable.

## Documentation clé
| Fichier | Rôle |
|---|---|
| CODEMAP.md | Index 51 fichiers (rôle, exports) |
| lessons.md | 12 règles de bugs (lues au démarrage) |
| etat-du-projet-abnegation.md | Snapshot état du projet (source de vérité) |
| working-style.md | Conventions de travail JM ↔ Claude |
| arbitrages-orchestration-ia.md | Décisions outils IA (7 évaluées, 1 retenue) |
| brand-voice.md | Formulations marketing stockées |
| competitive-complaints.md | 7 plaintes concurrents + réponses |

## Tests
- Smoke tests : `npm run smoke` (258 tests structurels)
- Unit tests : `npm test` (Vitest)
- QA agent : `npm run qa` (15 checks post-merge)
- Lint : `npx eslint .`
- Types : pas de TypeScript, pas de typecheck
- Pre-commit hook : bloque unicode escapes, console.log, dangerouslySetInnerHTML, features mortes
- Post-merge hook : lance QA agent

## Déploiement
- Preview : push sur une branche → Vercel preview auto
- Production : merge sur main → Vercel deploy auto
- Variables d'environnement : Vercel dashboard (jamais dans le code)
- Stripe webhook : production uniquement (pas localhost)
