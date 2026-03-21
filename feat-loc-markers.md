# PROMPT CLAUDE CODE — FEAT: MARQUEURS LOC + SOLO×ÉQUIPE
## Détecter l'attribution interne/externe dans le vocabulaire du candidat et croiser avec le contexte solo/équipe.

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

Tous les chantiers (1–21) + micro-fixes + feat-audit-cv-forge + feat-salary-comparison mergés. lib/sprint/analysis.js exporte hasDecisionMarkers, hasInfluenceMarkers, hasNumbers. Le micro-fix influence-solo a ajouté isSoloBrick dans Interrogation.jsx. Ce chantier enrichit analysis.js avec un nouveau détecteur (hasInternalLocus) et croise les deux dimensions (LoC × solo/équipe) dans l'Arsenal.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b feat-loc-markers
```

---

## CONTEXTE

Le cadre théorique (cadre-theorique-stress-test.md) identifie 3 construits psychométriques implicites dans l'outil : Need for Achievement (hasDecisionMarkers), Grit (briques cicatrices + Duel), et Locus of Control (non implémenté).

Le LoC se détecte par les verbes d'attribution. "J'ai décidé" = interne. "On m'a confié" = externe. Les deux dimensions se croisent :

1. Solo + interne : "J'ai construit seul et lancé le produit." → Autonomie prouvée.
2. Solo + externe : "J'étais seul parce qu'on ne m'a pas donné de ressources." → Isolement subi.
3. Équipe + interne : "J'ai aligné l'équipe sur la nouvelle stratégie." → Leadership prouvé.
4. Équipe + externe : "L'équipe a décidé et j'ai suivi." → Compliance.

Le candidat qui a un locus interne structurel sur toutes ses briques a un pattern. Ce pattern est un signal de signature (l'axe Singularité). Le candidat qui alterne interne/externe a un signal faible. Le candidat qui est systématiquement externe a un problème de positionnement (l'outil doit le nommer).

---

## CE QUE TU FAIS (4 opérations)

### Opération 1 — Lire l'existant

Lis ces fichiers AVANT de modifier quoi que ce soit :

- `lib/sprint/analysis.js` — identifie hasDecisionMarkers, hasInfluenceMarkers, hasNumbers. Note les listes de marqueurs existantes. Note la signature de chaque fonction (entrée : string, sortie : boolean).
- `components/sprint/Interrogation.jsx` — identifie isSoloBrick et SOLO_MARKERS. Note comment ils sont utilisés dans l'angle 4.
- `components/sprint/Arsenal.jsx` — identifie les blocs existants (1-5). Note où ajouter un bloc 6.
- `lib/sprint/scoring.js` — identifie computeDensityScore. Note les 6 axes et leurs poids. NE PAS modifier le scoring.

### Opération 2 — Ajouter hasInternalLocus et hasExternalLocus dans analysis.js

Deux nouvelles fonctions exportées. Même pattern que hasDecisionMarkers (string in, boolean out).

```javascript
/**
 * Detects internal locus of control markers in text.
 * Internal = the candidate attributes outcomes to their own actions.
 * @param {string} text
 * @returns {boolean}
 */
export function hasInternalLocus(text) {
  var lower = text.toLowerCase();
  var markers = [
    "j'ai décidé", "j'ai initié", "j'ai lancé", "j'ai tranché",
    "j'ai refusé", "j'ai convaincu", "j'ai imposé", "j'ai choisi",
    "j'ai restructuré", "j'ai négocié", "j'ai piloté", "j'ai arbitré",
    "j'ai provoqué", "j'ai créé", "j'ai construit", "j'ai transformé",
    "ma décision", "mon initiative", "mon choix", "mon arbitrage",
    "j'ai pris la décision", "j'ai pris l'initiative"
  ];
  return markers.some(function (m) { return lower.includes(m); });
}

/**
 * Detects external locus of control markers in text.
 * External = the candidate attributes outcomes to circumstances or others.
 * @param {string} text
 * @returns {boolean}
 */
export function hasExternalLocus(text) {
  var lower = text.toLowerCase();
  var markers = [
    "on m'a confié", "on m'a demandé", "on m'a chargé",
    "le contexte a permis", "le marché était favorable",
    "l'équipe a décidé", "la direction a voulu",
    "j'ai eu la chance", "j'ai eu l'opportunité",
    "on m'a proposé", "on m'a nommé", "on m'a affecté",
    "c'était demandé", "c'était prévu", "il fallait",
    "j'ai été assigné", "j'ai été mandaté"
  ];
  return markers.some(function (m) { return lower.includes(m); });
}
```

Ajouter aussi isSoloBrick dans analysis.js (extraire de Interrogation.jsx pour le rendre réutilisable). La fonction isSoloBrick dans Interrogation.jsx est remplacée par un import depuis analysis.js. Les SOLO_MARKERS restent les mêmes.

```javascript
/**
 * Detects solo context markers in brick text.
 * @param {string} text
 * @returns {boolean}
 */
export function isSoloBrick(text) {
  var lower = text.toLowerCase();
  var markers = [
    "seul", "solo", "fondateur", "freelance", "indépendant",
    "sans équipe", "zéro équipe", "de a à z",
    "j'ai construit", "j'ai créé", "j'ai lancé",
    "side project", "bootstrap"
  ];
  return markers.some(function (m) { return lower.includes(m); });
}
```

### Opération 3 — Mettre à jour Interrogation.jsx

Remplacer la définition locale de isSoloBrick et SOLO_MARKERS par un import :

```javascript
import { isSoloBrick } from "@/lib/sprint/analysis";
```

Supprimer la déclaration locale de SOLO_MARKERS et isSoloBrick. L'appel isSoloBrick(brick.text) reste identique. Zéro changement de comportement.

### Opération 4 — Ajouter le diagnostic LoC dans Arsenal.jsx (bloc 6)

Le bloc 6 est toujours visible (pas conditionnel sur le salaire — il analyse les briques). Il s'affiche si le candidat a ≥ 3 briques validées.

Calcul via useMemo :

```javascript
var locDiag = useMemo(function () {
  if (!bricks || bricks.length < 3) return null;
  var validated = bricks.filter(function (b) { return b.status === "validated"; });
  if (validated.length < 3) return null;

  var internal = 0;
  var external = 0;
  var solo = 0;
  var team = 0;

  validated.forEach(function (b) {
    var text = b.editText || b.text || "";
    if (hasInternalLocus(text)) internal++;
    if (hasExternalLocus(text)) external++;
    if (isSoloBrick(text)) solo++;
    else team++;
  });

  var total = validated.length;
  var internalRatio = Math.round((internal / total) * 100);
  var externalRatio = Math.round((external / total) * 100);

  // Dominant quadrant
  var dominant = null;
  if (solo > team && internal > external) dominant = "autonome";
  else if (solo > team && external >= internal) dominant = "isolé";
  else if (team >= solo && internal > external) dominant = "leader";
  else if (team >= solo && external >= internal) dominant = "exécutant";

  var labels = {
    autonome: "Autonomie prouvée — tu construis et décides seul.",
    isolé: "Isolement subi — tes briques montrent un contexte solo sans prise de décision. Reformule avec ce que TU as décidé.",
    leader: "Leadership prouvé — tu alignes et décides en équipe.",
    exécutant: "Exécution collective — tes briques montrent l'équipe qui décide. Reformule avec ce que TU as initié."
  };

  return {
    internal: internal,
    external: external,
    solo: solo,
    team: team,
    internalRatio: internalRatio,
    externalRatio: externalRatio,
    dominant: dominant,
    label: labels[dominant] || null,
    total: total
  };
}, [bricks]);
```

Imports à ajouter dans Arsenal.jsx :
```javascript
import { hasInternalLocus, hasExternalLocus, isSoloBrick } from "@/lib/sprint/analysis";
```

Affichage (après le bloc 5 salaire, avant le textarea CV) :

```
┌─────────────────────────────────────────────────────────┐
│ POSTURE DÉCISIONNELLE                                    │
│                                                          │
│ Attribution interne : 4/5 briques (80%)                  │
│ Attribution externe : 1/5 briques (20%)                  │
│ Contexte : 3 solo / 2 équipe                             │
│                                                          │
│ Leadership prouvé — tu alignes et décides en équipe.     │
└─────────────────────────────────────────────────────────┘
```

Couleurs :
- Label "POSTURE DÉCISIONNELLE" : même style que les autres labels Arsenal
- Dominant "autonome" ou "leader" : #4ecca3 (vert)
- Dominant "isolé" ou "exécutant" : #ff9800 (orange) — pas rouge. C'est un diagnostic, pas une erreur. Le candidat reformule.
- Ratios : #ccd6f6 (texte normal)

Si dominant est "isolé" ou "exécutant", ajouter sous le label :
"Reformule tes briques avec des verbes de décision : 'j'ai décidé', 'j'ai lancé', 'j'ai tranché.' L'outil réévalue automatiquement."

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies pas le scoring (computeDensityScore). Le LoC est un diagnostic, pas un axe de densité. Il pourra le devenir en V3.
- Tu ne modifies pas la signature. Le LoC alimentera la signature en V3.
- Tu ne modifies pas le Duel.
- Tu ne modifies pas les generators.
- Tu ne modifies pas l'Éclaireur.
- Tu ne modifies pas lib/forge/audit-cv-forge.js.
- Tu ne modifies pas le champ salaire ni le comparatif salarial.
- Tu ne crées pas de route.
- Tu ne crées pas de table Supabase.

---

## TESTS MANUELS

1. Forge une brique avec "J'ai décidé de restructurer le pipeline seul." Va dans l'Arsenal. Vérifie que le bloc "POSTURE DÉCISIONNELLE" apparaît avec internal=1, solo=1.
2. Forge 2 briques supplémentaires avec "J'ai aligné l'équipe sur la stratégie" et "L'équipe a décidé du planning." Vérifie que le diagnostic montre internal=2, external=1, solo=1, team=2. Dominant = "leader" (team > solo, internal > external).
3. Avec moins de 3 briques : vérifie que le bloc est absent.
4. Brique avec "On m'a confié la mission" : vérifie que external++ et le diagnostic s'ajuste.
5. Vérifie que le stress test angle 4 fonctionne toujours (isSoloBrick importé depuis analysis.js, comportement identique).
6. `npm run build` — zéro erreur.
7. `npm run smoke` — zéro régression.

---

## CONVENTIONS (ne pas modifier)

- Langue du code : anglais
- Langue des strings UI : français avec accents corrects (é, è, ê, à, ù, ç)
- Pas de console.log en production
- Les fonctions exportées ont un JSDoc
- Pas d'unicode escapes (écrire é, pas \u00E9)

---

## VÉRIFICATION FINALE

- hasInternalLocus exportée depuis analysis.js (22 marqueurs)
- hasExternalLocus exportée depuis analysis.js (16 marqueurs)
- isSoloBrick exportée depuis analysis.js (13 marqueurs) — plus de définition locale dans Interrogation.jsx
- Interrogation.jsx importe isSoloBrick depuis analysis.js
- Arsenal bloc 6 "POSTURE DÉCISIONNELLE" conditionnel (≥ 3 briques validées)
- 4 quadrants : autonome (vert), leader (vert), isolé (orange), exécutant (orange)
- Message de reformulation pour isolé/exécutant
- Aucune modification du scoring, de la signature, du Duel, des generators
- Le build passe sans erreur
- Le smoke test passe sans régression

---

## COMMIT

```
feat: LoC markers + solo×équipe diagnostic in Arsenal

- lib/sprint/analysis.js: hasInternalLocus (22 markers), hasExternalLocus (16 markers), isSoloBrick (extracted from Interrogation.jsx)
- Interrogation.jsx: import isSoloBrick from analysis.js (removes local definition)
- Arsenal.jsx: bloc 6 "Posture décisionnelle" — 4 quadrants (autonome/leader/isolé/exécutant)
- Diagnostic with reformulation guidance for external locus
- Zero modification to scoring, signature, Duel, or generators

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## MERGE

```bash
git checkout main
git merge feat-loc-markers --no-ff -m "feat: LoC markers + solo×équipe diagnostic in Arsenal"
npm run smoke
```
