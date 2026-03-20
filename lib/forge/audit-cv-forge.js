/**
 * Audits a CV against forged bricks, cauchemars, density, and signature.
 * Enrichment of Éclaireur audit with Forge-specific data.
 *
 * @param {string} cvText - candidate's pasted CV
 * @param {Array} bricks - validated bricks from Forge
 * @param {Array} cauchemars - active cauchemars
 * @param {object} density - density score object (axes, score, warnings)
 * @param {object|null} signature - signature object if detected
 * @returns {{ score: number, total: number, findings: Array<{ type: string, message: string, brick?: object, severity: string }> }}
 */

import { extractBrickCore } from "../sprint/brickExtractor.js";
import { BIO_VOCAB_INTERDIT } from "../generators/helpers.js";
import { hasDecisionMarkers } from "../sprint/analysis.js";

/**
 * Normalize a number string for fuzzy matching.
 * "18 000" → "18000", "12 %" → "12%", "18K" → "18000"
 */
function normalizeNum(str) {
  return str
    .replace(/\s/g, "")
    .replace(/(\d)K€?/gi, function (_, d) {
      return d + "000";
    })
    .replace(/(\d),(\d)/g, "$1.$2");
}

/**
 * Checks if a number appears in text with fuzzy matching.
 * Handles spaces in numbers ("18 000" vs "18000") and K notation.
 */
function fuzzyNumMatch(num, text) {
  if (!num) return false;
  var normalized = normalizeNum(num);
  var normalizedText = normalizeNum(text);
  if (normalizedText.indexOf(normalized) !== -1) return true;
  // Also check raw
  if (text.indexOf(num) !== -1) return true;
  // Strip % and check just the digits
  var digits = num.replace(/[^\d.,]/g, "");
  if (digits.length >= 2 && text.indexOf(digits) !== -1) return true;
  return false;
}

export function auditCVForge(cvText, bricks, cauchemars, density, signature) {
  if (!cvText || cvText.length < 100) return null;

  var lower = cvText.toLowerCase();
  var findings = [];
  var validated = (bricks || []).filter(function (b) {
    return b.status === "validated" && b.brickType !== "take";
  });
  var activeCauchemars = cauchemars || [];

  // ── Test 1 — Preuves absentes du CV ──
  validated.forEach(function (b) {
    var armor = b.armorScore || 0;
    if (armor < 3) return;
    var core = extractBrickCore(b);
    var resultNum = core.resultNumber || core.mainNumber;
    if (!resultNum) return;
    if (!fuzzyNumMatch(resultNum, cvText)) {
      var snippet = (b.text || "").slice(0, 40);
      findings.push({
        type: "missing_proof",
        message: "Ta brique « " + snippet + "… » prouve " + resultNum + ". Ton CV ne le mentionne pas.",
        brick: b,
        severity: armor >= 4 ? "high" : "medium",
      });
    }
  });

  // ── Test 2 — Cauchemars non adressés dans le CV ──
  activeCauchemars.forEach(function (c) {
    var kpis = c.kpis || [];
    var kw = c.kw || [];
    var keywords = kpis.concat(kw);
    var foundInCv = false;
    keywords.forEach(function (k) {
      if (foundInCv) return;
      var kLower = (k || "").toLowerCase();
      if (kLower.length >= 3 && lower.indexOf(kLower) !== -1) foundInCv = true;
    });
    // Also check label words
    if (!foundInCv && c.label) {
      var labelWords = c.label
        .toLowerCase()
        .split(/\s+/)
        .filter(function (w) {
          return w.length >= 4;
        });
      labelWords.forEach(function (w) {
        if (foundInCv) return;
        if (lower.indexOf(w) !== -1) foundInCv = true;
      });
    }
    if (foundInCv) return;
    // Check if a brick covers this cauchemar
    var coveredByBrick = validated.some(function (b) {
      return kpis.some(function (k) {
        var kSlice = k.toLowerCase().slice(0, 6);
        var bKpi = (b.kpi || "").toLowerCase();
        return bKpi.indexOf(kSlice) !== -1 || k.toLowerCase().indexOf(bKpi.slice(0, 6)) !== -1;
      });
    });
    if (coveredByBrick) {
      findings.push({
        type: "uncovered_cauchemar",
        message: "Le cauchemar « " + c.label + " » est couvert par ta brique mais absent de ton CV.",
        severity: "high",
      });
    }
  });

  // ── Test 3 — Vocabulaire toxique ──
  BIO_VOCAB_INTERDIT.forEach(function (re) {
    var match = cvText.match(re);
    if (match) {
      findings.push({
        type: "toxic_vocab",
        message: "Ton CV contient « " + match[0] + " ». Remplace par un fait de tes briques.",
        severity: "medium",
      });
    }
  });

  // ── Test 4 — Cohérence densité ──
  if (density && density.score >= 70 && !/\d/.test(cvText)) {
    findings.push({
      type: "density_gap",
      message: "Ta densité est à " + density.score + "% mais ton CV ne contient pas de chiffres.",
      severity: "medium",
    });
  }
  if (density && density.axes) {
    var blindageAxe = density.axes.find(function (ax) {
      return ax.name === "Blindage";
    });
    if (blindageAxe && blindageAxe.pct >= 70 && !hasDecisionMarkers(cvText)) {
      findings.push({
        type: "density_gap",
        message:
          "Ton blindage est à " + blindageAxe.pct + "% mais ton CV manque de verbes de décision. Ajoute ce que TU as décidé.",
        severity: "medium",
      });
    }
  }

  // ── Test 5 — Signature invisible ──
  if (signature && signature.formulation) {
    var sigTokens = signature.formulation
      .split(/\s+/)
      .filter(function (t) {
        return t.length > 4;
      });
    var sigFound = sigTokens.some(function (t) {
      return lower.indexOf(t.toLowerCase()) !== -1;
    });
    if (!sigFound && sigTokens.length > 0) {
      findings.push({
        type: "invisible_signature",
        message: "Ton avantage injuste n'apparaît pas dans ton CV. Ajoute : « " + signature.formulation + " ».",
        severity: "high",
      });
    }
  }

  // ── Test 6 — KPI caché absent ──
  if (activeCauchemars.length > 0) {
    var firstCauch = activeCauchemars[0];
    var firstKpi = firstCauch.kpis && firstCauch.kpis.length > 0 ? firstCauch.kpis[0] : null;
    if (firstKpi && lower.indexOf(firstKpi.toLowerCase()) === -1) {
      findings.push({
        type: "missing_kpi",
        message: "Le KPI que le recruteur évalue (" + firstKpi + ") n'apparaît pas dans ton CV.",
        severity: "high",
      });
    }
  }

  var score = findings.length;
  return { score: score, total: 6, findings: findings };
}
