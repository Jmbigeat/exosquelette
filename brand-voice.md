# Brand Voice

## How JM communicates

Terse. Direct. French. No filler words. Corrections are one sentence. Decisions are final unless new data appears.

Says "go" when ready. Says "non" when something is wrong. Explains why in one line.

Never asks for permission. Asks for options, picks one, moves.

## Abneg@tion product voice

The tool talks to candidates with buried insight and absent craft — senior professionals paralyzed by doubt, juniors who don't know their life experience counts as proof. It does not coddle. It does not congratulate. It states facts.

### Principles

- State the problem. State the proof. Stop.
- Numbers before adjectives. "18K€ en 6 mois" beats "une excellente performance."
- The candidate is competent. The tool reveals what the candidate already knows but cannot articulate.
- Never say "bravo." Never say "excellent travail." The work speaks.
- Tutoiement everywhere. No "vous." Break the distance.

### UI copy rules

- Short. 8 words max for a label. 2 sentences max for an explanation.
- Active voice. Subject Verb Object.
- No jargon the candidate wouldn't use at a dinner table.
- No marketing vocabulary: game-changer, disruptif, révolutionner, mettre en lumière, paysage, embarquer.
- No weak verbs: pouvoir, devoir, sembler.
- No intensity adverbs: très, vraiment, littéralement.

### Banned words in generated content

passionné, dynamique, proactif, orienté résultats, fort de, doté de, riche expérience, reconnu pour, expert en, n'hésitez pas, ouvert aux opportunités, à l'écoute du marché, en quête de nouveaux défis.

### Tone spectrum

| Context | Tone |
|---------|------|
| Éclaireur results | Clinical. Facts. No emotion. |
| Forge feedback | Direct. Constructive. One sentence. |
| Stress test questions | Adversarial. The recruiter's voice. |
| One-Pager (primary deliverable) | Proof-first. Positive factual formulations (never negative/defensive like "The PM who can't X"). Section titles in recruiter language: "Preuves d'impact" not "Cauchemars résolus", "Pourquoi ce poste" not "Transfert." Zero Abneg@tion jargon — the One-Pager leaves the platform and travels to DRH/hiring managers who don't know the vocabulary. |
| CV calibré (admin deliverable) | Candidate's voice, sharpened via ATMT. Chronological. |
| Other deliverables (DM, email, bio) | Candidate's voice, sharpened. Not the tool's voice. |
| La Trempe (Brew) recommendations | Strategic. Coach tone. No cheerleading. |
| L'Échoppe (B2B) — recruiter-facing | Professional. Recruiter vocabulary. No Abneg@tion jargon (no "cauchemar", "blindage", "densité" in pitch). Jargon appears in-app after signup. |
| L'Échoppe — candidate opt-in | Protective. Clear. "Tu contrôles ce qui est visible." |
| Error messages | Honest. "Ton texte est trop court." Not "Oops, something went wrong!" |
| CTA | Factual benefit. "Lancer ma Forge — Gratuit." Not "Découvrez votre potentiel." |

### LinkedIn posts (JM's personal voice)

- Proof deposits, not content marketing.
- One idea per post. One enemy per post.
- No hashtags. No "commentez ci-dessous." No engagement bait.
- The first comment adds a backstory or a contradiction. Never "et vous qu'en pensez-vous ?"
- Coverage of 4 angles (problem, method, result, counter-intuitive) over time. Performance of a single post is irrelevant.

### LinkedIn comments (JM's personal voice)

- 2-4 sentences. Angle complémentaire or contradiction.
- Never "je suis d'accord." Never self-promotional.
- End with a specific question, not a generic one.

## Language rules

- UI strings: French with proper accents (é, è, ê, à, ù, ç).
- Code: English.
- Generated content: French.
- No unicode escapes. Write é, not \u00E9. Write €, not \u20AC.

---

## MESSAGING TREMPE (25 mars 2026)

Formulation candidate pour la landing ou l'onboarding Trempe :

"Le contenu que tu publies n'est pas du personal branding. C'est une preuve de compétence déposée dans l'esprit d'un recruteur qui aura un besoin dans 3 mois. Ce jour-là, il ne comparera pas 200 CV. Il t'appellera toi."

Source : post LinkedIn doctrine proof deposit (anonyme, mars 2026). Reformulée pour le candidat Abneg@tion.

Variante courte : "Chaque post est une micro-preuve. Le recruteur qui aura un mandat dans 3 mois t'appellera toi."

Anti-pattern : ne jamais dire "personal branding" dans l'UI ou le messaging. Le candidat entend "marketing de soi" et décroche. Dire "preuve déposée" ou "trace sédimentée."

---

## MESSAGING ARCHITECTURE 80% DÉTERMINISTE (25 mars 2026)

Formulation candidate pour le portfolio, un post pilier 2, ou un pitch PM :

"Le LLM est optimisé pour paraître sûr de lui, pas pour avoir raison. C'est pour ça que le moteur d'Abneg@tion est déterministe à 80%. Le scoring ne passe pas par l'IA. Le Blindage ne passe pas par l'IA. La densité ne passe pas par l'IA. L'IA met en forme. Le code décide."

Source : post LinkedIn "LLMs programmés pour mentir" (mars 2026). Connexion : biais RLHF + architecture Abneg@tion.

Anti-pattern : ne jamais dire "notre IA est fiable." Dire "notre scoring est déterministe. L'IA n'y touche pas."

---

## MESSAGING ÈRE 4 × LINKEDIN HIRING ASSISTANT (25 mars 2026)

Formulation candidate pour un post pilier 4 (le positionnement est périssable) :

"LinkedIn vient de lancer un agent IA qui filtre les candidats sur le 'true fit', pas les mots-clés. Le candidat qui n'a pas blindé ses preuves sera filtré par un algorithme qui cherche exactement ce qu'il n'a pas formulé. Le positionnement n'est plus un avantage. C'est une condition de survie."

Source : pub LinkedIn Hiring Assistant (mars 2026). Connexion : même argument que Noota — l'IA côté recruteur améliore le filtre, pas l'input.

---

## MESSAGING DUEL × ENTRETIEN SOUS PRESSION (25 mars 2026)

Formulation candidate pour un post pilier 2 (le chiffre ouvre la porte, la cicatrice ferme la négo) :

"L'entretien préparé mesure la préparation. Le Duel mesure la tenue. La différence : le candidat qui a préparé ses réponses s'effondre à la première objection imprévue. Le candidat qui a blindé ses briques tient, parce que la preuve résiste à la pression. La préparation est périssable. Le blindage ne l'est pas."

Source : post LinkedIn recruteur early-stage "le vrai signal est ailleurs" (mars 2026). Contact potentiel Échoppe (profil recruteur early-stage).

---

## MESSAGING ANTI-HALLUCINATION (25 mars 2026)

Formulation candidate pour un post pilier 2 ou la landing :

"Les outils IA carrière inventent des chiffres. Abneg@tion refuse d'en inventer. Si le candidat n'a pas de chiffre, la case reste vide. Le moteur signale le manque. Il ne le comble pas. Le Blindage est déterministe. Un booléen ne hallucine pas."

Source : plaintes Reddit/LinkedIn sur les AI resume builders + biais RLHF + architecture 80% déterministe.

---

## POSITIONNEMENT DE RÉFÉRENCE (25 mars 2026)

Combinaison gagnante : catégorie + moment + résultat.

"Pour les candidats expérimentés qui postulent depuis des semaines sans retour, Abneg@tion est le seul outil qui structure des preuves vérifiables — pas du contenu généré. Tu repars avec un document qui te ressemble vraiment."

Cible V1 : candidats expérimentés. Élargir aux juniors après les 10 candidats.
"Le seul outil" tient : aucun concurrent identifié ne fait du Blindage 4 cases (competitive-complaints.md).

---

## TEMPLATE DM ACQUISITION CANDIDAT V2 (25 mars 2026)

V1 (remplacé) : "Tu postules depuis des semaines sans retour ?" — trop générique.

V2 :

"Tu as refait ton CV. Tu as testé les outils IA. Le recruteur ne rappelle pas. Le problème n'est pas le format — c'est que tes preuves ne sont pas structurées. Je construis un outil qui extrait tes preuves depuis ton vécu et les blinde sur 4 axes. Pas de contenu inventé. 2 minutes pour tester : abnegation.eu. Je cherche 3 retours honnêtes."

Cible : profils LinkedIn "Open to Work" ou posts frustration recherche.
Objectif : feedback, pas conversion.
Ratio attendu : 10% de retours (source : framework 80-8-4).

---

## MESSAGING DILEMME DU FUSIBLE × PILIER 1 (25 mars 2026)

Formulation candidate pour un post pilier 1 (le silence a un prix) :

"À 100K€, le silence coûte 8 mois de recherche et 15% de perte salariale au prochain poste. Le candidat en poste prouve avec un dashboard. Le candidat en recherche prouve avec des souvenirs. Le Blindage transforme les souvenirs en preuves qui ne périment pas."

Source : post Méroé Nguimbi "Théorie du Fusible" (mars 2026). Contact Méroé = contact Échoppe après 20 profils opt-in.

---

## DM PAR BANDE SALARIALE (25 mars 2026)

Source : post Méroé "Théorie du Fusible" — 4 comportements de recherche par bande.

DM cible 40K : "Tu envoies 80 candidatures par semaine. 4% de retours. Le problème n'est pas le volume. C'est que tes 80 CV disent la même chose. 2 minutes pour tester : abnegation.eu"

DM cible 70K : "Tu négocies remote + variable. Mais le recruteur ne sait pas ce que tu vaux. Tes preuves ne sont pas structurées. 2 minutes pour tester : abnegation.eu"

DM cible 100K+ : "Tu es sélectif parce que la mauvaise ligne sur ton CV à ce salaire te coûte 2 ans. L'outil structure tes preuves pour que le bon poste te reconnaisse. 2 minutes : abnegation.eu"

Le DM V2 (générique) reste le défaut. Les DM par bande s'utilisent quand le profil LinkedIn révèle la bande salariale.

---

## PITCH ÉCHOPPE 100K+ (25 mars 2026)

"Vous recrutez à 100K+. Le coût d'une erreur est de 80K€ minimum. Nos candidats ont des preuves blindées sur vos cauchemars spécifiques. 150€ pour vérifier au lieu de deviner."

Source : "Théorie du Fusible" — le crédit Échoppe est invisible face au coût du mauvais recrutement (50-130K€).

---

## BRIQUE ENTRETIEN PM — SEGMENTATION COMPORTEMENTALE (25 mars 2026)

Question recruteur : "Comment tu segmentes tes utilisateurs ?"

Réponse : "Pas par titre de poste. Par comportement de recherche. Le candidat à 40K joue au volume. Le candidat à 70K négocie. Le candidat à 100K+ joue au poker. Même outil, même densité cible (70%), parcours différent."

Source : post Méroé "Théorie du Fusible" (mars 2026). Preuve PM : segmentation comportementale vs démographique.

---

## MESSAGING DIFFÉRENCIATION IA (30 mars 2026)

Positionnement : "IA dans le moteur, humain dans la preuve." Pas anti-IA. Pas pro-IA. Troisième camp.

**Formulation candidat** : "Un CV généré par l'IA passe les ATS. Une brique blindée passe l'entretien."

**Formulation recruteur (Échoppe)** : "Vos candidats arrivent avec des livrables auto-générés. Les nôtres arrivent avec des preuves qu'ils ont forgées eux-mêmes. Le Blindage 4/4 signifie : chiffre vérifié, décision documentée, influence prouvée, transférabilité argumentée. Aucun outil IA ne produit ça sans le candidat."

**Formulation DRH (Plan C)** : "Le cabinet d'outplacement classique reformule le CV à la place du salarié. L'IA le fait aussi, 10x plus vite. Aucun des deux ne change ce que le salarié sait dire en entretien. L'entretien reste humain. Les preuves doivent l'être aussi."

**Source** : analyse newsletter Rémi (système IA prestataire, 30 mars 2026). Le contraste "80% délégué à l'IA" vs "le candidat fait le travail" est le fil rouge du positionnement.

**Usage** :
- Pages GEO "Alternatives à X" (post-10 candidats) : colonne "outils qui produisent à ta place" vs "outils qui t'aident à formuler"
- Post LinkedIn pilier 3 : architecture ATMT (accroche chiffre contraste, tension candidat nu en entretien, méthode la preuve se forge, transfert le lecteur reconnaît son CV auto-généré)
- One-Pager B2B : la dernière phrase du bloc 2 rappelle que les preuves sont forgées par le candidat, pas générées

**Anti-pattern** : ne jamais attaquer un outil IA nommé. Le contraste oppose deux philosophies, pas deux produits.
