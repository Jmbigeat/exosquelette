# PROMPT CLAUDE CODE — REFACTOR: Separate logic from formatting in generators
## Extraire la sélection de briques dans des helpers, garder le formatage dans les generators

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

Tous les chantiers (1–21) + fix + refactorings (generators split, Sprint hooks v1 + v2, panels split) mergés. Les generators vivent dans lib/generators/ (27 fichiers). Chaque generator mélange deux jobs : la sélection de données (quelle brique, quel score, quel cauchemar) et le formatage (template de texte). Ce refactoring les sépare. Zéro changement de comportement.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b refactor-generators-logic
```

---

## CONTEXTE

Un dev senior ouvre generate-cv.js. Il voit 80 lignes qui mélangent : sélection des briques par scoring cauchemar × KPI (logique métier), tri greedy par couverture (algorithme), formatage en lignes CV avec template (présentation). Pour comprendre l'algorithme de sélection, il lit le template. Pour comprendre le template, il traverse l'algorithme. Les deux responsabilités sont intriquées.

Le refactoring extrait la sélection (quelles briques, quel ordre, quel score) dans des fonctions partagées sous lib/generators/selectors.js. Les generators gardent le formatage (template, assemblage, nettoyage). Un dev senior lit le selector en 10 secondes et le template en 10 secondes. Pas les deux mélangés en 60 secondes.

---

## CE QUE TU FAIS (4 opérations)

### Opération 1 — Lire l'existant et identifier les patterns de sélection

Lis ces generators dans lib/generators/ :

1. `generate-cv.js` — identifie le bloc de scoring + tri greedy (scored.map, scored.sort, coveredCauchIds). Note où finit la sélection et où commence le formatage.
2. `generate-bio.js` — identifie la sélection de la brique anchor (meilleur armorScore + hasNumbers). Note le bloc de sélection du cauchemar dominant.
3. `generate-contact-scripts.js` — identifie comment il sélectionne les briques pertinentes par canal et interlocuteur.
4. `generate-interview.js` (ou équivalent) — identifie la sélection de briques pour la préparation entretien.
5. `generate-linkedin-posts.js` — identifie la sélection de briques par pilier.

Rapporte les patterns communs :

| Generator | Méthode de sélection | Critère de tri | Nombre de briques sélectionnées | Lignes sélection vs lignes formatage |
|---|---|---|---|---|

Identifie les patterns réutilisables :
- Scoring brique × cauchemar (utilisé dans CV, contact scripts, ?)
- Greedy par couverture cauchemar (utilisé dans CV, ?)
- Meilleure brique par armorScore (utilisé dans bio, ?)
- Briques par pilier (utilisé dans posts, ?)

STOP ici. Rapporte avant de coder. Je confirme quels patterns extraire.

### Opération 2 — Créer lib/generators/selectors.js

Fichier unique. Contient les fonctions de sélection réutilisables.

Fonctions probables (à confirmer après opération 1) :

```javascript
/**
 * Scores bricks against cauchemars and KPIs. Returns scored array sorted by relevance.
 * @param {Array} bricks - validated bricks
 * @param {Array} cauchemars - active cauchemars
 * @returns {Array<{ brick, score }>} sorted by score descending
 */
export function scoreBricksByCauchemar(bricks, cauchemars) { ... }

/**
 * Greedy selection: picks N bricks maximizing cauchemar coverage.
 * @param {Array<{ brick, score }>} scored - pre-scored bricks
 * @param {Array} cauchemars - active cauchemars
 * @param {number} target - max bricks to select (default 5)
 * @returns {{ selected: Array, coveredCount: number }}
 */
export function selectGreedyCoverage(scored, cauchemars, target) { ... }

/**
 * Selects the best brick by armorScore with optional filters.
 * @param {Array} bricks - validated bricks
 * @param {object} filters - { hasNumbers: boolean, brickType: string }
 * @returns {object|null} best brick or null
 */
export function selectBestBrick(bricks, filters) { ... }

/**
 * Groups bricks by pillar ID for LinkedIn post generation.
 * @param {Array} bricks - validated bricks
 * @param {object} vault - vault with selectedPillars
 * @returns {object} { [pillarId]: Array<brick> }
 */
export function groupBricksByPillar(bricks, vault) { ... }
```

Chaque fonction :
- A un JSDoc clair
- Fait UNE chose (sélectionner, pas formater)
- Retourne des données structurées (pas du texte)
- Est testable indépendamment

### Opération 3 — Refactorer les generators

Pour chaque generator impacté, remplace le bloc de sélection inline par un appel au selector.

**Exemple generate-cv.js AVANT :**
```javascript
export function generateCV(bricks, targetRoleId, trajectoryToggle, hints) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  // ... 30 lignes de scoring + tri greedy
  var cvBricks = selected.map(function(s) { return s.brick; });
  // ... 40 lignes de formatage template
}
```

**Exemple generate-cv.js APRÈS :**
```javascript
import { scoreBricksByCauchemar, selectGreedyCoverage } from './selectors.js';

export function generateCV(bricks, targetRoleId, trajectoryToggle, hints) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  var scored = scoreBricksByCauchemar(validated, getActiveCauchemars());
  var { selected, coveredCount } = selectGreedyCoverage(scored, getActiveCauchemars(), 5);
  var cvBricks = selected.map(function(s) { return s.brick; });
  // ... 40 lignes de formatage template (inchangées)
}
```

Le formatage reste dans le generator. Seule la sélection migre vers le selector.

**Règle : ne touche pas au formatage.** Le template, l'assemblage des lignes, cleanRedac, applyHints — tout ça reste exactement où il est. Tu déplaces uniquement la logique de sélection/scoring.

### Opération 4 — Vérifier la couverture

```bash
grep -rn "scoreBricksByCauchemar\|selectGreedyCoverage\|selectBestBrick\|groupBricksByPillar" lib/generators/
```

Chaque selector est appelé par au moins un generator. Aucun generator ne contient encore de logique de scoring inline (sauf cas trop spécifique pour être extrait — dans ce cas, commenter "// Scoring specific to this generator, not extracted").

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies aucun template de formatage. Le texte produit est identique.
- Tu ne modifies pas helpers.js (extractBrickCore, applyHints, etc. restent).
- Tu ne modifies pas les signatures des generators (mêmes arguments, même retour).
- Tu ne modifies pas Sprint.jsx, panels.jsx, WorkBench.jsx, Arsenal.jsx.
- Tu ne forces pas l'extraction si un generator a une logique de sélection unique et courte (< 10 lignes). Laisse-la en place avec un commentaire.
- Tu ne crées pas de classe ou de pattern compliqué. Des fonctions pures qui prennent des données et retournent des données.
- Tu n'ajoutes pas de dépendance npm.

---

## TESTS MANUELS

1. npm run build — le build passe.
2. npm run smoke — 169 tests, 0 régressions.
3. Ouvre localhost:3000/sprint. Crée 3 briques avec des chiffres.
4. Ouvre l'Établi. Génère un CV. Vérifie que les mêmes briques sont sélectionnées qu'avant le refactoring (même ordre, mêmes chiffres).
5. Génère une bio LinkedIn. Vérifie que la brique anchor est la même qu'avant.
6. Génère un script de contact. Vérifie que le contenu est identique.
7. Génère des posts LinkedIn. Vérifie qu'ils sont groupés par pilier correctement.
8. Génère un followup. Vérifie que les briques croisées avec les challenges sont correctes.

---

## CONVENTIONS (ne pas modifier)

- Langue du code : anglais
- Langue des strings UI : français avec accents corrects (é, è, ê, à, ù, ç)
- Langue du contenu généré : français
- Pas de console.log en production
- Les fonctions exportées ont un JSDoc
- Pas d'unicode escapes (écrire é, pas \u00E9 ; écrire €, pas \u20AC)

---

## VÉRIFICATION FINALE

- `cat lib/generators/selectors.js` → fonctions de sélection pures, JSDoc complet
- Chaque selector fait UNE chose et retourne des données (pas du texte)
- Les generators impactés importent depuis ./selectors.js
- Aucun generator n'a changé de signature (mêmes arguments, même retour)
- Le texte produit par chaque generator est identique à avant le refactoring
- Les logiques de sélection spécifiques (< 10 lignes) restent dans leur generator avec un commentaire
- Le build passe sans erreur (`npm run build`)
- `npm run smoke` → 0 régressions

---

## COMMIT

```
refactor: extract brick selection logic into lib/generators/selectors.js

- scoreBricksByCauchemar: scoring bricks against cauchemars and KPIs
- selectGreedyCoverage: greedy N-brick selection maximizing cauchemar coverage
- selectBestBrick: single best brick by armorScore with filters
- groupBricksByPillar: brick grouping for LinkedIn posts
- Generators keep formatting only, delegate selection to selectors
- Zero output change, zero signature change

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## MERGE

```bash
git checkout main
git merge refactor-generators-logic --no-ff -m "refactor: separate selection logic from formatting in generators"
```
