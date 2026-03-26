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

- Cursor : RÉÉVALUÉ 25 mars. Le repo atteint 88 fichiers (51 code + 37 docs). Grepper 51 fichiers ralentit la phase recherche. Cursor en mode lecture seule (autocomplete désactivé, pas d'édition directe) accélérerait le terminal A du two-instance. Risque : tentation d'éditer directement. Atténuation : mode lecture seule strict. Action : tester sur le prochain chantier complexe.
- Multi-agent : PARTIELLEMENT RÉÉVALUÉ 25 mars. Le framework multi-agent (BMAD, Task tool) reste rejeté. Le two-instance kickoff (parallélisme léger, convergence manuelle) est la bonne granularité. Deux terminaux Claude Code, tâches différentes, JM comme pont. Le rejet initial était trop binaire.
- BMAD : rejet confirmé 25 mars. Toujours solo. Réévaluer quand 3+ personnes.
- Agent Analyst : rejet confirmé 25 mars. La valeur est dans l'angle (contrepied), pas dans le résumé. 26+ posts analysés manuellement le prouvent.
- MCP Servers (Supabase, Stripe, Vercel) : rejet confirmé 25 mars. Stripe inactif. Zéro candidat. Réévaluer quand Stripe actif et vérifications quotidiennes.
- Hooks Claude Code (LLM-review) : rejet confirmé 25 mars. Les hooks déterministes (pre-commit, post-merge) sont implémentés depuis le 20 mars. Le hook LLM (Claude review Claude) reste rejeté — faux sentiment de sécurité.
- Agent Dev autonome (option 2) : RÉÉVALUÉ 25 mars. L'auto mode Claude Code (classifieur IA, actions sûres auto-approuvées, actions risquées bloquées) est le compromis. Preview Team uniquement. À activer dès disponible plan Pro.
- Optimisation tokens (choix dynamique du modèle) : évalué 25 mars, rejeté temporairement. Non exploitable plan Pro. Pattern documenté dans everything-claude-code (96K stars). Backlog signal stocké.

---

## RÉÉVALUATION 25 MARS 2026

Contexte : 40 100 lignes, 51+ fichiers code, 37 fichiers docs, 209 smoke tests, 10 unit tests, 88 fichiers total. Le repo a doublé depuis les arbitrages initiaux (10 mars). Déclencheur : le repo everything-claude-code (96K stars) et le two-instance kickoff ont montré que certains rejets étaient trop binaires.

### Items jamais formellement évalués

#### Promptfoo / Evals LLM sur les generators

Contexte : 11 generators produisent du texte non-déterministe. Les unit tests (vitest) testent les helpers déterministes. Rien ne teste la qualité des outputs generators. Un generator qui produit un One-Pager médiocre passe le build et les smoke tests.
Évaluation : Promptfoo permettrait de définir des assertions sur les outputs LLM ("le One-Pager contient un chiffre", "le DM mentionne le cauchemar", "la bio ne dépasse pas 210 caractères").
Verdict : pas maintenant (zéro candidat, zéro données d'usage). Après les 10 candidats. Les outputs generators seront testables sur des cas réels.
Réévaluation : quand un generator est modifié et qu'on veut vérifier que la modification n'a pas dégradé la qualité. Prérequis : 10 candidats réels + outputs réels à évaluer.

#### Cowork (gestion connaissance + tâches planifiées)

Contexte : le workflow Sync manuel (commit → push → clic Sync) a un délai. Les fichiers vivants sont mis à jour manuellement. Les rappels de priorité sont dans la tête de JM.
Évaluation : Cowork accède aux fichiers locaux en temps réel. Tâches planifiées (rappel priorité 1 le lundi matin, mise à jour compteurs le vendredi). Dispatch depuis le téléphone. Triangle Cowork + Claude.ai + Claude Code remplace la ligne séquentielle.
Verdict : à implémenter. Plan Pro compatible. Setup 5 minutes. Gain immédiat sur la maintenance documentaire et les rappels priorité.
Action : installer Claude Desktop, pointer sur ~/Downloads/exosquelette, tester la première tâche.

#### Two-Instance Kickoff

Contexte : les chantiers complexes sont séquentiels. L'Opération 1 (lire 6-8 fichiers) bloque l'Opération 2+ (coder). Le temps d'attente de la lecture est du temps perdu.
Évaluation : deux terminaux Claude Code. Instance A (recherche) lit et rapporte. Instance B (scaffold) crée les signatures vides. Les deux convergent. JM est le pont.
Verdict : à tester immédiatement. Aucun coût. Aucune dépendance. Le premier test est prévu sur feat-16m (indicateur briques × livrables).
Source : repo everything-claude-code (96K stars), pattern documenté.

### Principe de décision mis à jour

Ancien : "Est-ce que cet outil résout un problème que j'ai aujourd'hui ou demain ? Si demain, rejeté."

Nouveau (25 mars) : même principe, avec deux ajouts :
1. Réévaluer les rejets quand le contexte double (taille repo, nombre de fichiers, complexité des sessions). Le rejet de Cursor à 27 fichiers n'est pas le même qu'à 88 fichiers.
2. Distinguer les rejets binaires (BMAD = non) des rejets graduels (multi-agent = pas le framework, mais le parallélisme léger oui). Le two-instance prouve qu'un rejet partiel est plus utile qu'un rejet total.
