import { KPI_REFERENCE, MARKET_DATA, STRESS_ANGLES, SCRIPT_CHANNELS } from "./references.js";
import { cleanRedac } from "./redac.js";
import { getActiveCauchemars, formatCost, computeCauchemarCoverage, hashCode } from "./scoring.js";
import { hasNumbers, hasExternalization, hasDecisionMarkers, hasInfluenceMarkers, classifyCicatrice, extractBrickSummary } from "./analysis.js";
import { matchKpiToReference } from "./bricks.js";
import { parseOfferSignals, parseInternalSignals } from "./offers.js";
import { analyzeDiltsProgression } from "./dilts.js";

export function extractBestNum(text) {
  var withSuffix = text.match(/([\+\-]?\d[\d\s.,]*\s*(?:K€|M€|k€|€|%|lignes?|modules?|mois|couverts?|tests?|sessions?|users?|clients?|projets?|tickets?|sprints?|jours?|heures?|semaines?))/i);
  if (withSuffix) return withSuffix[1].replace(/\s+/g, " ").trim();
  var all = text.match(/[\+\-]?\d[\d\s.,]*/g);
  if (!all) return null;
  var best = null;
  var bestVal = 0;
  all.forEach(function(m) {
    var v = parseFloat(m.replace(/\s/g, "").replace(",", "."));
    if (!isNaN(v) && v > bestVal) { bestVal = v; best = m.trim(); }
  });
  return best;
}

/* Génère un résumé Fossé chiffré pour le diagnostic */
export function computeFosseMarket(salaire) {
  var sal = salaire || MARKET_DATA.fosse.salaire_median_cadre;
  var minPerte = Math.round(sal * MARKET_DATA.fosse.ecart_salaire_marche.min / 100);
  var maxPerte = Math.round(sal * MARKET_DATA.fosse.ecart_salaire_marche.max / 100);
  return {
    salaire: sal,
    perteMensuelleMin: Math.round(minPerte / 12),
    perteMensuelleMax: Math.round(maxPerte / 12),
    perteAnnuelleMin: minPerte,
    perteAnnuelleMax: maxPerte,
    contexte: MARKET_DATA.fosse.part_augmentes_changement + "% des cadres qui changent sont augmentés. " + MARKET_DATA.fosse.part_augmentes_meme_poste + "% de ceux qui restent.",
    ecartGain: "+" + MARKET_DATA.fosse.gain_changement_employeur + "% en changeant vs +" + MARKET_DATA.fosse.gain_sans_changement + "% en restant.",
    intentionVsAction: MARKET_DATA.reconversion.projet_reconversion + "% veulent bouger. " + MARKET_DATA.reconversion.demarches_entamees + "% bougent. Le Fossé est là.",
  };
}



export function generateCV(bricks, targetRoleId, trajectoryToggle) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return "[Aucune brique validée. Le CV se construit à partir de tes preuves.]";

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleTitle = roleData ? roleData.role.toUpperCase() : "PROFESSIONNEL";

  // Score + greedy select (same logic as CVPreview)
  var cauchemars = getActiveCauchemars();
  var TARGET_BRICKS = 5;
  var scored = validated.map(function(b) {
    var score = 0;
    if (b.kpi && cauchemars.some(function(c) { return c.kpis.some(function(k) { return b.kpi.indexOf(k.slice(0, 6)) !== -1 || k.indexOf((b.kpi || "").slice(0, 6)) !== -1; }); })) score += 10;
    if (/\d/.test(b.text)) score += 5;
    if (/via|grâce à|méthode|process|déployé|mis en place|construit|structuré/i.test(b.text)) score += 3;
    if (b.elasticity === "élastique") score += 2;
    return { brick: b, score: score };
  });
  scored.sort(function(a, b) { return b.score - a.score; });

  var selected = [];
  var coveredCauchIds = {};
  scored.forEach(function(s) {
    if (selected.length >= TARGET_BRICKS) return;
    var coversNew = s.brick.kpi && cauchemars.some(function(c) {
      if (coveredCauchIds[c.id]) return false;
      return c.kpis.some(function(k) { return s.brick.kpi.indexOf(k.slice(0, 6)) !== -1 || k.indexOf(s.brick.kpi.slice(0, 6)) !== -1; });
    });
    if (coversNew) {
      selected.push(s);
      cauchemars.forEach(function(c) {
        if (c.kpis.some(function(k) { return s.brick.kpi.indexOf(k.slice(0, 6)) !== -1 || k.indexOf(s.brick.kpi.slice(0, 6)) !== -1; })) coveredCauchIds[c.id] = true;
      });
    }
  });
  scored.forEach(function(s) {
    if (selected.length >= TARGET_BRICKS) return;
    if (selected.indexOf(s) === -1) selected.push(s);
  });

  var cvBricks = selected.map(function(s) { return s.brick; });
  var coveredCount = Object.keys(coveredCauchIds).length;

  // Séparer briques side project / expérience pro.
  // Ne jamais mélanger les briques side project et les briques d'expérience salariée dans le même bloc.
  var proBricks = cvBricks.filter(function(b) { return !b.sideProject; });
  var sideBricks = cvBricks.filter(function(b) { return b.sideProject; });

  // Header
  var cv = roleTitle + "\n";
  cv += cvBricks.length + " preuves \u00B7 " + coveredCount + "/" + cauchemars.length + " cauchemars couverts\n";
  cv += "\n[Poste] \u2014 [Entreprise] ([Dates])\n\n";

  // Bricks pro via extractBrickSummary
  proBricks.forEach(function(b) {
    cv += "\u2022 " + extractBrickSummary(b.text) + "\n";
  });

  // Bloc side project séparé
  if (sideBricks.length > 0) {
    cv += "\nSIDE PROJECT \u2014 [Nom] ([Dates])\n\n";
    sideBricks.forEach(function(b) {
      cv += "\u2022 " + extractBrickSummary(b.text) + "\n";
    });
  }

  cv += "\nFormation\n[Diplôme] \u2014 [École] ([Année])";
  return cleanRedac(cv, "livrable");
}


export function generateBio(bricks, vault, trajectoryToggle) {
  // BIO LINKEDIN = POSITION, PAS MÉTA-COMMENTAIRE.
  // La bio ouvre sur une des 4 prises de position validées du candidat.
  // Interdit les phrases qui décrivent ce que le candidat fait (j'écris sur, je partage, j'explore).
  // La bio AFFIRME une conviction. Pas de coût chiffré (réservé à l'email), pas de question directe (réservée au DM).
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return "[Bio produite après validation de tes briques.]";

  // LINE 1 — Prise de position du candidat (conviction, pas cauchemar)
  var line1 = "Les résultats existent. Personne ne les formule.";
  if (vault && vault.selectedPillars && vault.selectedPillars.length > 0) {
    var takePillar = vault.selectedPillars.find(function(p) { return p.source === "take"; });
    var pillar = takePillar || vault.selectedPillars[0];
    if (pillar && pillar.title) {
      line1 = pillar.title.replace(/\.$/, "") + ".";
    }
  }

  // LINE 2 — Top 3 elastic bricks, numbers only
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });
  var proofBricks = elasticBricks.length >= 2 ? elasticBricks : validated;
  var line2parts = proofBricks.slice(0, 3).map(function(b) {
    var nums = b.text.match(/[\+\-]?\d+[%KM€]?[^\.\,]*/g);
    return nums ? nums[0].trim() : b.kpi || "";
  });
  var line2 = line2parts.join(". ") + ".";

  // LINE 3 — Cauchemar couvert (contexte terrain, pas méta-commentaire)
  var strongestCauchemar = null;
  getActiveCauchemars().forEach(function(c) {
    var covers = validated.filter(function(b) {
      return c.kpis.some(function(kpi) { return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; });
    });
    if (covers.length > 0 && (!strongestCauchemar || covers.length > strongestCauchemar.count)) {
      strongestCauchemar = { text: c.nightmareShort, count: covers.length };
    }
  });
  var line3 = strongestCauchemar ? strongestCauchemar.text : "Le marché récompense ceux qui documentent leurs résultats.";

  return cleanRedac(line1 + "\n\n" + line2 + "\n\n" + line3, "livrable");
}

/* ==============================
   ITEM 2 — TRIPLE SORTIE PAR BRIQUE
   CV 6sec + Entretien 3 interlocuteurs + Discovery
   ============================== */


export function generateScript(bricks, targetRoleId) {
  var result = generateContactScripts(bricks, targetRoleId);
  return result ? result.email : "[Script produit après validation de tes briques.]";
}

/* ==============================
   ITEM 6 — SCRIPT 4 VARIANTES + GRILLE 6 TESTS
   ============================== */


export function generatePlan90(bricks, targetRoleId, offersArray) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return null;

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  if (!roleData) return null;

  var cadence = roleData.cadence; // 30, 90, or 180
  var roleName = roleData.role;

  // Get cauchemars from offer or defaults
  var activeCauchs = getActiveCauchemars();
  if (offersArray && offersArray.length > 0) {
    var parsed = parseOfferSignals(offersArray[0].text, targetRoleId);
    if (parsed && parsed.cauchemars && parsed.cauchemars.length >= 3) activeCauchs = parsed.cauchemars;
  }

  // Match cauchemars to bricks (sorted by cost descending)
  var sortedCauchs = activeCauchs.slice().sort(function(a, b) { return (b.costRange[1] || 0) - (a.costRange[1] || 0); });
  var cauchWithBrick = [];
  sortedCauchs.forEach(function(c) {
    var matchBrick = validated.find(function(b) {
      return c.kpis && c.kpis.some(function(kpi) { return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; });
    });
    cauchWithBrick.push({ cauchemar: c, brick: matchBrick || null });
  });

  // Get Take
  var takeBrick = bricks.find(function(b) { return b.brickType === "take" && b.status === "validated"; });
  var takeText = takeBrick ? takeBrick.text : null;

  // Phase structure depends on cadence
  var phases = [];

  if (cadence <= 30) {
    // MENSUEL: 3 rendez-vous de souveraineté en 90 jours
    phases = [
      { label: "Semaines 1-4", tag: "DIAGNOSTIC + QUICK WIN", rdvSouverainete: "1er Rendez-vous de Souveraineté (J30)", color: "#e94560" },
      { label: "Semaines 5-8", tag: "EXECUTION + PREUVE", rdvSouverainete: "2e Rendez-vous de Souveraineté (J60)", color: "#ff9800" },
      { label: "Semaines 9-12", tag: "SYSTEME + MESURE", rdvSouverainete: "3e Rendez-vous de Souveraineté (J90)", color: "#4ecca3" },
    ];
  } else if (cadence <= 90) {
    // TRIMESTRIEL: 1 rendez-vous de souveraineté à J90
    phases = [
      { label: "Semaines 1-4", tag: "IMMERSION + DIAGNOSTIC", rdvSouverainete: null, color: "#e94560" },
      { label: "Semaines 5-8", tag: "PREMIERS ARBITRAGES", rdvSouverainete: null, color: "#ff9800" },
      { label: "Semaines 9-12", tag: "LIVRAISON + BILAN", rdvSouverainete: "Rendez-vous de Souveraineté (J90)", color: "#4ecca3" },
    ];
  } else {
    // SEMESTRIEL: J90 = mi-parcours
    phases = [
      { label: "Semaines 1-4", tag: "CARTOGRAPHIE POLITIQUE", rdvSouverainete: null, color: "#e94560" },
      { label: "Semaines 5-8", tag: "PREMIERS SIGNAUX", rdvSouverainete: null, color: "#ff9800" },
      { label: "Semaines 9-12", tag: "POINT MI-CYCLE", rdvSouverainete: "Mi-parcours vers le 1er Rendez-vous de Souveraineté (J180)", color: "#4ecca3" },
    ];
  }

  // Role-specific action templates
  var roleActions = {
    enterprise_ae: {
      phase1: ["Cartographier les 5 comptes stratégiques et leur cycle de décision", "Identifier le deal bloqué le plus coûteux et diagnostiquer le blocage", "Poser la question discovery au N+1 : ''{Q}''"],
      phase2: ["Débloquer 1 deal en appliquant la méthode multi-décideurs", "Documenter le before/after avec chiffre de pipeline", "Installer le rituel de revue hebdo avec le VP Sales"],
      phase3: ["Mesurer le delta de win rate depuis l'arrivée", "Présenter le ROI des 90 jours au COMEX", "Définir les 3 prochains comptes cibles avec le même playbook"],
    },
    head_of_growth: {
      phase1: ["Auditer les 3 canaux principaux et leur CAC réel", "Identifier l'expérimentation la plus rentable en cours", "Poser la question : quel canal a été abandonné trop tôt ?"],
      phase2: ["Lancer 2 expérimentations ciblées sur le canal sous-exploité", "Mesurer LTV/CAC par cohorte, pas en moyenne", "Couper 1 canal qui consomme du budget sans preuve de conversion"],
      phase3: ["Présenter le delta de CAC et les cohortes avant/après", "Proposer le plan Q2 avec budget et hypothèses testables", "Documenter la méthode pour qu'elle survive sans toi"],
    },
    strategic_csm: {
      phase1: ["Lister les 10 comptes à risque de churn avec date de renouvellement", "Identifier le compte le plus rentable avec le NRR le plus faible", "Poser la question au client : quel problème personne ne résout ?"],
      phase2: ["Sauver 1 compte à risque avec un plan d'action documenté", "Déclencher 1 upsell sur un besoin détecté (pas sur un pitch produit)", "Mesurer le NRR avant/après intervention"],
      phase3: ["Présenter le delta de churn sauvé en euros", "Créer le playbook de détection précoce pour l'équipe", "Identifier les 3 comptes d'expansion pour Q2"],
    },
    senior_pm: {
      phase1: ["Cartographier les 3 arbitrages produit en attente depuis plus de 2 mois", "Identifier la feature en production qui n'a bougé aucune métrique", "Poser la question à l'engineering : quel chantier est en cours sans sponsor ?"],
      phase2: ["Tuer 1 feature ou 1 projet sans impact mesurable", "Aligner engineering et business sur 1 métrique north star", "Livrer 1 quick win visible avec adoption mesurée"],
      phase3: ["Présenter le ROI des décisions prises (features tuées + livrées)", "Documenter les 3 prochains arbitrages du Q2", "Mesurer l'adoption du quick win à J90"],
    },
    ai_architect: {
      phase1: ["Auditer les projets IA en cours : combien en production vs POC", "Identifier le cas d'usage bloqué depuis plus de 3 mois", "Mesurer le coût d'infra actuel vs le ROI réel de chaque déploiement"],
      phase2: ["Débloquer 1 cas d'usage avec un périmètre réduit et mesurable", "Proposer 1 arbitrage build vs buy sur un modèle", "Former 1 équipe métier à l'usage autonome de l'outil IA"],
      phase3: ["Présenter le ROI du cas d'usage débloqué", "Documenter l'architecture de décision pour les prochains projets", "Mesurer le taux d'adoption interne avant/après intervention"],
    },
    engineering_manager: {
      phase1: ["Mesurer le cycle time réel (commit to deploy) sur les 3 derniers mois", "Identifier le dev le plus à risque de départ (signaux faibles)", "Cartographier la dette technique par impact business"],
      phase2: ["Réduire 1 friction dans le pipeline de livraison", "Conduire 1 entretien de rétention avec le talent à risque", "Arbitrer 1 décision build vs buy bloquée"],
      phase3: ["Présenter le delta de cycle time", "Documenter la décision build vs buy et son résultat", "Proposer le plan de rétention Q2 avec métriques"],
    },
    management_consultant: {
      phase1: ["Livrer le diagnostic en 2 semaines, pas en 6", "Identifier la recommandation que le COMEX refuse d'entendre", "Chiffrer le coût de l'inaction sur le problème principal"],
      phase2: ["Faire accepter 1 recommandation difficile avec données à l'appui", "Accompagner l'implémentation (pas juste livrer le slide deck)", "Mesurer le premier indicateur d'impact"],
      phase3: ["Présenter l'impact EBITDA de l'intervention", "Laisser un playbook utilisable sans consultant", "Poser la question : quel problème adjacent émerge ?"],
    },
    strategy_associate: {
      phase1: ["Cartographier les 3 dossiers stratégiques ouverts et leur sponsor", "Identifier le signal faible que personne n'a encore formalisé", "Comprendre l'alignement politique du COMEX sur chaque dossier"],
      phase2: ["Produire 1 analyse qui change la décision sur un dossier", "Aligner 2 membres du COMEX sur une position commune", "Documenter le raisonnement, pas juste la conclusion"],
      phase3: ["Présenter le delta de décision : qu'est-ce qui a changé grâce à l'analyse", "Préparer le cadrage du prochain cycle semestriel", "Identifier les 2 signaux faibles pour le S2"],
    },
    operations_manager: {
      phase1: ["Cartographier les 3 frictions inter-services les plus coûteuses en temps", "Mesurer la charge cognitive de l'équipe (nombre d'outils, étapes manuelles)", "Poser la question à chaque service : quel process vous fait perdre le plus de temps ?"],
      phase2: ["Éliminer 1 friction inter-services avec un process documenté", "Automatiser 1 tâche répétitive avec ROI mesurable", "Mesurer le temps gagné en heures par semaine"],
      phase3: ["Présenter le delta de friction et le temps libéré", "Documenter le process pour qu'il survive sans toi", "Identifier les 3 prochaines frictions à traiter en Q2"],
    },
    fractional_coo: {
      phase1: ["Diagnostiquer où le CEO passe son temps vs où il devrait le passer", "Identifier le process manquant qui coûte le plus cher", "Aligner les N-1 sur les 3 priorités du trimestre"],
      phase2: ["Installer 1 process de gouvernance qui libère le CEO de 5h/semaine", "Mesurer le runway impact de chaque décision opérationnelle", "Conduire le premier comité de pilotage structuré"],
      phase3: ["Présenter le ROI du temps libéré pour le CEO", "Documenter la gouvernance pour qu'elle fonctionne sans présence quotidienne", "Proposer le plan Q2 avec jalons et métriques"],
    },
  };

  var actions = roleActions[targetRoleId] || roleActions.enterprise_ae;

  // Inject cauchemar-specific content into phase 1
  var cauch1 = cauchWithBrick[0] || null;
  var cauch2 = cauchWithBrick[1] || null;
  var cauch3 = cauchWithBrick[2] || null;

  var plan = {
    role: roleName,
    cadence: cadence,
    cadenceLabel: roleData.cadenceLabel,
    phases: phases.map(function(p, i) {
      var phaseActions = i === 0 ? actions.phase1 : i === 1 ? actions.phase2 : actions.phase3;
      var targetCauch = i === 0 ? cauch1 : i === 1 ? cauch2 : cauch3;
      return {
        label: p.label,
        tag: p.tag,
        rdvSouverainete: p.rdvSouverainete,
        color: p.color,
        actions: phaseActions,
        cauchemar: targetCauch ? targetCauch.cauchemar.label : null,
        cauchemarCost: targetCauch ? formatCost(targetCauch.cauchemar.costRange[0]) + "-" + formatCost(targetCauch.cauchemar.costRange[1]) : null,
        brick: targetCauch && targetCauch.brick ? targetCauch.brick.cvVersion || targetCauch.brick.text : null,
      };
    }),
    take: takeText,
    ouverture: cauch1 ? "Le cauchemar le plus coûteux (" + cauch1.cauchemar.label + ", " + formatCost(cauch1.cauchemar.costRange[0]) + "-" + formatCost(cauch1.cauchemar.costRange[1]) + "/an) est votre priorité semaine 1." : null,
  };

  return plan;
}


export function generateContactScripts(bricks, targetRoleId, targetOffer) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return null;

  // If targetOffer provided, parse its signals and use those cauchemars
  var offerCauchemars = null;
  if (targetOffer && targetOffer.parsedSignals && targetOffer.parsedSignals.cauchemars) {
    offerCauchemars = targetOffer.parsedSignals.cauchemars;
  } else if (targetOffer && targetOffer.text && targetOffer.text.trim().length > 20) {
    var parsed = parseOfferSignals(targetOffer.text, targetRoleId);
    if (parsed) offerCauchemars = parsed.cauchemars;
  }
  var activeCauchs = offerCauchemars || getActiveCauchemars();

  var coverage = computeCauchemarCoverage(bricks);
  var covered = coverage.filter(function(c) { return c.covered; });
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleLabel = roleData ? roleData.role : "ce poste";

  var strongestCauchemar = null;
  var strongestBrick = null;
  covered.forEach(function(cc) {
    var cauch = activeCauchs.find(function(c) { return c.id === cc.id; });
    if (!cauch) {
      // Try matching by label/kpi for offer-specific cauchemars
      cauch = activeCauchs.find(function(c) {
        return c.kpis && c.kpis.some(function(kpi) { return cc.kpi && cc.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; });
      });
    }
    if (!cauch) return;
    if (!strongestCauchemar || cauch.costRange[1] > strongestCauchemar.costRange[1]) {
      var coveringBrick = validated.find(function(b) {
        return cauch.kpis.some(function(kpi) { return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; });
      });
      if (coveringBrick) { strongestCauchemar = cauch; strongestBrick = coveringBrick; }
    }
  });
  if (!strongestBrick) strongestBrick = validated[0];

  var cauchText = strongestCauchemar ? strongestCauchemar.nightmareShort : "";
  var brickText = strongestBrick ? strongestBrick.text : "";
  var brickCv = strongestBrick && strongestBrick.cvVersion ? strongestBrick.cvVersion : brickText;
  var costLow = strongestCauchemar ? formatCost(Math.round(strongestCauchemar.costRange[0] / 4)) : "";
  var costHigh = strongestCauchemar ? formatCost(Math.round(strongestCauchemar.costRange[1] / 4)) : "";
  var costLine = costLow && costHigh ? " Ce type de situation coûte entre " + costLow + " et " + costHigh + " par trimestre." : "";

  var closeQuestions = {
    enterprise_ae: "Qu'est-ce qui rend ce recrutement difficile aujourd'hui ?",
    head_of_growth: "Quel canal d'acquisition vous préoccupe le plus en ce moment ?",
    strategic_csm: "Quel est le compte qui vous empêche de dormir ?",
    senior_pm: "Quel arbitrage produit personne ne veut trancher en ce moment ?",
    ai_architect: "Quel cas d'usage IA est bloqué depuis plus de 3 mois ?",
    engineering_manager: "Quel est le frein technique que l'équipe n'arrive pas à débloquer ?",
    management_consultant: "Quel problème a déclenché ce recrutement ?",
    strategy_associate: "Quelle décision stratégique attend des données que personne ne produit ?",
    operations_manager: "Quelle friction inter-équipes consomme le plus de temps ?",
    fractional_coo: "Qu'est-ce que le CEO ne devrait plus faire lui-même dans 6 mois ?",
  };
  var closeQ = closeQuestions[targetRoleId] || "Qu'est-ce qui rend ce recrutement difficile aujourd'hui ?";
  var triggerQ = "Qu'est-ce qui a déclenché ce recrutement ?";
  var antiProfileQ = "Quel profil ne voulez-vous surtout pas reproduire ?";

  // HOOK DIFFÉRENCIÉ PAR CANAL :
  // - DM = douleur du recruteur (question directe)
  // - Email = coût financier chiffré (arithmétique visible)
  // - Bio = prise de position du candidat
  // Interdiction d'utiliser le même hook sur deux canaux.

  // A. EMAIL — coût financier chiffré, arithmétique visible. Pas de question directe (réservée au DM).
  var email = "Bonjour [Prénom],\n\n";
  if (costLow && costHigh) {
    email += (cauchText ? cauchText + " " : "") + "Ce type de situation coûte entre " + costLow + " et " + costHigh + " par trimestre.\n\n";
  } else {
    email += cauchText ? cauchText + "\n\n" : "Votre offre " + roleLabel + " m'a fait réagir sur un point précis.\n\n";
  }
  email += "J'ai vécu ce problème. " + brickText + "\n\n";
  email += "Je ne sais pas si c'est pertinent pour votre contexte. Mais si ce sujet résonne, j'ai une question :\n\n";
  email += closeQ + "\n\n";
  email += "Bonne journée,\n[Prénom Nom]\n\n";
  email += "PS : Deux questions que je pose systématiquement en début d'échange :\n";
  email += "1. " + triggerQ + "\n";
  email += "2. " + antiProfileQ;

  // B. DM LINKEDIN — douleur du recruteur, question directe. Pas de coût chiffré (réservé à l'email).
  var dmHook = closeQ;
  var dm = "[Prénom], " + dmHook + " ";
  dm += brickCv + " ";
  dm += triggerQ;

  // C. N+1 OPÉRATIONNEL — terrain, problème concret
  var n1 = "Bonjour [Prénom],\n\n";
  n1 += cauchText ? cauchText + " C'est un problème que j'ai résolu concrètement.\n\n" : "Votre équipe recrute sur un sujet que j'ai vécu de l'intérieur.\n\n";
  n1 += brickText + "\n\n";
  n1 += "La méthode est reproductible. " + triggerQ + " " + closeQ + "\n\n";
  n1 += "[Prénom Nom]";

  // D. RH — parcours, trajectoire, culture fit
  var rh = "Bonjour [Prénom],\n\n";
  rh += cauchText ? cauchText + " " : "";
  rh += brickCv + "\n\n";
  if (strongestBrick && strongestBrick.interviewVersions) {
    rh += strongestBrick.interviewVersions.rh.length > 200 ? strongestBrick.interviewVersions.rh.slice(0, 200) + "..." : strongestBrick.interviewVersions.rh;
    rh += "\n\n";
  }
  rh += antiProfileQ + " Je préfère calibrer mon discours sur ce que vous cherchez à éviter.\n\n";
  rh += "[Prénom Nom]";

  return { email: cleanRedac(email, "livrable"), dm: cleanRedac(dm, "livrable"), n1: cleanRedac(n1, "livrable"), rh: cleanRedac(rh, "livrable") };
}



export function scoreContactScript(text, bricks, cauchemars) {
  if (!text || text.length < 20) return { score: 0, tests: [] };
  var lower = text.toLowerCase();

  // 1. MIROIR — première phrase parle du destinataire
  var firstLine = text.split("\n").filter(function(l) { return l.trim().length > 5; })[0] || "";
  var firstLower = firstLine.toLowerCase();
  var miroir = firstLower.indexOf("vous") !== -1 || firstLower.indexOf("votre") !== -1 || firstLower.indexOf("[prénom]") !== -1 || firstLower.indexOf("[prenom]") !== -1;
  var miroirFail = firstLower.indexOf("je ") < 3 && firstLower.indexOf("je ") !== -1 && !miroir;

  // 2. CAUCHEMAR — nomme un cauchemar spécifique
  var activeCauch = cauchemars || getActiveCauchemars();
  var hasCauchemar = activeCauch.some(function(c) {
    return c.nightmareShort && lower.indexOf(c.nightmareShort.toLowerCase().slice(0, 20)) !== -1;
  });
  if (!hasCauchemar) {
    hasCauchemar = lower.indexOf("cauchemar") !== -1 || lower.indexOf("problème") !== -1 || lower.indexOf("coûte") !== -1 || lower.indexOf("coute") !== -1;
  }

  // 3. PREUVE ASYMÉTRIQUE — ouvre une question au lieu de fermer
  var hasQuestion = text.indexOf("?") !== -1;
  var hasProof = bricks.some(function(b) {
    return b.status === "validated" && b.text && lower.indexOf(b.text.toLowerCase().slice(0, 20)) !== -1;
  });
  var preuveAsym = hasQuestion && hasProof;

  // 4. COÛT DU NON — coût de ne pas répondre
  var coutDuNon = lower.indexOf("coûte") !== -1 || lower.indexOf("coute") !== -1 || lower.indexOf("perd") !== -1 || lower.indexOf("trimestre") !== -1 || lower.indexOf("par an") !== -1 || lower.indexOf("chaque mois") !== -1 || lower.indexOf("manque") !== -1;

  // 5. SORTIE FACILE — question de fin légère
  var lastLines = text.split("\n").filter(function(l) { return l.trim().length > 3; });
  var lastMeaningful = "";
  for (var i = lastLines.length - 1; i >= 0; i--) {
    if (lastLines[i].indexOf("?") !== -1) { lastMeaningful = lastLines[i]; break; }
  }
  var sortieFacile = lastMeaningful.length > 0 && lastMeaningful.length < 120;

  // 6. DILTS — monte d'au moins 1 niveau
  var diltsP = analyzeDiltsProgression(text);
  var diltsOk = diltsP.progression >= 1;

  var tests = [
    { id: "miroir", label: "Miroir", desc: "La première phrase parle du destinataire", passed: miroir && !miroirFail, fix: "Commence par 'vous' ou par le problème du destinataire, pas par 'je'." },
    { id: "cauchemar", label: "Cauchemar", desc: "Nomme un problème spécifique", passed: hasCauchemar, fix: "Ajoute le cauchemar du décideur issu de l'offre." },
    { id: "preuve", label: "Preuve asymétrique", desc: "Ouvre une question au lieu de la fermer", passed: preuveAsym, fix: "Inclus une preuve chiffrée ET termine par une question." },
    { id: "cout", label: "Coût du non", desc: "Le coût de ne pas répondre est visible", passed: coutDuNon, fix: "Ajoute le coût en euros ou en temps du problème non résolu." },
    { id: "sortie", label: "Sortie facile", desc: "La question de fin est légère", passed: sortieFacile, fix: "Termine par une question courte, facile à répondre." },
    { id: "dilts", label: "Registre", desc: "Monte d'au moins 1 niveau logique", passed: diltsOk, fix: "Ouvre sur du concret (fait, chiffre) et ferme sur de la vision (conviction, identité)." },
  ];

  var passed = tests.filter(function(t) { return t.passed; }).length;
  var score = Math.round(passed * 1.67);
  if (score > 10) score = 10;

  return { score: score, tests: tests, passedCount: passed };
}




export function generateTransitionScript(bricks, sourceRoleId, targetAlt) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0 || !targetAlt) return null;

  // Find strongest elastic brick that matches the alternative role
  var bestBrick = null;
  validated.forEach(function(b) {
    if (b.elasticity === "élastique" && !bestBrick) bestBrick = b;
  });
  if (!bestBrick) bestBrick = validated[0];

  var altRoleData = KPI_REFERENCE[targetAlt.roleId] ? KPI_REFERENCE[targetAlt.roleId] : null;
  var altRoleLabel = altRoleData ? altRoleData.role : "ce poste";
  var sourceRoleData = sourceRoleId && KPI_REFERENCE[sourceRoleId] ? KPI_REFERENCE[sourceRoleId] : null;
  var sourceRoleLabel = sourceRoleData ? sourceRoleData.role : "mon poste actuel";

  var script = "Bonjour [Prénom],\n\n";
  script += "Mon titre actuel ne matche pas votre offre " + altRoleLabel + ". Je viens de " + sourceRoleLabel + ".\n\n";
  script += "Mais votre besoin m'a interpellé. " + bestBrick.text + "\n\n";
  script += "Ce résultat s'est produit dans un autre contexte. Je suis convaincu qu'il se transpose chez vous.\n\n";
  script += "Je propose 30 minutes pour vous montrer comment. Si ça ne colle pas, vous n'avez rien perdu.\n\n";
  script += "[Prénom]";
  return script;
}


export function generateImpactReport(bricks, vault, targetRoleId, trajectoryToggle, density) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  var takes = bricks.filter(function(b) { return b.brickType === "take" && b.status === "validated"; });
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;

  var chiffreBricks = validated.filter(function(b) { return b.brickCategory === "chiffre"; });
  var decisionBricks = validated.filter(function(b) { return b.brickCategory === "decision"; });
  var influenceBricks = validated.filter(function(b) { return b.brickCategory === "influence"; });
  var cicatrices = validated.filter(function(b) { return b.brickType === "cicatrice"; });
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });

  var coverage = computeCauchemarCoverage(bricks);
  var coveredCount = coverage.filter(function(c) { return c.covered; }).length;

  var report = "RAPPORT D'IMPACT -- Forge #1\n\n";
  report += "Profil : " + (roleData ? roleData.role : "Non défini") + "\n";
  report += "Mode : " + (trajectoryToggle === "j_y_suis" ? "J'y suis" : trajectoryToggle === "j_y_vais" ? "J'y vais" : "Non défini") + "\n";
  report += "Densité atteinte : " + (density ? density.score : 0) + "%\n\n";

  report += "BRIQUES FORGÉES : " + validated.length + "\n";
  if (chiffreBricks.length > 0) report += "- " + chiffreBricks.length + " brique" + (chiffreBricks.length > 1 ? "s" : "") + " chiffre\n";
  if (decisionBricks.length > 0) report += "- " + decisionBricks.length + " brique" + (decisionBricks.length > 1 ? "s" : "") + " décision\n";
  if (influenceBricks.length > 0) report += "- " + influenceBricks.length + " brique" + (influenceBricks.length > 1 ? "s" : "") + " influence\n";
  if (cicatrices.length > 0) report += "- " + cicatrices.length + " cicatrice" + (cicatrices.length > 1 ? "s" : "") + "\n";

  report += "\nCAUCHEMARS COUVERTS : " + coveredCount + "/" + getActiveCauchemars().length + "\n";

  coverage.forEach(function(c) {
    var cauch = getActiveCauchemars().find(function(cc) { return cc.id === c.id; });
    report += "- " + c.label + " -- " + (c.covered ? "couvert" : "NON COUVERT") + "\n";
    if (c.covered && cauch) {
      report += "  Coût direct : " + formatCost(cauch.costRange[0]) + "-" + formatCost(cauch.costRange[1]) + "/an\n";
      if (cauch.costSymbolique) report += "  Coût symbolique : " + cauch.costSymbolique + "\n";
      if (cauch.costSystemique) report += "  Coût systémique : " + cauch.costSystemique + "\n";
    }
  });

  report += "\nKPIS ÉLASTIQUES DOCUMENTÉS : " + elasticBricks.length + "\n";
  elasticBricks.forEach(function(b) {
    report += "- " + (b.kpi || "Non classé") + " (élastique)\n";
  });

  var unfairBrick = bricks.find(function(b) { return b.type === "unfair_advantage" && b.status === "validated"; });
  if (unfairBrick) {
    report += "\nAVANTAGE INJUSTE IDENTIFIÉ\n";
    report += "- " + unfairBrick.text + "\n";
    var matchingElastic = elasticBricks.find(function(eb) {
      return eb.text && unfairBrick.text && eb.kpi === unfairBrick.kpi;
    });
    if (matchingElastic) {
      report += "  Confirmé par brique chiffre + signal collègues. Non-rattrapable par la formation.\n";
    }
  }

  var zones = computeZones(bricks, targetRoleId);
  if (zones) {
    if (zones.excellence.length > 0) {
      report += "\nZONE D'EXCELLENCE\n";
      zones.excellence.forEach(function(z) {
        report += "- " + z.kpi + " -- " + z.brickCount + " preuve" + (z.brickCount > 1 ? "s" : "") + " (" + z.types.join(", ") + ")\n";
      });
    }
    if (zones.rupture.length > 0) {
      report += "\nZONE DE RUPTURE\n";
      zones.rupture.forEach(function(z) {
        report += "- " + z.kpi + " -- " + z.reason + "\n";
      });
    }

    if (zones.profileGrid.length > 0) {
      report += "\nPROFIL DE VALEUR\n";
      zones.profileGrid.forEach(function(p) {
        report += (p.checked ? "[x] " : "[ ] ") + p.label + (p.checked ? " -- " + p.proof : "") + "\n";
      });
    }
  }

  report += "\nPRISES DE POSITION : " + takes.length + "\n";
  if (takes.length === 0) report += "- Aucune take formulée. Le prochain Rendez-vous reposera la question.\n";
  takes.forEach(function(t) { report += "- " + (t.text.length > 60 ? t.text.slice(0, 60) + "..." : t.text) + "\n"; });

  report += "\nPROCHAIN RENDEZ-VOUS : " + (roleData ? roleData.cadenceLabel : "dans 30 jours") + "\n";
  report += "Ce rapport s'épaissit à chaque Rendez-vous de Souveraineté. Les briques s'accumulent. Le levier grandit.";
  return cleanRedac(report);
}

/* ==============================
   ZONE D'EXCELLENCE / RUPTURE — Item 8
   ============================== */


export function computeZones(bricks, roleId) {
  var roleData = roleId && KPI_REFERENCE[roleId] ? KPI_REFERENCE[roleId] : null;
  if (!roleData) return null;
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take" && b.brickType !== "unfair_advantage"; });
  if (validated.length < 2) return null;

  var kpis = roleData.kpis;
  var excellence = [];
  var rupture = [];

  kpis.forEach(function(kpi) {
    var matchingBricks = validated.filter(function(b) {
      return b.kpi && b.kpi.toLowerCase().indexOf(kpi.name.toLowerCase().slice(0, 6)) !== -1;
    });
    if (matchingBricks.length >= 2) {
      var types = [];
      matchingBricks.forEach(function(b) {
        var t = b.brickCategory || b.brickType || "chiffre";
        if (types.indexOf(t) === -1) types.push(t);
      });
      var hasDepth = types.length >= 2 || matchingBricks.some(function(b) { return b.brickCategory === "decision" || b.brickType === "cicatrice"; });
      if (hasDepth) {
        excellence.push({ kpi: kpi.name, brickCount: matchingBricks.length, types: types, elasticity: kpi.elasticity });
      }
    } else if (matchingBricks.length === 0) {
      rupture.push({ kpi: kpi.name, reason: "Aucune preuve documentée", elasticity: kpi.elasticity });
    } else if (matchingBricks.length === 1 && !matchingBricks[0].brickCategory !== "decision") {
      rupture.push({ kpi: kpi.name, reason: "1 preuve fragile (sans arbitrage ni cicatrice)", elasticity: kpi.elasticity });
    }
  });

  // 9-PROFILE GRID
  var profileGrid = [
    { id: "hunter", label: "Chasseur", check: function() { return bricks.some(function(b) { return b.status === "validated" && b.kpi && (b.kpi.toLowerCase().indexOf("pipeline") !== -1 || b.kpi.toLowerCase().indexOf("prospection") !== -1); }); }, proofFn: function() { return "Brique pipeline/prospection validée"; } },
    { id: "zero_to_one", label: "Créateur 0-to-1", check: function() { return validated.some(function(b) { return b.text && (b.text.toLowerCase().indexOf("from scratch") !== -1 || b.text.toLowerCase().indexOf("de zero") !== -1 || b.text.toLowerCase().indexOf("cree") !== -1 || b.text.toLowerCase().indexOf("lance") !== -1 || b.text.toLowerCase().indexOf("construit") !== -1); }); }, proofFn: function() { return "Contexte de création identifié dans une brique"; } },
    { id: "regular", label: "Régulier", check: function() { return validated.filter(function(b) { return b.brickCategory === "chiffre"; }).length >= 3; }, proofFn: function() { return validated.filter(function(b) { return b.brickCategory === "chiffre"; }).length + " briques chiffre (indice de régularité)"; } },
    { id: "track_record", label: "Track record blindé", check: function() { return validated.filter(function(b) { return b.brickCategory === "chiffre" && hasNumbers(b.text); }).length >= 2; }, proofFn: function() { return "2+ briques chiffrées avec données quantifiées"; } },
    { id: "builder", label: "Constructeur", check: function() { return validated.some(function(b) { return b.brickCategory === "influence"; }) && validated.some(function(b) { return b.brickCategory === "decision"; }); }, proofFn: function() { return "Briques influence + décision (structure, pas juste exécute)"; } },
    { id: "specialist", label: "Spécialiste vertical", check: function() {
      var kpiNames = validated.map(function(b) { return b.kpi; }).filter(function(k) { return k; });
      var unique = []; kpiNames.forEach(function(k) { if (unique.indexOf(k) === -1) unique.push(k); });
      return unique.length <= 3 && validated.length >= 3;
    }, proofFn: function() { return "Toutes les preuves concentrées sur le même segment"; } },
    { id: "cicatrice", label: "Maturité (cicatrices)", check: function() { return bricks.filter(function(b) { return b.brickType === "cicatrice" && b.status === "validated"; }).length >= 1; }, proofFn: function() { return bricks.filter(function(b) { return b.brickType === "cicatrice" && b.status === "validated"; }).length + " échec(s) assumé(s)"; } },
    { id: "terrain", label: "Terrain (non-remote)", check: function() { return validated.some(function(b) { return b.text && (b.text.toLowerCase().indexOf("terrain") !== -1 || b.text.toLowerCase().indexOf("salon") !== -1 || b.text.toLowerCase().indexOf("face") !== -1 || b.text.toLowerCase().indexOf("deplacement") !== -1); }); }, proofFn: function() { return "Mentions de terrain dans les briques"; } },
    { id: "takes", label: "Voix (prises de position)", check: function() { return bricks.filter(function(b) { return b.brickType === "take" && b.status === "validated"; }).length >= 1; }, proofFn: function() { return bricks.filter(function(b) { return b.brickType === "take" && b.status === "validated"; }).length + " take(s) formulée(s)"; } },
  ];

  var grid = profileGrid.map(function(p) {
    var checked = p.check();
    return { label: p.label, checked: checked, proof: checked ? p.proofFn() : "" };
  });

  return { excellence: excellence, rupture: rupture, profileGrid: grid };
}

/* ==============================
   POST LINKEDIN GENERATOR — cauchemar + these + situation + question
   ============================== */


export function generateDiagnosticQuestions(bricks, targetRoleId) {
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  if (validated.length < 2) return [];

  var questions = [];

  // Find strongest decision brick
  var decisionBricks = validated.filter(function(b) { return b.brickCategory === "decision"; });
  if (decisionBricks.length > 0) {
    var db = decisionBricks[0];
    questions.push({
      type: "arbitrage",
      color: "#9b59b6",
      level1: "Comment les arbitrages stratégiques sont-ils pris ici ? Qui tranche quand les équipes ne s'alignent pas ?",
      level2: "J'ai dû arbitrer entre " + (db.text.length > 50 ? db.text.slice(0, 50) + "..." : db.text) + ". Ici, quelle est la décision difficile que personne ne veut prendre pour atteindre les objectifs du prochain trimestre ?",
      logic: "Basée sur ta brique décision la plus forte. Tu as la crédibilité de poser cette question parce que tu as déjà traversé un arbitrage similaire.",
      brickRef: db.text.length > 60 ? db.text.slice(0, 60) + "..." : db.text,
    });
  }

  // Find strongest influence brick
  var influenceBricks = validated.filter(function(b) { return b.brickCategory === "influence"; });
  if (influenceBricks.length > 0) {
    var ib = influenceBricks[0];
    questions.push({
      type: "friction",
      color: "#3498db",
      level1: "Comment l'alignement entre les équipes fonctionne-t-il au quotidien ? Quels sont les points de friction les plus fréquents ?",
      level2: "J'ai aligné des équipes qui ne reportaient pas à moi sur des sujets similaires. Ici, comment gérez-vous le conflit d'intérêt entre la vision produit et la réalité commerciale ?",
      logic: "Basée sur ta brique influence. Tu montres que tu penses en dynamique politique, pas en organigramme.",
      brickRef: ib.text.length > 60 ? ib.text.slice(0, 60) + "..." : ib.text,
    });
  }

  // Cauchemar-based question (always)
  if (getActiveCauchemars().length > 0) {
    var cauchemar = getActiveCauchemars()[0];
    var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });
    questions.push({
      type: "efficience",
      color: "#e94560",
      level1: "L'offre mentionne " + cauchemar.label.toLowerCase() + ". Qu'est-ce qui a été tenté avant pour résoudre ce problème ?",
      level2: "Ce type de problème coûte entre " + formatCost(cauchemar.costRange[0]) + " et " + formatCost(cauchemar.costRange[1]) + " par an dans la plupart des structures que je connais. Si rien ne change dans les 6 prochains mois, quel est l'impact sur vos objectifs ?",
      logic: "Basée sur le cauchemar principal de l'offre. Tu montres que tu penses en coût du problème, pas en coût salarial.",
      brickRef: cauchemar.label,
    });
  }

  // Cicatrice-based question (if exists)
  var cicatrices = validated.filter(function(b) { return b.brickType === "cicatrice"; });
  if (cicatrices.length > 0) {
    questions.push({
      type: "saillance",
      color: "#ff9800",
      level1: "Quel a été le dernier échec marquant de l'équipe et qu'est-ce qui a changé après ?",
      level2: "J'ai moi-même perdu un deal majeur en sous-estimant la politique interne. Ça m'a forcé à changer de méthode. Ici, comment la culture de l'équipe traite-t-elle les échecs ? Est-ce qu'on en parle ou est-ce qu'on les enterre ?",
      logic: "Basée sur ta cicatrice. Tu as la crédibilité de parler d'échec parce que tu as assumé le tien. Le recruteur mesure ta maturité et la culture de l'entreprise en même temps.",
      brickRef: cicatrices[0].text.length > 60 ? cicatrices[0].text.slice(0, 60) + "..." : cicatrices[0].text,
    });
  }

  return questions.slice(0, 4);
}



export function translateCVPerception(cvText, cauchemars) {
  var cvLower = (cvText || "").toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
  var perceptions = [];
  cauchemars.forEach(function(c) {
    var kwFound = [];
    var kwMissing = [];
    (c.kpis || []).forEach(function(kpi) {
      var words = kpi.toLowerCase().split(/[\s\/\(\)]+/).filter(function(w) { return w.length > 3; });
      words.forEach(function(w) {
        var wNorm = w.replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
        if (cvLower.indexOf(wNorm) !== -1) { if (kwFound.indexOf(w) === -1) kwFound.push(w); }
        else { if (kwMissing.indexOf(w) === -1) kwMissing.push(w); }
      });
    });
    (c.matchedKw || c.kw || []).forEach(function(kw) {
      var kwNorm = kw.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
      if (cvLower.indexOf(kwNorm) !== -1 && kwFound.indexOf(kw) === -1) kwFound.push(kw);
    });
    var hasActivity = kwFound.length > 0;
    var hasProof = /\d+\s*[%kKmM€]/.test(cvText);
    var status = "silence";
    var perception = "";
    if (hasActivity && hasProof) {
      status = "activite_chiffree";
      perception = "Tu mentionnes " + kwFound.slice(0, 2).join(", ") + " avec un chiffre. Le recruteur lit : piste. Pas encore preuve blindée.";
    } else if (hasActivity && !hasProof) {
      status = "activite_sans_preuve";
      perception = "Tu mentionnes " + kwFound.slice(0, 2).join(", ") + ". Le recruteur lit : activité. Pas résultat. Il passe.";
    } else {
      status = "silence";
      perception = "Le recruteur cherche un remède à \"" + c.label + ".\" Ton CV : silence.";
    }
    perceptions.push({
      cauchemar: c.label,
      cauchemarId: c.id,
      status: status,
      perception: perception,
      kwFound: kwFound,
      kwMissing: kwMissing,
      costRange: c.costRange,
    });
  });
  return perceptions;
}


export function generateSampleTransformation(cvText, cauchemars, roleId) {
  if (!cvText || cvText.trim().length < 20) return null;
  var lines = cvText.split(/[\n\r]+/).filter(function(l) { return l.trim().length > 15; });
  if (lines.length === 0) return null;
  var roleData = roleId && KPI_REFERENCE[roleId] ? KPI_REFERENCE[roleId] : null;
  var bestLine = null;
  var bestScore = 0;
  var bestCauch = null;
  lines.forEach(function(line) {
    var lineLow = line.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
    cauchemars.forEach(function(c) {
      var score = 0;
      (c.matchedKw || []).forEach(function(kw) {
        if (lineLow.indexOf(kw.toLowerCase().replace(/[éèê]/g, "e")) !== -1) score += 2;
      });
      (c.kpis || []).forEach(function(kpi) {
        kpi.toLowerCase().split(/[\s\/]+/).filter(function(w) { return w.length > 3; }).forEach(function(w) {
          if (lineLow.indexOf(w.replace(/[éèê]/g, "e")) !== -1) score++;
        });
      });
      var hasNumber = /\d/.test(line);
      if (!hasNumber) score += 1;
      if (score > bestScore) { bestScore = score; bestLine = line.trim(); bestCauch = c; }
    });
  });
  if (!bestLine || bestScore < 1) {
    bestLine = lines.reduce(function(a, b) { return a.length > b.length ? a : b; }).trim();
    bestCauch = cauchemars[0];
  }
  var cleanLine = bestLine.replace(/^[\-\•\*\u2022\u2013\u2014]\s*/, "").trim();
  var kpiLabel = bestCauch && bestCauch.kpis ? bestCauch.kpis[0] : "";
  var elasticTag = roleData ? roleData.kpis.find(function(k) { return k.name === kpiLabel && k.elasticity === "élastique"; }) : null;
  var afterLine = cleanLine;
  if (!/\d+\s*%/.test(cleanLine)) {
    afterLine = cleanLine.replace(/gestion d[eu']/gi, "Réduction de 22% à 4% du churn sur").replace(/pilotage d[eu']/gi, "Accélération de +35% du").replace(/mise en place/gi, "Déploiement en 3 mois de").replace(/responsable d[eu']/gi, "Restructuration complète de").replace(/suivi d[eu']/gi, "Amélioration de +28% de");
    if (afterLine === cleanLine) {
      afterLine = cleanLine + " — résultat : [chiffre à extraire pendant la Forge]";
    }
  } else {
    afterLine = cleanLine;
  }
  return {
    before: cleanLine,
    after: afterLine,
    cauchemar: bestCauch ? bestCauch.label : "",
    kpi: kpiLabel,
    isElastic: !!elasticTag,
    isSimulated: afterLine.indexOf("[chiffre a extraire") !== -1 || afterLine !== cleanLine,
  };
}


export function generateDiagnostic(cvText, offerText, roleId) {
  var signals = parseOfferSignals(offerText, roleId);
  if (!signals) return null;
  var cauchemars = signals.cauchemars;
  var perceptions = translateCVPerception(cvText, cauchemars);
  var transformation = generateSampleTransformation(cvText, cauchemars, roleId);
  var coveredCount = perceptions.filter(function(p) { return p.status !== "silence"; }).length;
  var proofCount = perceptions.filter(function(p) { return p.status === "activite_chiffree"; }).length;
  var totalCauchemars = cauchemars.length;
  var fossePct = totalCauchemars > 0 ? Math.round(((totalCauchemars - proofCount) / totalCauchemars) * 100) : 100;
  return {
    bloc1: { cauchemars: cauchemars, urgency: signals.urgencyScore, urgencyHits: signals.urgencyHits },
    bloc2: { perceptions: perceptions },
    bloc3: { coveredCount: coveredCount, proofCount: proofCount, totalCauchemars: totalCauchemars, fossePct: fossePct },
    bloc4: { transformation: transformation },
    signals: signals,
  };
}


export function generateAdvocacyText(text, category, type, nightmareText) {
  if (!text || text.length < 20) return null;
  var num = extractBestNum(text);

  if (type === "cicatrice") {
    if (nightmareText && num) return "Il a déjà vécu exactement le scénario qu'on redoute. Son échec lui a coûté " + num + ". Il sait ce qui casse et comment corriger. On ne trouvera pas quelqu'un qui connaît mieux ce piège.";
    if (nightmareText) return "Il a traversé le même type de crise que celle qu'on essaie d'éviter. Il l'assume et il sait ce qu'il ne refera pas. C'est une assurance qu'aucun autre candidat ne peut offrir.";
    return num
      ? "Il a assumé un échec qui a coûté " + num + ". Il a corrigé le tir. C'est rare à ce niveau. La plupart des candidats mentent ou esquivent."
      : "Il a traversé une situation difficile et il l'assume sans détour. Il sait ce qu'il ne refera pas. C'est un profil qui apprend de ses erreurs, pas quelqu'un qui les cache.";
  }
  if (category === "decision") {
    if (nightmareText && num) return "Il a tranché un arbitrage à " + num + " sur un sujet qui ressemble au nôtre. Il sait ce qu'on sacrifie et ce qu'on gagne. Il ne découvrira pas le problème — il l'a déjà résolu.";
    if (nightmareText) return "Il a pris une décision difficile sur un problème similaire au nôtre. Il connaît les pièges. Il ne va pas tâtonner pendant 6 mois — il sait déjà où aller.";
    return num
      ? "Il a tranché un arbitrage à " + num + ". Il explique pourquoi il a choisi cette option et ce qu'il a sacrifié. Ce n'est pas un exécutant. Il décide sous pression."
      : "Il a pris une décision difficile et il assume les conséquences. Il ne cherche pas le consensus. Il tranche et il avance.";
  }
  if (category === "influence") {
    if (nightmareText && num) return "Il a débloqué des résistances sur un sujet comparable au nôtre. Résultat : " + num + ". Il sait naviguer la politique sur ce type de problème. C'est exactement ce qu'on cherche.";
    if (nightmareText) return "Il a aligné des gens sur un sujet similaire au nôtre. Il connaît les résistances qu'on va rencontrer parce qu'il les a déjà retournées.";
    return num
      ? "Il a aligné des gens qui ne voulaient pas s'aligner. Le résultat : " + num + ". Ce n'est pas un manager de process. Il sait naviguer la politique."
      : "Il a débloqué une situation humaine. Il sait lire les résistances et les retourner. C'est le genre de personne qu'on met sur les sujets bloqués.";
  }
  // Default: chiffre brick
  if (nightmareText && num) {
    return "Il a résolu exactement le problème qu'on a en ce moment. Son chiffre : " + num + ". Il sait de quoi il parle parce qu'il l'a déjà fait.";
  }
  if (nightmareText) {
    return "Il a déjà travaillé sur le même type de problème que le nôtre. Il ne part pas de zéro. C'est un avantage qu'on ne retrouvera pas chez les autres candidats.";
  }
  if (num) {
    return "Son résultat clé : " + num + ". Il mesure ce qu'il fait. Il ne parle pas en impressions. Il y a un avant et un après son passage.";
  }
  return "Il a un parcours concret. Il parle de ce qu'il a fait, pas de ce qu'il ferait. C'est un profil opérationnel qui produit des résultats mesurables.";
}



export function generateInternalAdvocacy(text, category, type, elasticity) {
  if (!text || text.length < 20) return null;
  var num = extractBestNum(text);
  var isElastic = elasticity === "élastique";

  if (type === "cicatrice") {
    return "Tu es la mémoire de ce qui a échoué et pourquoi. Si tu pars, l'équipe refait les mêmes erreurs. Personne d'autre n'a vécu cette correction.";
  }
  if (category === "decision") {
    var base = "Tu es celui qui tranche quand tout le monde hésite.";
    if (num) base += " Ton dernier arbitrage a pesé " + num + ".";
    base += isElastic
      ? " Cette capacité n'est pas remplaçable par un outil ou un process. Elle part avec toi."
      : " Le remplacement prendra 6 mois minimum. Le coût de l'indécision en attendant est invisible mais réel.";
    return base;
  }
  if (category === "influence") {
    return "Tu es la personne qui débloque les situations humaines. Les alignements que tu as construits tiennent parce que tu les maintiens. Si tu pars, les frictions reviennent en 3 mois."
      + (num ? " Impact documenté : " + num + "." : "");
  }
  // Default: chiffre
  if (num && isElastic) {
    return "Ton résultat de " + num + " repose sur ta méthode. Pas sur un outil qu'on peut transférer. Si tu pars, le résultat part avec toi. Le recrutement de ton remplacement coûtera 6-9 mois de salaire. Le trou de production entre les deux n'a pas de prix.";
  }
  if (num) {
    return "Tu produis " + num + ". Ton remplacement coûtera du temps (6-9 mois de recrutement + intégration) et de l'argent (cabinet + formation). Pendant ce temps, ce résultat disparaît.";
  }
  return "Tu portes un savoir opérationnel que l'entreprise n'a pas documenté. Si tu pars, il faut 6 mois pour que ton remplacement atteigne ta vitesse actuelle. C'est un coût que ton N+1 ne voit pas aujourd'hui.";
}


export function generateStressTest(brick, targetRoleId, offersArray) {
  if (!brick || !brick.text) return null;
  var text = brick.text.toLowerCase();
  var angles = [];

  // ===== SOURCE 1: ANGLES GÉNÉRIQUES (toujours présents) =====

  // Angle 1 : Contexte vs mérite (toujours pertinent)
  var ctxPool = STRESS_ANGLES.contexte;
  angles.push({
    type: "contexte",
    label: "Contexte favorable ?",
    attack: ctxPool[Math.abs(hashCode(brick.id + "ctx")) % ctxPool.length],
    defense: "Isole ton action du contexte. Cite la mesure avant/après TON intervention. Si le marché aidait tout le monde, pourquoi tes collègues n'ont pas le même résultat ?",
    source: "generique",
  });

  // Angle 2 : Selon le type de brique
  if (brick.brickType === "cicatrice") {
    var echPool = STRESS_ANGLES.echec;
    angles.push({
      type: "echec",
      label: "Échec assumé ou subi ?",
      attack: echPool[Math.abs(hashCode(brick.id + "ech")) % echPool.length],
      defense: "Montre ce que l'échec t'a appris. La cicatrice vaut par la décision que tu prends APRÈS. Pas par la douleur.",
      source: "generique",
    });
  } else if (brick.brickCategory === "decision" || brick.brickCategory === "influence") {
    var colPool = STRESS_ANGLES.collectif;
    angles.push({
      type: "collectif",
      label: "Contribution individuelle ?",
      attack: colPool[Math.abs(hashCode(brick.id + "col")) % colPool.length],
      defense: "Identifie TA décision. Pas le résultat collectif. La décision que TU as prise et que personne d'autre n'aurait prise de la même façon.",

      source: "generique",
    });
  } else {
    var cauPool = STRESS_ANGLES.causalite;
    angles.push({
      type: "causalite",
      label: "Causalité prouvée ?",
      attack: cauPool[Math.abs(hashCode(brick.id + "cau")) % cauPool.length],
      defense: "Montre la méthode. Avant X, après Y. Ce qui a changé entre les deux, c'est ton action. Chiffre + périmètre + timeline.",
      source: "generique",
    });
  }

  // Angle 3 : Reproductibilité (toujours pertinent)
  var repPool = STRESS_ANGLES.reproductibilite;
  angles.push({
    type: "reproductibilite",
    label: "Reproductible ici ?",
    attack: repPool[Math.abs(hashCode(brick.id + "rep")) % repPool.length],
    defense: "Identifie le principe transférable. Pas le contexte spécifique. Ce que tu feras chez eux, c'est appliquer la même logique à LEUR problème.",

    source: "generique",
  });

  // ===== SOURCE 2: ATTAQUES TIRÉES DE L'OFFRE =====
  if (offersArray && offersArray.length > 0) {
    var offerText = offersArray[0].text || "";
    var offerLower = offerText.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a").replace(/[ùû]/g, "u");
    var offerAttack = null;

    // Detect signals in offer and build specific attacks
    var hasAutonomie = offerLower.indexOf("autonomi") !== -1 || offerLower.indexOf("seul") !== -1 || offerLower.indexOf("independan") !== -1;
    var hasHyperCroissance = offerLower.indexOf("forte croissance") !== -1 || offerLower.indexOf("hyper") !== -1 || offerLower.indexOf("scale") !== -1;
    var hasRestructuration = offerLower.indexOf("restructur") !== -1 || offerLower.indexOf("transformation") !== -1 || offerLower.indexOf("reorganis") !== -1;
    var hasExigeant = offerLower.indexOf("exigean") !== -1 || offerLower.indexOf("pression") !== -1 || offerLower.indexOf("rythme soutenu") !== -1 || offerLower.indexOf("fast-paced") !== -1;
    var hasCreationPoste = offerLower.indexOf("creation de poste") !== -1 || offerLower.indexOf("nouveau poste") !== -1 || offerLower.indexOf("premiere recrue") !== -1;
    var hasInternational = offerLower.indexOf("international") !== -1 || offerLower.indexOf("multi-pays") !== -1 || offerLower.indexOf("emea") !== -1 || offerLower.indexOf("global") !== -1;
    var hasRemplacement = offerLower.indexOf("remplace") !== -1 || offerLower.indexOf("succession") !== -1 || offerLower.indexOf("depart") !== -1;

    if (hasAutonomie) {
      offerAttack = {
        type: "offre_autonomie",
        label: "Autonomie ou isolement ?",
        attack: "Le recruteur dira : 'L'offre mentionne une forte autonomie. Votre dernier poste incluait une équipe structurée. Donnez-moi un exemple où vous avez délivré un résultat seul, sans support.'",
        defense: "Cite un projet où tu as porté le résultat de A à Z sans équipe. Si tu n'en as pas, sois honnête : ton atout est de structurer là où rien n'existe. C'est un atout d'autonomie.",
        source: "offre",
      };
    } else if (hasHyperCroissance) {
      offerAttack = {
        type: "offre_croissance",
        label: "Rythme de croissance ?",
        attack: "Le recruteur dira : 'On double chaque année. Votre expérience est dans une structure stable. Qu'est-ce qui prouve que vous tiendrez le rythme quand les process changent tous les 3 mois ?'",
        defense: "Montre un moment où tout a changé autour de toi et où tu as produit un résultat malgré le chaos. La croissance casse les process. Ton atout c'est de livrer sans process.",
        source: "offre",
      };
    } else if (hasRestructuration) {
      offerAttack = {
        type: "offre_restructuration",
        label: "Gestion de crise ?",
        attack: "Le recruteur dira : 'Le contexte ici est une restructuration. Les gens partent. Le moral est bas. Qu'est-ce que vous faites les 90 premiers jours quand personne ne veut coopérer ?'",
        defense: "Cite une situation de tension où tu as obtenu un résultat malgré la résistance. Le recruteur cherche quelqu'un qui avance quand les autres freinent.",
        source: "offre",
      };
    } else if (hasExigeant) {
      offerAttack = {
        type: "offre_pression",
        label: "Résistance à la pression ?",
        attack: "Le recruteur dira : 'L'environnement ici est exigeant. Le dernier sur ce poste n'a pas tenu 8 mois. Qu'est-ce qui vous rend différent ?'",
        defense: "Ne dis pas 'je gère le stress.' Cite un trimestre où tout a déraillé et montre le résultat que tu as quand même sorti. Le chiffre parle. Pas l'adjectif.",
        source: "offre",
      };
    } else if (hasCreationPoste) {
      offerAttack = {
        type: "offre_creation",
        label: "Poste sans précédent ?",
        attack: "Le recruteur dira : 'C'est une création de poste. Il n'y a pas de fiche de poste claire. Pas de prédécesseur. Comment vous définissez vos priorités quand personne ne sait ce qu'on attend de vous ?'",
        defense: "Montre un moment où tu as défini le périmètre toi-même. Le recruteur cherche quelqu'un qui structure le flou. Cite ta méthode pour identifier les 3 premiers quick wins.",
        source: "offre",
      };
    } else if (hasInternational) {
      offerAttack = {
        type: "offre_international",
        label: "Contexte international ?",
        attack: "Le recruteur dira : 'Le poste couvre plusieurs pays. Les fuseaux horaires, les cultures, les réglementations diffèrent. Votre expérience est franco-française. Comment vous gérez ?'",
        defense: "Cite une collaboration cross-country, un projet multi-fuseaux ou une négociation interculturelle. Si tu n'en as pas, montre ta capacité d'adaptation sur un changement de contexte radical.",
        source: "offre",
      };
    } else if (hasRemplacement) {
      offerAttack = {
        type: "offre_remplacement",
        label: "Comparaison au prédécesseur ?",
        attack: "Le recruteur dira : 'Vous remplacez quelqu'un qui avait 8 ans d'ancienneté. L'équipe lui était loyale. Comment vous gagnez la confiance d'une équipe qui ne vous a pas choisi ?'",
        defense: "Ne critique jamais le prédécesseur. Cite un moment où tu as pris un poste après quelqu'un et où tu as gagné la confiance par un résultat rapide. Le premier quick win efface la comparaison.",
        source: "offre",
      };
    }

    if (offerAttack) angles.push(offerAttack);
  }

  // ===== SOURCE 3: ATTAQUES TIRÉES DU MARCHÉ / RÔLE =====
  if (targetRoleId) {
    var roleData = KPI_REFERENCE[targetRoleId];
    var marketAttack = null;

    // Extract numbers from brick text to compare with market benchmarks
    var numbers = text.match(/\d+/g);
    var hasSmallNumbers = numbers && numbers.some(function(n) { return parseInt(n) < 20; });
    var hasPercentage = text.indexOf("%") !== -1;

    if (targetRoleId === "enterprise_ae" && (text.indexOf("cycle") !== -1 || text.indexOf("deal") !== -1 || text.indexOf("vente") !== -1)) {
      marketAttack = {
        type: "marche_cycle",
        label: "Benchmark marché ?",
        attack: "Le recruteur dira : 'Le cycle de vente moyen dans notre secteur est de 6 à 9 mois. Vos chiffres viennent d'un cycle transactionnel beaucoup plus court. Comment vous transférez cette compétence sur du enterprise long ?'",
        defense: "Sépare la méthode du cycle. Ta méthode de qualification, de multi-threading, de gestion du champion fonctionne quel que soit le cycle. Cite l'étape du process que tu as améliorée, pas le résultat final.",
        source: "marche",
      };
    } else if (targetRoleId === "head_of_growth" && (text.indexOf("acquisition") !== -1 || text.indexOf("lead") !== -1 || text.indexOf("canal") !== -1 || text.indexOf("cac") !== -1)) {
      marketAttack = {
        type: "marche_cac",
        label: "CAC et scalabilité ?",
        attack: "Le recruteur dira : 'Votre CAC était bas parce que votre marché n'était pas saturé. Ici la concurrence a fait exploser les coûts d'acquisition. Votre méthode tient encore quand le CPM triple ?'",
        defense: "Montre que ta méthode a fonctionné PENDANT une hausse des coûts, pas juste dans un marché vierge. Si tu as diversifié les canaux quand un s'est fermé, c'est la preuve.",
        source: "marche",
      };
    } else if (targetRoleId === "strategic_csm" && (text.indexOf("churn") !== -1 || text.indexOf("retention") !== -1 || text.indexOf("nrr") !== -1 || text.indexOf("upsell") !== -1)) {
      marketAttack = {
        type: "marche_churn",
        label: "Churn structurel ?",
        attack: "Le recruteur dira : 'Le churn moyen SaaS est de 5-7% annuel. Votre taux était déjà en dessous avant votre arrivée. Qu'avez-vous réellement changé ?'",
        defense: "Isole le segment que tu as traité. Le churn global masque les segments. Montre le segment le plus risqué et ce que tu as fait dessus. Le delta est ta preuve.",
        source: "marche",
      };
    } else if (targetRoleId === "senior_pm" && (text.indexOf("feature") !== -1 || text.indexOf("roadmap") !== -1 || text.indexOf("produit") !== -1 || text.indexOf("discovery") !== -1)) {
      marketAttack = {
        type: "marche_feature",
        label: "Impact produit réel ?",
        attack: "Le recruteur dira : 'En moyenne, 80% des features lancées n'ont pas d'impact mesurable. Comment vous mesurez que votre feature a réellement bougé une métrique, et pas juste fait plaisir à un stakeholder ?'",
        defense: "Cite la métrique AVANT et APRÈS le lancement. Si tu n'as pas mesuré l'impact post-lancement, sois honnête et montre comment tu structurerais la mesure ici.",
        source: "marche",
      };
    } else if (targetRoleId === "engineering_manager" && (text.indexOf("equipe") !== -1 || text.indexOf("recrutement") !== -1 || text.indexOf("turnover") !== -1 || text.indexOf("delivery") !== -1)) {
      marketAttack = {
        type: "marche_retention",
        label: "Rétention tech ?",
        attack: "Le recruteur dira : 'Le turnover moyen en engineering est de 15-20%. Le marché est tendu. Votre équipe restait peut-être parce que le marché était fermé, pas parce que votre management était bon. Comment vous prouvez le contraire ?'",
        defense: "Cite les départs évités. Un membre qui a reçu une offre et est resté, c'est ta preuve. Le taux de rétention seul ne suffit pas. La raison de la rétention si.",
        source: "marche",
      };
    } else if (targetRoleId === "ai_architect") {
      marketAttack = {
        type: "marche_ia",
        label: "Production vs POC ?",
        attack: "Le recruteur dira : '85% des projets IA ne passent jamais en production. Votre projet était-il un POC qui a impressionné un COMEX ou un système qui tourne encore aujourd'hui ?'",
        defense: "Cite le nombre d'utilisateurs actifs, le volume de requêtes, ou la durée en production. Un POC en production depuis 18 mois vaut plus qu'un projet flagship arrêté après 3 mois.",
        source: "marche",
      };
    } else if (targetRoleId === "management_consultant") {
      marketAttack = {
        type: "marche_conseil",
        label: "Impact post-mission ?",
        attack: "Le recruteur dira : 'Les consultants partent, les recommandations restent dans un tiroir. Votre livrable a-t-il été implémenté ? Quel résultat 6 mois après votre départ ?'",
        defense: "Cite le résultat post-mission. Si tu as un chiffre du client 6 mois après, c'est ta meilleure preuve. Si tu n'en as pas, cite la décision concrète que le client a prise grâce à toi.",
        source: "marche",
      };
    } else if (hasPercentage || hasSmallNumbers) {
      marketAttack = {
        type: "marche_benchmark",
        label: "Chiffre vs benchmark ?",
        attack: "Le recruteur dira : 'Ce chiffre est correct, mais c'est la moyenne du secteur. Qu'est-ce qui prouve que c'est exceptionnel et pas juste normal ?'",
        defense: "Situe ton chiffre. Compare-le au benchmark de ton secteur, de ton équipe précédente, ou de ton prédécesseur. Un chiffre sans référence est un chiffre sans poids.",
        source: "marche",
      };
    }

    if (marketAttack) angles.push(marketAttack);
  }

  return angles;
}


export function auditDeliverable(type, content, bricks, cauchemars) {
  if (!content || content.length < 30) return { score: 0, passed: [], failed: [] };
  var lower = content.toLowerCase();
  var validated = bricks ? bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; }) : [];
  var activeCauch = cauchemars || getActiveCauchemars();

  // A. NON-GÉNÉRIQUE — contient des éléments du Coffre-Fort
  var hasSpecific = validated.some(function(b) {
    if (!b.text || b.text.length < 15) return false;
    var fragment = b.text.toLowerCase().slice(0, 30);
    return lower.indexOf(fragment) !== -1;
  });
  var hasCvVersion = validated.some(function(b) {
    if (!b.cvVersion || b.cvVersion.length < 10) return false;
    return lower.indexOf(b.cvVersion.toLowerCase().slice(0, 25)) !== -1;
  });
  var nonGenerique = hasSpecific || hasCvVersion;

  // B. PREUVE — au moins 1 brique référencée avec données
  var hasProof = validated.some(function(b) {
    if (!b.text) return false;
    var brickLow = b.text.toLowerCase();
    return lower.indexOf(brickLow.slice(0, 20)) !== -1 && /\d/.test(b.text);
  });
  if (!hasProof) hasProof = hasCvVersion && validated.some(function(b) { return b.cvVersion && /\d/.test(b.cvVersion); });

  // C. DESTINATAIRE D'ABORD — première phrase orientée recruteur/cauchemar
  var firstLines = content.split("\n").filter(function(l) { return l.trim().length > 5; });
  var firstLine = (firstLines[0] || "").toLowerCase();
  var destFirst = firstLine.indexOf("vous") !== -1 || firstLine.indexOf("votre") !== -1 || firstLine.indexOf("[prénom]") !== -1 || firstLine.indexOf("[prenom]") !== -1;
  if (!destFirst) {
    destFirst = activeCauch.some(function(c) {
      return c.nightmareShort && firstLine.indexOf(c.nightmareShort.toLowerCase().slice(0, 15)) !== -1;
    });
  }
  // CV exception: header with role title counts as reader-oriented
  if (type === "cv") {
    var roleInFirst = firstLine.indexOf("enterprise") !== -1 || firstLine.indexOf("head") !== -1 || firstLine.indexOf("senior") !== -1 || firstLine.indexOf("manager") !== -1 || firstLine.indexOf("csm") !== -1 || firstLine.indexOf("consultant") !== -1;
    if (roleInFirst) destFirst = true;
  }

  // D. CALIBRAGE CANAL
  var calibreOk = false;
  if (type === "cv") {
    // 6 secondes scannable — lignes courtes, pas de pavés
    var lines = content.split("\n").filter(function(l) { return l.trim().length > 0; });
    var longLines = lines.filter(function(l) { return l.length > 150; });
    calibreOk = longLines.length <= 1 && content.length < 2000;
  } else if (type === "dm") {
    var lineCount = content.split("\n").filter(function(l) { return l.trim().length > 3; }).length;
    calibreOk = lineCount <= 5 && content.length < 400;
  } else if (type === "email") {
    var emailLines = content.split("\n").filter(function(l) { return l.trim().length > 3; }).length;
    calibreOk = emailLines <= 12 && content.length < 1200;
  } else if (type === "post") {
    calibreOk = content.length <= 1500 && !/^[\-\*•]\s/m.test(content);
  } else if (type === "bio") {
    calibreOk = content.length <= 500;
  } else {
    calibreOk = true;
  }

  var tests = [
    { id: "generique", label: "Non-générique", desc: "Contient des éléments du Score", passed: nonGenerique, fix: "Le livrable ne référence aucune brique. Il ressemble à un template." },
    { id: "preuve", label: "Preuve", desc: "Au moins 1 brique chiffrée", passed: hasProof, fix: "Aucune donnée chiffrée. Ajoute une brique avec un résultat mesurable." },
    { id: "destinataire", label: "Destinataire d'abord", desc: "Première phrase orientée recruteur", passed: destFirst, fix: "La première phrase parle de toi. Commence par le problème du recruteur." },
    { id: "calibrage", label: "Calibrage canal", desc: "Format adapté au support", passed: calibreOk, fix: type === "cv" ? "CV trop dense. Raccourcis les lignes pour un scan en 6 secondes." : type === "dm" ? "DM trop long. Maximum 3-4 lignes." : type === "email" ? "Email trop long. Maximum 10 lignes." : type === "post" ? "Post trop long ou contient des listes. Prose brute, max 1500 car." : "Format non calibré pour ce canal." },
  ];

  var passed = tests.filter(function(t) { return t.passed; });
  var failed = tests.filter(function(t) { return !t.passed; });
  return { score: passed.length, tests: tests, passed: passed, failed: failed };
}


/* ==============================
   CHANTIER 6 — GENERATORS INTERNES + PLAN 30j RH
   ============================== */

/**
 * Génère un plan 30 jours pour le recruteur/RH.
 * Montre ce que le candidat fera pendant son premier mois.
 * Basé sur les briques et le rôle cible.
 * @param {Array} bricks - briques validées
 * @param {string} targetRoleId - rôle cible
 * @param {object} offerSignals - signaux de l'offre (optionnel)
 * @returns {string} plan formaté
 */
export function generatePlan30jRH(bricks, targetRoleId, offerSignals) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return "[Plan 30 jours produit après validation de tes briques.]";

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleName = roleData ? roleData.role : "ce poste";
  var cauchemars = getActiveCauchemars();

  // Find strongest brick covering a cauchemar
  var strongestBrick = null;
  var strongestCauch = null;
  cauchemars.forEach(function(c) {
    validated.forEach(function(b) {
      if (b.kpi && c.kpis && c.kpis.some(function(k) { return b.kpi.toLowerCase().indexOf(k.toLowerCase().slice(0, 6)) !== -1; })) {
        if (!strongestBrick || (b.blinded && !strongestBrick.blinded)) {
          strongestBrick = b;
          strongestCauch = c;
        }
      }
    });
  });
  if (!strongestBrick) strongestBrick = validated[0];

  var plan = "PLAN 30 JOURS — " + roleName.toUpperCase() + "\n\n";

  // SEMAINE 1
  plan += "SEMAINE 1 — DIAGNOSTIC\n";
  plan += "• Cartographier les 3 priorités immédiates avec le N+1\n";
  plan += "• Identifier le problème le plus coûteux en cours\n";
  if (strongestCauch) {
    plan += "• Contexte probable : " + strongestCauch.nightmareShort + "\n";
  }
  plan += "\n";

  // SEMAINE 2
  plan += "SEMAINE 2 — PREMIER SIGNAL\n";
  plan += "• Livrer un quick win visible sur le problème identifié\n";
  if (strongestBrick) {
    plan += "• Méthode testée : " + extractBrickSummary(strongestBrick.text) + "\n";
  }
  plan += "• Documenter le before/after avec une métrique\n";
  plan += "\n";

  // SEMAINE 3
  plan += "SEMAINE 3 — INSTALLATION\n";
  plan += "• Installer un rituel de suivi hebdomadaire avec le N+1\n";
  plan += "• Identifier les 2 prochains chantiers par ordre d'impact\n";
  var decisionBrick = validated.find(function(b) { return b.brickCategory === "decision"; });
  if (decisionBrick) {
    plan += "• Capacité d'arbitrage démontrée : " + extractBrickSummary(decisionBrick.text) + "\n";
  }
  plan += "\n";

  // SEMAINE 4
  plan += "SEMAINE 4 — BILAN J30\n";
  plan += "• Présenter le ROI des 30 premiers jours\n";
  plan += "• Proposer le plan des 60 jours suivants\n";
  if (strongestCauch) {
    plan += "• Objectif : réduire l'impact de \"" + strongestCauch.label + "\" avec preuve mesurable\n";
  }

  plan += "\n---\n";
  plan += validated.length + " brique" + (validated.length > 1 ? "s" : "") + " de preuve disponible" + (validated.length > 1 ? "s" : "") + ". ";
  var blinded = validated.filter(function(b) { return b.blinded; });
  if (blinded.length > 0) {
    plan += blinded.length + " blindée" + (blinded.length > 1 ? "s" : "") + " (preuve chiffrée).";
  }

  return cleanRedac(plan, "livrable");
}


/**
 * Génère un rapport de coût de remplacement.
 * Montre au manager ce qu'il perd si le candidat part.
 * Basé sur les briques, le salaire (si fourni), et les signaux internes.
 * @param {Array} bricks - briques validées
 * @param {string} targetRoleId - rôle cible
 * @param {number|null} currentSalary - salaire actuel (optionnel)
 * @param {object} internalSignals - résultat de parseInternalSignals (optionnel)
 * @returns {string} rapport formaté
 */
export function generateReplacementReport(bricks, targetRoleId, currentSalary, internalSignals) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return "[Rapport produit après validation de tes briques.]";

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleName = roleData ? roleData.role : "ce poste";

  // Salary-based costs
  var salaryBase = currentSalary || 55000; // Default cadre median
  var recruitCostLow = Math.round(salaryBase * 0.15);
  var recruitCostHigh = Math.round(salaryBase * 0.30);
  var rampUpMonths = roleData && roleData.cadence >= 90 ? 6 : 4;
  var productivityLoss = Math.round(salaryBase * rampUpMonths / 12 * 0.5);
  var totalLow = recruitCostLow + productivityLoss;
  var totalHigh = recruitCostHigh + productivityLoss;

  var report = "RAPPORT DE COÛT DE REMPLACEMENT\n";
  report += roleName.toUpperCase() + "\n\n";

  // SECTION 1 — Coûts directs
  report += "1. COÛTS DIRECTS\n";
  report += "• Recrutement (cabinet + process) : " + formatCost(recruitCostLow) + "-" + formatCost(recruitCostHigh) + "\u20AC\n";
  report += "• Perte de productivité (" + rampUpMonths + " mois de montée en charge) : " + formatCost(productivityLoss) + "\u20AC\n";
  report += "• Total estimé : " + formatCost(totalLow) + "-" + formatCost(totalHigh) + "\u20AC\n";
  if (currentSalary) {
    report += "• Base de calcul : salaire déclaré " + formatCost(currentSalary) + "\u20AC\n";
  } else {
    report += "• Base de calcul : estimation médiane cadre (55K\u20AC). Renseigne ton salaire pour affiner.\n";
  }
  report += "\n";

  // SECTION 2 — Valeur opérationnelle
  report += "2. VALEUR OPÉRATIONNELLE EN JEU\n";
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });
  var blindedBricks = validated.filter(function(b) { return b.blinded; });
  report += "• " + validated.length + " compétence" + (validated.length > 1 ? "s" : "") + " documentée" + (validated.length > 1 ? "s" : "") + "\n";
  if (elasticBricks.length > 0) {
    report += "• " + elasticBricks.length + " compétence" + (elasticBricks.length > 1 ? "s" : "") + " élastique" + (elasticBricks.length > 1 ? "s" : "") + " (non remplaçable par l'IA)\n";
  }
  if (blindedBricks.length > 0) {
    report += "• " + blindedBricks.length + " résultat" + (blindedBricks.length > 1 ? "s" : "") + " chiffré" + (blindedBricks.length > 1 ? "s" : "") + " :\n";
    blindedBricks.slice(0, 3).forEach(function(b) {
      report += "  — " + extractBrickSummary(b.text) + "\n";
    });
  }
  report += "\n";

  // SECTION 3 — Coûts invisibles
  report += "3. COÛTS INVISIBLES\n";
  report += "• Perte de mémoire institutionnelle (process, relations, contexte)\n";
  report += "• Signal négatif pour l'équipe (si le meilleur élément part, les autres se posent la question)\n";
  report += "• Délai incompressible : " + rampUpMonths + " mois avant que le remplaçant soit autonome\n";

  // SECTION 4 — Signaux internes détectés
  if (internalSignals && internalSignals.detected) {
    report += "\n4. CONTEXTE INTERNE DÉTECTÉ\n";
    internalSignals.signals.forEach(function(s) {
      report += "• " + s.label + " (" + s.strength + ") — " + s.leverage + "\n";
    });
  }

  report += "\n---\n";
  report += "Ce rapport n'est pas une menace. C'est une cartographie. Le manager qui retient coûte moins cher que le manager qui remplace.";

  return cleanRedac(report, "livrable");
}


/**
 * Génère un argumentaire pour demander une augmentation.
 * Structure : valeur prouvée → coût du départ → demande calibrée.
 * @param {Array} bricks - briques validées
 * @param {string} targetRoleId - rôle cible
 * @param {number|null} currentSalary - salaire actuel (optionnel)
 * @returns {string} argumentaire formaté
 */
export function generateRaiseArgument(bricks, targetRoleId, currentSalary) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return "[Argumentaire produit après validation de tes briques.]";

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleName = roleData ? roleData.role : "ce poste";
  var cauchemars = getActiveCauchemars();

  var arg = "ARGUMENTAIRE D'AUGMENTATION\n";
  arg += roleName.toUpperCase() + "\n\n";

  // PARTIE 1 — Valeur prouvée
  arg += "1. VALEUR PROUVÉE\n";
  var blindedBricks = validated.filter(function(b) { return b.blinded; });
  var topBricks = blindedBricks.length > 0 ? blindedBricks : validated;
  topBricks.slice(0, 3).forEach(function(b) {
    arg += "• " + extractBrickSummary(b.text) + "\n";
  });

  // Coverage
  var coverage = computeCauchemarCoverage(bricks);
  var covered = coverage.filter(function(c) { return c.covered; });
  if (covered.length > 0) {
    var totalCostLow = 0;
    var totalCostHigh = 0;
    covered.forEach(function(cc) {
      var cauch = cauchemars.find(function(c) { return c.id === cc.id; });
      if (cauch) { totalCostLow += cauch.costRange[0]; totalCostHigh += cauch.costRange[1]; }
    });
    arg += "\nJe résous " + covered.length + " problème" + (covered.length > 1 ? "s" : "") + " dont le coût cumulé est estimé entre " + formatCost(totalCostLow) + " et " + formatCost(totalCostHigh) + " par an.\n";
  }
  arg += "\n";

  // PARTIE 2 — Coût du départ
  arg += "2. COÛT DE MON DÉPART\n";
  var salaryBase = currentSalary || 55000;
  var replacementCost = Math.round(salaryBase * 0.2);
  var rampCost = Math.round(salaryBase * 0.4);
  arg += "• Recrutement de remplacement : ~" + formatCost(replacementCost) + "\u20AC\n";
  arg += "• Perte de productivité pendant la transition : ~" + formatCost(rampCost) + "\u20AC\n";
  arg += "• Total : ~" + formatCost(replacementCost + rampCost) + "\u20AC\n";
  if (!currentSalary) {
    arg += "• (Estimation basée sur la médiane cadre. Renseigne ton salaire pour affiner.)\n";
  }
  arg += "\n";

  // PARTIE 3 — Demande calibrée
  arg += "3. DEMANDE\n";
  var raisePercent = blindedBricks.length >= 3 ? "8-12" : blindedBricks.length >= 1 ? "5-8" : "3-5";
  if (currentSalary) {
    var raiseLow = Math.round(currentSalary * parseInt(raisePercent) / 100);
    var raiseHigh = Math.round(currentSalary * parseInt(raisePercent.split("-")[1]) / 100);
    arg += "• Fourchette demandée : +" + raisePercent + "% soit " + formatCost(raiseLow) + "-" + formatCost(raiseHigh) + "\u20AC brut/an\n";
  } else {
    arg += "• Fourchette suggérée : +" + raisePercent + "% de ton salaire actuel\n";
  }
  arg += "• Justification : la valeur documentée dépasse le coût de la demande\n";
  arg += "• Le coût de mon remplacement (" + formatCost(replacementCost + rampCost) + "\u20AC) rend cette demande rationnelle\n";

  arg += "\n---\n";
  arg += "Cet argumentaire repose sur " + validated.length + " preuve" + (validated.length > 1 ? "s" : "") + " documentée" + (validated.length > 1 ? "s" : "") + ". ";
  arg += "Le manager ne négocie pas un salaire. Il arbitre entre le coût de ta demande et le coût de ton départ.";

  return cleanRedac(arg, "livrable");
}


/**
 * Génère un plan 90 jours pour le manager actuel.
 * Montre l'évolution proposée : 30j stabilisation, 30j expansion, 30j transformation.
 * @param {Array} bricks - briques validées
 * @param {string} targetRoleId - rôle cible
 * @param {object} internalSignals - résultat de parseInternalSignals (optionnel)
 * @returns {string} plan formaté
 */
export function generatePlan90jN1(bricks, targetRoleId, internalSignals) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return "[Plan 90 jours produit après validation de tes briques.]";

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleName = roleData ? roleData.role : "ce poste";

  var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });
  var decisionBricks = validated.filter(function(b) { return b.brickCategory === "decision"; });
  var influenceBricks = validated.filter(function(b) { return b.brickCategory === "influence"; });

  var plan = "PLAN 90 JOURS — ÉVOLUTION INTERNE\n";
  plan += roleName.toUpperCase() + "\n\n";

  // PHASE 1 — Stabilisation (J1-J30)
  plan += "PHASE 1 — STABILISATION (J1-J30)\n";
  plan += "Objectif : sécuriser la valeur actuelle et identifier les leviers d'expansion.\n\n";
  plan += "• Documenter les 3 résultats clés des 6 derniers mois\n";
  if (validated.length > 0) {
    plan += "• Résultat principal : " + extractBrickSummary(validated[0].text) + "\n";
  }
  plan += "• Identifier les 2 problèmes non résolus les plus coûteux pour l'équipe\n";
  if (internalSignals && internalSignals.detected) {
    var firstSignal = internalSignals.signals[0];
    plan += "• Signal détecté : " + firstSignal.label + " — " + firstSignal.leverage + "\n";
  }
  plan += "\n";

  // PHASE 2 — Expansion (J31-J60)
  plan += "PHASE 2 — EXPANSION (J31-J60)\n";
  plan += "Objectif : élargir le périmètre d'impact mesurable.\n\n";
  plan += "• Prendre en charge 1 chantier adjacent au périmètre actuel\n";
  if (decisionBricks.length > 0) {
    plan += "• Capacité d'arbitrage prouvée : " + extractBrickSummary(decisionBricks[0].text) + "\n";
  }
  if (influenceBricks.length > 0) {
    plan += "• Alignement inter-équipes : " + extractBrickSummary(influenceBricks[0].text) + "\n";
  }
  plan += "• Mesurer le ROI de l'expansion (avant/après sur 1 métrique)\n";
  plan += "\n";

  // PHASE 3 — Transformation (J61-J90)
  plan += "PHASE 3 — TRANSFORMATION (J61-J90)\n";
  plan += "Objectif : proposer une évolution de périmètre formalisée.\n\n";
  plan += "• Présenter le bilan des 90 jours avec métriques\n";
  if (elasticBricks.length > 0) {
    plan += "• Compétences élastiques documentées : " + elasticBricks.length + " (non remplaçables par l'IA)\n";
    plan += "  — " + extractBrickSummary(elasticBricks[0].text) + "\n";
  }
  plan += "• Proposer le nouveau périmètre avec objectifs chiffrés\n";
  plan += "• Poser la question au N+1 : \"Quel est le problème que personne ne prend en charge et qui coûte le plus cher à l'équipe ?\"\n";

  // Signaux internes
  if (internalSignals && internalSignals.detected && internalSignals.signals.length > 1) {
    plan += "\n---\nSIGNAUX INTERNES DÉTECTÉS\n";
    internalSignals.signals.forEach(function(s) {
      plan += "• " + s.label + " — " + s.leverage + "\n";
    });
  }

  plan += "\n---\n";
  plan += "Ce plan transforme une demande d'augmentation en proposition de valeur. Le N+1 n'évalue pas ton salaire. Il évalue le ROI de ton évolution.";

  return cleanRedac(plan, "livrable");
}
