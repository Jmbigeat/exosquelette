# PROMPT CLAUDE CODE — FEAT 16h : Zeigarnik — boucles ouvertes Éclaireur + Forge
## Rendre visibles les tâches incomplètes pour fermer les boucles cognitives du candidat

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b feat-16h-zeigarnik
```

---

## CONTEXTE

L'effet Zeigarnik : les tâches incomplètes restent en mémoire et drainent l'attention cognitive. Le cerveau garde une "boucle ouverte" pour chaque action commencée et non terminée.

Le candidat dans la Forge a des dizaines de boucles ouvertes invisibles. 3 briques non blindées. 2 cauchemars non couverts. La Signature non détectée. Le Duel non passé. 5 livrables non générés. Le candidat ne voit aucune de ces boucles. Il voit "tu as 5 briques" et pense avoir fini. Il quitte. Il revient 3 jours plus tard. Il ne sait pas par où reprendre.

L'Éclaireur a une boucle : le candidat a scanné une offre, vu son score, et quitté. Il connaît le problème mais n'a pas agi.

Le Zeigarnik inversé : au lieu de laisser les boucles ouvertes drainer silencieusement, l'outil les nomme. Le candidat qui voit "3 boucles ouvertes" a envie de les fermer. La boucle nommée est plus facile à fermer que la boucle invisible.

4 surfaces existent. Seules 2 sont implémentables (Éclaireur + Forge). La Trempe (Couche 2) et l'Échoppe (Couche 3) seront enrichies quand elles seront implémentées.

---

## OPÉRATION 0 — STATECHART

Ce chantier touche l'UI sur 2 surfaces.

Surface 1 — Éclaireur : composant Eclaireur.jsx. Ajout d'un bloc conditionnel dans le résultat de l'analyse (après le score).

Surface 2 — Forge : composant Arsenal.jsx. Ajout d'un bloc récapitulatif des boucles ouvertes (position à déterminer).

Lis les deux composants. Rapporte :

| Surface | Composant | Où le candidat "termine" actuellement | Boucles ouvertes possibles |
|---------|-----------|--------------------------------------|---------------------------|

STOP ici. Rapporte AVANT de coder. Je valide le placement des deux blocs.

---

## CE QUE TU FAIS (4 opérations)

### Opération 1 — Lire et cartographier les boucles ouvertes

Lis ces fichiers dans l'ordre :

1. `components/eclaireur/Eclaireur.jsx` — identifie le résultat de l'analyse (score, cauchemars détectés, CTA vers Forge). Note ce qui est visible après le scan. Le candidat voit-il déjà les cauchemars non couverts ?

2. `components/sprint/Arsenal.jsx` — identifie tous les blocs actuels. Note ceux qui montrent déjà une information de "manque" (densité incomplète, cauchemars non couverts, etc.). Le bloc radar de densité montre-t-il les axes faibles ?

3. `lib/sprint/scoring.js` — note les fonctions qui calculent la complétude : densityScore, cauchemar coverage, armorScore moyen. Ces données nourrissent le Zeigarnik.

4. `components/Sprint.jsx` — identifie si le statut de la Signature (détectée/non détectée), du Duel (passé/non passé), et des livrables (générés/non générés) est accessible depuis le state.

Rapporte :

| Boucle ouverte | Données nécessaires | Disponible dans le state ? | Surface concernée |
|----------------|--------------------|-----------------------------|-------------------|
| Briques non blindées | bricks.filter(armorScore < 4) | ? | Forge |
| Cauchemars non couverts | cauchemar coverage < 100% | ? | Éclaireur + Forge |
| Signature non détectée | signature === null | ? | Forge |
| Duel non passé | duelResults === null | ? | Forge |
| Livrables non générés | ? | ? | Forge |
| Offre scannée mais pas forgée | sessionStorage eclaireur_data | ? | Éclaireur |

STOP ici. Rapporte avant de coder. Certaines boucles existent peut-être déjà dans l'UI (Arsenal radar, next action). On ne duplique pas.

### Opération 2 — Créer computeOpenLoops dans lib/sprint/scoring.js

```javascript
/**
 * Calcule les boucles ouvertes (Zeigarnik) du candidat.
 * Chaque boucle est une tâche commencée et non terminée.
 * @param {object} params - { bricks, cauchemars, signature, duelResults, densityScore }
 * @returns {Array<{ id: string, label: string, action: string, priority: number }>}
 */
export function computeOpenLoops(params) {
  var loops = [];
  var bricks = params.bricks || [];
  var validated = bricks.filter(function(b) { return b.status === "validated"; });

  // 1. Briques non blindées (armorScore < 4)
  var unarmored = validated.filter(function(b) { return (b.armorScore || 0) < 4; });
  if (unarmored.length > 0) {
    loops.push({
      id: "unarmored_bricks",
      label: unarmored.length + " brique" + (unarmored.length > 1 ? "s" : "") + " non blindée" + (unarmored.length > 1 ? "s" : ""),
      action: "Blinde-les pour que tes livrables soient crédibles.",
      priority: 1
    });
  }

  // 2. Cauchemars non couverts
  var totalCauchemars = (params.cauchemars || []).length;
  var covered = /* calcul depuis cauchemar coverage */;
  var uncovered = totalCauchemars - covered;
  if (uncovered > 0) {
    loops.push({
      id: "uncovered_cauchemars",
      label: uncovered + " cauchemar" + (uncovered > 1 ? "s" : "") + " non couvert" + (uncovered > 1 ? "s" : ""),
      action: "Forge une brique qui répond à ce que le recruteur redoute.",
      priority: 2
    });
  }

  // 3. Signature non détectée (seulement si 3+ briques blindées)
  if (!params.signature && validated.filter(function(b) { return (b.armorScore || 0) >= 3; }).length >= 2) {
    loops.push({
      id: "no_signature",
      label: "Signature non détectée",
      action: "Blinde encore 1-2 briques pour déclencher la détection.",
      priority: 3
    });
  }

  // 4. Duel non passé (seulement si densité >= 40%)
  if (!params.duelResults && (params.densityScore || 0) >= 40) {
    loops.push({
      id: "duel_not_done",
      label: "Duel non passé",
      action: "Teste la résistance de tes briques sous pression.",
      priority: 4
    });
  }

  // Trier par priorité
  loops.sort(function(a, b) { return a.priority - b.priority; });

  return loops;
}
```

Conditions d'apparition des boucles :
- Briques non blindées : toujours (dès 1 brique validée avec armorScore < 4).
- Cauchemars non couverts : toujours (si cauchemars > 0 et couverture < 100%).
- Signature non détectée : seulement si le candidat a au moins 2 briques avec armorScore >= 3 (il est "proche" du seuil). Pas d'alerte si le candidat a 0 brique.
- Duel non passé : seulement si densité >= 40% (le candidat a assez de matière pour le Duel).

Ne PAS inclure "livrables non générés." Le candidat génère des livrables quand il veut. Ce n'est pas une tâche à compléter. C'est un outil à utiliser.

### Opération 3 — Afficher dans la Forge (Arsenal)

Dans Arsenal.jsx, ajouter un bloc EN HAUT du composant (avant le radar de densité). Le Zeigarnik est la première chose que le candidat voit dans l'Arsenal.

```jsx
{/* Bloc Zeigarnik — boucles ouvertes (16h) */}
{openLoops.length > 0 && (
  <div style={zeigarnikBlockStyle}>
    <div style={zeigarnikTitleStyle}>
      {openLoops.length} boucle{openLoops.length > 1 ? "s" : ""} ouverte{openLoops.length > 1 ? "s" : ""}
    </div>
    {openLoops.map(function(loop) {
      return (
        <div key={loop.id} style={loopItemStyle}>
          <div style={loopLabelStyle}>{loop.label}</div>
          <div style={loopActionStyle}>{loop.action}</div>
        </div>
      );
    })}
  </div>
)}
```

Style : fond sombre, bordure gauche orange (#e67e22). L'orange signale "en cours" (pas rouge = erreur, pas vert = fait). Compact. Chaque boucle = 2 lignes (label + action).

Quand le candidat ferme une boucle (blinde une brique, couvre un cauchemar, déclenche la Signature, passe le Duel), la boucle disparaît en temps réel. 0 boucles = le bloc disparaît.

### Opération 4 — Afficher dans l'Éclaireur (résultat post-scan)

Dans Eclaireur.jsx, APRÈS le score et les cauchemars détectés, ajouter un micro-bloc :

```jsx
{/* Zeigarnik Éclaireur (16h) */}
{cauchemarsDetected > 0 && (
  <div style={eclaireurLoopStyle}>
    {cauchemarsDetected} cauchemar{cauchemarsDetected > 1 ? "s" : ""} détecté{cauchemarsDetected > 1 ? "s" : ""}.
    {" "}Aucune preuve forgée pour l'instant.
  </div>
)}
```

Le texte est factuel. Pas de CTA agressif. Le candidat voit "3 cauchemars détectés. Aucune preuve forgée." La boucle ouverte travaille toute seule.

Le CTA vers la Forge existe déjà. Le micro-bloc renforce la motivation sans dupliquer le CTA.

---

## CE QUE TU NE FAIS PAS

- Tu ne bloques pas le candidat. Les boucles ouvertes sont informatives. Zéro gate.
- Tu ne modifies pas le scoring de densité. Les boucles sont un affichage, pas un axe de scoring.
- Tu ne modifies pas le radar Arsenal existant. Le bloc Zeigarnik est un ajout au-dessus.
- Tu ne modifies pas la "next action" existante dans l'Arsenal. Le Zeigarnik montre les boucles. La next action montre la prochaine étape. Les deux coexistent.
- Tu ne dupliques pas l'information. Si l'Arsenal montre déjà "2 cauchemars non couverts" dans le radar, le Zeigarnik dit "2 cauchemars non couverts" une seule fois (dans le Zeigarnik, pas dans le radar ET le Zeigarnik).
- Tu ne comptes PAS les livrables non générés comme boucles. Les livrables sont des outils, pas des tâches.
- Tu ne crées pas de boucles pour la Trempe ou l'Échoppe. Elles n'existent pas encore.
- Tu ne modifies pas Sprint.jsx sauf pour passer openLoops en props à Arsenal si nécessaire.
- Tu ne crées pas de nouvelle route API.
- Tu ne crées pas de dépendance npm.

---

## TEXTE UI (français avec accents)

Titre Forge : "{N} boucle(s) ouverte(s)"

Boucle briques : "{N} brique(s) non blindée(s)" / "Blinde-les pour que tes livrables soient crédibles."
Boucle cauchemars : "{N} cauchemar(s) non couvert(s)" / "Forge une brique qui répond à ce que le recruteur redoute."
Boucle Signature : "Signature non détectée" / "Blinde encore 1-2 briques pour déclencher la détection."
Boucle Duel : "Duel non passé" / "Teste la résistance de tes briques sous pression."

Éclaireur : "{N} cauchemar(s) détecté(s). Aucune preuve forgée pour l'instant."

---

## TESTS MANUELS

1. `npm run build` — le build passe.
2. `npm run smoke` — 240+ tests, 0 régressions.
3. Crée un candidat avec 3 briques (armorScore 1, 2, 3). L'Arsenal montre "3 boucles ouvertes" (briques non blindées + cauchemars non couverts + pas de Signature car < 3 briques blindées). Pas de boucle Duel (densité trop basse).
4. Blinde 1 brique à 4/4. La boucle "briques non blindées" passe de 3 à 2. Temps réel.
5. Déclenche la Signature. La boucle "Signature non détectée" disparaît.
6. Passe le Duel. La boucle "Duel non passé" disparaît.
7. Couvre tous les cauchemars. La boucle "cauchemars non couverts" disparaît.
8. 0 boucles → le bloc Zeigarnik disparaît.
9. Éclaireur : scanne une offre. Le micro-bloc "{N} cauchemars détectés. Aucune preuve forgée." apparaît après le score.
10. Candidat sans briques (juste inscrit) : 0 boucle (rien à montrer, le candidat n'a pas encore commencé).

---

## SMOKE TESTS À AJOUTER

```javascript
// 16h — Zeigarnik boucles ouvertes
console.log("\n=== ZEIGARNIK OPEN LOOPS SMOKE ===");

var { computeOpenLoops } = require("../lib/sprint/scoring.js");

assert("computeOpenLoops exists", typeof computeOpenLoops === "function");

// Candidat avec briques non blindées + pas de signature + pas de duel
var loops1 = computeOpenLoops({
  bricks: [
    { status: "validated", armorScore: 1 },
    { status: "validated", armorScore: 2 }
  ],
  cauchemars: [{ id: "c1" }, { id: "c2" }],
  signature: null,
  duelResults: null,
  densityScore: 20
});
assert("has unarmored bricks loop", loops1.some(function(l) { return l.id === "unarmored_bricks"; }));
assert("has uncovered cauchemars loop", loops1.some(function(l) { return l.id === "uncovered_cauchemars"; }));
assert("no signature loop (too few armored)", !loops1.some(function(l) { return l.id === "no_signature"; }));
assert("no duel loop (density too low)", !loops1.some(function(l) { return l.id === "duel_not_done"; }));

// Candidat tout blindé + signature + duel passé
var loops2 = computeOpenLoops({
  bricks: [
    { status: "validated", armorScore: 4 },
    { status: "validated", armorScore: 4 },
    { status: "validated", armorScore: 4 }
  ],
  cauchemars: [],
  signature: { formulation: "test" },
  duelResults: { score: 3 },
  densityScore: 80
});
assert("zero loops when all complete", loops2.length === 0);

// Candidat densité >= 40 sans duel
var loops3 = computeOpenLoops({
  bricks: [{ status: "validated", armorScore: 4 }],
  cauchemars: [],
  signature: { formulation: "test" },
  duelResults: null,
  densityScore: 45
});
assert("duel loop when density >= 40", loops3.some(function(l) { return l.id === "duel_not_done"; }));
```

---

## VÉRIFICATION FINALE

```bash
grep -rn "computeOpenLoops\|openLoops\|boucle.*ouverte\|zeigarnik" lib/ components/
```

computeOpenLoops dans scoring.js (définition) + Arsenal.jsx (consommation) + tests (vérification).
"boucle(s) ouverte(s)" dans Arsenal.jsx uniquement.
Le micro-bloc Éclaireur dans Eclaireur.jsx uniquement.

Le build passe (`npm run build`).
Les smoke tests passent (`node tests/smoke.mjs`).
