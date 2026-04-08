Ouvre README.md à la racine du repo. Remplace tout le contenu par :

# ABNEG@TION

Un outil de positionnement professionnel qui structure les preuves vérifiables d'un candidat expérimenté. Le candidat ne déclare plus. Il prouve.

## Le problème

95% des CV sont déclaratifs. "J'ai géré des projets." Le recruteur lit, hoche la tête, et passe au suivant. Le candidat expérimenté a 10 ans de preuves enfouies. Il ne sait pas les formuler de manière vérifiable.

## Ce que fait l'outil

4 surfaces, 1 pipeline.

**L'Éclaireur** — Le candidat colle une offre d'emploi. L'outil détecte le rôle, révèle le KPI caché du recruteur, et identifie les cauchemars (les peurs spécifiques que le recruteur ne formule pas dans l'offre).

**La Forge** — Le candidat écrit ses expériences (les briques). Chaque brique est testée sur 4 axes : chiffre vérifiable, décision personnelle, influence prouvée, transférabilité argumentée. Le stress test attaque chaque brique avec des questions de pression calibrées par rôle et séniorité. Le Duel simule un entretien adverse de 90 secondes.

**La Trempe** — Le candidat publie des preuves sur LinkedIn. 4 piliers narratifs. Scoring automatique (8 tests heuristiques). Les posts sont des preuves sédimentées, pas du contenu viral.

**L'Échoppe** — Les recruteurs trouvent les candidats forgés. Profils anonymisés, filtrés par cauchemar couvert. Le contact déclenche le One-Pager calibré. (Spec prête, pas encore en production.)

## Architecture

- 80% déterministe. Les generators, le scoring, le Blindage, la densité sont des fonctions pures. Pas de LLM sauf pour le scan initial (Éclaireur).
- Le candidat ne voit jamais le moteur interne (Blindage 4 cases). Il voit ATMT (Accroche, Tension, Méthode, Transfert). Les deux couches ne s'intersectent jamais.
- La densité avance par seuils, pas par durée.

## Chiffres

- 40 100 lignes de code
- 258 smoke tests + 10 unit tests
- 51 fichiers documentés (CODEMAP.md)
- 44 features en production
- 10 rôles × 4 secteurs couverts
- 21 chantiers mergés
- 145+ déploiements Vercel
- 1 personne

## Stack

Next.js 14 · Supabase (auth + persistence) · Stripe (paiements) · Claude API (scan Éclaireur) · Vercel (deploy) · ESLint + Prettier · Zod (validation API) · Rate limiting (4 routes)

## Le stress test

Chaque brique est attaquée sur 4 angles :
- **Chiffre** : "C'est le portefeuille total ou ta contribution personnelle ?"
- **Décision** : "Qui a approuvé ? Si ton manager avait dit non ?"
- **Influence** : "Quelqu'un d'autre aurait-il obtenu le même résultat ?"
- **Transférabilité** : "Qu'est-ce qui ne s'applique pas dans le nouveau contexte ?"

2 angles conditionnels pour les briques élastiques (compétences transférées d'un domaine non professionnel) : friction de transfert et intersection cachée.

Les questions sont calibrées par rôle (10 rôles) et par séniorité (IC/Manager/Leader). Entièrement déterministe. Zéro LLM.

## Lancer en local

```bash
cp .env.example .env.local
# Remplir les variables (Supabase, Stripe, Anthropic)
npm install
npm run dev
```

## Tests

```bash
npm run smoke    # 258 tests
npm run test     # 10 unit tests
npm run qa       # 15 checks post-merge
```

## Construit par

Jean-Mikaël Bigeat — [abnegation.eu](https://abnegation.eu) — contact@abnegation.eu

Je ne définis pas le produit. Je le construis et je le livre.
