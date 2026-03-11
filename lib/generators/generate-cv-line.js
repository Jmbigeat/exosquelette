import { extractBrickCore, formatCVLine as _formatCVLine } from "../sprint/brickExtractor.js";

/**
 * Generates a CV-optimized line for a single validated brick.
 * Format: action verb + number + minimal context. ≤ 150 characters.
 * Adapts verb by brickType (proof, scar, elastic, manual).
 * @param {object} brick - a single validated brick
 * @param {string} targetRoleId - target role
 * @returns {string} CV line (≤ 150 characters)
 */
export function generateCVLine(brick, targetRoleId, hints) {
  var core = extractBrickCore(brick);
  var cvLine = _formatCVLine(core, brick.brickType || "proof");
  if (brick.transferStatement && brick.transferStatement.length >= 20) {
    var condensed = brick.transferStatement.length > 80
      ? brick.transferStatement.slice(0, 77) + "..."
      : brick.transferStatement;
    if ((cvLine + "\n→ " + condensed).length <= 150) {
      cvLine += "\n→ " + condensed;
    }
  }
  return cvLine;
}
