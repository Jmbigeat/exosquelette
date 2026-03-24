# PROMPT CLAUDE CODE — FEAT 16i : Checklist intégration 90 jours
## Enrichir Plan 30j RH, Plan 90j N+1 et Discovery Call avec des jalons d'intégration

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b feat-16i-checklist-integration
```

---

## CONTEXTE

Le candidat qui décroche le poste a 3 livrables d'intégration : le Plan 30j RH (impression, fiabilité, cadre), le Plan 90j N+1 (résultats, autonomie, vision), et les questions d'appel découverte (démontrer la compréhension du contexte avant l'entretien).

Ce qui manque : des jalons d'intégration concrets calibrés par rôle et par séniorité. Le Plan 30j dit "installer la confiance" mais ne dit pas quoi livrer à J+7. Le Plan 90j dit "montrer des premiers résultats" mais ne dit pas quel résultat viser pour un enterprise_ae vs un senior_pm. Les questions discovery ne testent pas la compréhension du processus d'intégration du candidat.

Le candidat qui arrive en entretien avec "voici mon plan d'intégration calibré sur vos enjeux" bat le candidat qui dit "je m'adapterai." Le recruteur voit quelqu'un qui a pensé son arrivée.

Source : Cécile Kiavué (checklist 90 jours LinkedIn).

---

## OPÉRATION 0 — STATECHART

Ce chantier ne touche PAS l'UI. Il modifie le contenu généré par 3 generators existants. Aucun état, aucune transition, aucun écran modifié. Opération 0 non applicable.

---

## CE QUE TU FAIS (4 opérations)

### Opération 1 — Lire et comprendre les 3 generators

Lis ces fichiers dans l'ordre :

1. Le generator du Plan 30j RH — note sa signature, ses inputs (bricks, targetRoleId, cauchemars, seniority, etc.), et la structure de son output (quels blocs, quel format).
2. Le generator du Plan 90j N+1 — même analyse.
3. Le generator de l'appel découverte (discovery call) — même analyse. Note les 5 questions et comment elles sont calibrées (cauchemar × séniorité × briques).
4. `lib/sprint/references.js` — note les données disponibles par rôle : SENIORITY_LEVELS, SENIORITY_CALIBRATION, CAUCHEMAR_TEMPLATES_BY_ROLE, ROLE_VALUE_RATIO. Ces données calibrent les jalons.

Rapporte :

| Generator | Signature | Inputs utilisés | Structure output | Nombre de blocs actuels |
|-----------|-----------|-----------------|------------------|------------------------|

STOP ici. Rapporte avant de coder. Les jalons dépendent de la structure existante.

### Opération 2 — Définir les jalons d'intégration par période

Ajouter dans `lib/sprint/references.js` une constante INTEGRATION_MILESTONES :

```javascript
/**
 * Jalons d'intégration par période et par cluster de rôle.
 * Chaque jalon est calibré par rôle pour être concret (pas générique).
 */
export var INTEGRATION_MILESTONES = {
  week1: {
    label: "Semaine 1 — Observer et cartographier",
    universal: [
      "Identifier les 3 personnes clés de ton écosystème quotidien",
      "Cartographier les rituels d'équipe (réunions, stand-ups, reviews)",
      "Poser 5 questions de compréhension au N+1 (pas de propositions encore)"
    ],
    byCluster: {
      growth: ["Récupérer les dashboards existants (CRM, pipeline, OKRs)"],
      product: ["Lire la roadmap et identifier les 3 sujets en cours"],
      strategy: ["Obtenir les 3 documents stratégiques de référence"],
    }
  },
  month1: {
    label: "Mois 1 — Installer la confiance",
    universal: [
      "Livrer un premier résultat visible (même petit) dans les 3 premières semaines",
      "Documenter 3 observations sur les process existants (sans juger)",
      "Proposer 1 amélioration rapide (quick win) validée par le N+1"
    ],
    byCluster: {
      growth: ["Avoir qualifié les 10 premiers comptes du portefeuille"],
      product: ["Avoir participé à 3 sessions utilisateur ou feedback client"],
      strategy: ["Avoir produit une première note de synthèse sur un sujet demandé"],
    }
  },
  month3: {
    label: "Mois 3 — Prouver l'autonomie",
    universal: [
      "Piloter un sujet de bout en bout sans validation intermédiaire du N+1",
      "Avoir un avis formé sur 1 problème structurel de l'équipe (et l'avoir partagé)",
      "Être identifié par les pairs comme la personne de référence sur 1 sujet"
    ],
    byCluster: {
      growth: ["Avoir atteint ou dépassé le premier objectif trimestriel"],
      product: ["Avoir livré ou lancé une feature en ownership complet"],
      strategy: ["Avoir présenté une recommandation au comité de direction"],
    }
  }
};
```

Les clusters (growth, product, strategy) mappent sur les 4 secteurs existants dans TARGET_ROLES :
- growth = enterprise_ae, head_of_growth, strategic_csm
- product = senior_pm, engineering_manager, ai_architect
- strategy = management_consultant, strategy_associate, operations_manager, fractional_coo

Ajouter un helper pour résoudre le cluster :

```javascript
export function getRoleCluster(targetRoleId) {
  var map = {
    enterprise_ae: "growth", head_of_growth: "growth", strategic_csm: "growth",
    senior_pm: "product", engineering_manager: "product", ai_architect: "product",
    management_consultant: "strategy", strategy_associate: "strategy",
    operations_manager: "strategy", fractional_coo: "strategy"
  };
  return map[targetRoleId] || "growth";
}
```

Note : si ROLE_CLUSTERS existe déjà dans references.js, utiliser celui-là. Ne pas dupliquer.

### Opération 3 — Enrichir les 3 generators

**A. Plan 30j RH**

Après les blocs existants, ajouter un bloc "Jalons Semaine 1 + Mois 1" :

```javascript
// ── JALONS D'INTÉGRATION ──
var cluster = getRoleCluster(targetRoleId);
var w1 = INTEGRATION_MILESTONES.week1;
var m1 = INTEGRATION_MILESTONES.month1;

var milestoneBlock = '--- Mes jalons d\'intégration ---\n\n';
milestoneBlock += w1.label + '\n';
w1.universal.forEach(function(item) { milestoneBlock += '• ' + item + '\n'; });
if (w1.byCluster[cluster]) {
  w1.byCluster[cluster].forEach(function(item) { milestoneBlock += '• ' + item + '\n'; });
}
milestoneBlock += '\n' + m1.label + '\n';
m1.universal.forEach(function(item) { milestoneBlock += '• ' + item + '\n'; });
if (m1.byCluster[cluster]) {
  m1.byCluster[cluster].forEach(function(item) { milestoneBlock += '• ' + item + '\n'; });
}
```

Le Plan 30j RH couvre semaine 1 + mois 1 (son horizon est 30 jours).

**B. Plan 90j N+1**

Après les blocs existants, ajouter un bloc "Jalons Mois 1 + Mois 3" :

```javascript
var cluster = getRoleCluster(targetRoleId);
var m1 = INTEGRATION_MILESTONES.month1;
var m3 = INTEGRATION_MILESTONES.month3;

var milestoneBlock = '--- Jalons de progression ---\n\n';
milestoneBlock += m1.label + '\n';
// ... (même pattern que ci-dessus)
milestoneBlock += '\n' + m3.label + '\n';
// ...
```

Le Plan 90j N+1 couvre mois 1 + mois 3 (son horizon est 90 jours). Pas de semaine 1 (le RH a déjà ce bloc).

**C. Discovery Call**

Ajouter 1 question conditionnelle (la 6ème) à la fin de generateDiscoveryCall :

```javascript
// ── Question intégration (16i) ──
var cluster = getRoleCluster(targetRoleId);
var m1Specific = INTEGRATION_MILESTONES.month1.byCluster[cluster];
if (m1Specific && m1Specific[0]) {
  var integrationQ = 'À quoi ressemble un premier mois réussi pour ce poste ? ' +
    '(Tu connais déjà la réponse : ' + m1Specific[0].toLowerCase() + '. ' +
    'Écoute si le recruteur confirme ou corrige.)';
  // Injecter dans le output
}
```

Le candidat pose la question au recruteur. Il connaît la réponse probable (jalon calibré). Il écoute la divergence entre sa préparation et la réalité du poste. Le recruteur voit quelqu'un qui a pensé son intégration.

### Opération 4 — Calibrer par séniorité

Les jalons universels sont les mêmes pour IC/Manager/Leader. Les jalons par cluster changent selon la séniorité :

Dans INTEGRATION_MILESTONES, si la séniorité est disponible en paramètre du generator (vérifier en opération 1), ajuster :

```javascript
// Exemple pour month3.byCluster.growth
byCluster: {
  growth: function(seniority) {
    if (seniority === 'leader') return ["Avoir restructuré ou validé la stratégie commerciale du trimestre"];
    if (seniority === 'manager') return ["Avoir atteint l'objectif trimestriel avec l'équipe"];
    return ["Avoir atteint ou dépassé le premier objectif trimestriel individuel"];
  }
}
```

Si la séniorité n'est PAS accessible dans les generators (vérifier en opération 1), utiliser les jalons IC par défaut. La calibration séniorité sera ajoutée quand la séniorité sera propagée aux generators (V2).

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies pas la structure existante des 3 generators. Tu ajoutes un bloc à la fin de chaque output.
- Tu ne modifies pas le scoring, la densité, le Blindage.
- Tu ne modifies pas l'UI (Sprint.jsx, panels.jsx, WorkBench.jsx, Arsenal.jsx).
- Tu ne modifies pas le One-Pager, le CV, la bio, ou les contact scripts.
- Tu ne modifies pas les questions existantes de la discovery call. Tu ajoutes la 6ème.
- Tu ne crées pas de nouvelle route API.
- Tu ne crées pas de dépendance npm.
- Tu ne surfais pas le Blindage au candidat.

---

## TEXTE UI (français avec accents)

Titre bloc Plan 30j : "Mes jalons d'intégration"
Titre bloc Plan 90j : "Jalons de progression"
Les jalons sont en français courant. Pas de jargon Abneg@tion. Le candidat imprime ce document et le montre au recruteur.

---

## TESTS MANUELS

1. `npm run build` — le build passe.
2. `npm run smoke` — 179+ tests, 0 régressions.
3. Génère un Plan 30j RH pour un enterprise_ae. Le bloc "Jalons d'intégration" apparaît avec les items Semaine 1 + Mois 1 + items spécifiques growth.
4. Génère un Plan 90j N+1 pour un senior_pm. Le bloc "Jalons de progression" apparaît avec les items Mois 1 + Mois 3 + items spécifiques product.
5. Génère les questions discovery pour un management_consultant. La 6ème question d'intégration apparaît avec le jalon spécifique strategy.
6. Génère un Plan 30j pour un rôle inexistant (fallback). Pas de crash. Les jalons universels apparaissent. Les jalons spécifiques sont absents.

---

## SMOKE TESTS À AJOUTER

```javascript
// 16i — Checklist intégration
console.log("\n=== INTEGRATION MILESTONES SMOKE ===");

assert("INTEGRATION_MILESTONES exists", typeof references.INTEGRATION_MILESTONES === "object");
assert("INTEGRATION_MILESTONES has week1", references.INTEGRATION_MILESTONES.week1 !== undefined);
assert("INTEGRATION_MILESTONES has month1", references.INTEGRATION_MILESTONES.month1 !== undefined);
assert("INTEGRATION_MILESTONES has month3", references.INTEGRATION_MILESTONES.month3 !== undefined);

assert("getRoleCluster exists", typeof references.getRoleCluster === "function");
assert("getRoleCluster enterprise_ae = growth", references.getRoleCluster("enterprise_ae") === "growth");
assert("getRoleCluster senior_pm = product", references.getRoleCluster("senior_pm") === "product");
assert("getRoleCluster fractional_coo = strategy", references.getRoleCluster("fractional_coo") === "strategy");

// Plan 30j includes milestones
var plan30 = generators.generatePlan30jRH(testBricks, "enterprise_ae", testCauchemars);
assert("Plan 30j contains integration milestones", plan30.indexOf("Jalons") !== -1 || plan30.indexOf("jalons") !== -1);

// Plan 90j includes milestones
var plan90 = generators.generatePlan90jN1(testBricks, "enterprise_ae", testCauchemars);
assert("Plan 90j contains progression milestones", plan90.indexOf("Jalons") !== -1 || plan90.indexOf("jalons") !== -1);
```

Adapter les imports et arguments selon les signatures réelles des generators (vérifiées en opération 1).

---

## VÉRIFICATION FINALE

```bash
grep -rn "INTEGRATION_MILESTONES\|getRoleCluster" lib/ tests/
```

INTEGRATION_MILESTONES apparaît dans references.js (définition) et dans les 3 generators (consommation).
getRoleCluster apparaît dans references.js (définition) et dans les 3 generators + tests (consommation).

Le build passe (`npm run build`).
Les smoke tests passent (`node tests/smoke.mjs`).
