import { CAUCHEMAR_TEMPLATES_BY_ROLE, OFFER_URGENCY_KEYWORDS, SECTOR_KEYWORDS, KPI_REFERENCE } from "./references.js";

function formatCost(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return Math.round(n / 1000) + "K";
  return n + "";
}

export function parseOfferSignals(offersText, roleId) {
  if (!offersText || offersText.trim().length < 20) return null;
  var lower = offersText
    .toLowerCase()
    .replace(/[éèê]/g, "e")
    .replace(/[àâ]/g, "a")
    .replace(/[ùû]/g, "u")
    .replace(/[ôö]/g, "o")
    .replace(/[îï]/g, "i");
  var templates = CAUCHEMAR_TEMPLATES_BY_ROLE[roleId] || CAUCHEMAR_TEMPLATES_BY_ROLE.enterprise_ae;

  // Detect urgency
  var urgencyScore = 0;
  var urgencyHits = [];
  OFFER_URGENCY_KEYWORDS.forEach(function (u) {
    if (lower.indexOf(u) !== -1) {
      urgencyScore++;
      urgencyHits.push(u);
    }
  });

  // Score each template against offer text
  var scored = templates.map(function (t, i) {
    var hits = 0;
    var matchedKw = [];
    t.kw.forEach(function (k) {
      var kNorm = k
        .replace(/[éèê]/g, "e")
        .replace(/[àâ]/g, "a")
        .replace(/[ùû]/g, "u")
        .replace(/[ôö]/g, "o")
        .replace(/[îï]/g, "i");
      if (lower.indexOf(kNorm) !== -1) {
        hits++;
        matchedKw.push(k);
      }
    });
    return { template: t, hits: hits, matchedKw: matchedKw, index: i };
  });

  // Sort: most keyword hits first, then by template order (elastic first in KPI_REFERENCE)
  scored.sort(function (a, b) {
    if (b.hits !== a.hits) return b.hits - a.hits;
    return a.index - b.index;
  });

  // Build top 3 cauchemars
  var active = scored.slice(0, 3).map(function (s, i) {
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
      negoFrame:
        "La discussion ne porte pas sur ton salaire. Elle porte sur les " +
        costStr +
        " que ce problème leur coûte chaque année.",
      costSymbolique:
        "Le signal interne : si ce problème persiste, la confiance du board s'érode. Les meilleurs partent vers des équipes qui avancent.",
      costSystemique:
        "Effet domino : chaque mois sans résolution aggrave les problèmes adjacents. Le coût réel dépasse le périmètre visible.",
      detected: s.hits > 0,
      matchedKw: s.matchedKw,
      hitCount: s.hits,
    };
  });

  return {
    cauchemars: active,
    urgencyScore: urgencyScore,
    urgencyHits: urgencyHits,
    totalSignals: scored.reduce(function (sum, s) {
      return sum + s.hits;
    }, 0),
  };
}

/* Build active cauchemars from parsed signals or fall back to defaults */
export function buildActiveCauchemars(parsedOffers, roleId) {
  if (parsedOffers && parsedOffers.cauchemars && parsedOffers.cauchemars.length >= 3) {
    return parsedOffers.cauchemars;
  }
  // Fallback: generate from role templates without offer matching
  var templates = CAUCHEMAR_TEMPLATES_BY_ROLE[roleId] || CAUCHEMAR_TEMPLATES_BY_ROLE.enterprise_ae;
  return templates.map(function (t, i) {
    var costStr = formatCost(t.cost[0]) + "-" + formatCost(t.cost[1]);
    return {
      id: i + 1,
      label: t.label,
      kpis: t.kpis,
      nightmareShort: t.nightmare,
      costRange: t.cost,
      costUnit: "an",
      costContext: t.context,
      negoFrame:
        "La discussion ne porte pas sur ton salaire. Elle porte sur les " +
        costStr +
        " que ce problème leur coûte chaque année.",
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

  offersArray.forEach(function (offer) {
    var parsed = parseOfferSignals(offer.text, roleId);
    if (!parsed) return;
    totalSignals += parsed.totalSignals;
    urgencyScore += parsed.urgencyScore;
    parsed.urgencyHits.forEach(function (h) {
      if (allUrgencyHits.indexOf(h) === -1) allUrgencyHits.push(h);
    });
    parsed.cauchemars.forEach(function (c) {
      var key = c.label;
      if (!allScored[key]) {
        allScored[key] = { template: c, totalHits: 0, allKw: [], offerIds: [] };
      }
      allScored[key].totalHits += c.hitCount;
      allScored[key].offerIds.push(offer.id);
      c.matchedKw.forEach(function (kw) {
        if (allScored[key].allKw.indexOf(kw) === -1) allScored[key].allKw.push(kw);
      });
    });
  });

  var merged = Object.keys(allScored).map(function (key) {
    var s = allScored[key];
    var c = Object.assign({}, s.template);
    c.hitCount = s.totalHits;
    c.matchedKw = s.allKw;
    c.detected = s.totalHits > 0;
    c.offerIds = s.offerIds;
    return c;
  });

  merged.sort(function (a, b) {
    return b.hitCount - a.hitCount;
  });
  var top3 = merged.slice(0, 3).map(function (c, i) {
    c.id = i + 1;
    return c;
  });

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
  offersArray.forEach(function (offer) {
    var lower = offer.text.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
    Object.keys(SECTOR_KEYWORDS).forEach(function (sector) {
      var hits = 0;
      SECTOR_KEYWORDS[sector].forEach(function (kw) {
        if (lower.indexOf(kw) !== -1) hits++;
      });
      if (hits >= 1) {
        if (!detectedSectors[sector]) detectedSectors[sector] = [];
        detectedSectors[sector].push(offer.id);
      }
    });
  });
  var sectorList = Object.keys(detectedSectors);
  if (sectorList.length >= 4) {
    return {
      coherent: false,
      sectors: sectorList,
      message:
        "Tes offres ciblent " +
        sectorList.length +
        " secteurs différents. Ta densité se dilue. Concentre sur 1-2 secteurs.",
    };
  }
  return { coherent: true, sectors: sectorList, message: null };
}

/**
 * parseInternalSignals — V2 chantier 6
 * Parse les signaux d'une fiche de poste interne (N+1).
 * Le N+1 ne "recrute" pas. Il "retient" ou "promeut."
 * Signaux détectés : objectifs non atteints, surcharge équipe,
 * départs récents, restructuration interne, projet critique.
 * @param {string} internalJobDescription - description du poste/contexte interne
 * @param {string} targetRoleId - rôle cible
 * @returns {object} { signals: Array, detected: boolean }
 */
export function parseInternalSignals(internalJobDescription, targetRoleId) {
  if (!internalJobDescription || internalJobDescription.trim().length < 10) {
    return { signals: [], detected: false };
  }
  var lower = internalJobDescription
    .toLowerCase()
    .replace(/[éèê]/g, "e")
    .replace(/[àâ]/g, "a")
    .replace(/[ùû]/g, "u")
    .replace(/[ôö]/g, "o")
    .replace(/[îï]/g, "i");

  var signalDefs = [
    {
      id: "objectifs_non_atteints",
      label: "Objectifs non atteints",
      keywords: [
        "objectif",
        "target",
        "kpi",
        "resultat",
        "sous-performance",
        "sous performance",
        "en dessous",
        "retard",
        "ecart",
        "gap",
        "non atteint",
        "manque",
        "insuffisan",
      ],
      leverage:
        "Le manager sait que les objectifs ne sont pas atteints. Il cherche quelqu'un qui corrige sans qu'il ait à micro-manager.",
    },
    {
      id: "surcharge_equipe",
      label: "Surcharge équipe",
      keywords: [
        "charge",
        "capacite",
        "heures sup",
        "heure supplementaire",
        "turnover",
        "burn",
        "surcharge",
        "sous-effectif",
        "sous effectif",
        "epuise",
        "fatigue",
        "saturation",
        "deborde",
      ],
      leverage:
        "L'équipe craque. Le manager cherche un relais. Ton arrivée ou ta montée en compétence réduit la pression immédiate.",
    },
    {
      id: "departs_recents",
      label: "Départs récents",
      keywords: [
        "depart",
        "demission",
        "remplacement",
        "vacance",
        "poste vacant",
        "quitte",
        "parti",
        "perdu",
        "turnover",
        "attrition",
        "fuite",
      ],
      leverage:
        "Des départs fragilisent l'équipe. Le manager paie le coût de remplacement. Ta rétention vaut plus que ton salaire.",
    },
    {
      id: "restructuration",
      label: "Restructuration interne",
      keywords: [
        "reorg",
        "fusion",
        "transformation",
        "changement",
        "restructur",
        "reorganis",
        "nouvelle orga",
        "transition",
        "migration",
        "pivot",
      ],
      leverage:
        "En période de restructuration, la stabilité a un prix. Le manager perd des repères. Tu es un point fixe.",
    },
    {
      id: "projet_critique",
      label: "Projet critique",
      keywords: [
        "deadline",
        "urgent",
        "prioritaire",
        "critique",
        "livraison",
        "date limite",
        "imperatif",
        "bloque",
        "retard projet",
        "sprint",
        "release",
        "go live",
        "mise en production",
      ],
      leverage:
        "Un projet critique dépend de toi. Si tu pars, la deadline explose. Le coût du retard dépasse le coût de ta demande.",
    },
  ];

  var signals = [];
  signalDefs.forEach(function (def) {
    var matchedKw = [];
    def.keywords.forEach(function (kw) {
      if (lower.indexOf(kw) !== -1) matchedKw.push(kw);
    });
    if (matchedKw.length > 0) {
      signals.push({
        id: def.id,
        label: def.label,
        leverage: def.leverage,
        matchedKw: matchedKw,
        strength: matchedKw.length >= 3 ? "fort" : matchedKw.length >= 2 ? "moyen" : "faible",
      });
    }
  });

  return { signals: signals, detected: signals.length > 0 };
}

/* aggregateOfferSignals — Chantier 18
 * Wrapper around mergeOfferSignals that filters to external offers only.
 * Internal offers use parseInternalSignals with a different shape.
 */
export function aggregateOfferSignals(offers, roleId) {
  if (!offers || offers.length === 0) return null;
  var external = offers.filter(function (o) {
    return o.type !== "internal";
  });
  if (external.length === 0) return null;
  return mergeOfferSignals(external, roleId);
}

/* detectSectoralDispersion — Chantier 18
 * Returns null or { sectors: string[], message: string }.
 * Triggers at 2+ detected sectors (stricter than checkOfferCoherence's 4+).
 */
export function detectSectoralDispersion(offers) {
  if (!offers || offers.length < 2) return null;
  var detectedSectors = {};
  offers.forEach(function (offer) {
    var lower = offer.text.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
    Object.keys(SECTOR_KEYWORDS).forEach(function (sector) {
      var hits = 0;
      SECTOR_KEYWORDS[sector].forEach(function (kw) {
        if (lower.indexOf(kw) !== -1) hits++;
      });
      if (hits >= 1) {
        if (!detectedSectors[sector]) detectedSectors[sector] = [];
        detectedSectors[sector].push(offer.id);
      }
    });
  });
  var sectorList = Object.keys(detectedSectors);
  if (sectorList.length >= 2) {
    return {
      sectors: sectorList,
      message:
        "Tes offres couvrent " +
        sectorList.length +
        " secteurs différents (" +
        sectorList.join(", ") +
        "). Ta densité risque de se diluer.",
    };
  }
  return null;
}
