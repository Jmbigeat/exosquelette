import { KPI_REFERENCE, SIGNAL_TYPES, COMMENT_TOPICS, COMMENT_AVOID_PATTERNS, VISION_2026_FORMATS } from "./references.js";
import { cleanRedac } from "./redac.js";
import { getActiveCauchemars } from "./scoring.js";
import { DILTS_CALIBRATION, DILTS_EDITORIAL_MAPPING, detectDiltsLevel, computeDiltsTarget, selectBrickForDiltsTarget, getDiltsPlafond, getDiltsCeilingForOutput } from "./dilts.js";

function formatCost(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return Math.round(n / 1000) + "K";
  return n + "";
}

export function generateLinkedInPosts(bricks, vault, targetRoleId) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length < 2) return [];

  var pillars = vault && vault.selectedPillars ? vault.selectedPillars : [];
  if (pillars.length === 0) return [];

  // DILTS CALIBRATION — compute target from history
  var diltsHistory = vault && vault.diltsHistory ? vault.diltsHistory : [];
  var diltsTarget = computeDiltsTarget(diltsHistory);
  var targetLevel = diltsTarget.targetLevel;
  var calibration = DILTS_CALIBRATION[targetLevel] || DILTS_CALIBRATION[2];

  var usedBrickIds = [];
  var posts = [];

  // Sort pillars: for high Dilts targets (4-5), prefer takes (conviction/identity)
  // For low Dilts targets (1-2), prefer non-takes (fact-based)
  var sortedPillars = pillars.slice().sort(function(a, b) {
    if (targetLevel >= 4) {
      return (a.source === "take" ? 0 : 1) - (b.source === "take" ? 0 : 1);
    } else {
      return (a.source === "take" ? 1 : 0) - (b.source === "take" ? 1 : 0);
    }
  });

  sortedPillars.slice(0, 2).forEach(function(pillar) {
    // BRICK SELECTION — biased toward target Dilts level
    var brick = selectBrickForDiltsTarget(validated, targetLevel, usedBrickIds);
    if (!brick) return;
    usedBrickIds.push(brick.id);

    // LINE 1 — Cauchemar
    var cauchemar = "";
    getActiveCauchemars().forEach(function(c) {
      if (cauchemar) return;
      if (c.kpis.some(function(kpi) { return brick.kpi && brick.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1; })) {
        cauchemar = c.nightmareShort;
      }
    });
    if (!cauchemar) cauchemar = "Le problème existe. Personne ne le formule.";

    // LINES 2-5 — These from pillar
    var these = "";
    if (pillar.source === "take" && pillar.desc) {
      these = pillar.desc;
    } else {
      these = pillar.title + ". " + (pillar.desc || "C'est une réalité que l'expérience révèle, pas les articles de blog.");
    }
    if (these.length > 250) these = these.slice(0, 250) + "...";

    // LINES 6-8 — Situation (brick without numbers)
    var situation = brick.text;
    situation = situation.replace(/[\+\-]?\d+[\.,]?\d*\s*[%KM€]*/g, "").replace(/\d+[\.,]?\d*\s*(mois|semaines|jours|ans|comptes|commerciaux|personnes|équipes|EUR|euros|millions?)/gi, "$1").replace(/\(\s*\)/g, "").replace(/\s{2,}/g, " ").trim();
    if (situation.length > 200) situation = situation.slice(0, 200) + "...";

    // Framing by brick type + DILTS CALIBRATION
    if (calibration.framingOpen) {
      situation = calibration.framingOpen + situation;
    } else if (brick.brickType === "cicatrice") {
      situation = "J'ai appris ça à mes dépens. " + situation;
    } else if (brick.brickCategory === "decision") {
      situation = "J'ai du trancher dans ce contexte. " + situation;
    } else if (brick.brickCategory === "influence") {
      situation = "Le plus dur n'etait pas la méthode. " + situation;
    }

    // LINE 9 — Closing calibré par niveau Dilts
    var closing = calibration.framingClose;
    // Ajoute une question ouverte adaptée au niveau
    var question = "";
    if (targetLevel <= 2) {
      question = pillar.title && pillar.title.length < 60
        ? "Quel résultat concret avez-vous obtenu sur " + pillar.title.toLowerCase().replace(/\.$/, "") + " ?"
        : "Quel chiffre de votre parcours personne ne connaît ?";
    } else if (targetLevel === 3) {
      question = pillar.title && pillar.title.length < 60
        ? "Quelle méthode utilisez-vous sur " + pillar.title.toLowerCase().replace(/\.$/, "") + " ?"
        : "Quel process avez-vous construit que personne ne vous a appris ?";
    } else if (targetLevel === 4) {
      question = "Et vous, quel est le consensus de votre secteur que votre expérience contredit ?";
    } else {
      question = "Quelle conviction professionnelle vous définit, même quand elle dérange ?";
    }

    var post = cleanRedac(cauchemar + "\n\n" + these + "\n\n" + situation + "\n\n" + closing + "\n\n" + question);

    var dilts = detectDiltsLevel(post);
    var hook = scoreHook(post);
    var body = analyzeBodyRetention(post);
    var expert = expertWritingAudit(post);

    var postObj = {
      pillar: pillar.title,
      pillarSource: pillar.source,
      brickUsed: brick.text.length > 60 ? brick.text.slice(0, 60) + "..." : brick.text,
      brickType: brick.brickType === "cicatrice" ? "cicatrice" : brick.brickCategory,
      text: post,
      charCount: post.length,
      diltsLevel: dilts.dominant,
      diltsBreakdown: dilts.breakdown,
      hookScore: hook.score,
      hookTests: hook.tests,
      bodyRetention: body,
      expertCritique: expert,
    };

    postObj.firstComment = generateFirstComment(postObj, bricks, vault);

    // Global score /10 = average of hook + expert checks
    var expertPassed = expert.miroir.filter(function(m) { return m.passed; }).length + expert.luisEnrique.filter(function(l) { return l.passed; }).length;
    var expertTotal = expert.miroir.length + expert.luisEnrique.length;
    var globalScore = Math.round(((hook.score / 10) + (expertPassed / expertTotal)) / 2 * 10);
    postObj.globalScore = globalScore;
    postObj.diltsTarget = targetLevel;

    posts.push(postObj);
  });

  // Attach calibration info to the array for UI access
  posts.diltsTarget = diltsTarget;
  return posts;
}

/* ==============================
   ITEM 5 — 4 FILTRES POSTS LINKEDIN
   ============================== */

export function scoreHook(text) {
  if (!text || text.length < 20) return { score: 0, tests: [] };
  var lines = text.split("\n").filter(function(l) { return l.trim().length > 5; });
  var hook = lines[0] || "";
  var lower = hook.toLowerCase();

  // A. So What — pourquoi le lecteur s'arrête
  var soWhat = lower.indexOf("?") !== -1 || lower.indexOf("personne") !== -1 || lower.indexOf("jamais") !== -1 || lower.indexOf("problème") !== -1 || lower.indexOf("coûte") !== -1 || lower.indexOf("coute") !== -1 || lower.indexOf("erreur") !== -1;

  // B. Ennemi — antagoniste identifié
  var ennemi = lower.indexOf("pas") !== -1 || lower.indexOf("jamais") !== -1 || lower.indexOf("personne ne") !== -1 || lower.indexOf("erreur") !== -1 || lower.indexOf("mythe") !== -1 || lower.indexOf("mensonge") !== -1 || lower.indexOf("faux") !== -1 || lower.indexOf("à tort") !== -1;

  // C. Consensus — dit le contraire de ce que tout le monde pense
  var consensus = lower.indexOf("contrairement") !== -1 || lower.indexOf("tout le monde") !== -1 || lower.indexOf("consensus") !== -1 || lower.indexOf("on pense que") !== -1 || lower.indexOf("idée reçue") !== -1 || lower.indexOf("idee recue") !== -1 || lower.indexOf("à rebours") !== -1;

  // D. Aliénation — prise de position risquée
  var alienation = lower.indexOf("refuse") !== -1 || lower.indexOf("déteste") !== -1 || lower.indexOf("n'en peux plus") !== -1 || lower.indexOf("stop") !== -1 || lower.indexOf("marre") !== -1 || lower.indexOf("insupportable") !== -1 || ennemi;

  // E. Authenticité — vécu ou template
  var authenticite = lower.indexOf("j'ai") !== -1 || lower.indexOf("j'étais") !== -1 || lower.indexOf("mon") !== -1 || lower.indexOf("ma ") !== -1 || lower.indexOf("quand j") !== -1 || lower.indexOf("ce jour") !== -1;

  // F. Mémorabilité — courte et percutante
  var memorabilite = hook.length < 80 && hook.length > 10;

  var tests = [
    { id: "soWhat", label: "So What", passed: soWhat },
    { id: "ennemi", label: "Ennemi", passed: ennemi },
    { id: "consensus", label: "Consensus", passed: consensus },
    { id: "alienation", label: "Aliénation", passed: alienation },
    { id: "authenticite", label: "Authenticité", passed: authenticite },
    { id: "memorabilite", label: "Mémorabilité", passed: memorabilite },
  ];

  var passed = tests.filter(function(t) { return t.passed; }).length;
  var score = Math.round((passed / 6) * 10);
  return { score: score, tests: tests, hook: hook, passedCount: passed };
}

/* FILTRE 3 — MARIE HOOK (corps) — rétention paragraphe par paragraphe */
export function analyzeBodyRetention(text) {
  if (!text || text.length < 40) return { issues: [], charCount: 0, hasBullets: false, tooLong: false };
  var paragraphs = text.split("\n\n").filter(function(p) { return p.trim().length > 5; });
  var issues = [];

  // Détection bullets
  var hasBullets = /^[\-\*•]\s/m.test(text) || /^\d+\.\s/m.test(text);
  if (hasBullets) issues.push("Listes à puces détectées. Prose brute uniquement.");

  // Longueur
  var tooLong = text.length > 1500;
  if (tooLong) issues.push("Post trop long (" + text.length + " caractères). Max recommandé : 1500.");

  // Ventre mou — paragraphes intermédiaires trop longs sans tension
  if (paragraphs.length >= 3) {
    var middle = paragraphs.slice(1, -1);
    middle.forEach(function(p, i) {
      if (p.length > 300) issues.push("Paragraphe " + (i + 2) + " trop long (" + p.length + " car.). Découpe ou resserre.");
      var hasHook = p.indexOf("?") !== -1 || p.indexOf("!") !== -1 || p.toLowerCase().indexOf("mais") !== -1 || p.toLowerCase().indexOf("pourtant") !== -1 || p.toLowerCase().indexOf("sauf que") !== -1;
      if (!hasHook && p.length > 100) issues.push("Paragraphe " + (i + 2) + " : pas de relance. Ajoute une tension pour tirer le lecteur au suivant.");
    });
  }

  return { issues: issues, charCount: text.length, hasBullets: hasBullets, tooLong: tooLong, paragraphCount: paragraphs.length };
}

export function expertWritingAudit(text) {
  if (!text || text.length < 40) return { miroir: [], luisEnrique: [] };
  var paragraphs = text.split("\n\n").filter(function(p) { return p.trim().length > 5; });
  var lower = text.toLowerCase();

  // Phase Miroir
  var miroir = [];

  // Force du hook
  var hookResult = scoreHook(text);
  var hookStrong = hookResult.score >= 7;
  miroir.push({ label: "Force du hook", passed: hookStrong, detail: hookStrong ? "Accroche solide (" + hookResult.score + "/10)" : "Accroche faible (" + hookResult.score + "/10). Reformule." });

  // Clarté de l'angle — 1 seul sujet
  var subjects = [];
  paragraphs.forEach(function(p) {
    var pl = p.toLowerCase();
    var detectedSubjects = 0;
    if (pl.indexOf("churn") !== -1 || pl.indexOf("retention") !== -1 || pl.indexOf("rétention") !== -1) detectedSubjects++;
    if (pl.indexOf("pipeline") !== -1 || pl.indexOf("prospection") !== -1) detectedSubjects++;
    if (pl.indexOf("management") !== -1 || pl.indexOf("equipe") !== -1 || pl.indexOf("équipe") !== -1) detectedSubjects++;
    if (pl.indexOf("produit") !== -1 || pl.indexOf("roadmap") !== -1) detectedSubjects++;
    if (pl.indexOf("negociation") !== -1 || pl.indexOf("négociation") !== -1 || pl.indexOf("deal") !== -1) detectedSubjects++;
    subjects.push(detectedSubjects);
  });
  var uniqueTopics = subjects.filter(function(s) { return s > 0; }).length;
  var singleTopic = uniqueTopics <= 2;
  miroir.push({ label: "Clarté de l'angle", passed: singleTopic, detail: singleTopic ? "Un sujet par post. OK." : "Trop de sujets mélangés. Recentre." });

  // Incarnation — vécu ou théorie
  var incarnation = lower.indexOf("j'ai") !== -1 || lower.indexOf("j'étais") !== -1 || lower.indexOf("mon ") !== -1 || lower.indexOf("ma ") !== -1 || lower.indexOf("mes ") !== -1;
  miroir.push({ label: "Incarnation", passed: incarnation, detail: incarnation ? "Vécu personnel détecté." : "Trop générique. Ajoute une expérience vécue." });

  // Structure — 1 idée par paragraphe
  var goodStructure = paragraphs.length >= 3 && paragraphs.every(function(p) { return p.length < 400; });
  miroir.push({ label: "Structure", passed: goodStructure, detail: goodStructure ? "Paragraphes bien découpés." : "Découpe en blocs plus courts. 1 idée = 1 paragraphe." });

  // Phase Luis Enrique
  var luisEnrique = [];

  // Utilité vs bruit
  var hasInsight = lower.indexOf("apprend") !== -1 || lower.indexOf("découvert") !== -1 || lower.indexOf("compris") !== -1 || lower.indexOf("résultat") !== -1 || lower.indexOf("concret") !== -1 || lower.indexOf("methode") !== -1 || lower.indexOf("méthode") !== -1;
  luisEnrique.push({ label: "Utilité vs bruit", passed: hasInsight, detail: hasInsight ? "Le lecteur apprend quelque chose." : "Le lecteur n'apprend rien de concret. Ajoute un enseignement." });

  // Clarté vs complaisance
  var filler = (lower.match(/en effet|en fait|il faut dire que|force est de constater|il est important de|fondamentalement|évidemment/g) || []).length;
  var nofiller = filler < 2;
  luisEnrique.push({ label: "Clarté vs complaisance", passed: nofiller, detail: nofiller ? "Phrases directes." : filler + " expressions creuses détectées. Coupe le gras." });

  // Lecteur vs ego
  var jeCount = (lower.match(/\bje\b|\bj'ai\b|\bj'étais\b|\bmon\b|\bma\b|\bmes\b/g) || []).length;
  var vousCount = (lower.match(/\bvous\b|\bvotre\b|\bvos\b|\btu\b|\bton\b|\bta\b|\btes\b/g) || []).length;
  var readerFocused = vousCount >= 1 || jeCount < 8;
  luisEnrique.push({ label: "Lecteur vs ego", passed: readerFocused, detail: readerFocused ? "Equilibre je/vous correct." : "Trop de 'je' (" + jeCount + "). Réoriente vers le lecteur." });

  return { miroir: miroir, luisEnrique: luisEnrique };
}

export function generateFirstComment(post, bricks, vault) {
  if (!post || !post.text) return "";
  var pillarTitle = post.pillar || "";
  var pillarLower = pillarTitle.toLowerCase();
  var brickType = post.brickType || "chiffre";
  var pillarSource = post.pillarSource || "ai";

  // 1. Ouverture — angle complémentaire croisé pilier × brickType
  var opener = "";
  if (brickType === "cicatrice") {
    opener = "Ce que je ne dis pas dans le post : cette erreur m'a forcé à changer de méthode.";
  } else if (brickType === "decision") {
    opener = "Un détail que je n'ai pas mis dans le post : le plus dur n'était pas les chiffres. C'était de convaincre les gens autour de la table.";
  } else if (brickType === "influence") {
    opener = "Ce que je ne dis pas dans le post : le blocage n'était pas technique. Il était humain.";
  } else {
    opener = "Un point que je n'ai pas développé : ce résultat est venu de la méthode. La méthode est reproductible.";
  }

  // 2. Pont vers le pilier — relie le commentaire au territoire
  var bridge = "";
  if (pillarSource === "take") {
    // Take = conviction personnelle → renforcer la position
    bridge = " C'est pour ça que je reviens souvent sur ce sujet.";
  } else if (pillarTitle.length > 5) {
    bridge = " Et ça rejoint une conviction que j'observe sur le terrain : " + pillarTitle.charAt(0).toLowerCase() + pillarTitle.slice(1).replace(/\.$/, "") + ".";
  }

  // 3. Question — calibrée sur le pilier, pas générique
  var question = "";

  // Questions par thématique de pilier détectée
  if (pillarLower.indexOf("churn") !== -1 || pillarLower.indexOf("r" + "é" + "tention") !== -1 || pillarLower.indexOf("retention") !== -1) {
    question = "Quel signal vous alerte avant qu'un client parte ?";
  } else if (pillarLower.indexOf("pipeline") !== -1 || pillarLower.indexOf("prospection") !== -1 || pillarLower.indexOf("vente") !== -1 || pillarLower.indexOf("commercial") !== -1) {
    question = "Quel deal perdu vous a le plus appris sur votre process de vente ?";
  } else if (pillarLower.indexOf("equipe") !== -1 || pillarLower.indexOf("équipe") !== -1 || pillarLower.indexOf("management") !== -1 || pillarLower.indexOf("talent") !== -1) {
    question = "Quel signe vous dit qu'un collaborateur va partir avant qu'il ne le dise ?";
  } else if (pillarLower.indexOf("produit") !== -1 || pillarLower.indexOf("roadmap") !== -1 || pillarLower.indexOf("feature") !== -1 || pillarLower.indexOf("backlog") !== -1) {
    question = "Quelle feature avez-vous tuée alors que tout le monde la voulait ?";
  } else if (pillarLower.indexOf("n" + "é" + "gociation") !== -1 || pillarLower.indexOf("negociation") !== -1 || pillarLower.indexOf("salaire") !== -1 || pillarLower.indexOf("deal") !== -1) {
    question = "Quelle négociation vous a appris que le premier chiffre posé décide de tout ?";
  } else if (pillarLower.indexOf("ia") !== -1 || pillarLower.indexOf("intelligence artificielle") !== -1 || pillarLower.indexOf("mod" + "è" + "le") !== -1 || pillarLower.indexOf("modele") !== -1) {
    question = "Quel projet IA vous a appris que le vrai obstacle n'est pas technique ?";
  } else if (pillarLower.indexOf("process") !== -1 || pillarLower.indexOf("ops") !== -1 || pillarLower.indexOf("workflow") !== -1 || pillarLower.indexOf("simplifier") !== -1) {
    question = "Quel process avez-vous supprimé et que personne n'a regretté ?";
  } else if (pillarLower.indexOf("dette") !== -1 || pillarLower.indexOf("code") !== -1 || pillarLower.indexOf("tech") !== -1 || pillarLower.indexOf("build") !== -1) {
    question = "Quelle décision technique avez-vous repoussée jusqu'à ce qu'elle coûte cher ?";
  } else if (pillarLower.indexOf("conseil") !== -1 || pillarLower.indexOf("consultant") !== -1 || pillarLower.indexOf("diagnostic") !== -1) {
    question = "Quelle recommandation difficile a changé la trajectoire d'un client ?";
  } else if (pillarLower.indexOf("strat" + "é" + "g") !== -1 || pillarLower.indexOf("strateg") !== -1 || pillarLower.indexOf("comex") !== -1 || pillarLower.indexOf("m&a") !== -1) {
    question = "Quelle analyse avez-vous produite que le Comex a ignorée, à tort ?";
  } else {
    // Fallback — question universelle mais ancrée sur le pilier
    if (pillarTitle.length > 10) {
      question = "Quelle expérience vous a convaincu que " + pillarTitle.charAt(0).toLowerCase() + pillarTitle.slice(1).replace(/\.$/, "") + " ?";
    } else {
      question = "Quel résultat concret a changé votre façon de voir ce sujet ?";
    }
  }

  return cleanRedac(opener + bridge + " " + question);
}

/* ==============================
   POSITION GENERATOR — long-form from pillars + bricks
   ============================== */

export function generatePositions(bricks, vault) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  var pillars = vault && vault.selectedPillars ? vault.selectedPillars : [];
  if (pillars.length === 0 || validated.length === 0) return [];

  // Sort: takes first
  var sorted = pillars.slice().sort(function(a, b) {
    return (a.source === "take" ? 0 : 1) - (b.source === "take" ? 0 : 1);
  });

  var usedBrickIds = [];
  var positions = [];

  sorted.slice(0, 2).forEach(function(pillar) {
    // Find best brick match
    var available = validated.filter(function(b) { return usedBrickIds.indexOf(b.id) === -1; });
    if (available.length === 0) available = validated;

    var catPriority = { decision: 4, influence: 3, cicatrice: 2, chiffre: 1 };
    available.sort(function(a, b) {
      var ca = catPriority[a.brickCategory] || catPriority[a.brickType] || 0;
      var cb = catPriority[b.brickCategory] || catPriority[b.brickType] || 0;
      return cb - ca;
    });
    var brick = available[0];
    usedBrickIds.push(brick.id);

    // Build the argument
    var title = pillar.title || "Position sans titre";
    var text = "";

    // Opening: the consensus (what everyone thinks)
    if (pillar.source === "take" && pillar.desc) {
      text = pillar.desc;
    } else {
      text = pillar.desc || title + ". C'est une réalité que l'expérience révèle.";
    }

    // Bridge to proof
    text += "\n\n";
    if (brick.brickType === "cicatrice") {
      text += "J'ai appris ça à mes dépens. " + brick.text + " L'échec m'a obligé à changer de méthode. Depuis, je mesure autrement.";
    } else if (brick.brickCategory === "decision") {
      text += "J'ai du trancher dans ce contexte. " + brick.text + " L'arbitrage n'etait pas evident. Mais c'est la que se construit la crédibilité.";
    } else if (brick.brickCategory === "influence") {
      text += "Le plus dur n'était pas la méthode. C'était l'alignement. " + brick.text + " Quand tout le monde tire dans la même direction, le résultat suit.";
    } else {
      text += "Les chiffres parlent. " + brick.text + " Ce n'est pas une opinion. C'est un fait mesuré.";
    }

    // Closing
    text += "\n\nLe vrai KPI n'est pas celui qu'on affiche. C'est celui qu'on decouvre quand on creuse sous la surface.";

    positions.push({ title: title, text: cleanRedac(text), pillarSource: pillar.source });
  });

  return positions;
}

export function detectSignalType(text) {
  var lower = text.toLowerCase();
  for (var i = 0; i < SIGNAL_TYPES.length; i++) {
    var match = SIGNAL_TYPES[i].keywords.some(function(k) { return lower.indexOf(k) !== -1; });
    if (match) return SIGNAL_TYPES[i];
  }
  return { type: "autre", label: "Signal détecté" };
}

export function generateSignalScript(signalText, signalType, bricks, targetRoleId) {
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });
  var bestBrick = elasticBricks.length > 0 ? elasticBricks[0] : (validated.length > 0 ? validated[0] : null);
  var cauchemar = getActiveCauchemars().length > 0 ? getActiveCauchemars()[0] : null;

  var opener = "";
  if (signalType.type === "levee_fonds") opener = "Vous venez de lever des fonds. Dans les 6 prochains mois, vous allez structurer une équipe qui n'existe pas encore.";
  else if (signalType.type === "recrutement") opener = "J'ai vu que vous recrutez. Ce type de poste signale un problème que je connais bien.";
  else if (signalType.type === "mouvement") opener = "J'ai note un changement dans votre équipe de direction. Les 90 premiers jours vont definir la trajectoire.";
  else if (signalType.type === "expansion") opener = "Vous ouvrez un nouveau terrain. Les erreurs des 6 premiers mois coutent cher.";
  else if (signalType.type === "reorganisation") opener = "Une reorganisation cree toujours un besoin que l'organigramme ne montre pas encore.";
  else opener = "J'ai identifié un signal dans votre actualité récente.";

  var proof = bestBrick ? "J'ai résolu un problème similaire : " + (bestBrick.text.length > 80 ? bestBrick.text.slice(0, 80) + "..." : bestBrick.text) : "";
  var cost = cauchemar ? "Ce type de problème coute entre " + formatCost(cauchemar.costRange[0]) + " et " + formatCost(cauchemar.costRange[1]) + " par an." : "";
  var close = "3 minutes cette semaine pour en parler ?";

  return cleanRedac(opener + "\n\n" + proof + (cost ? "\n\n" + cost : "") + "\n\n" + close, "livrable");
}

/* ==============================
   LINKEDIN COMMENT GENERATOR — crosses post content with Coffre-Fort
   ============================== */

export function detectPostTopic(text) {
  var lower = text.toLowerCase();
  var bestTopic = null;
  var bestCount = 0;
  COMMENT_TOPICS.forEach(function(t) {
    var count = 0;
    t.keywords.forEach(function(k) { if (lower.indexOf(k) !== -1) count++; });
    if (count > bestCount) { bestCount = count; bestTopic = t; }
  });
  return bestTopic || { topic: "general" };
}

/* ==============================
   FILTRE COMMENTAIRE UTILISATEUR — 3 filtres + territoire + technique
   Calibré dynamiquement sur le Coffre-Fort, le rôle cible, les piliers.
   ============================== */

/* POSTS À ÉVITER — patterns toxiques pour la crédibilité */
export function detectAvoidPatterns(text) {
  var lower = text.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
  var detected = [];
  COMMENT_AVOID_PATTERNS.forEach(function(p) {
    var hits = 0;
    p.markers.forEach(function(m) {
      var mNorm = m.replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
      if (lower.indexOf(mNorm) !== -1) hits++;
    });
    if (hits >= 1) detected.push(p);
  });
  return detected;
}

export function computeUserTerritory(bricks, vault, targetRoleId) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  var takes = bricks.filter(function(b) { return b.brickType === "take" && b.status === "validated"; });
  var pillars = vault && vault.selectedPillars ? vault.selectedPillars : [];
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;

  // Territory keywords: from KPIs (élastiques first), pillars, and brick text
  var territoryKw = [];
  if (roleData) {
    roleData.kpis.forEach(function(kpi) {
      if (kpi.elasticity === "élastique") {
        kpi.name.toLowerCase().split(/[\s\/\(\)]+/).forEach(function(w) { if (w.length > 3 && territoryKw.indexOf(w) === -1) territoryKw.push(w); });
      }
    });
  }
  pillars.forEach(function(p) {
    // Inject title keywords
    (p.title || "").toLowerCase().split(/\s+/).forEach(function(w) { if (w.length > 4 && territoryKw.indexOf(w) === -1) territoryKw.push(w); });
    // Inject desc keywords — le territoire inclut le développement du pilier, pas seulement le titre
    (p.desc || "").toLowerCase().split(/\s+/).forEach(function(w) {
      var clean = w.replace(/[.,;:!?()]/g, "");
      if (clean.length > 4 && territoryKw.indexOf(clean) === -1) territoryKw.push(clean);
    });
  });

  // Territory sectors from role
  var sectors = roleData ? [roleData.sector] : [];

  // Territory KPI names for matching
  var kpiNames = [];
  if (roleData) {
    roleData.kpis.forEach(function(kpi) { kpiNames.push(kpi.name.toLowerCase()); });
  }

  return {
    keywords: territoryKw,
    sectors: sectors,
    kpiNames: kpiNames,
    pillarCount: pillars.length,
    takeCount: takes.length,
    brickCount: validated.length,
    elasticKpis: roleData ? roleData.kpis.filter(function(k) { return k.elasticity === "élastique"; }).map(function(k) { return k.name; }) : [],
  };
}

/* DÉTECTION DU TROU — ce que le post dit sans le prouver */
export function detectPostGap(text) {
  var lower = text.toLowerCase();
  var gaps = [];

  // Gap 1: claim without number
  var hasClaim = ["il faut", "on doit", "la cle c'est", "le secret", "l'essentiel", "le plus important", "ce qui compte"].some(function(m) { return lower.indexOf(m) !== -1; });
  var hasNumber = /\d+%|\d+x|\d+k|\d+€|\d+ mois|\d+ jours/.test(lower);
  if (hasClaim && !hasNumber) gaps.push({ type: "quoi_sans_combien", label: "Le quoi sans le combien", desc: "L'auteur affirme sans chiffrer. Ton chiffre sera le seul du fil." });

  // Gap 2: method without situation
  var hasMethod = ["methode", "process", "etapes", "framework", "strategie", "approche", "technique"].some(function(m) { return lower.indexOf(m) !== -1; });
  var hasSituation = ["chez", "quand j'ai", "dans mon", "en 20", "face a", "contexte", "equipe de", "pendant"].some(function(m) { return lower.indexOf(m) !== -1; });
  if (hasMethod && !hasSituation) gaps.push({ type: "comment_sans_ou", label: "Le comment sans le où", desc: "Méthode abstraite. Ton vécu ancre la théorie dans le réel." });

  // Gap 3: opinion without experience
  var hasOpinion = ["je pense que", "je crois que", "a mon avis", "selon moi", "conviction", "mon parti pris", "contrairement"].some(function(m) { return lower.indexOf(m) !== -1; });
  var hasExperience = ["j'ai vecu", "j'ai gere", "j'ai lance", "j'ai perdu", "j'ai construit", "dans mon experience", "quand j'ai du"].some(function(m) { return lower.indexOf(m) !== -1; });
  if (hasOpinion && !hasExperience) gaps.push({ type: "avis_sans_preuve", label: "L'avis sans la preuve", desc: "Opinion nue. Ton expérience vécue apporte ce que l'opinion seule ne donne pas." });

  // Gap 4: problem without solution
  var hasProblem = ["probleme", "difficulte", "challenge", "obstacle", "bloque", "galere", "crise", "echec"].some(function(m) { return lower.indexOf(m) !== -1; });
  var hasSolution = ["solution", "resolu", "regle", "mis en place", "lance", "deploye", "construit", "resultat"].some(function(m) { return lower.indexOf(m) !== -1; });
  if (hasProblem && !hasSolution) gaps.push({ type: "probleme_sans_solution", label: "Le problème sans la sortie", desc: "Constat sans issue. Ta brique montre comment tu as résolu un problème similaire." });

  if (gaps.length === 0) gaps.push({ type: "general", label: "Pas de trou flagrant", desc: "Le post est complet. Apporte un angle que l'auteur n'a pas couvert." });

  return gaps;
}

/* 3 FILTRES — chaque filtre retourne pass/fail + raison */
export function runCommentFilters(postText, bricks, vault, targetRoleId) {
  var territory = computeUserTerritory(bricks, vault, targetRoleId);
  var topic = detectPostTopic(postText);
  var avoidPatterns = detectAvoidPatterns(postText);
  var gaps = detectPostGap(postText);
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  var postLower = postText.toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");

  // FILTRE 1 — Le post est-il dans ton territoire ?
  // Vérifie si le sujet du post croise les KPIs, piliers, ou mots-clés du rôle cible
  var territoryHits = 0;
  territory.keywords.forEach(function(kw) { if (postLower.indexOf(kw) !== -1) territoryHits++; });
  // Also check topic match against role KPIs
  var topicInKpi = false;
  if (topic.topic !== "general") {
    territory.kpiNames.forEach(function(kn) {
      if (kn.indexOf(topic.topic.slice(0, 4)) !== -1) topicInKpi = true;
    });
  }
  var filter1Pass = territoryHits >= 2 || topicInKpi || topic.topic !== "general";
  var filter1Reason = filter1Pass
    ? territoryHits + " mot" + (territoryHits > 1 ? "s" : "") + " de ton territoire détecté" + (territoryHits > 1 ? "s" : "") + ". Sujet : " + topic.topic + "."
    : "Ce post est hors de ton territoire. Ton commentaire n'aura pas l'ancrage de tes preuves.";

  // FILTRE 2 — As-tu une brique pertinente à injecter ?
  // Cherche une brique qui matche le sujet du post
  var bestBrick = null;
  var bestRelevance = 0;
  validated.forEach(function(b) {
    var bLower = (b.text + " " + (b.kpi || "")).toLowerCase();
    var relevance = 0;
    if (topic.topic !== "general") {
      var topicEntry = COMMENT_TOPICS.find(function(t) { return t.topic === topic.topic; });
      if (topicEntry) {
        topicEntry.keywords.forEach(function(k) { if (bLower.indexOf(k) !== -1) relevance += 2; });
      }
    }
    var postWords = postLower.split(/\s+/).filter(function(w) { return w.length > 4; });
    postWords.forEach(function(w) { if (bLower.indexOf(w) !== -1) relevance++; });
    if (b.brickCategory === "decision" || b.brickCategory === "influence") relevance += 2;
    if (b.brickType === "cicatrice") relevance += 3;
    if (relevance > bestRelevance) { bestRelevance = relevance; bestBrick = b; }
  });
  var filter2Pass = bestBrick !== null && bestRelevance >= 2;
  var filter2Reason = filter2Pass
    ? "Brique trouvée (" + (bestBrick.brickType === "cicatrice" ? "cicatrice" : bestBrick.brickCategory) + ") — pertinence " + bestRelevance + "/10."
    : "Aucune brique assez pertinente. Ton commentaire sera creux. Passe.";

  // FILTRE 3 — Le post a-t-il un trou que tu remplis ?
  // ET : le post n'est pas un pattern toxique
  var filter3Pass = avoidPatterns.length === 0 && gaps[0].type !== "general";
  var filter3Reason = "";
  if (avoidPatterns.length > 0) {
    filter3Reason = "PASSE. " + avoidPatterns[0].label + ".";
  } else if (gaps[0].type === "general") {
    filter3Reason = "Pas de trou détecté. Ton commentaire risque de répéter l'auteur.";
  } else {
    filter3Reason = "Trou détecté : " + gaps[0].label + ". " + gaps[0].desc;
  }

  var allPass = filter1Pass && filter2Pass && filter3Pass;
  var verdict = allPass ? "COMMENTE" : "PASSE";
  var verdictColor = allPass ? "#4ecca3" : "#e94560";

  return {
    verdict: verdict,
    verdictColor: verdictColor,
    filters: [
      { id: "territoire", label: "Dans ton territoire ?", passed: filter1Pass, reason: filter1Reason },
      { id: "brique", label: "Brique pertinente ?", passed: filter2Pass, reason: filter2Reason },
      { id: "trou", label: "Trou à combler ?", passed: filter3Pass, reason: filter3Reason },
    ],
    topic: topic,
    gaps: gaps,
    avoidPatterns: avoidPatterns,
    bestBrick: bestBrick,
    bestRelevance: bestRelevance,
    territory: territory,
  };
}

/* AUDIT QUALITÉ COMMENTAIRE — 3 tests sur le commentaire généré */
export function auditComment(commentText, bricks, vault) {
  if (!commentText) return { score: 0, tests: [], verdict: "REJETTE" };
  var lower = commentText.toLowerCase();
  var tests = [];

  // TEST 1 — Preuve : chiffre ou KPI d'une brique dans le commentaire
  var hasNumber = /\d+[%KM€]|\d+\s*(mois|jours|semaines|ans|points?)/.test(commentText);
  var hasKpiRef = false;
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  validated.forEach(function(b) {
    if (hasKpiRef) return;
    var kpiWords = (b.kpi || "").toLowerCase().split(/\s+/).filter(function(w) { return w.length > 4; });
    kpiWords.forEach(function(kw) { if (lower.indexOf(kw) !== -1) hasKpiRef = true; });
  });
  var preuvePass = hasNumber || hasKpiRef;
  tests.push({ name: "Preuve", pass: preuvePass, detail: preuvePass ? "Chiffre ou KPI détecté." : "Aucune preuve. Opinion nue." });

  // TEST 2 — Pilier : un mot-clé d'un pilier sélectionné matche
  var pillars = vault && vault.selectedPillars ? vault.selectedPillars : [];
  var pillarHit = false;
  var pillarMatched = "";
  pillars.forEach(function(p) {
    if (pillarHit) return;
    var words = ((p.title || "") + " " + (p.desc || "")).toLowerCase().split(/\s+/).filter(function(w) { return w.length > 4; });
    words.forEach(function(w) {
      var clean = w.replace(/[.,;:!?()]/g, "");
      if (clean.length > 4 && lower.indexOf(clean) !== -1) { pillarHit = true; pillarMatched = p.title; }
    });
  });
  tests.push({ name: "Pilier", pass: pillarHit, detail: pillarHit ? "Ancré sur : " + pillarMatched : "Hors territoire. Risque de dilution." });

  // TEST 3 — Relance : question ou tension ouverte dans les 100 derniers caractères
  var tail = commentText.slice(-100);
  var hasQuestion = tail.indexOf("?") !== -1;
  var hasTension = /le vrai sujet|ce qui manque|la question que personne|curieux de|ce qui change/.test(tail.toLowerCase());
  var relancePass = hasQuestion || hasTension;
  tests.push({ name: "Relance", pass: relancePass, detail: relancePass ? "Question ou tension ouverte détectée." : "Commentaire fermé. Aucune relance." });

  var passed = tests.filter(function(t) { return t.pass; }).length;
  var verdict = passed >= 2 ? "PUBLIE" : passed === 1 ? "FAIBLE" : "REJETTE";
  var verdictColor = passed >= 2 ? "#4ecca3" : passed === 1 ? "#ff9800" : "#e94560";

  return { score: passed, total: 3, tests: tests, verdict: verdict, verdictColor: verdictColor };
}

export function generateLinkedInComment(postText, bricks, vault, targetRoleId) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return { comment: "Coffre-Fort vide. Valide des briques d'abord.", topic: "general", filterResult: null };

  // RUN 3 FILTERS
  var filterResult = runCommentFilters(postText, bricks, vault, targetRoleId);

  // If filters say PASSE, return early with filter diagnostic only
  if (filterResult.verdict === "PASSE") {
    // LIKE RECOMMENDATION — PASSE
    var hasAvoidPattern = filterResult.avoidPatterns && filterResult.avoidPatterns.length > 0;
    var likeAdvice = hasAvoidPattern
      ? { action: "NE LIKE PAS", reason: "Contenu toxique ou concurrent. Le like valide une thèse que tu combats.", color: "#e94560" }
      : { action: "LIKE POSSIBLE", reason: "Post hors de ton territoire mais correct. Le like maintient ta présence sans engager ton positionnement.", color: "#ff9800" };

    return {
      comment: null,
      topic: filterResult.topic.topic,
      filterResult: filterResult,
      likeAdvice: likeAdvice,
      brickUsed: null,
      pillarUsed: null,
      brickSource: null,
      gap: filterResult.gaps[0],
    };
  }

  var bestBrick = filterResult.bestBrick;
  if (!bestBrick) bestBrick = validated[0];
  var gap = filterResult.gaps[0];

  // Extract SITUATION from brick (strip numbers, keep context)
  var situation = bestBrick.text;
  situation = situation.replace(/[\+\-]?\d+[\.,]?\d*\s*[%KM€]*/g, "").replace(/\d+[\.,]?\d*\s*(mois|semaines|jours|ans|comptes|commerciaux|personnes|équipes)/g, "$1").replace(/\(\s*\)/g, "").replace(/\s{2,}/g, " ").trim();
  if (situation.length > 120) situation = situation.slice(0, 120) + "...";

  // Find relevant pillar from vault
  var pillarAngle = null;
  if (vault && vault.selectedPillars && vault.selectedPillars.length > 0) {
    var takePillar = vault.selectedPillars.find(function(p) { return p.source === "take"; });
    pillarAngle = takePillar || vault.selectedPillars[0];
  }

  // TECHNIQUE DE COMMENTAIRE — 3 temps calibrés sur le trou détecté
  // 1. Identifier le trou (déjà fait)
  // 2. Injecter une preuve du Coffre-Fort
  // 3. Fermer par une question qui montre l'expertise

  // TEMPS 1 — Acknowledgement calibré sur le trou
  var acknowledge = "";
  if (gap.type === "quoi_sans_combien") {
    acknowledge = "L'intention est la.";
  } else if (gap.type === "comment_sans_ou") {
    acknowledge = "Le cadre tient.";
  } else if (gap.type === "avis_sans_preuve") {
    acknowledge = "Prise de position nette.";
  } else if (gap.type === "probleme_sans_solution") {
    acknowledge = "Le constat est juste.";
  } else {
    acknowledge = "Point cle.";
  }

  // TEMPS 2 — Injection de preuve (situation sans chiffre)
  var proofText = "";
  if (bestBrick.brickType === "cicatrice") {
    proofText = "J'ai vecu l'inverse. " + situation + " L'échec m'a force a changer de méthode.";
  } else if (bestBrick.brickCategory === "decision") {
    proofText = "J'ai du trancher dans un contexte similaire. " + situation;
  } else if (bestBrick.brickCategory === "influence") {
    proofText = "Le plus dur n'était pas la méthode. C'était d'aligner les gens. " + situation;
  } else {
    proofText = "J'ai restructuré un processus dans le même contexte. " + situation;
  }

  // Inject pillar angle if available
  if (pillarAngle && gap.type === "avis_sans_preuve") {
    proofText = pillarAngle.title + ". " + proofText;
  }

  // TEMPS 3 — Question de fermeture (montre l'expertise, ne vend pas)
  var closing = "";
  if (gap.type === "quoi_sans_combien") {
    closing = "Sur quel indicateur tu mesures le delta avant/apres ?";
  } else if (gap.type === "comment_sans_ou") {
    closing = "Dans quel contexte tu as vu cette méthode tenir sous pression ?";
  } else if (gap.type === "avis_sans_preuve") {
    closing = "Curieux de savoir quelle situation t'a amené a cette conviction.";
  } else if (gap.type === "probleme_sans_solution") {
    closing = "Quelle a été la premiere action concrète pour en sortir ?";
  } else {
    closing = "Curieux de savoir comment ca se passe chez vous.";
  }

  var comment = acknowledge + " " + proofText + " " + closing;
  var cleanComment = cleanRedac(comment);

  // AUDIT QUALITÉ — 3 tests sur le commentaire généré
  var commentAudit = auditComment(cleanComment, bricks, vault);

  return {
    comment: cleanComment,
    topic: filterResult.topic.topic,
    filterResult: filterResult,
    commentAudit: commentAudit,
    likeAdvice: { action: "LIKE", reason: "Tu commentes. Le like amplifie le signal.", color: "#4ecca3" },
    brickUsed: bestBrick.text.length > 60 ? bestBrick.text.slice(0, 60) + "..." : bestBrick.text,
    pillarUsed: pillarAngle ? pillarAngle.title : null,
    brickSource: bestBrick.brickType === "cicatrice" ? "cicatrice" : bestBrick.brickCategory,
    gap: gap,
  };
}

/* ==============================
   CHAINE DE GENERATION DES POSTS
   Coffre-Fort → Dilts → Piliers/Takes → brouillon → Meroé → Marie Hook → Luis Enrique → Vision 2026
   ============================== */

export function mapDiltsToFormat(diltsLevel) {
  if (diltsLevel <= 2) return "storytelling_brut";
  if (diltsLevel === 3) return "expertise";
  if (diltsLevel === 4) return "conviction_actu";
  if (diltsLevel >= 5) return "leadership_talk";
  return "storytelling_brut";
}

export function generatePostDraft(brick, diltsLevel, pillar, take, targetRoleId) {
  if (!brick) return null;
  var calibration = DILTS_CALIBRATION[diltsLevel] || DILTS_CALIBRATION[2];
  var mapping = DILTS_EDITORIAL_MAPPING[diltsLevel] || DILTS_EDITORIAL_MAPPING[2];
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;

  var situation = brick.text;
  situation = situation.replace(/[\+\-]?\d+[\.,]?\d*\s*[%KM€]*/g, "").replace(/\s{2,}/g, " ").trim();
  if (situation.length > 100) situation = situation.slice(0, 100);
  var number = brick.text.match(/[\+\-]?\d+[\.,]?\d*\s*[%KM€]+/);
  number = number ? number[0] : null;

  var hook = "";
  var body = "";
  var close = "";

  if (diltsLevel <= 2) {
    hook = brick.brickType === "cicatrice"
      ? "J'ai plante. " + (brick.kpi || "un projet") + "."
      : (number ? number + ". " : "") + "Pas un objectif. Un resultat.";
    body = situation + ".";
    close = calibration.framingClose;
  } else if (diltsLevel === 3) {
    hook = "La methode que personne n'applique sur " + (brick.kpi || "ce sujet").toLowerCase() + ".";
    body = situation + "." + (number ? " Resultat : " + number + "." : "");
    close = calibration.framingClose;
  } else if (diltsLevel === 4) {
    var conviction = take ? take.text || take.title || "" : "";
    hook = conviction ? conviction.replace(/\.$/, "") + "." : "Le consensus dit le contraire.";
    body = "Mon experience : " + situation + "." + (number ? " " + number + " de delta." : "");
    close = calibration.framingClose;
  } else {
    hook = "On me reconnait a ca.";
    body = situation + ".";
    if (pillar && pillar.title) body += " J'ecris sur " + pillar.title.toLowerCase().replace(/\.$/, "") + ".";
    close = calibration.framingClose;
  }

  if (pillar && diltsLevel === 3 && pillar.title) {
    body = pillar.title + ". " + body;
  }

  var draft = hook + "\n\n" + body + "\n\n" + close;
  return {
    text: cleanRedac(draft, "livrable"),
    hook: hook,
    body: body,
    close: close,
    brickId: brick.id,
    brickText: brick.text.length > 60 ? brick.text.slice(0, 60) + "..." : brick.text,
    diltsLevel: diltsLevel,
    format: mapDiltsToFormat(diltsLevel),
    pillar: pillar ? pillar.title : null,
    take: take ? (take.title || take.text || "").slice(0, 50) : null,
    isBlinded: brick.blinded || false,
    stockPotential: diltsLevel >= 3,
  };
}

export function applyMeroeStyle(draft, vault) {
  if (!draft || !draft.text) return draft;
  var text = draft.text;
  text = cleanRedac(text, "livrable");
  if (vault && vault.styleCorrections && vault.styleCorrections.length > 0) {
    vault.styleCorrections.forEach(function(correction) {
      if (correction.from && correction.to) {
        text = text.replace(new RegExp(correction.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), correction.to);
      }
    });
  }
  draft.text = text;
  draft.meroeApplied = true;
  return draft;
}

export function marieHookAudit(draft) {
  if (!draft || !draft.text) return { score: 0, tests: [], pass: false };
  var text = draft.text;
  var hook = draft.hook || text.split("\n")[0] || "";
  var lower = text.toLowerCase();
  var hookLower = hook.toLowerCase();
  var tests = [];

  // 1. So What — reaction immediate
  var hasTension = /\?|!|\.{3}|pas un|personne|le vrai|contrairement|en r[eé]alit[eé]|plant[eé]|[eé]chou[eé]|perdu/.test(hookLower);
  var hasNumber = /\d+[%KM€]/.test(hook);
  var soWhat = hasTension || hasNumber;
  tests.push({ name: "So What", pass: soWhat, detail: soWhat ? "Tension ou chiffre present" : "Accroche plate, aucune reaction" });

  // 2. Ennemi — antagoniste identifie
  var hasEnemy = /personne ne|le consensus|l'erreur|[aà] tort|le probl[eè]me|on croit que|la majorit[eé]|le mythe|le pi[eè]ge|on me dit/.test(lower);
  tests.push({ name: "Ennemi", pass: hasEnemy, detail: hasEnemy ? "Antagoniste detecte" : "Pas d'ennemi, trop mou" });

  // 3. Consensus — clivant ou contre-intuitif
  var isClivant = /contrairement|le contraire|refuse|en r[eé]alit[eé]|personne ne dit|[aà] tort|mon parti|impopulaire/.test(lower);
  var notConsensus = hasEnemy || isClivant || draft.diltsLevel >= 4;
  tests.push({ name: "Consensus", pass: notConsensus, detail: notConsensus ? "Position clivante ou contre-intuitive" : "Tout le monde est d'accord, aucun interet" });

  // 4. Alienation — repousse les non-cibles
  var hasSpecificity = /\d+|m[eé]thode|process|framework|churn|pipeline|r[eé]tention|conversion|onboarding|recrutement/.test(lower);
  tests.push({ name: "Alienation", pass: hasSpecificity, detail: hasSpecificity ? "Vocabulaire specifique, filtre actif" : "Trop generique, parle a tout le monde" });

  // 5. Authenticite — ton assume, pas pute-a-clic
  var iaWords = ["revolutionnaire", "révolutionnaire", "incontournable", "a l'ere du", "a l'ère du", "à l'ère du", "game-changer", "disruptif", "secret pour", "astuce pour", "vous ne croirez"];
  var hasIaSmell = iaWords.some(function(w) { return lower.indexOf(w) !== -1; });
  var authentic = !hasIaSmell && (draft.isBlinded || draft.diltsLevel <= 2);
  tests.push({ name: "Authenticite", pass: !hasIaSmell, detail: hasIaSmell ? "Vocabulaire IA detecte, sonne faux" : "Ton assume" });

  // 6. Memorabilite — phrase retenue 1h apres
  var hasImage = /j'ai plant[eé]|j'ai vu|le jour o[uù]|ce moment|[aà] ce moment|en face de|quand j'ai|la premi[eè]re fois/.test(lower);
  var isShort = hook.length < 60;
  var memorable = hasImage || (isShort && (hasTension || hasNumber));
  tests.push({ name: "Memorabilite", pass: memorable, detail: memorable ? "Image ou chiffre memorisable" : "Oubliable en 30 secondes" });

  var score = tests.filter(function(t) { return t.pass; }).length;
  var scoreSur10 = Math.round((score / 6) * 10);
  return { score: scoreSur10, tests: tests, pass: scoreSur10 >= 7, rawScore: score };
}

export function luisEnriqueAudit(draft, bricks) {
  if (!draft || !draft.text) return { pass: false, tests: [], rejectReason: "Pas de texte" };
  var text = draft.text;
  var lower = text.toLowerCase();
  var tests = [];

  // 1. Utilite reelle ou bruit
  var hasConcrete = /\d+|m[eé]thode|r[eé]sultat|process|situation|contexte|[eé]quipe|client|impact/.test(lower);
  var isGeneric = /il est important|de nos jours|dans le monde|[aà] l'heure actuelle|tout le monde sait/.test(lower);
  var useful = hasConcrete && !isGeneric;
  tests.push({ name: "Utilite", pass: useful, detail: useful ? "Contenu concret et actionnable" : "Bruit — rien d'actionnable" });

  // 2. Clarte ou ego
  var egoMarkers = /je suis le meilleur|mon parcours exceptionnel|ma brillante|personne d'autre|je suis unique/;
  var isEgo = egoMarkers.test(lower);
  var brick = bricks.find(function(b) { return b.id === draft.brickId; });
  var hasProof = brick && brick.blinded;
  var isClear = !isEgo && (hasProof || draft.diltsLevel <= 3);
  tests.push({ name: "Clarte", pass: isClear, detail: isEgo ? "Ego — tu te regardes ecrire" : "Clair et ancre" });

  // 3. Aide autrui ou se montre
  var hasLearning = /m[eé]thode|le[cç]on|erreur|ce que j'ai appris|le pi[eè]ge|[eé]vite|question|comment/.test(lower);
  var helpsOthers = hasLearning || draft.diltsLevel === 3 || draft.format === "expertise";
  tests.push({ name: "Aide", pass: helpsOthers, detail: helpsOthers ? "Le lecteur apprend quelque chose" : "Le lecteur apprend que tu es bon. C'est tout." });

  var allPass = tests.every(function(t) { return t.pass; });
  var rejectReason = "";
  if (!allPass) {
    var failed = tests.filter(function(t) { return !t.pass; });
    rejectReason = failed.map(function(t) { return t.detail; }).join(". ");
  }
  return { pass: allPass, tests: tests, rejectReason: rejectReason };
}

export function tagVision2026(draft) {
  if (!draft) return draft;
  var format = VISION_2026_FORMATS.find(function(f) { return f.id === draft.format; }) || VISION_2026_FORMATS[0];
  draft.formatLabel = format.label;
  draft.formatDesc = format.desc;
  draft.stockPotential = draft.diltsLevel >= 3;
  if (draft.stockPotential) {
    draft.stockAngle = "Cet angle merite un article long. Developpe en article LinkedIn cette semaine.";
  }
  return draft;
}

export function generateWeeklyPosts(bricks, vault, targetRoleId) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return { posts: [], rejected: [] };

  var diltsHistory = vault && vault.diltsHistory ? vault.diltsHistory : [];
  var diltsTarget = computeDiltsTarget(diltsHistory);
  var plafond = getDiltsPlafond(diltsHistory);
  var pillars = vault && vault.selectedPillars ? vault.selectedPillars : [];
  var takes = bricks.filter(function(b) { return b.brickType === "take" && b.status === "validated"; });

  // Generate 4-5 candidates, filter down to 2-3 survivors
  var candidates = [];
  var usedBrickIds = [];
  var levels = [diltsTarget.targetLevel];
  if (diltsTarget.targetLevel > 2) levels.push(diltsTarget.targetLevel - 1);
  if (plafond >= 4 && levels.indexOf(2) === -1) levels.push(2);
  levels = levels.filter(function(l) { return l >= 2 && l <= plafond; });

  levels.forEach(function(level, i) {
    var brick = selectBrickForDiltsTarget(validated, level, usedBrickIds);
    if (!brick) return;
    usedBrickIds.push(brick.id);
    var pillar = pillars.length > 0 ? pillars[i % pillars.length] : null;
    var take = takes.length > 0 ? takes[i % takes.length] : null;
    var draft = generatePostDraft(brick, level, pillar, take, targetRoleId);
    if (draft) {
      draft = applyMeroeStyle(draft, vault);
      candidates.push(draft);
    }
  });

  // Add extra candidate from cicatrice if available
  var cicatrice = validated.find(function(b) { return b.brickType === "cicatrice" && usedBrickIds.indexOf(b.id) === -1; });
  if (cicatrice && candidates.length < 4) {
    var cicDraft = generatePostDraft(cicatrice, Math.min(2, plafond), null, null, targetRoleId);
    if (cicDraft) {
      cicDraft = applyMeroeStyle(cicDraft, vault);
      candidates.push(cicDraft);
    }
  }

  // Apply Marie Hook + Luis Enrique filters
  var survivors = [];
  var rejected = [];
  candidates.forEach(function(draft) {
    var marie = marieHookAudit(draft);
    draft.marieScore = marie.score;
    draft.marieTests = marie.tests;
    if (!marie.pass) {
      draft.rejectSource = "Marie Hook";
      draft.rejectReason = "Score " + marie.score + "/10. " + marie.tests.filter(function(t) { return !t.pass; }).map(function(t) { return t.detail; }).join(". ");
      rejected.push(draft);
      return;
    }
    var luis = luisEnriqueAudit(draft, bricks);
    draft.luisTests = luis.tests;
    if (!luis.pass) {
      draft.rejectSource = "Luis Enrique";
      draft.rejectReason = luis.rejectReason;
      rejected.push(draft);
      return;
    }
    draft = tagVision2026(draft);
    survivors.push(draft);
  });

  return { posts: survivors.slice(0, 3), rejected: rejected };
}

/* ==============================
   SLEEP MODE — 2 mécaniques
   1. Reseau maintenu (commentaire/semaine + relance dormant/mois)
   2. Coffre-Fort passif (nouvelles experiences → briques proposees)
   ============================== */

export function generateSleepComment(bricks, vault, targetRoleId) {
  var diltsHistory = vault && vault.diltsHistory ? vault.diltsHistory : [];
  var ceiling = getDiltsCeilingForOutput("commentaire", diltsHistory, 0);
  var brick = selectBrickForDiltsTarget(
    bricks.filter(function(b) { return b.status === "validated"; }),
    Math.min(ceiling, 3),
    []
  );
  if (!brick) return null;
  var situation = brick.text.replace(/[\+\-]?\d+[\.,]?\d*\s*[%KM€]*/g, "").replace(/\s{2,}/g, " ").trim();
  if (situation.length > 80) situation = situation.slice(0, 80) + "...";
  return {
    type: "commentaire_hebdo",
    diltsLevel: Math.min(ceiling, 3),
    suggestion: "Trouve un post dans ton secteur sur " + (brick.kpi || "ton sujet").toLowerCase() + ". Commente avec : \"" + situation + "\"",
    brickSource: brick.text.slice(0, 50),
    effort: "2 minutes",
  };
}

export function generateDormantRelaunch(bricks, vault, targetRoleId, monthsInactive) {
  var diltsHistory = vault && vault.diltsHistory ? vault.diltsHistory : [];
  var ceiling = getDiltsCeilingForOutput("relance_dormant", diltsHistory, monthsInactive || 1);
  var brick = selectBrickForDiltsTarget(
    bricks.filter(function(b) { return b.status === "validated"; }),
    Math.min(ceiling, 2),
    []
  );
  if (!brick) return null;
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleLabel = roleData ? roleData.role.toLowerCase() : "ton secteur";
  return {
    type: "relance_dormant",
    diltsLevel: Math.min(ceiling, 2),
    suggestion: "Envoie un message a un ancien collegue ou contact dormant. Angle : \"J'ai vu que [actualite de son entreprise]. Ca rejoint un cas que j'ai gere en " + roleLabel + ".\"",
    brickSource: brick.text.slice(0, 50),
    effort: "3 minutes",
  };
}

export function proposeSleepBrick(vault) {
  var weeks = 0;
  if (vault && vault.lastVisit) {
    weeks = Math.floor((Date.now() - new Date(vault.lastVisit).getTime()) / (7 * 24 * 60 * 60 * 1000));
  }
  if (weeks < 2) return null;
  return {
    type: "passive_brick",
    suggestion: "En " + weeks + " semaines, tu as probablement vecu au moins 1 situation notable. Un probleme resolu. Une decision prise. Un resultat mesure. Ajoute-la a ton Coffre-Fort. L'IA la transforme en brique.",
    effort: "5 minutes",
  };
}
