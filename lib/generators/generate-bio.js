import { cleanRedac } from "../sprint/redac.js";
import { getActiveCauchemars } from "../sprint/scoring.js";
import {
  applyHints,
  bioStripVocabInterdit,
  bioBuildAnchorText,
  bioBuildNightmareNarrative,
  bioDetectPattern,
} from "./helpers.js";
import { selectBestBrick } from "./selectors.js";

/**
 * generateBio — Framework D (Fait Anchor)
 * Produces a LinkedIn bio optimized for recruiter validation.
 * 4 blocks: anchor fact (≤ 210 chars), nightmare context (≤ 400 chars),
 * pattern (≤ 300 chars), CTA.
 * @param {Array} bricks - brick array (text, status, armorScore, hasNumbers, brickType, kpi, elasticity)
 * @param {object} vault - contains selectedPillars (unused in Framework D)
 * @param {boolean} trajectoryToggle - unused, preserved for signature compatibility
 * @returns {string} bio text via cleanRedac
 */
export function generateBio(bricks, vault, trajectoryToggle, hints) {
  var validated = bricks.filter(function (b) {
    return b.status === "validated" && b.brickType !== "take";
  });
  if (validated.length === 0) return cleanRedac("Profil en cours de construction.", "livrable");

  // BLOC 1 — ANCRAGE (≤ 210 car.) — selection logic in selectors.js
  var anchor = selectBestBrick(validated);
  var anchorText = bioBuildAnchorText(anchor);

  // BLOC 2 — CAUCHEMAR IMPLICITE (≤ 400 car.)
  var nightmareText = null;
  var strongestCauchemar = null;
  var strongestCount = 0;
  getActiveCauchemars().forEach(function (c) {
    var count = validated.filter(function (b) {
      return c.kpis.some(function (kpi) {
        return b.kpi && b.kpi.toLowerCase().indexOf(kpi.toLowerCase().slice(0, 6)) !== -1;
      });
    }).length;
    if (count > 0 && count > strongestCount) {
      strongestCount = count;
      strongestCauchemar = c;
    }
  });
  if (strongestCauchemar) nightmareText = bioBuildNightmareNarrative(strongestCauchemar);

  // BLOC 3 — PATTERN (≤ 300 car.)
  var patternText = validated.length >= 3 ? bioDetectPattern(validated) : null;

  // BLOC 4 — CTA (fixe) + assemblage
  var blocks = [anchorText];
  if (nightmareText) blocks.push(nightmareText);
  if (patternText) blocks.push(patternText);
  blocks.push("Un message suffit.");

  var bioRaw = bioStripVocabInterdit(blocks.join("\n\n"));
  bioRaw = applyHints(bioRaw, hints, { bricks: bricks, cauchemars: getActiveCauchemars(), type: "bio" });
  return cleanRedac(bioRaw, "livrable");
}
