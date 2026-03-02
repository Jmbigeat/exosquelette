import { ROLE_CLUSTERS, KPI_REFERENCE, CAUCHEMAR_TEMPLATES_BY_ROLE } from "@/lib/sprint/references";
import { parseOfferSignals } from "@/lib/sprint/offers";

function normalizeAccents(text) {
  return text.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a").replace(/[ùû]/g, "u").replace(/[ôö]/g, "o").replace(/[îï]/g, "i").replace(/[ç]/g, "c");
}

/**
 * analyzeOffer — Analyse client-side d'une offre d'emploi.
 * Zéro appel API. Utilise les références existantes.
 */
export function analyzeOffer(offerText) {
  if (!offerText || offerText.trim().length < 50) return null;

  var lower = normalizeAccents(offerText);

  // 1. Détection du rôle : scoring pondéré label (×3) + KPI names (×1) + cauchemar kw (×1)
  var bestRoleId = "enterprise_ae";
  var bestScore = 0;

  ROLE_CLUSTERS.forEach(function(cluster) {
    var roleId = cluster.id;
    var score = 0;

    // A. Label du rôle (signal le plus fort — poids ×3)
    var labelNorm = normalizeAccents(cluster.label);
    var labelWords = labelNorm.split(/[\s\/\(\)—,]+/).filter(function(w) { return w.length > 2; });
    labelWords.forEach(function(w) {
      if (lower.indexOf(w) !== -1) score += 3;
    });

    // B. Noms des KPIs (poids ×1)
    var roleData = KPI_REFERENCE[roleId];
    if (roleData) {
      roleData.kpis.forEach(function(kpi) {
        var kpiNorm = normalizeAccents(kpi.name);
        var kpiWords = kpiNorm.split(/[\s\/\(\)]+/).filter(function(w) { return w.length > 3; });
        kpiWords.forEach(function(w) {
          if (lower.indexOf(w) !== -1) score += 1;
        });
      });
    }

    // C. Cauchemar keywords (poids ×1)
    var templates = CAUCHEMAR_TEMPLATES_BY_ROLE[roleId];
    if (templates) {
      templates.forEach(function(t) {
        t.kw.forEach(function(k) {
          var kNorm = normalizeAccents(k);
          if (lower.indexOf(kNorm) !== -1) score++;
        });
      });
    }

    if (score > bestScore) {
      bestScore = score;
      bestRoleId = roleId;
    }
  });

  // 2. Extraction des signaux via parseOfferSignals
  var signals = parseOfferSignals(offerText, bestRoleId);

  // 3. Sélection du cauchemar principal (plus de hits, ou premier = coût le plus élevé)
  var mainNightmare = null;
  if (signals && signals.cauchemars && signals.cauchemars.length > 0) {
    mainNightmare = signals.cauchemars[0];
  } else {
    // Fallback : premier template du rôle (coût max par convention d'ordre)
    var fallbackTemplates = CAUCHEMAR_TEMPLATES_BY_ROLE[bestRoleId] || CAUCHEMAR_TEMPLATES_BY_ROLE.enterprise_ae;
    var t = fallbackTemplates[0];
    mainNightmare = {
      label: t.label,
      kpis: t.kpis,
      nightmareShort: t.nightmare,
      costRange: t.cost,
      detected: false,
      matchedKw: [],
      hitCount: 0,
    };
  }

  // 4. KPI associé au cauchemar principal
  var revealedKpi = null;
  var roleKpis = KPI_REFERENCE[bestRoleId] ? KPI_REFERENCE[bestRoleId].kpis : [];
  if (mainNightmare.kpis && mainNightmare.kpis.length > 0) {
    var targetKpiName = mainNightmare.kpis[0];
    for (var i = 0; i < roleKpis.length; i++) {
      if (roleKpis[i].name === targetKpiName) {
        revealedKpi = roleKpis[i];
        break;
      }
    }
  }
  if (!revealedKpi && roleKpis.length > 0) {
    revealedKpi = roleKpis[0];
  }

  // 5. Label du rôle détecté
  var detectedRoleLabel = bestRoleId;
  for (var j = 0; j < ROLE_CLUSTERS.length; j++) {
    if (ROLE_CLUSTERS[j].id === bestRoleId) {
      detectedRoleLabel = ROLE_CLUSTERS[j].label;
      break;
    }
  }

  return {
    detectedRoleId: bestRoleId,
    detectedRoleLabel: detectedRoleLabel,
    mainNightmare: mainNightmare,
    revealedKpi: revealedKpi,
    allCauchemars: signals ? signals.cauchemars : [],
    urgencyScore: signals ? signals.urgencyScore : 0,
    totalSignals: signals ? signals.totalSignals : 0,
  };
}
