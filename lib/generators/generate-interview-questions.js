import { KPI_REFERENCE } from "../sprint/references.js";
import { cleanRedac } from "../sprint/redac.js";
import { hashCode } from "../sprint/scoring.js";
import { extractBrickSummary, extractContextMarker } from "../sprint/analysis.js";
import { extractBrickCore } from "../sprint/brickExtractor.js";
import { applyHints, extractBestNum } from "./helpers.js";

/**
 * Détecte un parcours non linéaire : 3+ contextes professionnels distincts
 * identifiés dans les briques du candidat.
 * @param {Array} bricks - briques (filtrées validated en interne)
 * @returns {{ isNonLinear: boolean, contexts: string[], count: number }}
 */
export function detectNonLinearCareer(bricks) {
  var validated = (bricks || []).filter(function (b) {
    return b.status === "validated";
  });

  if (validated.length < 3) {
    return { isNonLinear: false, contexts: [], count: 0 };
  }

  var contexts = [];
  validated.forEach(function (b) {
    var text = b.editText || b.text || "";
    var ctx = extractContextMarker(text);
    if (ctx && contexts.indexOf(ctx) === -1) {
      contexts.push(ctx);
    }
  });

  return { isNonLinear: contexts.length >= 3, contexts: contexts, count: contexts.length };
}

/**
 * Génère des questions que le candidat pose au recruteur.
 * Croise briques blindées × cauchemars × signaux d'offre.
 * Chaque question démontre implicitement une compétence sans la nommer.
 * @param {Array} bricks - briques validées
 * @param {string} targetRoleId - rôle cible
 * @param {Array} nightmares - cauchemars actifs (getActiveCauchemars)
 * @param {object|null} offerSignals - signaux de l'offre (optionnel)
 * @param {string|null} signature - signature comportementale du candidat (optionnel)
 * @returns {string} questions formatées avec notes de coaching
 */
export function generateInterviewQuestions(bricks, targetRoleId, nightmares, offerSignals, signature, hints) {
  var validated = bricks.filter(function (b) {
    return b.status === "validated" && b.brickType !== "take";
  });
  if (validated.length < 2) {
    return "Pas assez de matériau pour calibrer tes questions. Forge au moins 2 briques pour que l'outil croise tes faits avec les cauchemars du recruteur.";
  }

  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleLabel = roleData ? roleData.role : "ce poste";

  // Briques blindées (chiffrées)
  var armored = validated.filter(function (b) {
    return /\d/.test(b.text);
  });

  // Scoring specific to this generator, not extracted (1-to-1 cauchemar-brick matching)
  var cauchWithBrick = [];
  nightmares.forEach(function (c) {
    var match = validated.find(function (b) {
      return (
        c.kpis &&
        c.kpis.some(function (kpi) {
          return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1;
        })
      );
    });
    cauchWithBrick.push({ cauchemar: c, brick: match || null });
  });

  var questions = [];

  // ── NIVEAU 3 — Contextuelles (minimum 2) ──
  if (offerSignals && offerSignals.cauchemars) {
    var detectedSignals = offerSignals.cauchemars.filter(function (c) {
      return c.detected;
    });
    var signalSource = detectedSignals.length > 0 ? detectedSignals : offerSignals.cauchemars;
    signalSource.slice(0, 2).forEach(function (sig) {
      var matchBrick = validated.find(function (b) {
        return (
          sig.kpis &&
          sig.kpis.some(function (kpi) {
            return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1;
          })
        );
      });
      var brickRef = matchBrick ? extractBrickSummary(matchBrick.text) : "expérience terrain";
      var questionText =
        "J'ai noté que le poste mentionne " +
        sig.label.toLowerCase() +
        " comme enjeu. Concrètement, comment votre équipe mesure-t-elle la progression sur ce sujet aujourd'hui ?";
      questions.push({
        level: 3,
        text: questionText,
        demonstrates: "Tu montres que tu lis l'offre au second degré et que tu cherches la métrique, pas le discours.",
        brickRef: brickRef,
        cauchRef: sig.label,
      });
    });
  }
  // Compléter avec cauchemars si pas assez de signaux — 4 templates distincts
  if (questions.length < 2) {
    var used = questions.map(function (q) {
      return q.cauchRef;
    });
    var contextualPatterns = [
      function (role, label) {
        return (
          "Sur un rôle " + role + ", " + label + " est souvent un enjeu. Comment votre équipe le gère aujourd'hui ?"
        );
      },
      function (role, label) {
        return (
          "J'ai vu que " +
          label +
          " revient dans beaucoup d'organisations. Quel mécanisme avez-vous mis en place pour le contenir ?"
        );
      },
      function (role, label) {
        return (
          "Si je comprends bien le poste, " +
          label +
          " fait partie des chantiers prioritaires. Qu'est-ce qui a été tenté jusqu'ici ?"
        );
      },
      function (role, label) {
        return (
          "En étudiant votre secteur, " +
          label +
          " semble structurel. Comment vous situez-vous par rapport au marché sur ce point ?"
        );
      },
    ];
    var patIdx = 0;
    cauchWithBrick.forEach(function (cw) {
      if (questions.length >= 2) return;
      if (used.indexOf(cw.cauchemar.label) !== -1) return;
      var brickRef = cw.brick ? extractBrickSummary(cw.brick.text) : "expérience terrain";
      var questionText = contextualPatterns[patIdx % contextualPatterns.length](
        roleLabel,
        cw.cauchemar.label.toLowerCase()
      );
      patIdx++;
      questions.push({
        level: 3,
        text: questionText,
        demonstrates:
          "Tu poses la question du terrain. Le recruteur comprend que tu connais le métier avant même d'avoir commencé.",
        brickRef: brickRef,
        cauchRef: cw.cauchemar.label,
      });
    });
  }

  // ── NIVEAU 4 — Miroir (minimum 1) ──
  var mirrorVariants = [
    "Quel est le profil type de " + roleLabel + " qui échoue ici dans les 6 premiers mois ?",
    "Qu'est-ce qui distingue vos meilleurs " + roleLabel + " de ceux qui n'atteignent pas les objectifs ?",
  ];
  var mirrorIdx = Math.abs(hashCode(targetRoleId || "default")) % mirrorVariants.length;
  var mirrorCauch = cauchWithBrick.length > 0 ? cauchWithBrick[0] : null;
  questions.push({
    level: 4,
    text: mirrorVariants[mirrorIdx],
    demonstrates: "Tu forces le recruteur à décrire la réalité. Sa réponse te donne les vrais critères de sélection.",
    brickRef: mirrorCauch && mirrorCauch.brick ? extractBrickSummary(mirrorCauch.brick.text) : "ton profil global",
    cauchRef: mirrorCauch ? mirrorCauch.cauchemar.label : "échec en poste",
  });
  // Deuxième miroir si matériau suffisant
  if (cauchWithBrick.length >= 2 && cauchWithBrick[1].brick) {
    var cw1 = cauchWithBrick[1];
    questions.push({
      level: 4,
      text:
        "Quand " +
        cw1.cauchemar.label.toLowerCase() +
        " devient critique, c'est généralement un problème de process, de compétence, ou de contexte ?",
      demonstrates: "Tu cadres le problème en 3 dimensions. Le recruteur voit que tu diagnostiques avant d'agir.",
      brickRef: extractBrickSummary(cw1.brick.text),
      cauchRef: cw1.cauchemar.label,
    });
  }

  // ── NIVEAU 5 — Révélatrice (1-2 si >= 3 briques blindées) ──
  if (armored.length >= 3) {
    var bestArmored = armored[0];
    var bestCore = extractBrickCore(bestArmored);
    var bestNum = bestCore.resultNumber || extractBestNum(bestArmored.text);
    var costCauch = cauchWithBrick.find(function (cw) {
      return cw.cauchemar.costRange && cw.cauchemar.costRange[1] > 0;
    });
    if (costCauch) {
      questions.push({
        level: 5,
        text:
          "Si " +
          costCauch.cauchemar.label.toLowerCase() +
          " reste un sujet ouvert chez vous, quelle serait votre attente vis-à-vis du poste sur ce point ? Ou c'est déjà résolu ?",
        demonstrates:
          "Tu cadres le problème sans le chiffrer. Le recruteur comprend que tu connais l'enjeu business, pas juste le poste.",
        brickRef: bestNum
          ? bestNum + " — " + extractBrickSummary(bestArmored.text)
          : extractBrickSummary(bestArmored.text),
        cauchRef: costCauch.cauchemar.label,
      });
    }
    // Deuxième révélatrice si assez de matériau
    if (armored.length >= 5 && cauchWithBrick.length >= 3) {
      var cw2 = cauchWithBrick[2];
      if (cw2 && cw2.brick) {
        questions.push({
          level: 5,
          text:
            "Entre " +
            cauchWithBrick[0].cauchemar.label.toLowerCase() +
            " et " +
            cw2.cauchemar.label.toLowerCase() +
            ", lequel a le plus d'impact sur vos résultats actuels ? Je demande parce que l'approche serait très différente.",
          demonstrates:
            "Tu mets deux problèmes en tension. Le recruteur est obligé de prioriser — et te donne la hiérarchie réelle des enjeux.",
          brickRef: extractBrickSummary(cw2.brick.text),
          cauchRef: cw2.cauchemar.label,
        });
      }
    }
  }

  // ── NIVEAU 6 — Inconfortable (max 1, optionnelle, >= 5 briques blindées ET signature) ──
  if (armored.length >= 5 && signature) {
    var uncoveredCauch = cauchWithBrick.find(function (cw) {
      return !cw.brick;
    });
    if (uncoveredCauch) {
      questions.push({
        level: 6,
        text:
          "En étudiant le marché, j'ai compris que " +
          uncoveredCauch.cauchemar.label.toLowerCase() +
          " est un enjeu structurel pour beaucoup d'équipes. Est-ce un problème résolu chez vous, ou une contrainte avec laquelle le poste compose ?",
        demonstrates:
          "Tu poses la question que personne ne pose. Le recruteur sait que tu fais ta due diligence — comme un investisseur évalue un deal.",
        brickRef: "due diligence candidat",
        cauchRef: uncoveredCauch.cauchemar.label,
      });
    } else if (nightmares.length > 0) {
      var lastCauch = nightmares[nightmares.length - 1];
      questions.push({
        level: 6,
        text:
          "Si je regarde les signaux du marché sur " +
          lastCauch.label.toLowerCase() +
          ", les entreprises qui performent ont résolu ce point en amont. Comment vous situez-vous sur ce sujet — en avance, au niveau, ou en rattrapage ?",
        demonstrates:
          "Tu benchmarkes l'employeur. Il se retrouve en position de se vendre à toi. L'asymétrie s'inverse.",
        brickRef: "positionnement marché",
        cauchRef: lastCauch.label,
      });
    }
  }

  // Trier par niveau croissant
  questions.sort(function (a, b) {
    return a.level - b.level;
  });

  // Limiter à 8 max
  if (questions.length > 8) questions = questions.slice(0, 8);

  // Formater la sortie
  var levelNames = { 3: "Contextuelle", 4: "Miroir", 5: "Révélatrice", 6: "Inconfortable" };
  var out = "QUESTIONS POUR L'ENTRETIEN — " + roleLabel.toUpperCase() + "\n";
  out += questions.length + " questions calibrées sur tes preuves\n\n";

  questions.forEach(function (q, i) {
    out += "QUESTION " + (i + 1) + " — Niveau " + q.level + " (" + levelNames[q.level] + ")\n";
    out += '"' + q.text + '"\n\n';
    out += "↳ Ce que tu démontres : " + q.demonstrates + "\n";
    out += "↳ Brique mobilisée : " + q.brickRef + "\n";
    out += "↳ Cauchemar visé : " + q.cauchRef + "\n";
    if (q.level <= 4) out += "↳ Pour ton message post-entretien : note la réponse du recruteur à cette question.\n";
    if (i < questions.length - 1) out += "\n";
  });

  out += "\n---\n";
  out += "COMMENT UTILISER CES QUESTIONS\n\n";
  out += "Pose 2-3 questions maximum en entretien. Pas les " + questions.length + ".\n";
  out += "Commence par une contextuelle (niveau 3) pour ouvrir.\n";
  out += "Place la miroir (niveau 4) quand le recruteur est en confiance.\n";
  out += "La révélatrice (niveau 5) ne se pose que si l'échange est devenu une conversation, pas un interrogatoire.\n";
  out += "L'inconfortable (niveau 6) se garde pour un deuxième entretien ou un échange informel.\n\n";
  out += "Écoute la réponse. Ta question suivante doit intégrer ce que le recruteur vient de dire.\n";
  out += "Si tu déroules ta liste sans écouter, tu fais exactement ce que font les mauvais commerciaux.";
  out += "\n";
  out +=
    "Ces questions ne te rendront pas sympathique. Elles te rendront mémorable. Le recruteur qui réagit mal à une question niveau 4 te donne une information gratuite : cette entreprise ne recrute pas, elle remplit des cases.";

  // ── Parcours non linéaire (16n) ──
  var career = detectNonLinearCareer(bricks);
  if (career.isNonLinear) {
    var topBricks = validated
      .slice()
      .sort(function (a, b) {
        return (b.armorScore || 0) - (a.armorScore || 0);
      })
      .slice(0, 3);

    var paradeLines = topBricks.map(function (b, i) {
      return (i + 1) + ". " + extractBrickSummary(b.editText || b.text);
    });

    out += "\n\n---\n";
    out += "PARCOURS NON LINÉAIRE\n\n";
    out += "Le recruteur te demandera : \"Pourquoi avez-vous changé si souvent ?\"\n\n";
    out += "Ta parade :\n";
    out += "\"Chaque poste correspondait à un problème résolu. Voici les 3 problèmes et les 3 résultats :\"\n\n";
    out += paradeLines.join("\n") + "\n\n";
    out += "Ancre chaque transition sur une décision, pas sur une circonstance.";
  }

  out = applyHints(out, hints, { bricks: bricks, cauchemars: nightmares, type: "questions" });
  return cleanRedac(out, "livrable");
}
