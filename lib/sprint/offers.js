import { CAUCHEMAR_TEMPLATES_BY_ROLE, OFFER_URGENCY_KEYWORDS, SECTOR_KEYWORDS, KPI_REFERENCE } from "./references.js";

function formatCost(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return Math.round(n / 1000) + "K";
  return n + "";
}

export function parseOfferSignals(offersText, roleId) {
  if (!offersText || offersText.trim().length < 20) return null;
  var lower = offersText.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a").replace(/[ùû]/g, "u").replace(/[ôö]/g, "o").replace(/[îï]/g, "i");
  var templates = CAUCHEMAR_TEMPLATES_BY_ROLE[roleId] || CAUCHEMAR_TEMPLATES_BY_ROLE.enterprise_ae;

  // Detect urgency
  var urgencyScore = 0;
  var urgencyHits = [];
  OFFER_URGENCY_KEYWORDS.forEach(function(u) {
    if (lower.indexOf(u) !== -1) { urgencyScore++; urgencyHits.push(u); }
  });

  // Score each template against offer text
  var scored = templates.map(function(t, i) {
    var hits = 0;
    var matchedKw = [];
    t.kw.forEach(function(k) {
      var kNorm = k.replace(/[éèê]/g, "e").replace(/[àâ]/g, "a").replace(/[ùû]/g, "u").replace(/[ôö]/g, "o").replace(/[îï]/g, "i");
      if (lower.indexOf(kNorm) !== -1) { hits++; matchedKw.push(k); }
    });
    return { template: t, hits: hits, matchedKw: matchedKw, index: i };
  });

  // Sort: most keyword hits first, then by template order (elastic first in KPI_REFERENCE)
  scored.sort(function(a, b) {
    if (b.hits !== a.hits) return b.hits - a.hits;
    return a.index - b.index;
  });

  // Build top 3 cauchemars
  var active = scored.slice(0, 3).map(function(s, i) {
    var t = s.template;
    var costStr = formatCost(t.cost[0]) + "-" + formatCost(t.cost[1]);
    return {
      id: i + 1,
      label: t.label,
      kpis: t.kpis,
      nightmareShort: t.nightmare,
      costRange: t.cost,
      costUnit: "an",
      costContext: t.context,
      negoFrame: "La discussion ne porte pas sur ton salaire. Elle porte sur les " + costStr + " que ce problème leur coûte chaque année.",
      costSymbolique: "Le signal interne : si ce problème persiste, la confiance du board s'érode. Les meilleurs partent vers des équipes qui avancent.",
      costSystemique: "Effet domino : chaque mois sans résolution aggrave les problèmes adjacents. Le coût réel dépasse le périmètre visible.",
      detected: s.hits > 0,
      matchedKw: s.matchedKw,
      hitCount: s.hits,
    };
  });

  return {
    cauchemars: active,
    urgencyScore: urgencyScore,
    urgencyHits: urgencyHits,
    totalSignals: scored.reduce(function(sum, s) { return sum + s.hits; }, 0),
  };
}

/* Build active cauchemars from parsed signals or fall back to defaults */
export function buildActiveCauchemars(parsedOffers, roleId) {
  if (parsedOffers && parsedOffers.cauchemars && parsedOffers.cauchemars.length >= 3) {
    return parsedOffers.cauchemars;
  }
  // Fallback: generate from role templates without offer matching
  var templates = CAUCHEMAR_TEMPLATES_BY_ROLE[roleId] || CAUCHEMAR_TEMPLATES_BY_ROLE.enterprise_ae;
  return templates.map(function(t, i) {
    var costStr = formatCost(t.cost[0]) + "-" + formatCost(t.cost[1]);
    return {
      id: i + 1,
      label: t.label,
      kpis: t.kpis,
      nightmareShort: t.nightmare,
      costRange: t.cost,
      costUnit: "an",
      costContext: t.context,
      negoFrame: "La discussion ne porte pas sur ton salaire. Elle porte sur les " + costStr + " que ce problème leur coûte chaque année.",
      costSymbolique: "",
      costSystemique: "",
      detected: false,
      matchedKw: [],
      hitCount: 0,
    };
  });
}

/* Merge signals from multiple offers into unified cauchemar list */
export function mergeOfferSignals(offersArray, roleId) {
  if (!offersArray || offersArray.length === 0) return null;
  var allScored = {};
  var totalSignals = 0;
  var allUrgencyHits = [];
  var urgencyScore = 0;

  offersArray.forEach(function(offer) {
    var parsed = parseOfferSignals(offer.text, roleId);
    if (!parsed) return;
    totalSignals += parsed.totalSignals;
    urgencyScore += parsed.urgencyScore;
    parsed.urgencyHits.forEach(function(h) { if (allUrgencyHits.indexOf(h) === -1) allUrgencyHits.push(h); });
    parsed.cauchemars.forEach(function(c) {
      var key = c.label;
      if (!allScored[key]) {
        allScored[key] = { template: c, totalHits: 0, allKw: [], offerIds: [] };
      }
      allScored[key].totalHits += c.hitCount;
      allScored[key].offerIds.push(offer.id);
      c.matchedKw.forEach(function(kw) { if (allScored[key].allKw.indexOf(kw) === -1) allScored[key].allKw.push(kw); });
    });
  });

  var merged = Object.keys(allScored).map(function(key) {
    var s = allScored[key];
    var c = Object.assign({}, s.template);
    c.hitCount = s.totalHits;
    c.matchedKw = s.allKw;
    c.detected = s.totalHits > 0;
    c.offerIds = s.offerIds;
    return c;
  });

  merged.sort(function(a, b) { return b.hitCount - a.hitCount; });
  var top3 = merged.slice(0, 3).map(function(c, i) { c.id = i + 1; return c; });

  return {
    cauchemars: top3,
    urgencyScore: urgencyScore,
    urgencyHits: allUrgencyHits,
    totalSignals: totalSignals,
  };
}

/* Detect sector dispersion across offers */
export function checkOfferCoherence(offersArray) {
  if (!offersArray || offersArray.length < 2) return { coherent: true, sectors: [], message: null };
  var detectedSectors = {};
  offersArray.forEach(function(offer) {
    var lower = offer.text.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
    Object.keys(SECTOR_KEYWORDS).forEach(function(sector) {
      var hits = 0;
      SECTOR_KEYWORDS[sector].forEach(function(kw) { if (lower.indexOf(kw) !== -1) hits++; });
      if (hits >= 1) {
        if (!detectedSectors[sector]) detectedSectors[sector] = [];
        detectedSectors[sector].push(offer.id);
      }
    });
  });
  var sectorList = Object.keys(detectedSectors);
  if (sectorList.length >= 4) {
    return { coherent: false, sectors: sectorList, message: "Tes offres ciblent " + sectorList.length + " secteurs différents. Ta densité se dilue. Concentre sur 1-2 secteurs." };
  }
  return { coherent: true, sectors: sectorList, message: null };
}

/**
 * parseInternalSignals — V2 chantier 6
 * Parse les signaux d'une fiche de poste interne (N+1).
 * Le N+1 ne "recrute" pas. Il "retient" ou "promeut."
 * Signaux détectés : objectifs non atteints, surcharge équipe,
 * départs récents, restructuration interne, projet critique.
 * @param {string} internalJobDescription
 * @param {string} targetRoleId
 * @returns {object} signals
 */
export function parseInternalSignals(internalJobDescription, targetRoleId) {
  // TODO: Chantier 6
  return { signals: [], detected: false };
}
