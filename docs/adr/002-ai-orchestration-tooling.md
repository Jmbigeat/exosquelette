# ADR 002 — Orchestration IA — 6 approches évaluées, 1 retenue

**Date :** 10 mars 2026
**Statut :** Accepté

## Contexte

Le sprint utilise Claude pour extraire des briques de preuve à partir du CV et des offres. La question est : comment orchestrer les appels IA (scan CV, audit, génération de livrables) ?

## Options évaluées

| # | Option | Avantage | Inconvénient |
|---|--------|----------|--------------|
| 1 | LangChain | Écosystème riche, agents | Abstraction lourde, dépendance massive |
| 2 | Semantic Kernel | Intégration .NET/Python | Pas de support JS natif mature |
| 3 | Autogen | Multi-agent | Complexité, overhead, Python only |
| 4 | Appels directs Anthropic SDK | Simple, contrôle total | Pas de retry/fallback intégré |
| 5 | Vercel AI SDK | Streaming natif, Next.js | Abstraction sur le prompt, moins de contrôle |
| 6 | Custom thin wrapper | Contrôle total, zéro dépendance | Maintenance manuelle |

## Décision

**Option 4 : Appels directs via `@anthropic-ai/sdk`.**

- Un seul endpoint `/api/scan` qui envoie CV + offres à Claude Sonnet 4.
- Prompt structuré avec instructions précises (max 3000 chars CV, 1500 tokens réponse).
- Parsing JSON de la réponse côté serveur.
- Pas de chaîne d'agents, pas de mémoire conversationnelle, pas de RAG.

## Justification

Le cas d'usage est un single-shot : un CV + des offres entrent, des briques structurées sortent. Pas besoin de conversation, de mémoire, ou de chaîne d'appels. Les frameworks d'orchestration ajoutent de la complexité sans valeur pour ce pattern.

## Conséquences

- Une seule dépendance IA : `@anthropic-ai/sdk`.
- Le prompt est versionné dans le code, pas dans une config externe.
- Les retry et la gestion d'erreur sont manuels (try/catch + message utilisateur).
- Si le besoin évolue vers du multi-turn ou du RAG, cette décision sera réévaluée.
