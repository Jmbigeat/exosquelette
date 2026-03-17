/**
 * Brick selection logic extracted from generators.
 * Pure functions: take data, return data. No formatting.
 */

/**
 * Scores bricks against cauchemars and KPIs.
 * Scoring: cauchemar KPI match (+10), has digits (+5), method words (+3), élastique (+2).
 * Returns scored array sorted by score descending.
 *
 * @param {Array} validated - validated bricks (already filtered, brickType !== "take")
 * @param {Array} cauchemars - active cauchemars (from getActiveCauchemars)
 * @returns {Array<{ brick: object, score: number }>} sorted by score descending
 */
export function scoreBricksByCauchemar(validated, cauchemars) {
  var scored = validated.map(function (b) {
    var score = 0;
    if (
      b.kpi &&
      cauchemars.some(function (c) {
        return c.kpis.some(function (k) {
          return b.kpi.indexOf(k.slice(0, 6)) !== -1 || k.indexOf((b.kpi || "").slice(0, 6)) !== -1;
        });
      })
    )
      score += 10;
    if (/\d/.test(b.text)) score += 5;
    if (/via|grâce à|méthode|process|déployé|mis en place|construit|structuré/i.test(b.text)) score += 3;
    if (b.elasticity === "élastique") score += 2;
    return { brick: b, score: score };
  });
  scored.sort(function (a, b) {
    return b.score - a.score;
  });
  return scored;
}

/**
 * Greedy selection: picks N bricks maximizing cauchemar coverage.
 * Prioritizes bricks that cover a new cauchemar, then fills remaining slots by score.
 *
 * @param {Array<{ brick: object, score: number }>} scored - pre-scored bricks (from scoreBricksByCauchemar)
 * @param {Array} cauchemars - active cauchemars
 * @param {number} target - max bricks to select (default 5)
 * @returns {{ selected: Array<{ brick: object, score: number }>, coveredCauchIds: object }}
 */
export function selectGreedyCoverage(scored, cauchemars, target) {
  if (target == null) target = 5;
  var selected = [];
  var coveredCauchIds = {};
  scored.forEach(function (s) {
    if (selected.length >= target) return;
    var coversNew =
      s.brick.kpi &&
      cauchemars.some(function (c) {
        if (coveredCauchIds[c.id]) return false;
        return c.kpis.some(function (k) {
          return s.brick.kpi.indexOf(k.slice(0, 6)) !== -1 || k.indexOf(s.brick.kpi.slice(0, 6)) !== -1;
        });
      });
    if (coversNew) {
      selected.push(s);
      cauchemars.forEach(function (c) {
        if (
          c.kpis.some(function (k) {
            return s.brick.kpi.indexOf(k.slice(0, 6)) !== -1 || k.indexOf(s.brick.kpi.slice(0, 6)) !== -1;
          })
        )
          coveredCauchIds[c.id] = true;
      });
    }
  });
  scored.forEach(function (s) {
    if (selected.length >= target) return;
    if (selected.indexOf(s) === -1) selected.push(s);
  });
  return { selected: selected, coveredCauchIds: coveredCauchIds };
}

/**
 * Selects the single best brick by armorScore, then hasNumbers as tiebreaker.
 *
 * @param {Array} validated - validated bricks (already filtered)
 * @returns {object|null} best brick or null if empty
 */
export function selectBestBrick(validated) {
  if (!validated || validated.length === 0) return null;
  return validated.slice().sort(function (a, b) {
    var d = (b.armorScore || 0) - (a.armorScore || 0);
    if (d !== 0) return d;
    if (/\d/.test(b.text || "") && !/\d/.test(a.text || "")) return 1;
    if (/\d/.test(a.text || "") && !/\d/.test(b.text || "")) return -1;
    return 0;
  })[0];
}
