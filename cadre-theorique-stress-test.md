# CADRE THÉORIQUE — Stress Test Abneg@tion
## Mapping académique vers les fonctions existantes

---

## POURQUOI CE DOCUMENT

Le stress test Abneg@tion mesure la crédibilité d'un candidat face aux cauchemars du recruteur. Il le fait via des marqueurs de vocabulaire, des briques de preuve, et un scoring de densité. Ce document nomme ce que l'outil fait déjà en langage académique. L'objectif : le messaging vers les coachs et recruteurs qui reconnaîtront immédiatement la logique.

---

## AXE 1 — NEED FOR ACHIEVEMENT (David McClelland, Harvard, années 60)

Le meilleur prédicteur de performance commerciale. Au-dessus de l'intelligence. Au-dessus de l'expérience.

Se détecte par le vocabulaire. Verbes de résultat ("gagner", "atteindre", "dépasser", "closer") vs verbes de processus ("essayer", "apprendre", "contribuer").

Mapping Abneg@tion : hasDecisionMarkers dans lib/sprint/analysis.js. La fonction détecte les marqueurs de décision et d'impact dans le texte du candidat. Les briques de type "chiffre" et "decision" capturent le NfA : le candidat formule un résultat mesurable, pas une intention.

Livrable impacté : le scoring de blindage. Une brique blindée à 4/4 contient un chiffre, un contexte, une décision et une contrainte. C'est un NfA complet encodé en 4 champs.

---

## AXE 2 — GRIT (Angela Duckworth)

La persévérance face à l'adversité. La "dalle" sans endurance est un feu de paille.

Se détecte par la durée sous pression. "Cite une chose que tu as poursuivie malgré l'envie d'arrêter." La raison du maintien distingue la compliance ("on m'a obligé") du câblage ("je ne pouvais pas accepter d'échouer").

Mapping Abneg@tion : les briques de type "cicatrice". Une cicatrice est un moment difficile traversé. Le candidat raconte un échec, une contrainte, une adversité — et ce qu'il en a fait. Le Duel force le candidat à défendre cette brique sous pression simulée. Le Duel ne teste pas la connaissance. Il teste la tenue.

Livrable impacté : le generator followup (Framework Miroir). Le bloc "cicatrice" dans un DM ou un post LinkedIn est la preuve de Grit que le recruteur cherche sans savoir la nommer.

---

## AXE 3 — LOCUS OF CONTROL (Julian Rotter)

L'attribution des succès et des échecs. Interne ("j'ai fait X") vs externe ("j'ai eu de la chance" / "le produit était nul").

Se détecte par les verbes d'attribution.

Attribution interne : "j'ai décidé", "j'ai initié", "j'ai lancé", "j'ai tranché", "j'ai refusé", "j'ai convaincu."
Attribution externe : "on m'a confié", "on m'a demandé", "le contexte a permis", "le marché était favorable", "l'équipe a décidé."

Mapping Abneg@tion : enrichissement prévu des marqueurs du stress test. Aujourd'hui, le stress test détecte solo vs équipe. Demain, il distingue attribution interne vs externe. Les deux dimensions se croisent : un candidat peut parler d'équipe avec un locus interne ("j'ai aligné l'équipe sur X") ou solo avec un locus externe ("j'étais seul parce qu'on ne m'a pas donné de ressources").

Livrable impacté : la Signature. Le pattern comportemental détecté par la Signature est un locus interne structurel. Le candidat qui a une signature fait les choses d'une certaine façon quel que soit le contexte. C'est un locus interne pur.

---

## SYNTHÈSE — CE QUE L'OUTIL FAIT VS CE QUE LE RECRUTEUR FAIT

| Ce que le recruteur évalue | Comment il le fait | Ce que l'outil fait | Fonction |
|---|---|---|---|
| Need for Achievement | "Je le sens en entretien" | Détecte les marqueurs de décision et de résultat | hasDecisionMarkers, blindage 4/4 |
| Grit | "Raconte-moi un échec" | Force la preuve d'adversité traversée | Briques cicatrice, Duel |
| Locus of Control | "C'est grâce à quoi ?" | Détecte l'attribution interne vs externe | Marqueurs solo/équipe (enrichissement prévu) |
| Les trois ensemble | Instinct après 45 min d'entretien | Scoring 6 axes + densité en 15 min | Densité, blindage, signature |

---

## MESSAGING — CANAL COACHS / RECRUTEURS

Ligne principale : "L'outil fait ce que vous faites à l'instinct. Sauf qu'il le fait sur 6 axes, avec des preuves, en 15 minutes."

Ligne secondaire : "Le Need for Achievement, le Grit et le Locus of Control. Trois construits que vous évaluez sans les nommer. L'outil les encode dans chaque brique forgée."

Ligne canal B2B : "Vos candidats arrivent avec un CV. Les nôtres arrivent avec un score de densité, 4 briques blindées, et une signature comportementale. Lequel choisissez-vous ?"

---

## CE DOCUMENT N'EST PAS

- Un changement de code. Aucune modification de fichier.
- Une spec. Pas d'implémentation.
- Un post LinkedIn. C'est un document interne qui alimente le messaging.

L'enrichissement Locus of Control (verbes d'attribution) est en liste d'attente priorité 3, fusionné avec l'item "marqueurs solo × équipe."
