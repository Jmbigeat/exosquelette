# PROMPT CLAUDE CODE — FEAT 16p : Réflexes comportementaux entretien
## Ajouter un bloc "4 réflexes à surveiller" dans la fiche de combat, calibré par séniorité

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b feat-16p-reflexes-entretien
```

---

## CONTEXTE

La fiche de combat assemble 6 blocs depuis 8 sources. Le candidat la lit en 2 minutes avant l'entretien. Elle couvre le contenu (quoi dire) : cauchemars, briques, parades, questions discovery, pitch, Signature, posture, ratio, position marché.

Ce qui manque : la posture (comment le dire). Un candidat enterprise_ae qui connaît toutes ses parades rate son entretien parce qu'il corrige l'intervieweur en direct. Un candidat senior_pm qui dit "dans mon ancien poste on faisait comme ça" vend son passé au lieu de projeter son futur.

4 réflexes identifiés par Marshall Goldsmith (What Got You Here Won't Get You There). Ce sont des biais comportementaux que les candidats seniors activent en entretien sans s'en rendre compte :

1. Ajouter trop de valeur. Le candidat complète ou corrige chaque idée de l'intervieweur. Il pense nuancer. L'intervieweur entend "il a réponse à tout." La contre-mesure : laisser un silence après la question. Répondre au point posé, pas au point voisin.

2. Le "oui mais." Le candidat est challengé sur une décision passée. Il défend. Il pense expliquer le contexte. L'intervieweur entend de la rigidité. La contre-mesure : remplacer "oui mais" par "oui, et dans ce contexte j'ai aussi considéré..."

3. Écouter en mode réponse. Le candidat prépare sa prochaine phrase pendant que l'intervieweur parle. Les recruteurs seniors testent ça délibérément. La contre-mesure : reformuler la question avant de répondre. "Si je comprends bien, vous demandez..."

4. Vendre son passé au lieu d'incarner son futur. "Chez Danone on faisait comme ça." L'intervieweur ne recrute pas pour reproduire Danone. Il recrute pour résoudre SON problème. La contre-mesure : chaque réponse commence par le contexte du poste visé, pas par l'ancien poste.

Les 4 réflexes ne touchent pas tous les candidats de la même façon. La séniorité détermine le réflexe dominant :

Leader (C-level, VP, directeur) : réflexes 1 et 3 dominants. Le leader est habitué à trancher. Il ajoute de la valeur par réflexe. Il écoute en mode "décision" pas en mode "compréhension."

Manager : réflexes 2 et 4 dominants. Le manager défend ses décisions passées (il a managé des équipes, il a des résultats à protéger). Il vend son expérience de management au lieu de projeter sa méthode.

IC (Individual Contributor) : réflexes 4 et 2 dominants. L'IC vend son expertise technique passée. Il a moins de réflexe 1 (il n'a pas l'habitude de compléter les autres).

Source : Marshall Goldsmith via Samantha Pagés (coach carrière LinkedIn).

---

## OPÉRATION 0 — STATECHART

Ce chantier ne touche PAS l'UI. Il enrichit le contenu généré par le generator de la fiche de combat. Aucun état, aucune transition, aucun écran modifié. Opération 0 non applicable.

---

## CE QUE TU FAIS (3 opérations)

### Opération 1 — Lire le generator de la fiche de combat

Lis ces fichiers dans l'ordre :

1. Le generator de la fiche de combat (generate-combat-sheet.js ou équivalent dans lib/generators/) — note sa signature, les 6 blocs existants, comment la séniorité est accessible (paramètre direct ou via le vault/state).

2. `lib/sprint/references.js` — note SENIORITY_LEVELS et SENIORITY_CALIBRATION. Note si les calibrations par séniorité sont disponibles pour enrichir les réflexes.

Rapporte :

| Question | Réponse |
|----------|---------|
| Signature du generator fiche de combat | (params, return type) |
| Les 6 blocs actuels (noms/descriptions) | (liste) |
| La séniorité est-elle accessible dans le generator | (oui/non, comment) |
| Format d'un bloc existant | (template, structure) |

STOP ici. Rapporte avant de coder. L'intégration dépend de l'accès à la séniorité.

### Opération 2 — Ajouter INTERVIEW_REFLEXES dans references.js

```javascript
/**
 * 4 réflexes comportementaux à surveiller en entretien (Goldsmith).
 * Calibrés par séniorité : chaque niveau a 2 réflexes dominants.
 */
export var INTERVIEW_REFLEXES = [
  {
    id: "adding_value",
    label: "Ajouter trop de valeur",
    risk: "Tu complètes ou corriges l'intervieweur par réflexe. Il entend 'il a réponse à tout.'",
    counter: "Laisse un silence après la question. Réponds au point posé, pas au point voisin.",
    dominantFor: ["leader"]
  },
  {
    id: "yes_but",
    label: "Le 'oui mais'",
    risk: "On te challenge sur une décision. Tu défends. L'intervieweur entend de la rigidité.",
    counter: "Remplace 'oui mais' par 'oui, et dans ce contexte j'ai aussi considéré...'",
    dominantFor: ["manager", "ic"]
  },
  {
    id: "listening_to_reply",
    label: "Écouter en mode réponse",
    risk: "Tu prépares ta prochaine phrase pendant que l'intervieweur parle. Les recruteurs seniors testent ça.",
    counter: "Reformule la question avant de répondre : 'Si je comprends bien, vous demandez...'",
    dominantFor: ["leader"]
  },
  {
    id: "selling_past",
    label: "Vendre son passé",
    risk: "'Chez Danone on faisait comme ça.' L'intervieweur ne recrute pas pour reproduire Danone.",
    counter: "Chaque réponse commence par le contexte du poste visé, pas par l'ancien poste.",
    dominantFor: ["manager", "ic"]
  }
];
```

### Opération 3 — Ajouter le bloc 7 dans le generator de la fiche de combat

Après les 6 blocs existants, ajouter un bloc "Réflexes à surveiller" :

```javascript
// ── BLOC 7 — RÉFLEXES À SURVEILLER (16p) ──
var seniority = /* récupérer depuis le state/vault/param — vérifier en opération 1 */;
var seniorityKey = seniority === "Leader" ? "leader" : seniority === "Manager" ? "manager" : "ic";

// Trier : réflexes dominants d'abord, puis les autres
var sorted = INTERVIEW_REFLEXES.slice().sort(function(a, b) {
  var aMatch = a.dominantFor.indexOf(seniorityKey) !== -1 ? 0 : 1;
  var bMatch = b.dominantFor.indexOf(seniorityKey) !== -1 ? 0 : 1;
  return aMatch - bMatch;
});

var reflexBlock = '--- Réflexes à surveiller ---\n\n';

sorted.forEach(function(r, i) {
  var isDominant = r.dominantFor.indexOf(seniorityKey) !== -1;
  reflexBlock += r.label + (isDominant ? ' ⚠️' : '') + '\n';
  reflexBlock += 'Risque : ' + r.risk + '\n';
  reflexBlock += 'Parade : ' + r.counter + '\n\n';
});
```

Si la séniorité N'EST PAS accessible dans le generator (vérifier en opération 1) :

Afficher les 4 réflexes dans l'ordre par défaut (1-2-3-4), sans marqueur ⚠️. Le candidat voit les 4. Pas de calibration. La calibration sera ajoutée quand la séniorité sera propagée au generator.

Si la séniorité EST accessible :

Les 2 réflexes dominants sont en premier avec un marqueur ⚠️. Les 2 autres suivent sans marqueur. Le candidat lit les 2 premiers en priorité.

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies pas les 6 blocs existants de la fiche de combat. Tu ajoutes un 7ème bloc.
- Tu ne modifies pas le scoring, la densité, le Blindage.
- Tu ne modifies pas l'UI (Sprint.jsx, panels.jsx, Arsenal.jsx).
- Tu ne modifies pas le One-Pager, le CV, la bio, ou les contact scripts.
- Tu ne modifies pas le stress test, le Duel, ou les questions d'entretien.
- Tu ne crées pas de nouvelle route API.
- Tu ne crées pas de dépendance npm.
- Tu ne surfais pas le Blindage au candidat.

---

## TEXTE UI (français avec accents)

Titre bloc : "Réflexes à surveiller"

Réflexe 1 label : "Ajouter trop de valeur"
Réflexe 1 risque : "Tu complètes ou corriges l'intervieweur par réflexe. Il entend 'il a réponse à tout.'"
Réflexe 1 parade : "Laisse un silence après la question. Réponds au point posé, pas au point voisin."

Réflexe 2 label : "Le 'oui mais'"
Réflexe 2 risque : "On te challenge sur une décision. Tu défends. L'intervieweur entend de la rigidité."
Réflexe 2 parade : "Remplace 'oui mais' par 'oui, et dans ce contexte j'ai aussi considéré...'"

Réflexe 3 label : "Écouter en mode réponse"
Réflexe 3 risque : "Tu prépares ta prochaine phrase pendant que l'intervieweur parle. Les recruteurs seniors testent ça."
Réflexe 3 parade : "Reformule la question avant de répondre : 'Si je comprends bien, vous demandez...'"

Réflexe 4 label : "Vendre son passé"
Réflexe 4 risque : "'Chez Danone on faisait comme ça.' L'intervieweur ne recrute pas pour reproduire Danone."
Réflexe 4 parade : "Chaque réponse commence par le contexte du poste visé, pas par l'ancien poste."

---

## TESTS MANUELS

1. `npm run build` — le build passe.
2. `npm run smoke` — 248+ tests, 0 régressions.
3. Génère une fiche de combat pour un enterprise_ae (séniorité Leader si accessible). Le bloc "Réflexes à surveiller" apparaît après les 6 blocs existants. Les réflexes 1 et 3 ont le marqueur ⚠️ (dominants Leader).
4. Génère une fiche de combat pour un senior_pm (séniorité IC). Les réflexes 2 et 4 ont le marqueur ⚠️.
5. Génère une fiche de combat sans séniorité définie (fallback). Les 4 réflexes apparaissent dans l'ordre par défaut, sans marqueur.
6. Vérifie que le texte des réflexes ne contient pas de jargon Abneg@tion ("Blindage", "densité", "cauchemar"). Le candidat imprime cette fiche.

---

## SMOKE TESTS À AJOUTER

```javascript
// 16p — Réflexes comportementaux entretien
console.log("\n=== INTERVIEW REFLEXES SMOKE ===");

assert("INTERVIEW_REFLEXES exists", Array.isArray(references.INTERVIEW_REFLEXES));
assert("INTERVIEW_REFLEXES has 4 items", references.INTERVIEW_REFLEXES.length === 4);
assert("each reflex has id, label, risk, counter, dominantFor", references.INTERVIEW_REFLEXES.every(function(r) {
  return r.id && r.label && r.risk && r.counter && Array.isArray(r.dominantFor);
}));

// Fiche de combat includes reflexes block
var combatSheet = generators.generateCombatSheet(testBricks, "enterprise_ae", testCauchemars);
assert("combat sheet contains reflexes section", combatSheet.indexOf("Réflexes à surveiller") !== -1);
assert("combat sheet contains adding_value reflex", combatSheet.indexOf("Ajouter trop de valeur") !== -1);
assert("combat sheet contains selling_past reflex", combatSheet.indexOf("Vendre son passé") !== -1);
```

Adapter les imports et arguments selon la signature réelle de generateCombatSheet (vérifiée en opération 1).

---

## VÉRIFICATION FINALE

```bash
grep -rn "INTERVIEW_REFLEXES\|Réflexes à surveiller\|dominantFor" lib/sprint/references.js lib/generators/
```

INTERVIEW_REFLEXES dans references.js (définition) + generator fiche de combat (consommation) + tests (vérification).
"Réflexes à surveiller" dans le generator uniquement.

Le build passe (`npm run build`).
Les smoke tests passent (`node tests/smoke.mjs`).
