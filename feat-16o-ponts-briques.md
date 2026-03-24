# PROMPT CLAUDE CODE — FEAT 16o : Ponts entre briques
## Rendre visibles les connexions entre briques consécutives dans l'Arsenal

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b feat-16o-ponts-briques
```

---

## CONTEXTE

Le candidat forge des briques dans des contextes différents. "Pipeline restructuré de 400K€ à 1.2M€ chez Danone." "Onboarding de 15 commerciaux en 3 mois chez Salesforce." "Lancement produit B2B dans une startup de 12 personnes." Le recruteur voit 3 postes. Il pense "instable." Le candidat voit 3 expériences. Il ne sait pas les relier.

Le pont est la compétence transférée d'une brique à l'autre. Danone → Salesforce : "restructurer un process à grande échelle." Salesforce → startup : "transmettre un savoir-faire commercial dans un contexte contraint." Le candidat qui voit le pont transforme l'instabilité en pattern. Le recruteur qui lit le pont voit un narratif, pas une liste.

16n détecte le parcours non linéaire (3+ contextes). 16o montre POURQUOI ces contextes s'enchaînent. 16n répond à "pourquoi tu as changé." 16o répond à "quel fil relie tes changements."

Source : template Narratif Polymathe de Moreau. Le polymathe ne collectionne pas des compétences. Il transfère un pattern d'un domaine à l'autre.

---

## OPÉRATION 0 — STATECHART

Ce chantier touche l'UI (ajout d'un bloc conditionnel dans l'Arsenal).

Lis le code de l'Arsenal (components/sprint/Arsenal.jsx). Rapporte :

| Bloc existant | Condition d'affichage | Position |
|---------------|----------------------|----------|

Le bloc "Ponts entre briques" apparaît si le candidat a 2+ briques validées de contextes différents (detectNonLinearCareer de 16n, ou 2+ contextes si le seuil 3 est trop restrictif).

STOP ici. Rapporte AVANT de coder. Je valide le placement.

---

## CE QUE TU FAIS (4 opérations)

### Opération 1 — Lire et comprendre les modules

Lis ces fichiers dans l'ordre :

1. `lib/generators/generate-interview-questions.js` — note detectNonLinearCareer(bricks). Note comment les contextes sont extraits (extractContext). Réutiliser cette fonction pour identifier les contextes de chaque brique.

2. `lib/generators/helpers.js` — note extractBrickCore. Quels champs sont disponibles : resultLine, contextLine, kpi, etc. Ces champs nourrissent la détection de ponts.

3. `lib/sprint/scoring.js` — note si des fonctions comparent des briques entre elles (scoring croisé, similarité, etc.).

4. `components/sprint/Arsenal.jsx` — note la structure. Identifie où le bloc "Ponts" s'insère (après le bloc trajectoire, après le bloc anti-pattern 16l, ou autre).

Rapporte :

| Question | Réponse |
|----------|---------|
| extractContext de 16n est-elle réutilisable | (oui/non, signature) |
| Champs extractBrickCore utilisables pour détecter des ponts | (liste) |
| Existe-t-il une fonction de comparaison entre briques | (oui/non) |
| Position recommandée du bloc Ponts dans l'Arsenal | (après quel bloc) |

STOP ici. Rapporte avant de coder. La méthode de détection des ponts dépend des données disponibles.

### Opération 2 — Créer detectBridges dans lib/sprint/analysis.js

```javascript
/**
 * Détecte les ponts (compétences transférées) entre paires de briques
 * de contextes différents.
 * @param {Array} bricks - briques validées
 * @returns {Array<{ from: object, to: object, bridge: string }>}
 */
export function detectBridges(bricks) {
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  if (validated.length < 2) return [];

  var bridges = [];

  // Pour chaque paire de briques de contextes différents
  for (var i = 0; i < validated.length; i++) {
    for (var j = i + 1; j < validated.length; j++) {
      var a = validated[i];
      var b = validated[j];

      // Vérifier que les contextes sont différents
      var ctxA = extractContext(a);
      var ctxB = extractContext(b);
      if (ctxA === ctxB) continue;

      // Chercher le pont
      var bridge = findBridge(a, b);
      if (bridge) {
        bridges.push({ from: a, to: b, bridge: bridge });
      }
    }
  }

  return bridges;
}
```

La fonction findBridge cherche le lien entre 2 briques par 3 heuristiques (du plus fiable au moins fiable) :

**Heuristique 1 — Cauchemars communs.**
Si les 2 briques couvrent le même cauchemar (via le scoring cauchemar × brique), le pont est le cauchemar partagé. Exemple : brique Danone + brique Salesforce couvrent toutes les deux "pipeline stagnant" → pont = "restructurer un pipeline."

**Heuristique 2 — KPI communs.**
Si les 2 briques partagent le même kpi (revenue, conversion, retention, etc.), le pont est la métrique commune. Exemple : les 2 briques ont kpi = "revenue" → pont = "croissance du revenu."

**Heuristique 3 — Mots-clés communs.**
Si les 2 briques partagent des mots-clés significatifs dans editText (noms de compétences, verbes d'action communs, termes métier), le pont est le mot-clé partagé. Filtrer les mots vides (le, la, de, un, etc.). Seuil : 2+ mots significatifs communs.

Si aucune heuristique ne trouve de pont → pas de connexion. Faux négatifs acceptables. Le candidat avec 5 briques sans pont a un parcours diversifié, pas un pattern de transfert.

Limiter à 5 ponts maximum (les plus forts). Trier par force (heuristique 1 > 2 > 3).

### Opération 3 — Afficher le bloc Ponts dans l'Arsenal

Dans Arsenal.jsx, ajouter un bloc conditionnel :

```jsx
{/* Bloc Ponts entre briques (16o) */}
{bridges.length > 0 && (
  <div style={blockStyle}>
    <div style={blockTitleStyle}>Le fil de ton parcours</div>
    <div style={blockSubtitleStyle}>
      {bridges.length === 1
        ? "1 connexion détectée entre tes briques."
        : bridges.length + " connexions détectées entre tes briques."}
    </div>
    {bridges.map(function(b, i) {
      return (
        <div key={i} style={bridgeStyle}>
          <div style={bridgeFromStyle}>
            {(b.from.editText || "").substring(0, 60) + "..."}
          </div>
          <div style={bridgeArrowStyle}>→</div>
          <div style={bridgeToStyle}>
            {(b.to.editText || "").substring(0, 60) + "..."}
          </div>
          <div style={bridgeLabelStyle}>
            Pont : {b.bridge}
          </div>
        </div>
      );
    })}
    <div style={blockAdviceStyle}>
      En entretien : "Chaque poste correspond à un problème résolu. Le fil qui relie mes expériences est {bridges[0].bridge}."
    </div>
  </div>
)}
```

Conditions d'affichage :
1. Le candidat a 2+ briques validées.
2. detectBridges retourne au moins 1 pont.
3. Les briques sont de contextes différents.

Si les conditions sont false → le bloc n'apparaît pas.

Style : bordure gauche bleue (#4ecca3, même couleur Signature). Discret. Le bloc montre les connexions, pas un jugement.

### Opération 4 — Enrichir le One-Pager bloc 4 (parcours compressé)

Dans le generator du One-Pager (lib/generators/one-pager.js), modifier buildParcourBlock pour intégrer les ponts si disponibles :

```javascript
function buildParcourBlock(selected, bridges) {
  // Code existant : parcours compressé 3 lignes
  var parcour = /* ... existing code ... */;

  // Si des ponts existent, ajouter une ligne de synthèse
  if (bridges && bridges.length > 0) {
    var bridgeLabels = bridges.slice(0, 3).map(function(b) { return b.bridge; });
    var unique = [...new Set(bridgeLabels)];
    parcour += "\n\nFil conducteur : " + unique.join(", ") + ".";
  }

  return parcour;
}
```

Le One-Pager bloc 4 passe de "3 lignes de parcours" à "3 lignes + fil conducteur." Le recruteur lit "Pipeline restructuré chez Danone → Onboarding chez Salesforce → Lancement startup. Fil conducteur : restructurer un process à grande échelle."

Le "Fil conducteur" ne contient PAS de jargon Abneg@tion. Le document sort de la plateforme.

Si bridges est null ou vide → bloc 4 inchangé (fallback).

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies pas detectNonLinearCareer de 16n. Tu réutilises extractContext.
- Tu ne modifies pas le scoring de densité. Les ponts sont informatifs.
- Tu ne modifies pas le Blindage.
- Tu ne modifies pas les autres blocs de l'Arsenal.
- Tu ne modifies pas le CV (le CV est chronologique, pas narratif).
- Tu ne modifies pas Sprint.jsx sauf pour passer bridges en props à Arsenal si nécessaire.
- Tu ne crées pas de nouvelle route API.
- Tu ne crées pas de dépendance npm.
- Tu ne surfais pas le Blindage au candidat.
- Tu ne forces pas un pont quand il n'existe pas. Faux négatifs > faux positifs.

---

## TEXTE UI (français avec accents)

Titre bloc Arsenal : "Le fil de ton parcours"

Sous-titre singulier : "1 connexion détectée entre tes briques."
Sous-titre pluriel : "{N} connexions détectées entre tes briques."

Label pont : "Pont : {description}"

Conseil : "En entretien : 'Chaque poste correspond à un problème résolu. Le fil qui relie mes expériences est {pont}.'"

One-Pager : "Fil conducteur : {ponts}."

---

## TESTS MANUELS

1. `npm run build` — le build passe.
2. `npm run smoke` — 225+ tests, 0 régressions.
3. Crée un candidat avec 3 briques de contextes différents couvrant le même cauchemar (ex : "pipeline" chez 3 entreprises). Le bloc "Fil de ton parcours" apparaît avec les ponts.
4. Crée un candidat avec 3 briques du même contexte (même entreprise). Pas de ponts. Le bloc n'apparaît pas.
5. Crée un candidat avec 2 briques de contextes différents sans cauchemar commun mais avec le même KPI. Le pont détecté est le KPI.
6. Crée un candidat avec 1 seule brique. Pas de ponts. Le bloc n'apparaît pas.
7. Génère un One-Pager avec des ponts. Le bloc 4 contient "Fil conducteur : {pont}."
8. Génère un One-Pager sans ponts. Le bloc 4 est identique à avant (fallback).

---

## SMOKE TESTS À AJOUTER

```javascript
// 16o — Ponts entre briques
console.log("\n=== BRICK BRIDGES SMOKE ===");

var { detectBridges } = require("../lib/sprint/analysis.js");

assert("detectBridges exists", typeof detectBridges === "function");

// 2 briques même cauchemar, contextes différents → pont
var brickA = { id: "a", status: "validated", editText: "Pipeline restructuré de 400K à 1.2M chez Danone", kpi: "revenue", armorScore: 4 };
var brickB = { id: "b", status: "validated", editText: "Pipeline redressé de 200K à 800K chez Salesforce", kpi: "revenue", armorScore: 3 };
var bridges = detectBridges([brickA, brickB]);
assert("bridge detected between different contexts", bridges.length >= 1);

// 2 briques même contexte → pas de pont
var brickC = { id: "c", status: "validated", editText: "Chez Danone j'ai lancé un produit", kpi: "revenue", armorScore: 2 };
var bridges2 = detectBridges([brickA, brickC]);
assert("no bridge same context", bridges2.length === 0);

// 1 seule brique → pas de pont
var bridges3 = detectBridges([brickA]);
assert("no bridge single brick", bridges3.length === 0);

// 0 briques → pas de pont
var bridges4 = detectBridges([]);
assert("no bridge empty", bridges4.length === 0);
```

Adapter les imports et arguments selon la structure réelle de detectBridges (vérifiée en opération 1).

---

## VÉRIFICATION FINALE

```bash
grep -rn "detectBridges\|bridgeStyle\|Fil conducteur\|fil de ton parcours" lib/ components/
```

detectBridges dans analysis.js (définition) + Arsenal.jsx (consommation) + one-pager.js (consommation) + tests (vérification).
"Fil conducteur" dans one-pager.js uniquement.
"fil de ton parcours" dans Arsenal.jsx uniquement.

Le build passe (`npm run build`).
Les smoke tests passent (`node tests/smoke.mjs`).
