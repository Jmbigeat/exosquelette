"use client";
import { useState, useEffect } from "react";
import { loadBrewWeeks, saveBrewWeek, loadBrewInstructions, createBrewInstruction, getMonday } from "@/lib/brew-db";
import { computeDensityScore, getActiveCauchemars, setActiveCauchemarsGlobal } from "@/lib/sprint/scoring";
import { buildActiveCauchemars } from "@/lib/sprint/offers";
import { detectDiltsLevel, detectDiltsStagnation, computeDiltsTarget, DILTS_EDITORIAL_MAPPING } from "@/lib/sprint/dilts";
import { generateLinkedInPosts } from "@/lib/sprint/linkedin";
import { generateContactScripts } from "@/lib/sprint/generators";
import { CopyBtn } from "@/components/sprint/ui";

/* ── Helpers ──────────────────────────────────────────────── */

var CATEGORY_LABELS = { rh: "RH / Recruteurs", n1: "Managers opérationnels", peers: "Pairs", other: "Autres / Inconnus" };
var CATEGORY_COLORS = { rh: "#e94560", n1: "#ff9800", peers: "#4ecca3", other: "#495670" };
var CATEGORY_KEYS = ["rh", "n1", "peers", "other"];
var DILTS_LEVEL_NAMES = { 1: "Environnement", 2: "Comportement", 3: "Capacités", 4: "Croyances", 5: "Identité", 6: "Mission" };

function totalReactions(row) {
  return (row.reactions_rh || 0) + (row.reactions_n1 || 0) + (row.reactions_peers || 0) + (row.reactions_other || 0);
}

function dominantCategory(rows) {
  var totals = { rh: 0, n1: 0, peers: 0, other: 0 };
  rows.forEach(function(r) {
    totals.rh += r.reactions_rh || 0;
    totals.n1 += r.reactions_n1 || 0;
    totals.peers += r.reactions_peers || 0;
    totals.other += r.reactions_other || 0;
  });
  var max = 0;
  var dominant = "rh";
  CATEGORY_KEYS.forEach(function(k) {
    if (totals[k] > max) { max = totals[k]; dominant = k; }
  });
  return { key: dominant, label: CATEGORY_LABELS[dominant], totals: totals };
}

function computeCoverageMap(brewWeeks) {
  var map = { 1: 0, 2: 0, 3: 0, 4: 0 };
  brewWeeks.forEach(function(w) {
    if (w.published) map[w.pillar_id] = (map[w.pillar_id] || 0) + 1;
  });
  return map;
}

function pillarWeeks(brewWeeks, pillarId) {
  return brewWeeks.filter(function(w) { return w.pillar_id === pillarId; });
}

function publishedWeeks(brewWeeks, pillarId) {
  return brewWeeks.filter(function(w) { return w.pillar_id === pillarId && w.published; });
}

function computeTrend(brewWeeks, pillarId) {
  var weeks = publishedWeeks(brewWeeks, pillarId);
  if (weeks.length < 2) return "stable";
  // Compare most recent 2 weeks
  var sorted = weeks.slice().sort(function(a, b) { return a.week_start > b.week_start ? -1 : 1; });
  var recent = totalReactions(sorted[0]);
  var prev = totalReactions(sorted[1]);
  if (prev === 0) return recent > 0 ? "up" : "stable";
  var delta = (recent - prev) / prev;
  if (delta > 0.2) return "up";
  if (delta < -0.2) return "down";
  return "stable";
}

function trendArrow(trend) {
  if (trend === "up") return { symbol: "↑", color: "#4ecca3" };
  if (trend === "down") return { symbol: "↓", color: "#e94560" };
  return { symbol: "→", color: "#495670" };
}

function computeDiagnostic(brewWeeks, pillarId, pillarTitle) {
  var published = publishedWeeks(brewWeeks, pillarId);
  if (published.length === 0) return null;
  var total = 0;
  published.forEach(function(w) { total += totalReactions(w); });
  var strong = total >= 5;
  var trend = computeTrend(brewWeeks, pillarId);
  var dom = dominantCategory(published);

  if (strong && trend === "up") return "Ton pilier " + pillarId + " (" + pillarTitle + ") laisse des traces chez les " + dom.label + ". Passe à un autre pilier pour diversifier tes preuves.";
  if (strong && trend !== "down") return "Ton pilier " + pillarId + " (" + pillarTitle + ") est déposé. Contacte les profils qui réagissent. Concentre tes publications sur les piliers sans trace.";
  if (!strong && trend === "up") return "Ton pilier " + pillarId + " (" + pillarTitle + ") commence à exister. Dépose une deuxième trace avant de juger.";
  return "Ton pilier " + pillarId + " (" + pillarTitle + ") ne laisse pas de trace. Change l'angle ou abandonne ce pilier.";
}

/* ── Main Component ───────────────────────────────────────── */

/**
 * Brew — LinkedIn 360 cockpit.
 * Reads Forge data in read-only mode. Manages brew_weeks and brew_instructions.
 *
 * @param {{ user: object, paid: boolean, forgeData: object }} props
 */
export default function Brew(props) {
  var user = props.user;
  var paid = props.paid;
  var forgeData = props.forgeData || {};

  // Forge data (read-only)
  var bricks = forgeData.bricks || [];
  var vault = forgeData.vault || {};
  var pillars = vault.selectedPillars || [];
  var targetRoleId = forgeData.targetRoleId || null;
  var signature = forgeData.signature || null;
  var offersArray = forgeData.offersArray || [];
  var duelResults = forgeData.duelResults || [];

  // Compute density
  var nightmares = getActiveCauchemars();
  var density = computeDensityScore({ bricks: bricks, nightmares: nightmares, pillars: vault, signature: signature, duelResults: duelResults, cvBricks: [] });

  // Brew state
  var brewWeeksSt = useState([]);
  var brewWeeks = brewWeeksSt[0];
  var setBrewWeeks = brewWeeksSt[1];

  var instructionsSt = useState([]);
  var instructions = instructionsSt[0];
  var setInstructions = instructionsSt[1];

  var savingSt = useState(false);
  var saving = savingSt[0];
  var setSaving = savingSt[1];

  var savedSt = useState(false);
  var saved = savedSt[0];
  var setSaved = savedSt[1];

  // Current week declaration state: { 1: { published, rh, n1, peers, other, signal }, 2: ... }
  var currentWeekSt = useState({});
  var currentWeek = currentWeekSt[0];
  var setCurrentWeek = currentWeekSt[1];

  var weekCount = 0;
  var weekStarts = {};
  brewWeeks.forEach(function(w) { weekStarts[w.week_start] = true; });
  weekCount = Object.keys(weekStarts).length;

  var coverageMap = computeCoverageMap(brewWeeks);

  // Initialize cauchemars from offers if available
  useEffect(function() {
    if (targetRoleId && offersArray.length > 0) {
      var merged = null;
      offersArray.forEach(function(o) {
        if (o.parsedSignals) merged = o.parsedSignals;
      });
      setActiveCauchemarsGlobal(buildActiveCauchemars(merged, targetRoleId));
    } else if (targetRoleId) {
      setActiveCauchemarsGlobal(buildActiveCauchemars(null, targetRoleId));
    }
  }, [targetRoleId]);

  // Load brew data on mount
  useEffect(function() {
    if (!user || user.id === "dev") return;
    Promise.all([loadBrewWeeks(user.id), loadBrewInstructions(user.id)]).then(function(results) {
      setBrewWeeks(results[0] || []);
      setInstructions(results[1] || []);
    });
  }, [user]);

  // Initialize current week form from previous week data
  useEffect(function() {
    if (pillars.length === 0) return;
    var monday = getMonday(new Date());
    var thisWeekRows = brewWeeks.filter(function(w) { return w.week_start === monday; });
    var prevWeeks = brewWeeks.filter(function(w) { return w.week_start !== monday; });

    var init = {};
    pillars.forEach(function(p, idx) {
      var pid = idx + 1;
      var existing = thisWeekRows.find(function(w) { return w.pillar_id === pid; });
      var prev = prevWeeks.filter(function(w) { return w.pillar_id === pid; }).sort(function(a, b) { return a.week_start > b.week_start ? -1 : 1; })[0];
      if (existing) {
        init[pid] = {
          published: existing.published,
          rh: existing.reactions_rh,
          n1: existing.reactions_n1,
          peers: existing.reactions_peers,
          other: existing.reactions_other,
          signal: existing.signal_text || "",
        };
      } else {
        init[pid] = {
          published: false,
          rh: prev ? prev.reactions_rh : 0,
          n1: prev ? prev.reactions_n1 : 0,
          peers: prev ? prev.reactions_peers : 0,
          other: prev ? prev.reactions_other : 0,
          signal: "",
          _prefilled: !!prev,
        };
      }
    });
    setCurrentWeek(init);
  }, [pillars.length, brewWeeks.length]);

  // GATE check
  var gateBlocked = false;
  var gateMessage = null;
  if (density.score < 70) {
    gateBlocked = true;
    gateMessage = "Ton arsenal n'est pas prêt. Retourne à la Forge. Le Brew s'ouvre à 70% de densité.";
  } else if (!paid) {
    gateBlocked = true;
    gateMessage = "Le Brew est réservé aux abonnés. ~19€/mois. Livrables calibrés + Brew actif + négociation salariale.";
  }

  if (gateBlocked) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>ABNEG@TION — BREW</div>
        <div style={{ fontSize: 14, color: "#ccd6f6", marginBottom: 20, maxWidth: 400, lineHeight: 1.6 }}>{gateMessage}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/sprint" style={{ padding: "8px 20px", background: "linear-gradient(135deg, #e94560, #c81d4e)", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 12, fontWeight: 700 }}>Retour à la Forge</a>
          {!paid && density.score >= 70 && (
            <a href="/paywall" style={{ padding: "8px 20px", background: "#0f3460", color: "#ccd6f6", borderRadius: 8, textDecoration: "none", fontSize: 12, fontWeight: 700 }}>S'abonner</a>
          )}
        </div>
        <div style={{ fontSize: 11, color: "#495670", marginTop: 16 }}>Densité actuelle : {density.score}%</div>
      </div>
    );
  }

  /* ── Save handler ──────────────────────────────────────── */

  function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    var monday = getMonday(new Date());
    var rows = [];
    pillars.forEach(function(p, idx) {
      var pid = idx + 1;
      var data = currentWeek[pid] || {};
      rows.push({
        pillar_id: pid,
        published: data.published || false,
        reactions_rh: parseInt(data.rh, 10) || 0,
        reactions_n1: parseInt(data.n1, 10) || 0,
        reactions_peers: parseInt(data.peers, 10) || 0,
        reactions_other: parseInt(data.other, 10) || 0,
        signal_text: data.signal || null,
      });
    });

    if (user.id === "dev") {
      // Dev mode: just update local state
      var fakeWeeks = rows.map(function(r) {
        return Object.assign({ id: Date.now() + "_" + r.pillar_id, user_id: "dev", week_start: monday, created_at: new Date().toISOString(), dms_generated: 0 }, r);
      });
      setBrewWeeks(function(prev) {
        var filtered = prev.filter(function(w) { return w.week_start !== monday; });
        return fakeWeeks.concat(filtered);
      });
      setSaving(false);
      setSaved(true);
      setTimeout(function() { setSaved(false); }, 2000);
      return;
    }

    saveBrewWeek(user.id, monday, rows).then(function() {
      return loadBrewWeeks(user.id);
    }).then(function(fresh) {
      setBrewWeeks(fresh || []);
      setSaving(false);
      setSaved(true);
      setTimeout(function() { setSaved(false); }, 2000);
    });
  }

  /* ── Generate posts (from linkedin.js) ─────────────────── */

  var posts = [];
  try {
    var rawPosts = generateLinkedInPosts(bricks, vault, targetRoleId);
    if (Array.isArray(rawPosts)) posts = rawPosts;
  } catch (e) {}

  /* ── Dilts progress per pillar ─────────────────────────── */

  function getDiltsForPillar(pillarId) {
    var pillarPosts = posts.filter(function(p) { return p.pillarId === String(pillarId) || p.pillar === (pillars[pillarId - 1] && pillars[pillarId - 1].title); });
    if (pillarPosts.length === 0) return { level: null, target: null, count: 0 };
    var lastLevel = pillarPosts[pillarPosts.length - 1].diltsLevel || 2;
    var target = lastLevel >= 6 ? null : Math.min(lastLevel + 2, 6);
    return { level: lastLevel, target: target, count: pillarPosts.length };
  }

  /* ── Publish recommendation ────────────────────────────── */

  function getPublishRecommendation() {
    // Priority 1: pillar with 0 published weeks
    for (var i = 1; i <= 4; i++) {
      if (i > pillars.length) break;
      if ((coverageMap[i] || 0) === 0) {
        var dilts = getDiltsForPillar(i);
        return { pillarId: i, message: "Ton pilier " + i + " (" + pillars[i - 1].title + ") n'existe pas sur ton profil. Dépose ta première trace cette semaine.", type: "no_trace", dilts: dilts };
      }
    }

    // Priority 2: pillar with 1 post + Dilts stagnation
    for (var i = 1; i <= Math.min(4, pillars.length); i++) {
      if ((coverageMap[i] || 0) === 1) {
        var dilts = getDiltsForPillar(i);
        var targetLabel = dilts.target ? DILTS_LEVEL_NAMES[dilts.target] || "niveau " + dilts.target : null;
        return { pillarId: i, message: "Ton pilier " + i + " (" + pillars[i - 1].title + ") a une seule trace au niveau " + (dilts.level || 2) + ". Dépose une deuxième trace" + (targetLabel ? " au niveau " + dilts.target + " (" + targetLabel + ")" : "") + ".", type: "under_covered", dilts: dilts };
      }
    }

    // Priority 3: All covered + stagnation on a pillar
    var stagnatingPillar = null;
    for (var i = 1; i <= Math.min(4, pillars.length); i++) {
      var dilts = getDiltsForPillar(i);
      var pillarPostsForStagnation = posts.filter(function(p) { return p.pillarId === String(i) || p.pillar === (pillars[i - 1] && pillars[i - 1].title); });
      var stagnation = detectDiltsStagnation(pillarPostsForStagnation);
      if (stagnation.stagnating) {
        stagnatingPillar = { pillarId: i, level: stagnation.level, dilts: dilts };
        break;
      }
    }
    if (stagnatingPillar) {
      var target = Math.min((stagnatingPillar.level || 2) + 2, 6);
      return { pillarId: stagnatingPillar.pillarId, message: "Ton pilier " + stagnatingPillar.pillarId + " (" + pillars[stagnatingPillar.pillarId - 1].title + ") stagne au niveau " + stagnatingPillar.level + ". Monte au niveau " + target + " (" + (DILTS_LEVEL_NAMES[target] || "") + ").", type: "stagnation", dilts: stagnatingPillar.dilts };
    }

    // Priority 4: All covered + progressing → least dense
    var leastDense = 1;
    var leastCount = coverageMap[1] || 0;
    for (var i = 2; i <= Math.min(4, pillars.length); i++) {
      if ((coverageMap[i] || 0) < leastCount) { leastCount = coverageMap[i] || 0; leastDense = i; }
    }
    return { pillarId: leastDense, message: "Tes preuves se diversifient. Publie le prochain post sur ton pilier le moins dense : pilier " + leastDense + " (" + pillars[leastDense - 1].title + ").", type: "diversify", dilts: getDiltsForPillar(leastDense) };
  }

  var pubRecommendation = getPublishRecommendation();

  /* ── Contact DM generation ─────────────────────────────── */

  function generateBrewDM(pillarId) {
    if (bricks.filter(function(b) { return b.status === "validated"; }).length === 0) return null;
    var pillar = pillars[pillarId - 1];
    var pillarContext = pillar ? { pillarId: pillarId, pillarTitle: pillar.title, pillarTheme: pillar.desc || pillar.title } : null;
    var dilts = getDiltsForPillar(pillarId);
    var diltsClosingLevel = dilts.level || null;
    var targetOffer = offersArray.length > 0 ? offersArray[0] : null;
    var scripts = generateContactScripts(bricks, targetRoleId, targetOffer, null, pillarContext, diltsClosingLevel);
    return scripts;
  }

  /* ── Prepare regeneration ──────────────────────────────── */

  function handlePrepareRegeneration(pillarId, targetLevel) {
    if (user.id === "dev") {
      setInstructions(function(prev) {
        return [{ id: Date.now() + "", pillar_id: pillarId, target_dilts_level: targetLevel, status: "pending", created_at: new Date().toISOString() }].concat(prev);
      });
      return;
    }
    createBrewInstruction(user.id, pillarId, targetLevel).then(function() {
      return loadBrewInstructions(user.id);
    }).then(function(fresh) {
      setInstructions(fresh || []);
    });
  }

  /* ── RENDER ─────────────────────────────────────────────── */

  var recommendedPost = posts.find(function(p) {
    return p.pillarId === String(pubRecommendation.pillarId) || p.pillar === (pillars[pubRecommendation.pillarId - 1] && pillars[pubRecommendation.pillarId - 1].title);
  });

  var contactDom = dominantCategory(publishedWeeks(brewWeeks, pubRecommendation.pillarId));
  var contactScripts = generateBrewDM(pubRecommendation.pillarId);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2 }}>ABNEG@TION — BREW</div>
          <div style={{ fontSize: 10, color: "#495670", marginTop: 2 }}>Cockpit stratégique de preuves LinkedIn</div>
        </div>
        <a href="/sprint" style={{ fontSize: 11, color: "#8892b0", textDecoration: "none" }}>← La Forge</a>
      </div>

      {/* Density + week count bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ background: "#111125", borderRadius: 8, padding: "8px 14px", fontSize: 11 }}>
          <span style={{ color: "#495670" }}>Densité : </span>
          <span style={{ color: density.score >= 70 ? "#4ecca3" : "#e94560", fontWeight: 700 }}>{density.score}%</span>
        </div>
        <div style={{ background: "#111125", borderRadius: 8, padding: "8px 14px", fontSize: 11 }}>
          <span style={{ color: "#495670" }}>Semaines déclarées : </span>
          <span style={{ color: "#ccd6f6", fontWeight: 700 }}>{weekCount}</span>
        </div>
        <div style={{ background: "#111125", borderRadius: 8, padding: "8px 14px", fontSize: 11 }}>
          <span style={{ color: "#495670" }}>Piliers couverts : </span>
          <span style={{ color: "#ccd6f6", fontWeight: 700 }}>{Object.keys(coverageMap).filter(function(k) { return coverageMap[k] > 0; }).length}/{pillars.length}</span>
        </div>
      </div>

      {/* ══════ ZONE DÉCLARER ══════ */}
      <div style={{ background: "#111125", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>DÉCLARER</div>
        <div style={{ fontSize: 11, color: "#495670", marginBottom: 12 }}>Qu'as-tu publié cette semaine ? Qui a réagi ?</div>

        {pillars.map(function(pillar, idx) {
          var pid = idx + 1;
          var data = currentWeek[pid] || {};
          var isPublished = data.published;

          return (
            <div key={pid} style={{ background: "#0d0d1a", borderRadius: 10, padding: 12, marginBottom: 10, borderLeft: "3px solid " + (isPublished ? "#4ecca3" : "#1a1a3e") }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isPublished ? 8 : 0 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isPublished ? "#ccd6f6" : "#495670" }}>Pilier {pid} — {pillar.title}</span>
                  {pillar.desc && <div style={{ fontSize: 10, color: "#495670", marginTop: 2 }}>{pillar.desc}</div>}
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 11, color: isPublished ? "#4ecca3" : "#495670" }}>
                  <input type="checkbox" checked={isPublished || false} onChange={function() {
                    setCurrentWeek(function(prev) {
                      var next = Object.assign({}, prev);
                      next[pid] = Object.assign({}, next[pid], { published: !isPublished });
                      return next;
                    });
                  }} style={{ accentColor: "#4ecca3" }} />
                  Publié
                </label>
              </div>

              {isPublished && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                    {CATEGORY_KEYS.map(function(cat) {
                      var fieldKey = cat === "rh" ? "rh" : cat === "n1" ? "n1" : cat === "peers" ? "peers" : "other";
                      return (
                        <div key={cat}>
                          <div style={{ fontSize: 10, color: CATEGORY_COLORS[cat], marginBottom: 2 }}>{CATEGORY_LABELS[cat]}</div>
                          <input type="number" min="0" value={data[fieldKey] || 0} onChange={function(e) {
                            setCurrentWeek(function(prev) {
                              var next = Object.assign({}, prev);
                              var updated = Object.assign({}, next[pid]);
                              updated[fieldKey] = e.target.value;
                              updated._prefilled = false;
                              next[pid] = updated;
                              return next;
                            });
                          }} placeholder={weekCount === 0 ? "Combien de " + CATEGORY_LABELS[cat].toLowerCase() + " ont réagi ?" : ""} style={{
                            width: "100%", background: "#1a1a2e", border: "1px solid #495670", borderRadius: 6,
                            color: data._prefilled ? "#495670" : "#ccd6f6", fontSize: 12, padding: "6px 8px",
                            fontFamily: "Inter, sans-serif",
                          }} />
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#495670", marginBottom: 2 }}>Un signal fort cette semaine ?</div>
                    <input type="text" value={data.signal || ""} onChange={function(e) {
                      setCurrentWeek(function(prev) {
                        var next = Object.assign({}, prev);
                        next[pid] = Object.assign({}, next[pid], { signal: e.target.value });
                        return next;
                      });
                    }} placeholder="Optionnel — un fait saillant" style={{
                      width: "100%", background: "#1a1a2e", border: "1px solid #495670", borderRadius: 6,
                      color: "#ccd6f6", fontSize: 11, padding: "6px 8px", fontFamily: "Inter, sans-serif",
                    }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <button onClick={handleSave} disabled={saving} style={{
            padding: "8px 20px", fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: "pointer", border: "none",
            background: saving ? "#1a1a3e" : "linear-gradient(135deg, #e94560, #c81d4e)",
            color: saving ? "#495670" : "#fff",
          }}>{saving ? "Enregistrement..." : "Enregistrer la semaine"}</button>
          {saved && <span style={{ fontSize: 11, color: "#4ecca3", fontWeight: 600 }}>✓ Semaine enregistrée</span>}
        </div>
      </div>

      {/* ══════ ZONE LIRE ══════ */}
      <div style={{ background: "#111125", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>LIRE</div>

        {weekCount === 0 ? (
          <div style={{ fontSize: 11, color: "#495670", lineHeight: 1.6 }}>
            Déclare ta première semaine pour voir les analyses. La carte de visibilité, les tendances et le diagnostic apparaîtront ici.
          </div>
        ) : (
          <div>
            {/* Analyse 1 — Carte de visibilité */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 700, marginBottom: 8 }}>Carte de visibilité des traces</div>
              {pillars.map(function(pillar, idx) {
                var pid = idx + 1;
                var published = publishedWeeks(brewWeeks, pid);
                if (published.length === 0) return (
                  <div key={pid} style={{ fontSize: 10, color: "#495670", marginBottom: 6 }}>Pilier {pid} ({pillar.title}) — aucune trace</div>
                );
                var dom = dominantCategory(published);
                var grandTotal = dom.totals.rh + dom.totals.n1 + dom.totals.peers + dom.totals.other;
                if (grandTotal === 0) return (
                  <div key={pid} style={{ fontSize: 10, color: "#495670", marginBottom: 6 }}>Pilier {pid} ({pillar.title}) — publié, 0 réaction déclarée</div>
                );

                return (
                  <div key={pid} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: "#ccd6f6", fontWeight: 600, marginBottom: 4 }}>Pilier {pid} — {pillar.title}</div>
                    <div style={{ display: "flex", height: 14, borderRadius: 4, overflow: "hidden", marginBottom: 3 }}>
                      {CATEGORY_KEYS.map(function(cat) {
                        var val = dom.totals[cat];
                        var pct = grandTotal > 0 ? (val / grandTotal * 100) : 0;
                        if (pct < 1) return null;
                        return <div key={cat} style={{ width: pct + "%", background: CATEGORY_COLORS[cat], minWidth: pct > 3 ? "auto" : 0 }} title={CATEGORY_LABELS[cat] + ": " + val}></div>;
                      })}
                    </div>
                    <div style={{ fontSize: 10, color: "#8892b0" }}>
                      Tes preuves sont vues par {Math.round(dom.totals[dom.key] / grandTotal * 100)}% de {dom.label}.
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Analyse 2 — Tendance */}
            {weekCount >= 2 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 700, marginBottom: 8 }}>Tendance de visibilité</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {pillars.map(function(pillar, idx) {
                    var pid = idx + 1;
                    var trend = computeTrend(brewWeeks, pid);
                    var arrow = trendArrow(trend);
                    return (
                      <div key={pid} style={{ background: "#0d0d1a", borderRadius: 8, padding: "6px 12px", fontSize: 11 }}>
                        <span style={{ color: "#ccd6f6" }}>P{pid} </span>
                        <span style={{ color: arrow.color, fontWeight: 700, fontSize: 14 }}>{arrow.symbol}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Analyse 3 — Diagnostic */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 700, marginBottom: 8 }}>Diagnostic actionnable</div>
              {pillars.map(function(pillar, idx) {
                var pid = idx + 1;
                var diag = computeDiagnostic(brewWeeks, pid, pillar.title);
                if (!diag) return (
                  <div key={pid} style={{ fontSize: 10, color: "#495670", marginBottom: 4 }}>Pilier {pid} : pas encore de trace.</div>
                );
                return (
                  <div key={pid} style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 6, paddingLeft: 8, borderLeft: "2px solid #1a1a3e" }}>
                    {diag}
                  </div>
                );
              })}
            </div>

            {/* Analyse 4 — Progression Dilts */}
            <div>
              <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 700, marginBottom: 8 }}>Progression Dilts</div>
              {pillars.map(function(pillar, idx) {
                var pid = idx + 1;
                var dilts = getDiltsForPillar(pid);
                if (!dilts.level) return (
                  <div key={pid} style={{ fontSize: 10, color: "#495670", marginBottom: 4 }}>Pilier {pid} ({pillar.title}) : aucun post généré.</div>
                );
                var targetLabel = dilts.target ? DILTS_LEVEL_NAMES[dilts.target] || "" : null;
                return (
                  <div key={pid} style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 6, paddingLeft: 8, borderLeft: "2px solid #1a1a3e" }}>
                    Pilier {pid} ({pillar.title}) : {dilts.count} trace{dilts.count > 1 ? "s" : ""} au niveau {dilts.level} ({DILTS_LEVEL_NAMES[dilts.level] || ""}).
                    {dilts.target ? " Cible : déposer une trace niveau " + dilts.target + " (" + targetLabel + "). Le recruteur qui scrolle ton profil doit voir la montée." : " Pilier au sommet. Diversifie."}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ══════ ZONE AGIR ══════ */}
      <div style={{ background: "#111125", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>AGIR</div>

        {/* Bloc PUBLIER */}
        <div style={{ background: "#0d0d1a", borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>PUBLIER</div>
          <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 10 }}>
            {pubRecommendation.message}
          </div>

          {recommendedPost && (
            <div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.6, whiteSpace: "pre-wrap", background: "#111125", borderRadius: 8, padding: 10, marginBottom: 8, maxHeight: 200, overflow: "auto" }}>
                {recommendedPost.text}
              </div>
              {recommendedPost.firstComment && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: "#495670", marginBottom: 2 }}>Premier commentaire :</div>
                  <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5, background: "#111125", borderRadius: 6, padding: 8 }}>{recommendedPost.firstComment}</div>
                </div>
              )}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <CopyBtn text={recommendedPost.text} label="Copier le post" />
                {recommendedPost.firstComment && <CopyBtn text={recommendedPost.firstComment} label="Copier le commentaire" />}
                {pubRecommendation.dilts && pubRecommendation.dilts.target && (
                  <button onClick={function() { handlePrepareRegeneration(pubRecommendation.pillarId, pubRecommendation.dilts.target); }} style={{
                    padding: "5px 12px", background: "#1a1a2e", color: "#ff9800", border: "1px solid #ff9800",
                    borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 11,
                  }}>Préparer la régénération</button>
                )}
              </div>
            </div>
          )}

          {!recommendedPost && (
            <div style={{ fontSize: 10, color: "#495670" }}>Aucun post généré pour ce pilier. Retourne à la Forge pour générer tes posts LinkedIn.</div>
          )}

          {instructions.length > 0 && (
            <div style={{ marginTop: 10, padding: 8, background: "#1a1a2e", borderRadius: 8, borderLeft: "3px solid #ff9800" }}>
              <div style={{ fontSize: 10, color: "#ff9800", fontWeight: 600, marginBottom: 4 }}>Instructions en attente</div>
              {instructions.map(function(inst) {
                return (
                  <div key={inst.id} style={{ fontSize: 10, color: "#8892b0", marginBottom: 2 }}>
                    Pilier {inst.pillar_id} → régénérer au niveau {inst.target_dilts_level} ({DILTS_LEVEL_NAMES[inst.target_dilts_level] || ""})
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bloc LIKER */}
        {weekCount >= 1 && (
          <div style={{ background: "#0d0d1a", borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>LIKER</div>
            <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.6 }}>
              Cette semaine, like 3-5 publications de <span style={{ color: CATEGORY_COLORS[contactDom.key], fontWeight: 600 }}>{contactDom.label}</span> dans ton secteur. Cible les profils que tu contacteras la semaine prochaine.
            </div>
            <div style={{ fontSize: 10, color: "#495670", marginTop: 6 }}>Le like précède le DM. Le recruteur qui reçoit ton message après avoir vu ton profil dans ses notifications réagit différemment.</div>
          </div>
        )}

        {/* Bloc CONTACTER */}
        {weekCount >= 1 && (
          <div style={{ background: "#0d0d1a", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>CONTACTER</div>
            <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 8 }}>
              Ton pilier {pubRecommendation.pillarId} ({pillars[pubRecommendation.pillarId - 1] && pillars[pubRecommendation.pillarId - 1].title}) attire des {contactDom.label}. Voici ton DM calibré.
            </div>
            <div style={{ fontSize: 10, color: "#495670", marginBottom: 8 }}>2-3 contacts cette semaine. Personnalise le prénom avant d'envoyer.</div>

            {contactScripts && contactScripts.dm && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: "#8892b0", fontWeight: 600, marginBottom: 4 }}>DM LinkedIn</div>
                <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5, background: "#111125", borderRadius: 6, padding: 8, whiteSpace: "pre-wrap" }}>{contactScripts.dm}</div>
                <div style={{ marginTop: 4 }}><CopyBtn text={contactScripts.dm} label="Copier le DM" /></div>
              </div>
            )}

            {contactScripts && contactScripts.email && (
              <div>
                <div style={{ fontSize: 10, color: "#8892b0", fontWeight: 600, marginBottom: 4 }}>Email</div>
                <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5, background: "#111125", borderRadius: 6, padding: 8, whiteSpace: "pre-wrap" }}>{contactScripts.email}</div>
                <div style={{ marginTop: 4 }}><CopyBtn text={contactScripts.email} label="Copier l'email" /></div>
              </div>
            )}

            {!contactScripts && (
              <div style={{ fontSize: 10, color: "#495670" }}>Pas assez de briques validées pour générer un DM. Retourne à la Forge.</div>
            )}
          </div>
        )}

        {weekCount === 0 && (
          <div>
            {/* Bloc PUBLIER only when weekCount = 0, LIKER and CONTACTER hidden */}
            <div style={{ fontSize: 11, color: "#495670", marginTop: 8 }}>Déclare ta première semaine pour débloquer les blocs LIKER et CONTACTER.</div>
          </div>
        )}
      </div>
    </div>
  );
}
