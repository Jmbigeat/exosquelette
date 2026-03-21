# PROMPT CLAUDE CODE — FEAT: 3 CAUCHEMARS TRANSVERSAUX
## Ajouter 3 cauchemars qui touchent tous les rôles, pas un seul secteur.

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

Tous les chantiers (1–21) + micro-fixes + features (audit CV, salary, loc-markers, one-pager, role-variants) mergés. CAUCHEMAR_TEMPLATES_BY_ROLE existe dans lib/sprint/references.js avec 5 cauchemars par rôle. Ce chantier ajoute 3 cauchemars transversaux qui s'appliquent à plusieurs rôles.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b feat-transversal-cauchemars
```

---

## CONTEXTE

Les cauchemars actuels sont spécifiques à chaque rôle (5 par rôle). Trois peurs du recruteur traversent tous les secteurs :

A. "Le senior face au manager junior" — le candidat expérimenté rejoint une équipe dirigée par quelqu'un de moins expérimenté. Le recruteur craint le conflit d'ego, la résistance passive, le départ rapide.

B. "Les critères modifiés en cours de route" — le hiring manager change les specs du poste entre le premier entretien et l'offre. Le candidat découvre un poste différent. Le recruteur craint le refus tardif, le coût du process perdu.

C. "La variable structurellement inatteignable" — le package annoncé inclut une variable irréaliste. Le ratio OTE/ACV > 35%. Le candidat découvre après 6 mois que la variable est un mirage. Le recruteur craint le churn et la mauvaise réputation.

Ces 3 cauchemars enrichissent le stress test, les questions d'entretien, et les scripts de contact. Le candidat qui couvre un cauchemar transversal montre une maturité que les cauchemars techniques ne captent pas.

---

## CE QUE TU FAIS (3 opérations)

### Opération 1 — Lire l'existant

Lis ces fichiers AVANT de modifier quoi que ce soit :

- `lib/sprint/references.js` — identifie CAUCHEMAR_TEMPLATES_BY_ROLE. Note la structure exacte d'un cauchemar : quels champs (label, keywords, cost, kpis, description ?). Note les 10 identifiants de rôle. Note le format des coûts.
- `lib/sprint/scoring.js` — identifie comment les cauchemars sont consommés dans le scoring (axe couverture cauchemars). Note si le scoring itère sur les cauchemars par rôle uniquement ou s'il accepte un array mixte.
- `lib/eclaireur/analyze.js` — identifie comment analyzeOffer produit les cauchemars (getActiveCauchemars ou buildActiveCauchemars). Note si les cauchemars sont filtrés par rôle.

Rapporte la structure exacte d'un cauchemar avant de coder. Je confirme.

### Opération 2 — Ajouter TRANSVERSAL_CAUCHEMARS dans references.js

Nouveau bloc dans references.js, APRÈS CAUCHEMAR_TEMPLATES_BY_ROLE :

```javascript
/**
 * Cauchemars transversaux — peurs du recruteur qui traversent tous les rôles.
 * Ajoutés aux cauchemars spécifiques du rôle. Pas un remplacement.
 * applicableRoles : liste des rôles où ce cauchemar est pertinent.
 * "all" = tous les 10 rôles.
 */
export const TRANSVERSAL_CAUCHEMARS = [
  {
    id: "transversal_senior_junior_manager",
    label: "Le senior bloqué par un manager junior",
    // ADAPTE les champs ci-dessous à la structure exacte trouvée en opération 1.
    // Les champs doivent être IDENTIQUES à ceux de CAUCHEMAR_TEMPLATES_BY_ROLE.
    keywords: ["senior", "manager junior", "expérience", "hiérarchie", "ego", "conflit", "résistance"],
    cost: "Départ dans les 6 mois. Coût recrutement + vacance : 30-80K€ selon le rôle.",
    description: "Le candidat a 15 ans d'expérience. Son futur manager en a 5. Le recruteur craint que le senior ne supporte pas la hiérarchie inversée. Il cherche la preuve que le candidat sait contribuer sans contrôler.",
    applicableRoles: "all"
  },
  {
    id: "transversal_moving_goalposts",
    label: "Les critères qui bougent en cours de process",
    keywords: ["critères", "changement", "périmètre", "brief", "scope", "poste modifié", "redéfinition"],
    cost: "Process perdu : 15-40K€ (temps recruteur + candidat + opportunité). Réputation employeur dégradée.",
    description: "Le hiring manager change le brief entre le 2ème et le 3ème entretien. Le candidat préparé pour un rôle stratégique découvre un rôle opérationnel. Le recruteur craint le refus au dernier moment et le retour au point zéro.",
    applicableRoles: "all"
  },
  {
    id: "transversal_unreachable_variable",
    label: "La variable structurellement inatteignable",
    keywords: ["variable", "OTE", "ACV", "objectif", "bonus", "commission", "quota", "inatteignable"],
    cost: "Churn à 6-12 mois. Le candidat quitte quand il comprend. Coût total : 50-120K€.",
    description: "Le package annonce 30% de variable. Le ratio OTE/ACV dépasse 35%. La variable est un mirage mathématique. Le candidat découvre après 2 trimestres. Le recruteur craint la démission et la mauvaise réputation Glassdoor.",
    applicableRoles: ["enterprise_ae", "head_of_growth", "strategic_csm"]
  }
];
```

IMPORTANT : adapte les champs (label, keywords, cost, description, etc.) à la structure EXACTE trouvée dans CAUCHEMAR_TEMPLATES_BY_ROLE. Si les cauchemars existants ont des champs différents (par ex. costRange au lieu de cost, ou kpis au lieu de keywords), utilise les mêmes noms de champs. Ne jamais inventer un champ qui n'existe pas dans la structure existante.

Le champ applicableRoles est NOUVEAU. Les cauchemars existants ne l'ont pas (ils sont déjà filtrés par rôle via la clé de l'objet). Les cauchemars transversaux en ont besoin pour savoir à quels rôles ils s'appliquent.

### Opération 3 — Brancher les cauchemars transversaux dans getActiveCauchemars

Identifie la fonction qui retourne les cauchemars actifs pour un rôle donné (getActiveCauchemars, buildActiveCauchemars, ou la logique inline dans Sprint.jsx / analyze.js).

Enrichis cette fonction pour concaténer les cauchemars transversaux applicables :

```javascript
// Pseudo-code — adapte à la fonction réelle
function getActiveCauchemars(targetRoleId) {
  // Cauchemars spécifiques au rôle (existant)
  var roleCauchemars = CAUCHEMAR_TEMPLATES_BY_ROLE[targetRoleId] || [];
  
  // Cauchemars transversaux applicables
  var transversals = TRANSVERSAL_CAUCHEMARS.filter(function(c) {
    return c.applicableRoles === "all" || 
           (Array.isArray(c.applicableRoles) && c.applicableRoles.includes(targetRoleId));
  });
  
  return roleCauchemars.concat(transversals);
}
```

Le candidat voit 5 + N cauchemars (5 spécifiques + 2 ou 3 transversaux selon le rôle). Les generators, le scoring, le stress test, les questions d'entretien — tout consomme la même liste. Aucune modification nécessaire en aval si getActiveCauchemars est le point d'entrée unique.

Si les cauchemars sont consommés différemment (itération directe sur CAUCHEMAR_TEMPLATES_BY_ROLE sans passer par une fonction), crée la fonction getActiveCauchemars et remplace les accès directs. Un seul point d'entrée.

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies pas les cauchemars existants (5 par rôle restent identiques)
- Tu ne modifies pas le scoring (l'axe cauchemars compte les cauchemars couverts — plus de cauchemars = dénominateur plus grand, le scoring s'adapte automatiquement)
- Tu ne modifies pas les generators (ils consomment getActiveCauchemars, les transversaux arrivent naturellement)
- Tu ne modifies pas le Duel
- Tu ne modifies pas l'Éclaireur (analyzeOffer utilise les cauchemars du rôle détecté)
- Tu ne crées pas de route
- Tu ne crées pas de table Supabase
- Tu n'ajoutes pas de dépendance npm

---

## TESTS MANUELS

1. Lis TRANSVERSAL_CAUCHEMARS dans references.js. Vérifie que les 3 cauchemars existent avec la bonne structure.
2. Avec rôle enterprise_ae : vérifie que getActiveCauchemars retourne 5 + 3 = 8 cauchemars (les 3 transversaux s'appliquent aux rôles sales).
3. Avec rôle senior_pm : vérifie que getActiveCauchemars retourne 5 + 2 = 7 cauchemars (senior_junior_manager + moving_goalposts, PAS unreachable_variable).
4. Vérifie que le stress test affiche les cauchemars transversaux dans la liste.
5. Vérifie que les questions d'entretien (generateInterviewQuestions) intègrent un cauchemar transversal si pertinent.
6. Vérifie que le scoring de couverture cauchemars fonctionne avec le dénominateur augmenté (7 ou 8 au lieu de 5).
7. `npm run build` — zéro erreur.
8. `npm run smoke` — zéro régression.

---

## CONVENTIONS (ne pas modifier)

- Langue du code : anglais
- Langue des strings UI : français avec accents corrects (é, è, ê, à, ù, ç)
- Langue des descriptions cauchemars : français
- Pas de console.log en production
- Les fonctions exportées ont un JSDoc
- Pas d'unicode escapes (écrire é, pas \u00E9)

---

## VÉRIFICATION FINALE

- TRANSVERSAL_CAUCHEMARS existe dans references.js avec 3 entries
- Chaque entry a les mêmes champs que CAUCHEMAR_TEMPLATES_BY_ROLE + applicableRoles
- getActiveCauchemars concatène spécifiques + transversaux
- enterprise_ae → 8 cauchemars (5 + 3)
- senior_pm → 7 cauchemars (5 + 2)
- Aucun cauchemar existant modifié
- Aucun generator modifié
- Le build passe sans erreur
- Le smoke test passe sans régression

---

## COMMIT

```
feat: 3 transversal cauchemars — senior/junior manager, moving goalposts, unreachable variable

- lib/sprint/references.js: TRANSVERSAL_CAUCHEMARS (3 entries, applicableRoles field)
- getActiveCauchemars enriched: role-specific + transversal concatenation
- enterprise_ae: 5+3=8 cauchemars, senior_pm: 5+2=7 cauchemars
- Zero modification to existing cauchemars, generators, or scoring logic

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## MERGE

```bash
git checkout main
git merge feat-transversal-cauchemars --no-ff -m "feat: 3 transversal cauchemars — senior/junior, moving goalposts, unreachable variable"
npm run smoke
```
