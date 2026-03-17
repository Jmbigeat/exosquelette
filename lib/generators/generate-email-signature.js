import { KPI_REFERENCE } from "../sprint/references.js";
import { extractBrickCore } from "../sprint/brickExtractor.js";
import { BIO_VOCAB_INTERDIT } from "./helpers.js";
import { selectBestBrick } from "./selectors.js";

/**
 * Generates a compressed email signature line from the strongest brick.
 * Format: "{fact} — {role}"
 * Maximum 80 characters.
 *
 * @param {Array} bricks - validated bricks
 * @param {string} targetRoleId - target role
 * @returns {string} signature line ≤ 80 chars
 */
export function generateEmailSignature(bricks, targetRoleId) {
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var roleName = roleData ? roleData.role : "Professionnel";
  var validated = (bricks || []).filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return roleName;

  // Pick strongest brick — selection logic in selectors.js
  var best = selectBestBrick(validated);

  var core = extractBrickCore(best);
  var parts = [];
  if (core.actionVerb) parts.push(core.actionVerb.charAt(0).toUpperCase() + core.actionVerb.slice(1));
  if (core.problemNumber && core.resultNumber && core.problemNumber !== core.resultNumber) {
    parts.push("de " + core.problemNumber + " à " + core.resultNumber);
  } else if (core.mainNumber) {
    parts.push(core.mainNumber);
  }
  if (core.context) parts.push(core.context);

  var fact = parts.join(" ").replace(/\s+/g, " ").trim();
  var suffix = " — " + roleName;
  var maxFact = 80 - suffix.length;

  if (fact.length > maxFact) {
    // Cut context, keep verb + number
    var shortParts = [];
    if (core.actionVerb) shortParts.push(core.actionVerb.charAt(0).toUpperCase() + core.actionVerb.slice(1));
    if (core.problemNumber && core.resultNumber && core.problemNumber !== core.resultNumber) {
      shortParts.push("de " + core.problemNumber + " à " + core.resultNumber);
    } else if (core.mainNumber) {
      shortParts.push(core.mainNumber);
    }
    fact = shortParts.join(" ").trim();
    if (fact.length > maxFact) fact = fact.slice(0, maxFact - 3) + "...";
  }

  var line = fact ? fact + suffix : roleName;
  // Strip vocab interdit
  BIO_VOCAB_INTERDIT.forEach(function(re) { line = line.replace(re, ""); });
  return line.replace(/  +/g, " ").trim();
}
