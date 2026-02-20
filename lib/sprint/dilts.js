export var DILTS_LEVELS = [
  { level: 1, name: "Environnement", desc: "Où, quand, avec qui", color: "#8892b0" },
  { level: 2, name: "Comportement", desc: "Ce que je fais", color: "#3498db" },
  { level: 3, name: "Capacités", desc: "Comment je le fais", color: "#4ecca3" },
  { level: 4, name: "Croyances", desc: "Pourquoi je le fais", color: "#ff9800" },
  { level: 5, name: "Identité", desc: "Qui je suis", color: "#e94560" },
  { level: 6, name: "Mission", desc: "Pour quoi je le fais", color: "#9b59b6" },
];

export var DILTS_MARKERS = {
  1: ["chez", "dans l'equipe", "en 20", "pendant", "mois", "semaines", "trimestre", "clients", "comptes", "personnes", "euros", "budget", "paris", "lyon", "france", "entreprise", "start-up", "scale-up", "groupe"],
  2: ["j'ai fait", "j'ai lance", "j'ai mis en place", "j'ai deploye", "j'ai construit", "j'ai cree", "j'ai forme", "j'ai recrute", "j'ai gere", "j'ai pilote", "j'ai negocie", "j'ai redige", "j'ai organise", "j'ai produit", "j'ai execute"],
  3: ["ma methode", "mon approche", "mon process", "ma strategie", "mon cadre", "mon systeme", "la methode que", "la technique", "le framework", "reproductible", "structuré", "systematique", "optimise", "itere", "mesure", "analyse", "diagnostic"],
  4: ["je crois que", "je suis convaincu", "le vrai sujet", "le vrai probleme", "ce que personne ne dit", "contrairement a", "a tort", "en realite", "la majorite pense", "l'erreur commune", "mon parti pris", "ma conviction", "je refuse de", "je defends"],
  5: ["je suis le genre de", "mon role est", "je suis celui qui", "je suis celle qui", "mon positionnement", "ce qui me definit", "ma singularite", "ce qui me rend", "ma marque", "mon ADN", "ma posture", "je ne suis pas un", "on me reconnait"],
  6: ["pour que", "l'impact sur", "contribuer a", "au service de", "ma mission", "ce que je veux changer", "le systeme", "l'ecosysteme", "la prochaine génération", "transformer", "le monde du travail", "faire avancer", "laisser une trace", "plus grand que moi"],
};

export function detectDiltsLevel(text) {
  if (!text || text.length < 10) return { dominant: 1, scores: {}, breakdown: [] };
  var lower = text.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a").replace(/[ùû]/g, "u").replace(/[ôö]/g, "o").replace(/[îï]/g, "i");

  var scores = {};
  var breakdown = [];
  [1, 2, 3, 4, 5, 6].forEach(function(level) {
    var hits = 0;
    var matched = [];
    DILTS_MARKERS[level].forEach(function(m) {
      var mNorm = m.replace(/[éèê]/g, "e").replace(/[àâ]/g, "a").replace(/[ùû]/g, "u").replace(/[ôö]/g, "o").replace(/[îï]/g, "i");
      if (lower.indexOf(mNorm) !== -1) { hits++; matched.push(m); }
    });
    scores[level] = hits;
    if (hits > 0) breakdown.push({ level: level, hits: hits, matched: matched });
  });

  // Dominant = highest score, tiebreak favors higher level
  var dominant = 1;
  var maxScore = 0;
  [1, 2, 3, 4, 5, 6].forEach(function(level) {
    if (scores[level] > maxScore || (scores[level] === maxScore && level > dominant)) {
      maxScore = scores[level];
      dominant = level;
    }
  });

  return { dominant: dominant, scores: scores, breakdown: breakdown };
}

export function getDiltsLabel(level) {
  var d = DILTS_LEVELS.find(function(l) { return l.level === level; });
  return d || DILTS_LEVELS[0];
}

/* Detect Dilts progression in a script (open vs close) */
export function analyzeDiltsProgression(text) {
  if (!text || text.length < 40) return { opens: 1, closes: 1, progression: 0 };
  var parts = text.split("\n\n");
  if (parts.length < 2) parts = text.split("\n");
  if (parts.length < 2) return { opens: 1, closes: 1, progression: 0 };

  var firstThird = parts.slice(0, Math.max(1, Math.floor(parts.length / 3))).join(" ");
  var lastThird = parts.slice(-Math.max(1, Math.floor(parts.length / 3))).join(" ");

  var openLevel = detectDiltsLevel(firstThird).dominant;
  var closeLevel = detectDiltsLevel(lastThird).dominant;

  return { opens: openLevel, closes: closeLevel, progression: closeLevel - openLevel };
}

/* Check sequence stagnation across multiple posts */
export function checkDiltsSequence(posts) {
  if (!posts || posts.length < 3) return null;
  var last3 = posts.slice(-3);
  var levels = last3.map(function(p) { return p.diltsLevel || 1; });
  var allSame = levels[0] === levels[1] && levels[1] === levels[2];
  if (allSame) {
    var d = getDiltsLabel(levels[0]);
    return { stagnant: true, level: levels[0], name: d.name, message: "Tes 3 derniers posts sont au niveau " + levels[0] + " (" + d.name + "). Ta séquence stagne. Monte d'un niveau." };
  }
  return { stagnant: false };
}

/* ==============================
   CALIBRAGE DILTS ACTIF — séquence de montée
   Stratégie : 2 posts par niveau, puis on monte.
   Séquence idéale : 1,1 → 2,2 → 3,3 → 4,4 → 5,5 → cycle
   Le candidat construit sa crédibilité du concret vers l'identité.
   ============================== */

export var DILTS_CALIBRATION = {
  // Pour chaque niveau cible : quel type de brique et quel cadrage
  1: { brickPriority: ["chiffre"], framingOpen: "", framingClose: "Les chiffres ne mentent pas. Ceux-là sont les miens." },
  2: { brickPriority: ["chiffre", "influence"], framingOpen: "", framingClose: "Ce que j'ai fait parle. Le reste est du bruit." },
  3: { brickPriority: ["decision", "influence"], framingOpen: "Ma méthode est reproductible. ", framingClose: "Le cadre compte autant que le talent. C'est lui qui tient sous pression." },
  4: { brickPriority: ["cicatrice", "decision"], framingOpen: "", framingClose: "Le consensus dit le contraire. Mon expérience dit ça." },
  5: { brickPriority: ["cicatrice", "decision"], framingOpen: "", framingClose: "Ce n'est pas ce que je fais. C'est ce qui me définit." },
};

export function computeDiltsTarget(diltsHistory) {
  if (!diltsHistory || diltsHistory.length === 0) {
    return { targetLevel: 2, reason: "Premier post. On ancre sur du concret — ce que tu fais.", postsAtCurrent: 0, sequencePosition: 0, completed: 0 };
  }

  // Count posts per level
  var countPerLevel = {};
  diltsHistory.forEach(function(entry) {
    var lvl = entry.level || 2;
    countPerLevel[lvl] = (countPerLevel[lvl] || 0) + 1;
  });

  // Find the lowest level (2-5) that has < 2 posts — that's the target
  var target = 5;
  [2, 3, 4, 5].forEach(function(lvl) {
    if ((countPerLevel[lvl] || 0) < 2 && lvl < target) {
      target = lvl;
    }
  });

  // If all levels have 2+ posts, stay at 5 (identity)
  var postsAtCurrent = countPerLevel[target] || 0;

  // Count completed levels for display
  var highestCompleted = 0;
  [2, 3, 4, 5].forEach(function(lvl) {
    if ((countPerLevel[lvl] || 0) >= 2) highestCompleted = lvl;
  });

  var reasons = {
    2: "On montre l'action. Ce que tu as fait, pas ce que tu sais.",
    3: "On expose la méthode. Comment tu opères. Ton cadre est reproductible.",
    4: "On affirme la conviction. Ton parti pris contredit le consensus.",
    5: "On pose l'identité. Ce qui te définit au-delà du poste.",
  };

  return {
    targetLevel: target,
    reason: reasons[target] || "",
    postsAtCurrent: postsAtCurrent,
    sequencePosition: diltsHistory.length,
    completed: highestCompleted,
  };
}

/* Bias brick selection toward target Dilts level */
export function selectBrickForDiltsTarget(bricks, targetLevel, usedBrickIds) {
  var available = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take" && usedBrickIds.indexOf(b.id) === -1; });
  if (available.length === 0) available = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (available.length === 0) return null;

  var calibration = DILTS_CALIBRATION[targetLevel] || DILTS_CALIBRATION[2];
  var priorities = calibration.brickPriority;

  // Score each brick by how well it matches the target level's preferred types
  var scored = available.map(function(b) {
    var cat = b.brickType === "cicatrice" ? "cicatrice" : (b.brickCategory || "chiffre");
    var priorityScore = priorities.indexOf(cat);
    if (priorityScore === -1) priorityScore = 10;
    // Also check if the brick text naturally hits the target Dilts level
    var dilts = detectDiltsLevel(b.text);
    var diltsBonus = dilts.scores[targetLevel] || 0;
    return { brick: b, priorityScore: priorityScore, diltsBonus: diltsBonus };
  });

  // Sort: best priority first, then by Dilts bonus
  scored.sort(function(a, b) {
    if (a.priorityScore !== b.priorityScore) return a.priorityScore - b.priorityScore;
    return b.diltsBonus - a.diltsBonus;
  });

  return scored[0].brick;
}

/* ==============================
   DILTS THERMOSTAT GLOBAL
   Le niveau Dilts atteint = plafond pour tous les outputs.
   Posts fixent le plafond. DM/commentaires/relances operent en dessous.
   ============================== */

export var DILTS_EDITORIAL_MAPPING = {
  2: { registre: "Ce que j'ai fait", sujets: "projet mene, resultat obtenu, situation geree", brickTypes: ["chiffre", "cicatrice"], prospectPerception: "Le prospect enregistre un praticien." },
  3: { registre: "Comment je le fais", sujets: "methode appliquee, framework utilise, processus construit", brickTypes: ["chiffre", "decision"], prospectPerception: "Le prospect apprend de toi. Tu te distingues." },
  4: { registre: "Ce que je crois et pourquoi", sujets: "conviction nee de l'experience, desaccord avec le consensus", brickTypes: ["cicatrice", "decision"], prospectPerception: "Le prospect a une raison de se souvenir de toi. Tu occupes un territoire." },
  5: { registre: "Qui je suis dans cet ecosysteme", sujets: "role dans la conversation sectorielle, definition du metier", brickTypes: ["cicatrice", "decision"], prospectPerception: "Le prospect associe un probleme a ton nom. Tu es le raccourci mental." },
};

export function getDiltsPlafond(diltsHistory) {
  if (!diltsHistory || diltsHistory.length === 0) return 2;
  var maxLevel = 2;
  var countPerLevel = {};
  diltsHistory.forEach(function(entry) {
    var lvl = entry.level || 2;
    countPerLevel[lvl] = (countPerLevel[lvl] || 0) + 1;
  });
  [2, 3, 4, 5].forEach(function(lvl) {
    if ((countPerLevel[lvl] || 0) >= 2) maxLevel = lvl;
  });
  return maxLevel;
}

export function getDiltsCeilingForOutput(outputType, diltsHistory, monthsInactive) {
  var plafond = getDiltsPlafond(diltsHistory);
  var inactive = monthsInactive || 0;
  if (outputType === "post") return plafond;
  if (outputType === "dm_froid") return Math.max(2, plafond - 1);
  if (outputType === "commentaire") return plafond;
  if (outputType === "relance_dormant") return Math.max(2, plafond - inactive);
  if (outputType === "dm_chaud") return plafond;
  return plafond;
}

export function getDiltsThermometerState(diltsHistory) {
  var plafond = getDiltsPlafond(diltsHistory);
  var lastPost = null;
  var weeksInactive = 0;
  if (diltsHistory && diltsHistory.length > 0) {
    lastPost = diltsHistory[diltsHistory.length - 1];
    if (lastPost.date) {
      var diff = Date.now() - new Date(lastPost.date).getTime();
      weeksInactive = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
    }
  }
  // Decay: 1 semaine sans signal = alerte. 2+ semaines = decay réel.
  // 94.8% des utilisateurs LinkedIn ne publient pas. 1 post/semaine = top 5%.
  // Seuil plancher : 1 signal/semaine (post OU commentaire calibré).
  // Au-delà de 5/semaine : inutile pour un cadre senior, risque de bruit.
  var decay = weeksInactive >= 2 ? Math.floor((weeksInactive - 1) / 2) : 0;
  var isAlert = weeksInactive >= 1;
  var effectiveLevel = Math.max(2, plafond - decay);
  var mapping = DILTS_EDITORIAL_MAPPING[effectiveLevel] || DILTS_EDITORIAL_MAPPING[2];
  var plafondMapping = DILTS_EDITORIAL_MAPPING[plafond] || DILTS_EDITORIAL_MAPPING[2];
  return {
    plafond: plafond,
    effectiveLevel: effectiveLevel,
    weeksInactive: weeksInactive,
    decay: decay,
    isAlert: isAlert,
    registre: mapping.registre,
    prospectPerception: mapping.prospectPerception,
    plafondRegistre: plafondMapping.registre,
    lastPostDate: lastPost ? lastPost.date : null,
  };
}
