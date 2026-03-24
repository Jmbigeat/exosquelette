# PROMPT CLAUDE CODE — FEAT 16m : Indicateur briques × livrables dans l'Arsenal
## Chaque brique affiche combien de livrables elle alimente

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b feat-16m-bricks-deliverables
```

---

## CONTEXTE

Le candidat forge des briques. Il génère des livrables dans l'Établi. Il ne voit pas la connexion entre les deux. Sa meilleure brique (4/4, dans la Signature) alimente 9/11 livrables. Sa brique la plus faible (1/4, hors Signature) alimente 2/11 livrables. Le candidat ne sait pas pourquoi l'outil lui dit de blinder cette brique-là plutôt qu'une autre.

L'indicateur rend visible le mécanisme d'intérêts composés de la Forge. Une brique bien blindée travaille partout. Une brique mal blindée ne travaille presque nulle part. Le candidat voit "7/11" à côté de sa brique et comprend que chaque amélioration de cette brique améliore 7 livrables en même temps.

Source : Ha Hack de Moreau (checklist d'application par domaine — chaque insight appliqué à 5 domaines = intérêts composés).

---

## OPÉRATION 0 — STATECHART

Ce chantier touche l'UI (ajout d'un indicateur visuel par brique dans l'Arsenal ou dans le récap briques).

Lis le code de l'Arsenal (components/sprint/Arsenal.jsx) et le récap briques (BricksRecap dans panels.jsx ou équivalent). Rapporte :

| Composant | Où les briques sont listées | Format actuel par brique |
|-----------|----------------------------|-------------------------|

L'indicateur "X/11" est un badge ajouté à côté de chaque brique dans la vue existante. Pas un nouveau bloc. Un enrichissement du rendu existant.

STOP ici. Rapporte AVANT de coder. Je valide le placement.

---

## CE QUE TU FAIS (4 opérations)

### Opération 1 — Lire et cartographier les generators

L'objectif est de construire un mapping statique : pour chaque generator, quelles briques utilise-t-il ?

Lis les fichiers dans lib/generators/. Pour chaque generator qui produit un livrable visible dans l'Établi, note :

| Generator | Livrable Établi | Méthode de sélection des briques | Toutes les briques ou sélection ? |
|-----------|-----------------|----------------------------------|----------------------------------|

Les 11 livrables de l'Établi (après unification 17→11) :
1. One-Pager
2. CV calibré
3. Bio LinkedIn
4. Script contact (4 sous-onglets)
5. Message post-entretien (followup)
6. Plan 30j RH
7. Questions (Discovery / Entretien formel)
8. Entretien (Préparation / Fiche de combat)
9. Posts piliers
10. Bundle négociation salariale
11. Plan 90j N+1

Pour chaque generator, identifie :
- Utilise-t-il TOUTES les briques validées ? (ex : CV greedy coverage)
- Utilise-t-il un SUBSET ? (ex : bio = meilleure brique anchor)
- Utilise-t-il les briques INDIRECTEMENT ? (ex : négociation utilise le scoring, pas les briques textuelles)

STOP ici. Rapporte le mapping. Je confirme avant l'implémentation.

### Opération 2 — Créer la fonction computeBrickDeliverableCount

Fichier : `lib/sprint/scoring.js` (c'est le module scoring, le bon endroit).

```javascript
/**
 * Pour chaque brique, calcule combien de livrables elle alimenterait.
 * Le calcul simule la sélection de chaque generator sans le lancer.
 * @param {Array} bricks - toutes les briques validées
 * @param {string} targetRoleId - rôle cible
 * @param {Array} cauchemars - cauchemars actifs
 * @param {object} signature - objet signature (nullable)
 * @returns {Map<string, number>} brickId → nombre de livrables (0 à 11)
 */
export function computeBrickDeliverableCount(bricks, targetRoleId, cauchemars, signature) {
  var counts = new Map();
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  
  validated.forEach(function(b) {
    var count = 0;
    
    // 1. One-Pager : top 3-5 briques par armorScore → vérifier si b est dans le top
    // 2. CV : greedy coverage → vérifier si b serait sélectionnée
    // 3. Bio : meilleure brique anchor → vérifier si b est l'anchor
    // 4. Script contact : briques pertinentes par cauchemar → vérifier
    // 5. Followup : briques avec challenges → vérifier
    // 6. Plan 30j : toutes les briques → +1
    // 7. Questions : briques utilisées pour calibrer → vérifier
    // 8. Entretien/Fiche combat : toutes les briques dans les parades → +1
    // 9. Posts piliers : briques groupées par pilier → vérifier si b a un pilier
    // 10. Négociation : utilise le scoring global → +1 si armorScore > 0
    // 11. Plan 90j : toutes les briques → +1
    
    counts.set(b.id || b.text, count);
  });
  
  return counts;
}
```

IMPORTANT : la fonction ne doit PAS appeler les generators. Elle simule la logique de sélection. Si un generator utilise toutes les briques → count +1 pour chaque brique. Si un generator utilise un subset (top N par armorScore, greedy coverage) → simuler la sélection et compter.

L'approximation est acceptable. Le but n'est pas la précision parfaite. C'est de montrer au candidat "cette brique travaille dans 7 livrables, cette autre dans 2." La différence relative est le signal, pas le chiffre absolu.

Approche simplifiée si le mapping de l'opération 1 le justifie :

```javascript
// Catégories de generators :
// A. Utilisent TOUTES les briques validées → toujours +1
// B. Utilisent un SUBSET (top N) → +1 si armorScore >= seuil
// C. Utilisent des briques spécifiques (par pilier, par cauchemar) → +1 si match

var ALWAYS = 0;  // compter le nombre de generators catégorie A
var brickCount = ALWAYS;

// Catégorie B : +1 si armorScore >= 3 (approximation : les top N ont généralement armor >= 3)
if (b.armorScore >= 3) brickCount += /* nombre de generators catégorie B */;

// Catégorie C : +1 par match spécifique
if (b.selectedPillar) brickCount += 1;  // posts piliers
// etc.
```

### Opération 3 — Afficher l'indicateur dans l'UI

Dans le composant qui liste les briques (Arsenal.jsx, BricksRecap dans panels.jsx, ou Interrogation.jsx — à déterminer en opération 0), ajouter un badge par brique :

```jsx
<span style={{
  display: "inline-block",
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  marginLeft: 8,
  background: count >= 8 ? "#4ecca3" : count >= 5 ? "#f0a500" : "#495670",
  color: count >= 8 ? "#0a0a1a" : "#ccd6f6"
}}>
  {count}/11
</span>
```

Couleurs :
- Vert (#4ecca3) : 8+ livrables → la brique travaille partout.
- Jaune (#f0a500) : 5-7 livrables → moyenne.
- Gris (#495670) : 0-4 livrables → la brique est sous-utilisée.

Le badge est discret (11px, inline). Il ne domine pas l'affichage de la brique. Le candidat le voit sans que ça pollue.

### Opération 4 — Optimiser le calcul

Le calcul est potentiellement coûteux (N briques × 11 checks). Deux protections :

1. useMemo avec dépendance sur [bricks, targetRoleId, cauchemars, signature].
2. Ne recalculer que pour les briques validées (pas les drafts, pas les skippées).

Si le calcul est trop lent (> 50ms sur 20 briques), simplifier l'approximation de l'opération 2.

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies pas les generators. Le calcul SIMULE la sélection, il ne l'exécute pas.
- Tu ne modifies pas le scoring de densité. L'indicateur est informatif, pas un axe de scoring.
- Tu ne modifies pas le Blindage.
- Tu ne modifies pas la Signature.
- Tu ne bloques pas le candidat. L'indicateur est un badge visuel.
- Tu ne crées pas de nouvelle route API.
- Tu ne crées pas de dépendance npm.

---

## TEXTE UI (français avec accents)

Badge : "{N}/11" (ex : "7/11")

Tooltip (optionnel, si le composant Tooltip est disponible) : "Cette brique alimente {N} livrables sur 11."

Pas de titre de section. Le badge vit à côté du nom/texte de la brique.

---

## TESTS MANUELS

1. `npm run build` — le build passe.
2. `npm run smoke` — 209+ tests (ou le total actuel), 0 régressions.
3. Crée un candidat avec 3 briques : une blindée 4/4 (proof, dans la Signature, cauchemar couvert), une blindée 2/4 (elastic), une blindée 0/4 (draft validé). Les badges montrent des valeurs différentes (la première > la deuxième > la troisième).
4. Crée un candidat avec 0 briques. Pas de badge. Pas d'erreur.
5. Ajoute une brique. Le badge apparaît après la validation.

---

## SMOKE TESTS À AJOUTER

```javascript
// 16m — Briques × livrables
console.log("\n=== BRICK DELIVERABLE COUNT SMOKE ===");

var { computeBrickDeliverableCount } = require("../lib/sprint/scoring.js");

assert("computeBrickDeliverableCount exists", typeof computeBrickDeliverableCount === "function");

// Brique blindée 4/4 → devrait alimenter plus de livrables qu'une brique 1/4
var strongBrick = { id: "s1", status: "validated", armorScore: 4, brickType: "proof", editText: "Pipeline restructuré de 400K à 1.2M", kpi: "revenue" };
var weakBrick = { id: "w1", status: "validated", armorScore: 1, brickType: "proof", editText: "J'ai aidé l'équipe" };
var testBricksCount = [strongBrick, weakBrick];

var counts = computeBrickDeliverableCount(testBricksCount, "enterprise_ae", testCauchemars, null);
var strongCount = counts.get("s1") || 0;
var weakCount = counts.get("w1") || 0;
assert("strong brick feeds more deliverables", strongCount >= weakCount);
assert("strong brick feeds at least 3", strongCount >= 3);
assert("count is <= 11", strongCount <= 11);
```

---

## VÉRIFICATION FINALE

```bash
grep -rn "computeBrickDeliverableCount\|\/11" lib/sprint/scoring.js components/
```

computeBrickDeliverableCount dans scoring.js (définition) + Arsenal.jsx ou panels.jsx (consommation).
Le badge "/11" apparaît uniquement dans le composant de rendu des briques.

Le build passe (`npm run build`).
Les smoke tests passent (`node tests/smoke.mjs`).
