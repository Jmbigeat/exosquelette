# PLAINTES RÉCURRENTES — OUTILS IA CARRIÈRE
## Ce que les utilisateurs reprochent aux concurrents. Ce qu'Abneg@tion fait différemment.

---

### Plainte #1 — Hallucinations et contenu inventé (source : Reddit, LinkedIn, forums 2025-2026)

Constat : les outils IA carrière inventent des compétences, des technologies, des métriques ("Augmenté les ventes de 40%") sans base dans le CV original. Le LLM préfère générer un chiffre confiant et faux que laisser un blanc (biais RLHF : la certitude est récompensée).

Réponse Abneg@tion : le moteur n'invente rien. Il extrait. extractBrickCore isole le chiffre du texte du candidat. Si le candidat n'écrit pas de chiffre, la case Chiffre du Blindage reste vide. Le moteur signale le manque. Il ne le comble pas. Les generators formatent les briques existantes. Ils ne fabriquent pas. Le Blindage est déterministe (hasNumbers, hasDecisionMarkers, hasInfluenceMarkers, hasTransferability). 4 fonctions booléennes. Un booléen ne hallucine pas.

Angle compétitif : "Les outils IA carrière inventent des chiffres. Abneg@tion refuse d'en inventer."

---

### Plainte #2 — Le piège ATS qui ne fonctionne pas vraiment (source : Reddit, Trustpilot, recruteurs 2025-2026)

Constat : Jobscan aspire les mots-clés d'une offre et exige de les coller dans le CV. Les recruteurs sont formels : les ATS modernes reconnaissent les synonymes, aucun système ne rejette automatiquement un CV à 100%, les résumés surchargés de mots-clés sont identifiables. Des CV "optimisés" à 95% par Jobscan sont ignorés. Des CV simples et humains obtiennent des retours. L'optimisation ATS est vendue comme solution à un problème surestimé.

Réponse Abneg@tion : l'outil ne fait pas d'optimisation ATS. Le CV généré par la Forge contient les bons mots-clés naturellement parce que les briques sont formulées avec le vocabulaire du rôle (CAUCHEMAR_TEMPLATES_BY_ROLE contient les kw par rôle). Les mots-clés viennent du contenu, pas du bourrage. Le livrable principal n'est pas le CV (format Ère 1). C'est le One-Pager (organisé par problème résolu). Le CV passe l'ATS. Le One-Pager convainc l'humain. Deux livrables, deux audiences, deux logiques.

Angle compétitif : "L'optimisation ATS est un problème surestimé. Le vrai problème n'est pas de passer le filtre. C'est de convaincre l'humain après le filtre."

---

### Plainte #3 — Déshumanisation visible (source : Reddit 2026)

Constat : les outils produisent des CV que les recruteurs détectent instantanément comme générés par IA. Un CV optimisé pour une machine sonne creux pour un humain. Le candidat est dans une impasse : optimiser pour l'ATS (rejeté par le recruteur humain) ou écrire humainement (mauvais score ATS). Les deux chemins perdent.

Réponse Abneg@tion : le matériau vient du candidat, pas du LLM. Les briques contiennent les mots du candidat, ses chiffres, ses décisions, ses cicatrices. extractBrickCore préserve le vocabulaire original. Les generators formatent sans réécrire la substance. Le Blindage force la spécificité (chiffre non rond, décision personnelle, influence attribuée) — exactement ce que le recruteur humain cherche et que l'IA générique ne produit pas. Un CV blindé passe l'ATS (les bons mots-clés sont dans les briques) ET convainc l'humain (les preuves sont spécifiques, pas génériques). L'impasse n'existe pas quand le matériau est réel.

Angle compétitif : "Le recruteur détecte l'IA en 6 secondes. Il ne détecte pas un CV blindé, parce que les preuves sont celles du candidat. Le format est assisté. Le contenu est humain."

---

### Plainte #4 — Qualité IA médiocre pour le prix (source : Reddit, Trustpilot, Teal reviews 2025-2026)

Constat : payer cher pour du contenu générique. Kickresume "underwhelming pour le prix" avec des formulations creuses. Jobscan ~50$/mois qualifié d'"achat quasi inutile" qui reformule la fiche de poste. L'IA produit du générique si l'utilisateur ne réécrit pas tout derrière.

Réponse Abneg@tion : la Forge est gratuite. Le candidat forge ses briques sans payer. L'abonnement 19€/mois débloque les livrables (formatage, pas extraction). Le matériau est produit par le candidat avant de payer. Le candidat ne paie pas pour du générique. Il paie pour la mise en forme de son propre matériau blindé. Si le matériau est faible, la densité le montre avant le paiement. Pas de surprise.

Angle compétitif : "L'outil gratuit extrait. L'abonnement formate. Le candidat ne paie jamais pour du vide."

---

### Plainte #5 — Pièges d'abonnement et dark patterns (source : Test-Achats, CEC, ACM, Trustpilot 2025-2026)

Constat : renouvellement automatique silencieux, abonnements cachés (CVneed.com : 250 plaintes en Belgique, bloqué par l'ACM néerlandaise), refus de remboursement, crédits non reportables, suppression de compte impossible (Careerflow : email + file mensuelle, problématique RGPD).

Réponse Abneg@tion : RGPD implémenté (mentions légales, confidentialité, bannière cookies). Stripe Checkout standard (pas de facturation custom). Abonnement résiliable immédiatement. Données supprimables (RLS Supabase). Pas de crédits expirables (mécanisme pièces tué en production). Le modèle est l'inverse du dark pattern : Forge gratuite → le candidat prouve la valeur avant de payer → abonnement explicite → résiliation libre.

Angle compétitif : "Pas de piège. Forge gratuite. Résiliation immédiate. Vos données vous appartiennent."

---

### Plainte #6 — Contrôle de mise en page inexistant (source : Reddit, Teal reviews 2025-2026)

Constat : templates rigides impossibles à personnaliser. Bullets qui se repositionnent seuls (Careerflow). Marges et sections difficiles à réorganiser (Kickresume). Fluide en capture marketing, frustrant en usage réel.

Réponse Abneg@tion : l'outil ne génère pas de PDF formaté. Il génère du texte structuré que le candidat copie dans son propre format. Le One-Pager, le CV, la bio, les scripts sont du texte pur (CopyBtn). Le candidat contrôle sa mise en page. L'outil ne la contraint pas. Le choix est délibéré : le format est le problème du candidat. Le contenu est le problème de l'outil.

Angle compétitif : "L'outil ne formate pas votre CV. Il arme votre contenu. La mise en page, c'est votre choix."

---

### Plainte #7 — Offres d'emploi fantômes dans les outils intégrés (source : Reddit 2025-2026)

Constat : Teal critiqué pour son tableau de bord d'offres. Annonces qui redirigent vers des pages cassées, offres expirées, sites sans rapport. Érode la confiance dans l'ensemble de l'outil.

Réponse Abneg@tion : l'outil n'agrège pas les offres d'emploi. L'Éclaireur analyse une offre que le candidat colle. Le candidat apporte l'offre. L'outil ne prétend pas être un job board. Zéro offre fantôme parce que zéro offre hébergée. La surface d'erreur est éliminée par design.

Angle compétitif : "L'outil n'héberge pas d'offres. Vous collez la vôtre. Zéro page cassée. Zéro offre expirée."

---

### Synthèse positionnement

La douleur la plus profonde du marché n'est pas "mon CV ne passe pas l'ATS." C'est "je ne sais plus si mon CV me représente vraiment." Les 7 plaintes convergent vers le même diagnostic : les outils IA carrière optimisent le format au détriment de la substance. Abneg@tion prend le chemin inverse : la substance d'abord (extraction, blindage, densité), le format ensuite (generators au dernier kilomètre). L'authenticité vérifiée bat l'optimisation algorithmique.

Sources : 25 URLs documentées (Reddit, Trustpilot, G2, Test-Achats, CEC, LinkedIn). Fichier mis à jour le 25 mars 2026.
