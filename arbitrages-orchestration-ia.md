# ARBITRAGES ORCHESTRATION IA — Abneg@tion
## Pourquoi un QA agent. Pourquoi pas le reste. Décisions documentées.

Date : 10 mars 2026
Contexte : solo founder, zéro background technique, produit en production, 21 chantiers livrés via Claude.ai (spec) + Claude Code (implémentation).

---

## LE WORKFLOW RETENU

Claude.ai (spec, arbitrage, stratégie) → prompt markdown → Claude Code (implémentation) → review diff → merge.

Un seul agent d'implémentation (Claude Code). Un seul agent de décision (JM via Claude.ai). Pas d'orchestration multi-agent. Pas de framework.

---

## CE QUI A ÉTÉ ÉVALUÉ ET REJETÉ

### BMAD (multi-agent framework)

Évalué : 7 agents (Analyst, PM, Architect, SM/PO, Dev, QA, Quick Flow). 15 fichiers d'arborescence. Workflows formalisés entre chaque agent.

Rejeté. Raison : BMAD résout la coordination entre plusieurs personnes. JM est seul. Le problème de coordination n'existe pas. Chaque rôle BMAD est déjà assumé :
- Analyst → three mental models appliqués à chaque décision
- PM → JM (spec, priorisation, kill features)
- Architect → statechart Harel + CODEMAP
- SM/PO → snapshot État du Projet + liste d'attente priorisée
- Dev → Claude Code
- QA → 169 smoke tests + review manuelle

Ajouter 7 fichiers .md d'agents produirait du travail méta (doc sur la doc) sans livrer un candidat de plus. Le workflow actuel a prouvé sa vélocité : 21 chantiers en 25 jours.

### Orchestration multi-agent dans Claude Code

Évalué : un prompt qui enchaîne Analyst → Architect → Dev → QA en sous-agents (Task tool).

Rejeté. Raison : 4× la consommation de tokens. Le rate limit est atteint 4× plus vite (frappé le jour même à 13h). Chaque sous-agent perd le contexte des autres. Les chantiers Abneg@tion sont séquentiels et interdépendants — l'agent Dev a besoin de la décision du PM, qui a besoin du diagnostic, qui a besoin de l'arbitrage de JM. Rien ne tourne en parallèle. L'orchestration multi-agent a du sens quand les tâches sont parallélisables et indépendantes. Ce n'est pas le cas.

### Cursor (IDE IA)

Évalué : VS Code fork avec IA intégrée (autocomplete, diffs visuels, navigation codebase).

Rejeté (pour le moment). Raison : Cursor encourage le hands-on. JM risque de dériver de PM (spec → review → décision) vers développeur (éditer → tester → commiter). Le workflow Claude Code force le rôle PM : le prompt markdown est une spec, la review est un arbitrage. Cursor brouille cette frontière. De plus, le repo (27 fichiers generators + 3 hooks + Sprint.jsx) se navigue par grep. Cursor devient pertinent quand le repo atteint une taille où les greps ne suffisent plus.

### Agent Analyst autonome

Évalué : un agent qui lit les posts LinkedIn, les verbatims candidats, et produit des briefs produit automatiquement.

Rejeté. Raison : l'analyse demande du jugement contextuel. Le post de Didier Queste dit "on ne trouve plus de candidats" — l'insight n'est pas dans le post, il est dans le contrepied (le candidat ne sait pas se formuler). Un agent Analyst retourne un résumé. JM retourne un angle. La valeur est dans l'angle, pas dans le résumé.

### Agent Dev autonome (option 2 : "allow all edits")

Évalué : Claude Code exécute sans approbation diff par diff.

Rejeté (comme politique par défaut). Raison : pour un non-technique, le risque d'un fix autonome qui casse autre chose est trop élevé. Le bug structuredFields (correction path) aurait été mergé sans review. L'approche "option 1 toujours" est un filet de sécurité contre les faux positifs de l'IA. Exception : les opérations de déplacement de code pur (refactor generators split) où le risque comportemental est nul.

---

## CE QUI A ÉTÉ RETENU

### QA Agent automatique

Retenu. Un seul agent. Un script Node.js natif (zéro dépendance). 15 checks automatisés post-merge. Il ne corrige rien. Il rapporte.

Pourquoi celui-là et pas les autres :
1. Parallélisable. Le QA tourne après le merge. Il ne bloque pas le workflow. Le Dev code, le QA vérifie en arrière-plan.
2. Déterministe. Chaque check est un grep ou un test binaire. Pas de jugement. Pas de contexte. Pas de créativité. L'IA n'est pas nécessaire — c'est du scripting pur.
3. Préventif. Chaque anti-pattern documenté dans lessons.md est un check automatisé. Les erreurs ne se répètent pas même si JM oublie de grepper.
4. Scalable. Quand un nouveau bug est attrapé, une ligne s'ajoute dans lessons.md ET un check s'ajoute dans qa-agent.js. La couverture grandit mécaniquement.
5. Portfolio PM. Le QA agent est une preuve axe 3 (Qualité & Rigueur technique). Un recruteur PM qui voit `npm run qa → 15/15 PASS` comprend que la qualité est systématisée, pas improvisée.

---

## PRINCIPE DE DÉCISION

La règle appliquée à chaque évaluation d'outil/agent IA :

"Est-ce que cet outil résout un problème que j'ai aujourd'hui, ou un problème que je pourrais avoir demain ?"

Si la réponse est "demain" : rejeté. On réévalue quand le problème existe.

BMAD → problème de coordination. Pas de coordination solo. Rejeté.
Multi-agent → problème de parallélisme. Pas de tâches parallèles. Rejeté.
Cursor → problème de navigation codebase. 51 fichiers se greppent. Rejeté.
QA agent → problème de régression post-merge. 11 bugs documentés. Retenu.

### MCP Servers (Supabase, Stripe, Vercel)

Évalué : connecter Claude Code directement aux services externes. Lire les tables Supabase, vérifier les webhooks Stripe, lire les logs Vercel depuis le terminal.

Rejeté (pour le moment). Raison : les interactions avec les services externes sont rares (1-2 fois par session). Supabase : vérification manuelle dans le dashboard (brew_weeks ce matin). Stripe : inactif, zéro transaction. Vercel : déploiement automatique, zéro problème, UptimeRobot surveille. Le gain est du confort, pas un besoin. Chaque MCP ajouté est une surface d'erreur supplémentaire (tokens, permissions, rate limits côté service).

### Hooks Claude Code (pre-commit, auto-format, LLM-review)

Évalué : configurer des hooks pour bloquer les commandes dangereuses, imposer les tests, formater automatiquement, et potentiellement reviewer les diffs via un deuxième LLM.

Rejeté (20 mars 2026). Raison : les hooks couvrent 20% des bugs (mécaniques : formatage, syntaxe, linting). 80% des bugs dans l'historique du projet sont sémantiques (inversion de priorité, déviation de spec, guard condition manquante). ESLint + Prettier + QA agent (15 checks) + 170 smoke tests couvrent déjà la couche mécanique. La review manuelle du diff est le seul mécanisme qui connaît les 52 arbitrages B2B, les 10 arbitrages Trempe, et les anti-patterns de lessons.md. Automatiser le contexte est une contradiction. Un hook LLM-based (Claude review Claude) double la surface d'erreur et crée un faux sentiment de sécurité — la vigilance sémantique baisse quand le hook "valide." Le coût de la discipline manuelle est 2-4 heures/mois. Le gain marginal des hooks est proche de zéro sur la couche non couverte.

---

## RÉÉVALUATION PRÉVUE

- Cursor : quand le repo dépasse 100 fichiers ou quand un deuxième contributeur rejoint.
- Multi-agent : quand les tâches deviennent parallélisables (ex : 3 generators à refactorer indépendamment en même temps).
- BMAD : quand une équipe de 3+ personnes travaille sur le produit.
- Agent Analyst : quand PostHog est actif et que les données utilisateurs remplacent l'intuition.
- MCP Servers (Supabase, Stripe, Vercel) : quand Stripe est actif et que les vérifications base/webhook deviennent quotidiennes.
- Hooks Claude Code : quand un dev humain rejoint le projet. Le dev ne connaît pas les 52 arbitrages. Les hooks compensent le manque de contexte. Solo founder = le fondateur est le hook.
