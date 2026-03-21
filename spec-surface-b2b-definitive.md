# SPEC L'ÉCHOPPE — Surface B2B Abneg@tion
## Définitive — 19 mars 2026
## 10 blocs, 52 questions tranchées (three mental models)

L'Échoppe est la surface B2B d'Abneg@tion. La Forge est l'arrière-boutique (le candidat forge). L'Échoppe est la façade (le recruteur entre). Ce document remplace toute référence antérieure au B2B (Architecture C, marketplace B2B). Il est la source de vérité pour l'Échoppe.

---

## BLOC 1 — QUI EST L'UTILISATEUR B2B

**Premier client B2B :** le cabinet de recrutement. Après le seuil de volume (20 profils opt-in par rôle).

**Le coach carrière :** canal d'acquisition candidats. Pas un client B2B. Gratuit à vie. Il utilise la Forge existante (gratuite). Action commerciale : 3 coachs identifiés, accès gratuit, mesure de l'apport. Revenue share envisageable après les premiers fees B2B. Dashboard coach après 20+ coachs actifs. Zéro code maintenant.

**Le hiring manager :** pas de surface au lancement. Passe par le cabinet. Éclaireur inversé (recruteur colle une offre → profils matchés) en liste d'attente après 100 profils/rôle.

**Le DRH :** phase 2. Après que le cabinet ait validé la surface.

**Séquence :** coach (action commerciale, zéro code) → cabinet (premier client payant) → DRH (phase 2) → hiring manager (si Éclaireur inversé construit).

---

## BLOC 2 — CE QUE LE RECRUTEUR VOIT

### Deux niveaux de lecture

**En liste (scan rapide) :** rôle, Blindage en labels qualitatifs ("Chiffre vérifié", "Décision documentée" — pas "4/4"), cauchemars matchés via filtre (vert/gris), ville, séniorité (quand disponible), "Signature ✓" (indicateur binaire, pas le contenu). Zéro nom. Zéro entreprise.

**En fiche (évaluation) :** briques ATMT (texte masqué — type + cauchemar couvert + label Blindage visibles, texte complet après acceptation du contact), signature complète, cauchemars détaillés avec briques qui les couvrent, KPI couverts.

### Densité
Invisible pour le recruteur. Le gate ≥ 70% filtre en amont. Tout profil visible est qualifié par construction. Le tri recruteur se fait sur fraîcheur, cauchemars couverts, Blindage moyen, signature.

### Cauchemars
Pas un attribut affiché. Un filtre de recherche. Le recruteur filtre par cauchemar ("Multi-décideurs" → 8 profils). En liste : cauchemars matchés en vert, non couverts en gris. En fiche : détail complet avec briques. Le filtre par cauchemar est le cœur de la surface B2B et le différenciateur face à LinkedIn.

### Signature
Visible en fiche seulement. En liste : indicateur binaire "Signature ✓" sans le contenu. Le recruteur clique pour découvrir. L'anonymisation tient en liste. Le candidat voit ce que le recruteur verra au moment de l'opt-in.

### Livrables
Aucun livrable visible dans la fiche. Le recruteur voit les matériaux bruts (briques, Blindage, cauchemars, signature). Le contact déclenche deux documents :
- **One-Pager** (document principal) : généré automatiquement, calibré pour le mandat. 5 blocs : (1) titre du rôle visé + signature (le titre est le rôle, pas le nom — le recruteur cherche un "Product Manager" pas une "Élise Dupont"), (2) "Preuves d'impact" — formulations positives factuelles (pas de formulations négatives type "Le PM qui ne sait pas X" — le positif prouve, le négatif défend), (3) "Pourquoi ce poste" — lien explicite entre le contexte passé et le mandat, (4) parcours compressé (3 lignes), (5) contact (nom + email + LinkedIn + ville). Vocabulaire Abneg@tion absent du document (pas de "cauchemar", "blindage", "densité" — le One-Pager sort de la plateforme et voyage). Le One-Pager PROUVE.
- **CV calibré** (document de procédure, sur demande) : chronologique, briques formatées en ATMT, calibré pour l'offre. Le CV satisfait l'ATS et le processus administratif. Le CV DOCUMENTE.
Le One-Pager ouvre la porte. Le CV remplit le dossier.

### Format
Phase 1 (lancement) : page web avec URL unique (abnegation.eu/profil/{id}). Mise à jour en temps réel. Accès authentifié (recruteur).
Phase 2 (après 10 recruteurs) : PDF exportable. Date de validité 30 jours. Lien vers la page web en pied de PDF. Le PDF est le cheval de Troie vers le DRH.

### Indexation AIO
Couche publique anonymisée (indexable) : rôle + secteur + ville + séniorité + cauchemars couverts (nombre) + "Signature ✓" + mots-clés marché. Zéro nom. Zéro entreprise. Zéro brique. Bilingue : mots-clés marché (pour les crawlers) + vocabulaire Abneg@tion (pour différencier).
Couche privée (authentifiée) : Blindage labels + cauchemars détaillés + briques ATMT + signature complète.
Le candidat contrôle l'indexation via l'opt-in. Opt-in = couche publique indexable. Pas d'opt-in = invisible.
Chaque candidat opt-in est un aimant à recruteurs. L'acquisition recruteur est distribuée sur les profils.

---

## BLOC 3 — QUALITY GATE CANDIDAT → B2B

### Opt-in
Global avec une seule exclusion sectorielle. Un toggle on/off + un champ "Exclure un secteur" (nullable). Un seul secteur excluable. Le candidat perd 10-15% de visibilité, pas 50%. L'anonymisation porte le reste de la protection.
Données : booléen is_opted_in + champ texte excluded_sector (nullable).

### Briques visibles
Le candidat sélectionne via prévisualisation obligatoire. Il voit sa fiche telle que le recruteur la verra. Il coche/décoche chaque brique. Il voit en temps réel l'impact sur les cauchemars couverts et le Blindage.
Seuil minimum : 3 briques blindées visibles + 2 cauchemars couverts. En dessous, le toggle opt-in est grisé.
Données : tableau visible_bricks[] dans savedState.

### Consultations
Invisibles au lancement (< 20 recruteurs). Email mensuel générique ("X recruteurs actifs sur la plateforme").
Compteur visible quand la moyenne dépasse 5 consultations/profil/mois. Nombre anonymisé dans l'Arsenal. Pas de comparaison entre candidats.
Données : table profile_views (recruiter_id, profile_id, timestamp). Compteur dérivé.

### Retrait
Effet immédiat. Zéro délai. La fiche disparaît dans la seconde. Couche publique dépubliée. Couche privée masquée. RGPD respecté (art. 7).
Avertissement discret au recruteur quand il shortliste : "Contacte rapidement, les profils peuvent être retirés à tout moment."

### Densité sous 70% après opt-in
Warning candidat (invisible pour le recruteur) + délai 14 jours pour corriger. Message : "Ta densité est passée à X%. Ton profil B2B reste actif 14 jours. Blinde une brique pour rester visible."
Après 14 jours sous 70% : profil suspendu (masqué, pas supprimé). L'opt-in reste actif. Réapparition automatique dès ≥ 70%.

### Abonnement
L'opt-in survit sans abonnement. Le candidat garde la vitrine B2B. Il perd l'accès aux livrables (Établi, Trempe). Le contact recruteur est le levier de réabonnement ("Un recruteur t'a contacté. Génère ton One-Pager calibré.").
Le ranking naturel (fraîcheur, activité) fait monter les abonnés actifs et descendre les inactifs. Le volume de la marketplace ne fait que monter.

---

## BLOC 4 — MATCHING ET RECHERCHE

### Filtres au lancement
3 filtres : rôle + cauchemar + ville. Le filtre ville affiche le nombre entre parenthèses (Paris (12), Lyon (4)).
Secteur : après 500 profils (exige un champ candidat non encore implémenté).
Séniorité : après implémentation axe IC/Manager/Leader côté candidat (item 16f).
Signature : indicateur en liste, pas filtre.

### Matching
Manuel au lancement. 3 filtres + liste + fiche. Le recruteur browse et évalue.
Phase 2 (après 500 profils) : bouton "Coller une offre" = raccourci qui pré-remplit les filtres via analyzeOffer. Le recruteur ajuste et valide. Pas un mode séparé.
Phase 3 : Éclaireur inversé complet (scoring candidat × offre). Après calibration sur données réelles.

### Scoring candidat-offre
Reporté en phase 2-3. Se construit sur données réelles (contacts, placements, feedback).

### Ranking des résultats
Fraîcheur (dernière activité Forge) > cauchemars couverts (fit additionnel) > Blindage moyen (qualité preuves) > signature présente (différenciateur). La fraîcheur prédit la réactivité. Le ranking récompense les abonnés actifs sans punir les inactifs.

---

## BLOC 5 — PREMIER CONTACT

### Canal
Email transactionnel au lancement. Zéro inbox. Le recruteur clique "Contacter" sur un profil. Il remplit un formulaire structuré — pas un champ libre. Champs : rôle recherché (pré-rempli si mandat sauvegardé), cauchemar principal (1 seul, pas 3), contexte court (80 mots max), message personnel optionnel (30 mots max). Le formulaire force la concision : 1 message = 1 proposition de valeur pour 1 pain point. L'email au candidat est assemblé par l'outil à partir des champs structurés. La qualité du message est garantie par le formulaire, pas par le talent rédactionnel du recruteur.
Prérequis : SPF + DKIM + DMARC sur abnegation.eu. Service d'envoi transactionnel séparé du Zimbra (Resend ou équivalent). Tracking d'ouverture.
Séquence : email seul (lancement) → dashboard recruteur (V2, après 10 recruteurs) → inbox candidat Arsenal (V3, rétention).

### Paiement
Avant, par crédits. Un crédit consommé par demande envoyée. Restitution sur refus ou expiration. Le solde reste sur la plateforme (pas de remboursement en argent).
Données : table credits (recruiter_id, balance). Table credit_transactions (type: purchase/consume/refund, contact_request_id, amount, created_at).

### Consentement du candidat
Le candidat accepte ou refuse. Après acceptation : le One-Pager calibré (cauchemars du mandat) est généré et transmis au recruteur avec les coordonnées du candidat. Le CV calibré (ATMT, chronologique) est disponible sur demande du recruteur. Le consentement est spécifique (ce recruteur, ce mandat).

### Refus
Avec raison optionnelle, après le refus. Le candidat clique Refuser → page de confirmation "Demande déclinée" → 4 boutons optionnels : "Pas la bonne ville" / "Pas intéressé par ce rôle" / "J'ai trouvé un poste" / "Timing pas bon."
Données : champ nullable decline_reason (enum: wrong_city / wrong_role / found_job / bad_timing / null) dans contact_requests.

### Relance
Une seule autorisée après expiration. Le recruteur consomme un nouveau crédit. Maximum 2 tentatives par couple recruteur-candidat. Verrouillage permanent après 2 tentatives.
Données : champ attempts (integer, default 1, max 2) dans contact_requests.

### Délai d'expiration
Ajustable par le recruteur : 3j / 5j / 7j / 10j / 14j. Défaut 7j. Plancher 3j (protège le week-end). Plafond 14j. Le candidat voit le délai dans l'email.
Données : champ expires_at dans contact_requests (calculé: created_at + délai choisi). Cron expire sur expires_at.

---

## BLOC 6 — MODÈLE DE REVENU B2B

### Prix par crédit
150€ au lancement. Unique. Tous rôles. Toutes villes. Monte avec le volume (200€ après 500 profils). Hypothèse à valider avec 5 cabinets beta.
Variable Stripe (product_price), pas hardcodée.

### Format d'achat
Packs de crédits. Pas de récurrence.
- 5 crédits : 750€ (150€/crédit)
- 10 crédits : 1500€ (150€/crédit)
- 20 crédits : 2600€ (130€/crédit — discount)
Les crédits ne périment pas.
Abonnement recruteur en V2 si consommation régulière constatée (> 10 crédits/mois pendant 3 mois).

### Freemium recruteur
Recherche et fiches structurelles gratuites. Le recruteur voit la liste complète et la fiche (type de brique, cauchemar couvert, Blindage label). Le texte complet des briques est masqué. Il apparaît après acceptation du candidat.
Le contact est payant (1 crédit = 150€).
Cohérence avec le modèle candidat : voir gratuit, agir payant.

### Candidat
Ne touche rien. Sa rémunération est l'opportunité d'emploi. Le fee finance la plateforme.

---

## BLOC 7 — ONBOARDING RECRUTEUR

### Proposition de valeur
"Chaque candidat a déjà résolu le problème que votre client vous demande de résoudre."
Sous-titre : "Filtrez par défi résolu. Pas par titre de poste."
Vocabulaire Abneg@tion (Blindage, cauchemar, densité) absent du pitch. Présent dans l'interface après inscription. Le pitch parle la langue du recruteur. L'outil lui apprend la nôtre.

### Auth
Unifiée avec rôle. Un seul compte Supabase. Champ role dans user_metadata ("candidate", "recruiter", "both"). RLS filtre par rôle. Inscription recruteur sur /recruiter/signup. Inscription candidat inchangée. Le même email accède aux deux surfaces.
Guard RLS : le candidat-recruteur ne voit pas son propre profil dans les résultats (WHERE profile_user_id != auth.uid()).

### Entité cabinet
Comptes individuels au lancement. Champ cabinet_name (texte libre) dans user_metadata. Guard anti-doublon : avant l'envoi d'une demande, vérifier si un contact_request existe avec le même cabinet_name pour le même profil.
Entité cabinet (table organizations, invitations, solde partagé) en V2 après 10 cabinets avec 3+ recruteurs.

### Recherche
Browse libre immédiat. Zéro formulaire obligatoire. La preuve de valeur arrive en 30 secondes.
Mandat optionnel : bouton "Sauvegarder cette recherche comme mandat" dans la barre de filtres. Le mandat pré-remplit le message de contact. La donnée de mandats s'accumule pour l'Éclaireur inversé (phase 2).
Données : table mandates (id, recruiter_id, role, city, cauchemar_ids, context_text, created_at).

### Double rôle
Supporté par l'auth unifiée. Le candidat-recruteur switch entre les deux surfaces. Guard RLS exclut le profil propre des résultats.

---

## BLOC 8 — INFRASTRUCTURE ET SÉPARATION

### Domaine
Même domaine. abnegation.eu/recruiter. Dossier /app/recruiter/ avec layout séparé. Header conditionnel selon la route. Footer candidat avec lien "Recruteurs" vers /recruiter.
Sous-domaine (pro.abnegation.eu) en phase 3 si feedback recruteur le justifie.

### Base de données
Même Supabase + RLS. Tables recruteur (credits, credit_transactions, contact_requests, mandates, profile_views) à côté des tables candidat (candidate_states, brew_weeks, brew_instructions). Chaque table a ses propres RLS policies.
Check QA agent ajouté : "Aucune table candidat accessible sans is_opted_in = true pour le rôle recruteur."

### Profils
Vue temps réel. Pas de snapshot. Pas de cron.
Table profile_index pour le filtrage (colonnes plates : role, city, cauchemars_covered, blindage_avg, has_signature, last_activity, is_opted_in, excluded_sector). Trigger AFTER UPDATE sur candidate_states. Fonction PL/pgSQL qui extrait les champs filtrables du JSONB.
Fiche individuelle lit le JSONB d'un seul candidat (10KB). Zéro fenêtre RGPD.

### RGPD
Un seul responsable de traitement (Exosquelette). Deux finalités dans le registre (positionnement carrière + sourcing). Pas de séparation technique nécessaire.

---

## BLOC 9 — RGPD ET CONSENTEMENT

Tout tranché par les décisions des blocs 2-5.

- Consentement : prévisualisation obligatoire. Le candidat voit ce que le recruteur verra.
- Données partagées : briques sélectionnées, signature, cauchemars couverts, rôle, ville.
- Droit d'accès : le candidat voit sa fiche B2B à tout moment dans l'Arsenal.
- Droit à l'effacement : retrait immédiat sur la plateforme. L'email reçu par le recruteur après acceptation est sous la responsabilité du recruteur.
- DPA : pas nécessaire avec les cabinets (destinataires, pas sous-traitants). Nécessaire avec le service email transactionnel.
- Révocabilité : effet immédiat.

**Documents à produire :**
1. Mise à jour mentions légales + politique de confidentialité (section B2B)
2. CGU recruteur (responsabilité post-transmission des coordonnées)
3. Registre des traitements (entrée B2B)
4. DPA avec le service email transactionnel

---

## BLOC 10 — SEUILS DE LANCEMENT

### Seuil
20 profils opt-in par rôle. Pas 200. Le seuil de 200/rôle est retiré. Le seuil de 3+ villes est retiré.
Lancement progressif rôle par rôle. Premier rôle probable : enterprise_ae.
Le nombre total de profils n'est jamais affiché. Le recruteur voit le nombre de résultats par recherche.

### Villes
Pas de seuil par ville. Tous les profils opt-in sont visibles. Le filtre ville affiche le nombre entre parenthèses. Le recruteur décide.

### Beta
Fermée, gratuite, 2-3 cabinets invités, 2-3 semaines. Feedback interface uniquement (filtres, fiche, flow contact, délivrabilité email). Pas de feedback pricing.
Flag is_beta dans user_metadata. Bouton "Contacter" fonctionne sans crédit en mode beta. Flag retiré au lancement payant.

### Calendrier
Phase 0 (en cours) : 10 candidats réels + micro-entreprise + Stripe.
Phase 1 (mois 1-4) : base grandit, opt-in proposé, coachs envoient des candidats.
Phase 2 (mois 3-4) : surface B2B construite + beta 2-3 cabinets.
Phase 3 (mois 4-5) : ouverture payante au seuil de 20 profils/rôle.

---

## TABLES SUPABASE B2B (nouvelles)

```sql
-- Profils indexés pour filtrage rapide
CREATE TABLE profile_index (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL,
  city TEXT,
  cauchemars_covered INTEGER DEFAULT 0,
  blindage_avg NUMERIC(3,2) DEFAULT 0,
  has_signature BOOLEAN DEFAULT FALSE,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  is_opted_in BOOLEAN DEFAULT FALSE,
  excluded_sector TEXT,
  visible_bricks JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crédits recruteur
CREATE TABLE credits (
  recruiter_id UUID PRIMARY KEY REFERENCES auth.users(id),
  balance INTEGER DEFAULT 0
);

-- Transactions crédits
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('purchase', 'consume', 'refund')),
  amount INTEGER NOT NULL,
  contact_request_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Demandes de contact
CREATE TABLE contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID REFERENCES auth.users(id),
  candidate_profile_id UUID REFERENCES auth.users(id),
  mandate_id UUID,
  mandate_role TEXT NOT NULL,
  mandate_cauchemar TEXT NOT NULL,
  mandate_context VARCHAR(500) NOT NULL,
  personal_note VARCHAR(200),
  status TEXT CHECK (status IN ('pending', 'accepted', 'refused', 'expired')) DEFAULT 'pending',
  decline_reason TEXT CHECK (decline_reason IN ('wrong_city', 'wrong_role', 'found_job', 'bad_timing', NULL)),
  attempts INTEGER DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Mandats sauvegardés
CREATE TABLE mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL,
  city TEXT,
  cauchemar_ids TEXT[],
  context_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consultations de profils
CREATE TABLE profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID REFERENCES auth.users(id),
  profile_id UUID REFERENCES auth.users(id),
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## SÉQUENCE D'IMPLÉMENTATION

### Lancement (code minimal)
1. Table profile_index + trigger sur candidate_states
2. Auth unifiée (champ role dans user_metadata)
3. /recruiter/signup + /recruiter/search (3 filtres + liste)
4. /recruiter/profile/[id] (fiche structurelle, briques masquées)
5. Opt-in candidat (toggle + exclusion secteur + prévisualisation + seuil minimum)
6. Table credits + credit_transactions + packs Stripe (3 produits)
7. Table contact_requests + endpoint POST /api/contact-request
8. Email transactionnel (notification candidat + One-Pager calibré après acceptation)
9. Generator One-Pager dans l'Établi (5 blocs : signature, cauchemars × preuves, transfert, parcours compressé, contact — calibré pour le mandat du recruteur)
10. Pages /contact/accept/[token] et /contact/refuse/[token]
11. Cron expiration (expires_at) + restitution crédits
12. Guard anti-doublon (cabinet_name × profile_id)
13. Couche publique indexable (abnegation.eu/profil/[id] anonymisé)
14. Flag is_beta pour cabinets test

### V2 (après 10 recruteurs actifs)
15. Dashboard recruteur ("Mes demandes" : statuts, historique)
16. Table mandates + bouton "Sauvegarder cette recherche"
17. PDF exportable (depuis la fiche web)
18. Compteur consultations candidat (dans l'Arsenal)
19. Filtre secteur (après ajout champ candidat)
20. Entité cabinet (organizations, invitations, solde partagé)

### V3 (après feedback et volume)
21. Bouton "Coller une offre" (pré-remplissage filtres via analyzeOffer)
22. Inbox candidat Arsenal (rétention)
23. Filtre séniorité (après item 16f IC/Manager/Leader)
24. Éclaireur inversé complet (scoring candidat × offre)
25. Sous-domaine pro.abnegation.eu (si feedback le justifie)

---

## DÉCISIONS ACTIVES B2B (ne pas remettre en question)

- Premier client : cabinet de recrutement. Coach = canal, pas client.
- Blindage visible pour le recruteur en labels qualitatifs. ATMT en fiche.
- Densité invisible pour le recruteur. Gate ≥ 70% filtre en amont.
- Cauchemar = filtre de recherche, pas attribut affiché.
- Signature en fiche seulement. Indicateur binaire en liste.
- Aucun livrable dans la fiche. One-Pager calibré (5 blocs, par cauchemar) déclenché par le contact. CV calibré (ATMT, chronologique) sur demande. Le One-Pager prouve. Le CV documente.
- Couche publique indexable + couche privée authentifiée.
- Opt-in global + 1 exclusion sectorielle. Retrait immédiat.
- Paiement par crédits avant l'envoi. Restitution sur refus/expiration.
- Contact par email. Zéro inbox au lancement. Formulaire structuré (1 rôle, 1 cauchemar, contexte 80 mots, note 30 mots). L'outil assemble l'email. La qualité est garantie par le formulaire, pas par le recruteur.
- Prix unique 150€/crédit. Tous rôles. Toutes villes.
- Même domaine. Même base Supabase. Vue temps réel.
- Seuil 20 profils/rôle. Lancement rôle par rôle. Beta gratuite avant.
