# PROMPT CLAUDE CODE — FEAT: ROLE_VARIANTS — Titres alternatifs par rôle
## Le candidat qui cherche "Account Manager" trouve le rôle enterprise_ae. L'Éclaireur reconnaît 5× plus de titres de poste.

Tu travailles sur le repo ~/Downloads/exosquelette. Next.js 14.

Tous les chantiers (1–21) + micro-fixes + feat-audit-cv-forge + feat-salary-comparison + feat-loc-markers + feat-one-pager mergés. analyzeOffer existe dans lib/eclaireur/analyze.js. ROLE_CLUSTERS existe dans lib/sprint/references.js avec 10 rôles. Ce chantier ajoute les titres alternatifs par rôle et les branche dans la détection.

IMPORTANT : lis lessons.md au démarrage. Propose une entrée si un bug non trivial est attrapé.

---

## BRANCHE

```bash
git checkout -b feat-role-variants
```

---

## CONTEXTE

Un candidat colle une offre "Account Manager SaaS." L'Éclaireur détecte le rôle via analyzeOffer. Si le matching cherche uniquement "enterprise_ae", l'offre passe à côté. Le candidat pense que l'outil ne comprend pas son métier. Il part.

Les titres de poste varient entre entreprises, entre pays, entre générations. Un "Customer Success Manager" chez une startup est un "Key Account Manager" chez un grand groupe. L'outil connaît 10 rôles. Il doit reconnaître 50+ variantes de titre.

ROLE_VARIANTS est une table de synonymes. Chaque rôle a sa liste de titres alternatifs (français + anglais). Le matching dans analyzeOffer utilise cette liste. L'Onboarding affiche les variantes comme aide à la sélection. Le One-Pager utilise le titre le plus pertinent pour l'offre.

---

## CE QUE TU FAIS (4 opérations)

### Opération 1 — Lire l'existant

Lis ces fichiers AVANT de modifier quoi que ce soit :

- `lib/sprint/references.js` — identifie ROLE_CLUSTERS. Note la structure : clé, label, description. Note les 10 identifiants exacts.
- `lib/eclaireur/analyze.js` — identifie analyzeOffer. Note comment le rôle est détecté. Cherche la logique de matching (keywords, regex, scoring). Note la fonction exacte et sa signature.
- `components/Onboarding.jsx` — identifie comment la liste des rôles est affichée. Note si les labels viennent de ROLE_CLUSTERS.
- `lib/generators/one-pager.js` — identifie comment le bloc 1 utilise le label du rôle.

### Opération 2 — Ajouter ROLE_VARIANTS dans references.js

Nouveau bloc dans references.js, APRÈS ROLE_CLUSTERS :

```javascript
/**
 * Alternative job titles per role (FR + EN).
 * Used by analyzeOffer for role detection and by Onboarding for selection hints.
 * Each array contains lowercase variants. Matching is case-insensitive.
 * Updated when new titles are encountered in real offers.
 */
export const ROLE_VARIANTS = {
  enterprise_ae: [
    "account executive", "ae", "enterprise ae", "commercial grands comptes",
    "business developer senior", "ingénieur commercial", "key account executive",
    "enterprise sales", "commercial enterprise", "chargé d'affaires grands comptes",
    "responsable grands comptes", "sales executive", "account manager senior"
  ],
  head_of_growth: [
    "head of growth", "growth manager", "responsable croissance",
    "growth lead", "directeur croissance", "growth hacker senior",
    "vp growth", "head of acquisition", "responsable acquisition",
    "growth marketing manager", "performance marketing lead"
  ],
  strategic_csm: [
    "customer success manager", "csm", "csm senior", "strategic csm",
    "responsable succès client", "key account manager", "account manager",
    "client partner", "customer relationship manager", "chargé de clientèle senior",
    "responsable portefeuille clients", "client success lead"
  ],
  senior_pm: [
    "product manager", "pm", "senior product manager", "chef de produit",
    "product owner senior", "group product manager", "lead product manager",
    "responsable produit", "product lead", "head of product",
    "directeur produit", "staff product manager"
  ],
  engineering_manager: [
    "engineering manager", "em", "responsable technique",
    "tech lead manager", "head of engineering", "directeur technique",
    "vp engineering", "software engineering manager", "manager développement",
    "responsable équipe dev", "lead engineer manager", "cto adjoint"
  ],
  ai_architect: [
    "ai architect", "architecte ia", "machine learning engineer senior",
    "ml architect", "data architect", "head of ai", "lead ai",
    "responsable ia", "ai lead", "chief ai officer",
    "architecte data", "staff ml engineer", "principal data scientist"
  ],
  management_consultant: [
    "consultant", "management consultant", "consultant en stratégie",
    "consultant senior", "consultant manager", "business consultant",
    "conseil en management", "consultant en organisation",
    "consultant transformation", "associate consultant", "engagement manager"
  ],
  strategy_associate: [
    "strategy associate", "analyste stratégie", "chargé de stratégie",
    "strategy analyst", "business analyst strategy", "associate strategy",
    "consultant stratégie junior", "strategic planner",
    "analyste business", "corporate strategy analyst"
  ],
  operations_manager: [
    "operations manager", "responsable opérations", "ops manager",
    "directeur des opérations", "head of operations", "chief of staff",
    "responsable process", "operations lead", "business operations manager",
    "gestionnaire des opérations", "program manager"
  ],
  fractional_coo: [
    "coo", "chief operating officer", "directeur général adjoint",
    "fractional coo", "coo part-time", "directeur des opérations",
    "dg adjoint", "deputy ceo", "operating partner",
    "partner opérations", "interim coo", "coo freelance"
  ]
};
```

IMPORTANT : vérifie que les clés correspondent EXACTEMENT aux identifiants dans ROLE_CLUSTERS. Adapte si nécessaire.

### Opération 3 — Brancher ROLE_VARIANTS dans analyzeOffer

Fichier : `lib/eclaireur/analyze.js`

Import :
```javascript
import { ROLE_VARIANTS } from "../sprint/references";
```

Dans la logique de détection de rôle d'analyzeOffer, enrichir le matching :

1. Lis le code actuel de détection. Note comment le rôle est matché (keywords dans le texte de l'offre).
2. Ajoute le matching par ROLE_VARIANTS. Pour chaque rôle, tester si l'une des variantes apparaît dans le texte de l'offre (case-insensitive).
3. Le matching par variante a la MÊME priorité que le matching existant. Si les deux matchent le même rôle, pas de conflit. Si les deux matchent des rôles différents, le match le plus spécifique gagne (la variante la plus longue trouvée).

Pattern de matching :

```javascript
// Pour chaque rôle, chercher les variantes dans le texte de l'offre
var offerLower = offerText.toLowerCase();
var variantMatches = [];

Object.keys(ROLE_VARIANTS).forEach(function(roleId) {
  ROLE_VARIANTS[roleId].forEach(function(variant) {
    if (offerLower.includes(variant)) {
      variantMatches.push({ roleId: roleId, variant: variant, length: variant.length });
    }
  });
});

// Trier par longueur de variant descendante (le plus spécifique gagne)
variantMatches.sort(function(a, b) { return b.length - a.length; });
```

Ne PAS réécrire analyzeOffer. Ajouter le matching par variantes APRÈS le matching existant. Si le matching existant a déjà trouvé un rôle, le matching par variantes confirme ou ne change rien. Si le matching existant n'a rien trouvé, le matching par variantes fournit le résultat.

### Opération 4 — Afficher les variantes dans l'Onboarding

Fichier : `components/Onboarding.jsx`

Import :
```javascript
import { ROLE_VARIANTS } from "../lib/sprint/references";
```

Sous chaque rôle dans la liste de sélection, ajouter une ligne grisée avec 3-4 variantes les plus courantes :

```
Enterprise Account Executive
  Account Executive, Commercial grands comptes, Key Account Executive...
```

Style : fontSize 11, color #8892b0 (muted), fontStyle italic. Pas cliquable. Juste informatif. Le candidat lit "ah, c'est ça mon rôle."

Sélectionner les 3-4 premières variantes de ROLE_VARIANTS[roleId] (les plus courtes, qui sont les plus reconnaissables).

---

## CE QUE TU NE FAIS PAS

- Tu ne modifies pas ROLE_CLUSTERS (les 10 rôles restent les mêmes)
- Tu ne modifies pas CAUCHEMAR_TEMPLATES_BY_ROLE
- Tu ne modifies pas le scoring
- Tu ne modifies pas les generators (le One-Pager utilise déjà le label de ROLE_CLUSTERS)
- Tu ne modifies pas le Duel
- Tu ne modifies pas l'Arsenal
- Tu ne crées pas de route
- Tu ne crées pas de table Supabase
- Tu n'ajoutes pas de dépendance npm

---

## TESTS MANUELS

1. Ouvre l'Éclaireur. Colle une offre contenant "Account Executive SaaS." Vérifie que le rôle enterprise_ae est détecté.
2. Colle une offre contenant "Customer Success Manager." Vérifie que strategic_csm est détecté.
3. Colle une offre contenant "Chef de produit senior." Vérifie que senior_pm est détecté.
4. Colle une offre contenant "COO freelance." Vérifie que fractional_coo est détecté.
5. Colle une offre avec un titre inconnu ("Responsable des partenariats"). Vérifie que le matching existant prend le relais ou que le rôle n'est pas détecté (pas de crash).
6. Ouvre l'Onboarding. Vérifie que chaque rôle affiche 3-4 variantes en grisé sous le label.
7. `npm run build` — zéro erreur.
8. `npm run smoke` — zéro régression.

---

## CONVENTIONS (ne pas modifier)

- Langue du code : anglais
- Langue des strings UI : français avec accents corrects (é, è, ê, à, ù, ç)
- Langue des variantes : français ET anglais (les offres sont dans les deux langues)
- Pas de console.log en production
- Les fonctions exportées ont un JSDoc
- Pas d'unicode escapes (écrire é, pas \u00E9)

---

## VÉRIFICATION FINALE

- ROLE_VARIANTS existe dans references.js avec 10 rôles (identifiants vérifiés)
- Chaque rôle a 10-13 variantes (FR + EN)
- analyzeOffer utilise ROLE_VARIANTS pour enrichir la détection
- Le matching par variantes ne casse pas le matching existant
- L'Onboarding affiche 3-4 variantes sous chaque rôle
- Aucun generator modifié
- Aucun scoring modifié
- Le build passe sans erreur
- Le smoke test passe sans régression

---

## COMMIT

```
feat: ROLE_VARIANTS — alternative job titles per role (10 roles × 10-13 variants)

- lib/sprint/references.js: ROLE_VARIANTS with FR + EN variants for all 10 roles
- lib/eclaireur/analyze.js: variant matching in analyzeOffer (additive, longest match wins)
- Onboarding.jsx: 3-4 variant hints displayed under each role label
- Zero modification to ROLE_CLUSTERS, generators, scoring, or audit

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## MERGE

```bash
git checkout main
git merge feat-role-variants --no-ff -m "feat: ROLE_VARIANTS — alternative job titles per role"
npm run smoke
```
