import { KPI_REFERENCE } from "../sprint/references.js";
import { getActiveCauchemars, formatCost } from "../sprint/scoring.js";
import { parseOfferSignals } from "../sprint/offers.js";

export function generatePlan90(bricks, targetRoleId, offersArray) {
  var validated = bricks.filter(function (b) {
    return b.status === "validated" && b.brickType !== "take";
  });
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
  var sortedCauchs = activeCauchs.slice().sort(function (a, b) {
    return (b.costRange[1] || 0) - (a.costRange[1] || 0);
  });
  var cauchWithBrick = [];
  sortedCauchs.forEach(function (c) {
    var matchBrick = validated.find(function (b) {
      return (
        c.kpis &&
        c.kpis.some(function (kpi) {
          return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1;
        })
      );
    });
    cauchWithBrick.push({ cauchemar: c, brick: matchBrick || null });
  });

  // Get Take
  var takeBrick = bricks.find(function (b) {
    return b.brickType === "take" && b.status === "validated";
  });
  var takeText = takeBrick ? takeBrick.text : null;

  // Phase structure depends on cadence
  var phases = [];

  if (cadence <= 30) {
    // MENSUEL: 3 rendez-vous de souveraineté en 90 jours
    phases = [
      {
        label: "Semaines 1-4",
        tag: "DIAGNOSTIC + QUICK WIN",
        rdvSouverainete: "1er Rendez-vous de Souveraineté (J30)",
        color: "#e94560",
      },
      {
        label: "Semaines 5-8",
        tag: "EXECUTION + PREUVE",
        rdvSouverainete: "2e Rendez-vous de Souveraineté (J60)",
        color: "#ff9800",
      },
      {
        label: "Semaines 9-12",
        tag: "SYSTEME + MESURE",
        rdvSouverainete: "3e Rendez-vous de Souveraineté (J90)",
        color: "#4ecca3",
      },
    ];
  } else if (cadence <= 90) {
    // TRIMESTRIEL: 1 rendez-vous de souveraineté à J90
    phases = [
      { label: "Semaines 1-4", tag: "IMMERSION + DIAGNOSTIC", rdvSouverainete: null, color: "#e94560" },
      { label: "Semaines 5-8", tag: "PREMIERS ARBITRAGES", rdvSouverainete: null, color: "#ff9800" },
      {
        label: "Semaines 9-12",
        tag: "LIVRAISON + BILAN",
        rdvSouverainete: "Rendez-vous de Souveraineté (J90)",
        color: "#4ecca3",
      },
    ];
  } else {
    // SEMESTRIEL: J90 = mi-parcours
    phases = [
      { label: "Semaines 1-4", tag: "CARTOGRAPHIE POLITIQUE", rdvSouverainete: null, color: "#e94560" },
      { label: "Semaines 5-8", tag: "PREMIERS SIGNAUX", rdvSouverainete: null, color: "#ff9800" },
      {
        label: "Semaines 9-12",
        tag: "POINT MI-CYCLE",
        rdvSouverainete: "Mi-parcours vers le 1er Rendez-vous de Souveraineté (J180)",
        color: "#4ecca3",
      },
    ];
  }

  // Role-specific action templates
  var roleActions = {
    enterprise_ae: {
      phase1: [
        "Cartographier les 5 comptes stratégiques et leur cycle de décision",
        "Identifier le deal bloqué le plus coûteux et diagnostiquer le blocage",
        "Poser la question discovery au N+1 : ''{Q}''",
      ],
      phase2: [
        "Débloquer 1 deal en appliquant la méthode multi-décideurs",
        "Documenter le before/after avec chiffre de pipeline",
        "Installer le rituel de revue hebdo avec le VP Sales",
      ],
      phase3: [
        "Mesurer le delta de win rate depuis l'arrivée",
        "Présenter le ROI des 90 jours au COMEX",
        "Définir les 3 prochains comptes cibles avec le même playbook",
      ],
    },
    head_of_growth: {
      phase1: [
        "Auditer les 3 canaux principaux et leur CAC réel",
        "Identifier l'expérimentation la plus rentable en cours",
        "Poser la question : quel canal a été abandonné trop tôt ?",
      ],
      phase2: [
        "Lancer 2 expérimentations ciblées sur le canal sous-exploité",
        "Mesurer LTV/CAC par cohorte, pas en moyenne",
        "Couper 1 canal qui consomme du budget sans preuve de conversion",
      ],
      phase3: [
        "Présenter le delta de CAC et les cohortes avant/après",
        "Proposer le plan Q2 avec budget et hypothèses testables",
        "Documenter la méthode pour qu'elle survive sans toi",
      ],
    },
    strategic_csm: {
      phase1: [
        "Lister les 10 comptes à risque de churn avec date de renouvellement",
        "Identifier le compte le plus rentable avec le NRR le plus faible",
        "Poser la question au client : quel problème personne ne résout ?",
      ],
      phase2: [
        "Sauver 1 compte à risque avec un plan d'action documenté",
        "Déclencher 1 upsell sur un besoin détecté (pas sur un pitch produit)",
        "Mesurer le NRR avant/après intervention",
      ],
      phase3: [
        "Présenter le delta de churn sauvé en euros",
        "Créer le playbook de détection précoce pour l'équipe",
        "Identifier les 3 comptes d'expansion pour Q2",
      ],
    },
    senior_pm: {
      phase1: [
        "Cartographier les 3 arbitrages produit en attente depuis plus de 2 mois",
        "Identifier la feature en production qui n'a bougé aucune métrique",
        "Poser la question à l'engineering : quel chantier est en cours sans sponsor ?",
      ],
      phase2: [
        "Tuer 1 feature ou 1 projet sans impact mesurable",
        "Aligner engineering et business sur 1 métrique north star",
        "Livrer 1 quick win visible avec adoption mesurée",
      ],
      phase3: [
        "Présenter le ROI des décisions prises (features tuées + livrées)",
        "Documenter les 3 prochains arbitrages du Q2",
        "Mesurer l'adoption du quick win à J90",
      ],
    },
    ai_architect: {
      phase1: [
        "Auditer les projets IA en cours : combien en production vs POC",
        "Identifier le cas d'usage bloqué depuis plus de 3 mois",
        "Mesurer le coût d'infra actuel vs le ROI réel de chaque déploiement",
      ],
      phase2: [
        "Débloquer 1 cas d'usage avec un périmètre réduit et mesurable",
        "Proposer 1 arbitrage build vs buy sur un modèle",
        "Former 1 équipe métier à l'usage autonome de l'outil IA",
      ],
      phase3: [
        "Présenter le ROI du cas d'usage débloqué",
        "Documenter l'architecture de décision pour les prochains projets",
        "Mesurer le taux d'adoption interne avant/après intervention",
      ],
    },
    engineering_manager: {
      phase1: [
        "Mesurer le cycle time réel (commit to deploy) sur les 3 derniers mois",
        "Identifier le dev le plus à risque de départ (signaux faibles)",
        "Cartographier la dette technique par impact business",
      ],
      phase2: [
        "Réduire 1 friction dans le pipeline de livraison",
        "Conduire 1 entretien de rétention avec le talent à risque",
        "Arbitrer 1 décision build vs buy bloquée",
      ],
      phase3: [
        "Présenter le delta de cycle time",
        "Documenter la décision build vs buy et son résultat",
        "Proposer le plan de rétention Q2 avec métriques",
      ],
    },
    management_consultant: {
      phase1: [
        "Livrer le diagnostic en 2 semaines, pas en 6",
        "Identifier la recommandation que le COMEX refuse d'entendre",
        "Chiffrer le coût de l'inaction sur le problème principal",
      ],
      phase2: [
        "Faire accepter 1 recommandation difficile avec données à l'appui",
        "Accompagner l'implémentation (pas juste livrer le slide deck)",
        "Mesurer le premier indicateur d'impact",
      ],
      phase3: [
        "Présenter l'impact EBITDA de l'intervention",
        "Laisser un playbook utilisable sans consultant",
        "Poser la question : quel problème adjacent émerge ?",
      ],
    },
    strategy_associate: {
      phase1: [
        "Cartographier les 3 dossiers stratégiques ouverts et leur sponsor",
        "Identifier le signal faible que personne n'a encore formalisé",
        "Comprendre l'alignement politique du COMEX sur chaque dossier",
      ],
      phase2: [
        "Produire 1 analyse qui change la décision sur un dossier",
        "Aligner 2 membres du COMEX sur une position commune",
        "Documenter le raisonnement, pas juste la conclusion",
      ],
      phase3: [
        "Présenter le delta de décision : qu'est-ce qui a changé grâce à l'analyse",
        "Préparer le cadrage du prochain cycle semestriel",
        "Identifier les 2 signaux faibles pour le S2",
      ],
    },
    operations_manager: {
      phase1: [
        "Cartographier les 3 frictions inter-services les plus coûteuses en temps",
        "Mesurer la charge cognitive de l'équipe (nombre d'outils, étapes manuelles)",
        "Poser la question à chaque service : quel process vous fait perdre le plus de temps ?",
      ],
      phase2: [
        "Éliminer 1 friction inter-services avec un process documenté",
        "Automatiser 1 tâche répétitive avec ROI mesurable",
        "Mesurer le temps gagné en heures par semaine",
      ],
      phase3: [
        "Présenter le delta de friction et le temps libéré",
        "Documenter le process pour qu'il survive sans toi",
        "Identifier les 3 prochaines frictions à traiter en Q2",
      ],
    },
    fractional_coo: {
      phase1: [
        "Diagnostiquer où le CEO passe son temps vs où il devrait le passer",
        "Identifier le process manquant qui coûte le plus cher",
        "Aligner les N-1 sur les 3 priorités du trimestre",
      ],
      phase2: [
        "Installer 1 process de gouvernance qui libère le CEO de 5h/semaine",
        "Mesurer le runway impact de chaque décision opérationnelle",
        "Conduire le premier comité de pilotage structuré",
      ],
      phase3: [
        "Présenter le ROI du temps libéré pour le CEO",
        "Documenter la gouvernance pour qu'elle fonctionne sans présence quotidienne",
        "Proposer le plan Q2 avec jalons et métriques",
      ],
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
    phases: phases.map(function (p, i) {
      var phaseActions = i === 0 ? actions.phase1 : i === 1 ? actions.phase2 : actions.phase3;
      var targetCauch = i === 0 ? cauch1 : i === 1 ? cauch2 : cauch3;
      return {
        label: p.label,
        tag: p.tag,
        rdvSouverainete: p.rdvSouverainete,
        color: p.color,
        actions: phaseActions,
        cauchemar: targetCauch ? targetCauch.cauchemar.label : null,
        cauchemarCost: targetCauch
          ? formatCost(targetCauch.cauchemar.costRange[0]) + "-" + formatCost(targetCauch.cauchemar.costRange[1])
          : null,
        brick: targetCauch && targetCauch.brick ? targetCauch.brick.cvVersion || targetCauch.brick.text : null,
      };
    }),
    take: takeText,
    ouverture: cauch1
      ? "Le cauchemar le plus coûteux (" +
        cauch1.cauchemar.label +
        ", " +
        formatCost(cauch1.cauchemar.costRange[0]) +
        "-" +
        formatCost(cauch1.cauchemar.costRange[1]) +
        "/an) est votre priorité semaine 1."
      : null,
  };

  return plan;
}
