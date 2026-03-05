"use client";
import { useState, useRef, useCallback } from "react";
import { CATEGORY_LABELS, ELASTICITY_LABELS, KPI_REFERENCE, MARKET_DATA, SCRIPT_CHANNELS, TARGET_ROLES } from "@/lib/sprint/references";
import { computeCauchemarCoverage, computeCauchemarCoverageDetailed, computeDensityScore, computeNegotiationBrief, detectBluffRisk, formatCost, getActiveCauchemars } from "@/lib/sprint/scoring";
import { auditBrickVulnerability, computeCrossRoleMatching } from "@/lib/sprint/bricks";
import { auditDeliverable, computeZones, generateBio, generateCV, generateContactScripts, generateDiagnosticQuestions, generateImpactReport, generatePlan90, generateTransitionScript, scoreContactScript } from "@/lib/sprint/generators";
import { detectSignalType, generateLinkedInComment, generateLinkedInPosts, generatePositions, generateSignalScript, generateSleepComment, generateWeeklyPosts, proposeSleepBrick } from "@/lib/sprint/linkedin";
import { analyzeDiltsProgression, checkDiltsSequence, computeDiltsTarget, DILTS_LEVELS, getDiltsLabel, getDiltsThermometerState } from "@/lib/sprint/dilts";
import { Bar, CopyBtn } from "./ui";
import { auditAnonymization } from "@/lib/sprint/analysis";
import { CrossRoleInsight, MarketMap } from "./panels";

export function ImpactReportPanel({ bricks, vault, targetRoleId, trajectoryToggle }) {
  var sectionSt = useState(null);
  var openSection = sectionSt[0];
  var setOpenSection = sectionSt[1];

  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  var takes = bricks.filter(function(b) { return b.brickType === "take" && b.status === "validated"; });
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  var density = computeDensityScore(bricks);

  var chiffreBricks = validated.filter(function(b) { return b.brickCategory === "chiffre"; });
  var decisionBricks = validated.filter(function(b) { return b.brickCategory === "decision"; });
  var influenceBricks = validated.filter(function(b) { return b.brickCategory === "influence"; });
  var cicatrices = validated.filter(function(b) { return b.brickType === "cicatrice"; });
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });
  var missions = bricks.filter(function(b) { return b.type === "mission"; });

  var coverage = computeCauchemarCoverage(bricks);
  var coveredCount = coverage.filter(function(c) { return c.covered; }).length;
  var zones = computeZones(bricks, targetRoleId);
  var unfairBrick = bricks.find(function(b) { return b.type === "unfair_advantage" && b.status === "validated"; });

  var copyText = generateImpactReport(bricks, vault, targetRoleId, trajectoryToggle, density);

  var sBox = { background: "#1a1a2e", borderRadius: 8, padding: "10px 12px", marginBottom: 8 };
  var sHead = { fontSize: 10, color: "#495670", fontWeight: 600, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" };

  function toggle(id) { setOpenSection(openSection === id ? null : id); }

  return (
    <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 14 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>Rapport d'impact</div>
          <div style={{ fontSize: 11, color: "#495670", marginTop: 2 }}>
            {roleData ? roleData.role : "Non défini"} {"\u00B7"} {trajectoryToggle === "j_y_suis" ? "J'y suis" : "J'y vais"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ccd6f6" }}>{density ? density.score : 0}%</div>
          <div style={{ fontSize: 10, color: "#495670" }}>blindage</div>
        </div>
      </div>

      {/* DENSITY BAR */}
      <div style={{ width: "100%", background: "#16213e", borderRadius: 4, height: 4, marginBottom: 16 }}>
        <div style={{ width: Math.min(100, density ? density.score : 0) + "%", height: "100%", background: "#ccd6f6", borderRadius: 4, transition: "width 0.4s ease" }} />
      </div>

      {/* ARSENAL COMPACT */}
      <div style={sBox}>
        <div style={sHead}>Arsenal</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {chiffreBricks.length > 0 && <div style={{ fontSize: 12, color: "#ccd6f6" }}>{chiffreBricks.length} chiffre{chiffreBricks.length > 1 ? "s" : ""}</div>}
          {decisionBricks.length > 0 && <div style={{ fontSize: 12, color: "#ccd6f6" }}>{decisionBricks.length} decision{decisionBricks.length > 1 ? "s" : ""}</div>}
          {influenceBricks.length > 0 && <div style={{ fontSize: 12, color: "#ccd6f6" }}>{influenceBricks.length} influence{influenceBricks.length > 1 ? "s" : ""}</div>}
          {cicatrices.length > 0 && <div style={{ fontSize: 12, color: "#ccd6f6" }}>{cicatrices.length} cicatrice{cicatrices.length > 1 ? "s" : ""}</div>}
          {takes.length > 0 && <div style={{ fontSize: 12, color: "#ccd6f6" }}>{takes.length} take{takes.length > 1 ? "s" : ""}</div>}
          {missions.length > 0 && <div style={{ fontSize: 12, color: "#e94560" }}>{missions.length} mission{missions.length > 1 ? "s" : ""}</div>}
        </div>
        {elasticBricks.length > 0 && (
          <div style={{ fontSize: 11, color: "#8892b0", marginTop: 6 }}>{elasticBricks.length} brique{elasticBricks.length > 1 ? "s" : ""} sur marché élastique</div>
        )}
      </div>

      {/* CAUCHEMARS */}
      <div style={sBox}>
        <button onClick={function() { toggle("cauchemars"); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={sHead}>Cauchemars couverts</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>{coveredCount}/{getActiveCauchemars().length}</span>
          </div>
        </button>
        {coverage.map(function(c) {
          var cauch = getActiveCauchemars().find(function(cc) { return cc.id === c.id; });
          var isOpen = openSection === "cauchemars";
          return (
            <div key={c.id} style={{ marginBottom: 6, paddingLeft: 8, borderLeft: c.covered ? "2px solid #495670" : "2px solid #e94560" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: c.covered ? "#ccd6f6" : "#e94560" }}>{c.label}</div>
                <div style={{ fontSize: 10, color: c.covered ? "#495670" : "#e94560" }}>{c.covered ? "couvert" : "trou"}</div>
              </div>
              {isOpen && c.covered && cauch && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: "#8892b0" }}>Direct : {formatCost(cauch.costRange[0])}-{formatCost(cauch.costRange[1])}/an</div>
                  {cauch.costSymbolique && <div style={{ fontSize: 11, color: "#495670", marginTop: 2 }}>Symbolique : {cauch.costSymbolique}</div>}
                  {cauch.costSystemique && <div style={{ fontSize: 11, color: "#495670", marginTop: 2 }}>Systémique : {cauch.costSystemique}</div>}
                </div>
              )}
              {isOpen && !c.covered && (
                <div style={{ fontSize: 11, color: "#e94560", marginTop: 2 }}>Aucune brique ne couvre ce cauchemar. Le recruteur contrôlera cette zone.</div>
              )}
            </div>
          );
        })}
        {openSection !== "cauchemars" && <div style={{ fontSize: 10, color: "#495670", marginTop: 4 }}>Appuie pour voir le détail des coûts</div>}
      </div>

      {/* ZONES */}
      {zones && (zones.excellence.length > 0 || zones.rupture.length > 0) && (
        <div style={sBox}>
          <div style={sHead}>Cartographie</div>
          {zones.excellence.length > 0 && (
            <div style={{ marginBottom: zones.rupture.length > 0 ? 10 : 0 }}>
              <div style={{ fontSize: 11, color: "#8892b0", marginBottom: 4 }}>EXCELLENCE</div>
              {zones.excellence.map(function(z) {
                return (
                  <div key={z.kpi} style={{ paddingLeft: 8, borderLeft: "2px solid #495670", marginBottom: 4 }}>
                    <div style={{ fontSize: 12, color: "#ccd6f6" }}>{z.kpi}</div>
                    <div style={{ fontSize: 10, color: "#495670" }}>{z.brickCount} preuves ({z.types.join(" + ")})</div>
                  </div>
                );
              })}
            </div>
          )}
          {zones.rupture.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: "#e94560", marginBottom: 4 }}>RUPTURE</div>
              {zones.rupture.map(function(z) {
                return (
                  <div key={z.kpi} style={{ paddingLeft: 8, borderLeft: "2px solid #e94560", marginBottom: 4 }}>
                    <div style={{ fontSize: 12, color: "#e94560" }}>{z.kpi}</div>
                    <div style={{ fontSize: 10, color: "#495670" }}>{z.reason}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PROFIL DE VALEUR — 9 GRID */}
      {zones && zones.profileGrid.length > 0 && (
        <div style={sBox}>
          <button onClick={function() { toggle("profil"); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={sHead}>Profil de valeur</div>
              <span style={{ fontSize: 12, color: "#ccd6f6" }}>
                {zones.profileGrid.filter(function(p) { return p.checked; }).length}/{zones.profileGrid.length}
              </span>
            </div>
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {zones.profileGrid.map(function(p) {
              return (
                <div key={p.label} style={{ display: "flex", gap: 6, alignItems: "flex-start", padding: "4px 0" }}>
                  <span style={{ fontSize: 11, color: p.checked ? "#ccd6f6" : "#e94560", flexShrink: 0, lineHeight: 1, marginTop: 1 }}>{p.checked ? "\u25CF" : "\u25CB"}</span>
                  <div>
                    <div style={{ fontSize: 11, color: p.checked ? "#ccd6f6" : "#495670" }}>{p.label}</div>
                    {openSection === "profil" && p.checked && p.proof && (
                      <div style={{ fontSize: 10, color: "#495670" }}>{p.proof}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {openSection !== "profil" && (
            <div style={{ fontSize: 10, color: "#495670", marginTop: 4 }}>Appuie pour voir les preuves</div>
          )}
        </div>
      )}

      {/* AVANTAGE INJUSTE */}
      {unfairBrick && (
        <div style={sBox}>
          <div style={sHead}>Avantage injuste</div>
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5 }}>{unfairBrick.text}</div>
          {elasticBricks.some(function(eb) { return eb.kpi === unfairBrick.kpi; }) && (
            <div style={{ fontSize: 10, color: "#8892b0", marginTop: 4 }}>Confirmé par brique chiffre + signal collègues. Non-rattrapable par la formation.</div>
          )}
        </div>
      )}

      {/* TAKES */}
      {takes.length > 0 && (
        <div style={sBox}>
          <div style={sHead}>Prises de position ({takes.length})</div>
          {takes.map(function(t, i) {
            return <div key={i} style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.4, marginBottom: 4 }}>{t.text.length > 80 ? t.text.slice(0, 80) + "..." : t.text}</div>;
          })}
        </div>
      )}

      {/* NEXT RDV */}
      <div style={{ fontSize: 11, color: "#495670", marginTop: 8, marginBottom: 12 }}>
        Prochain Rendez-vous : {roleData ? roleData.cadenceLabel : "dans 30 jours"}. Ce rapport s'épaissit à chaque itération.
      </div>

      {/* COPY — Option 2 structured text */}
      <CopyBtn text={copyText} label="Copier le rapport complet" />
    </div>
  );
}

/* ==============================
   DELIVERABLE COMPONENTS
   ============================== */

/* ==============================
   ITEM 1 — AUDIT AUTOMATIQUE DES LIVRABLES
   4 principes : non-générique, preuve, destinataire d'abord, calibrage canal
   ============================== */


export function Deliverable({ emoji, title, content, lines, auditResult, onCorrect }) {
  var st = useState(false);
  var open = st[0];
  var setOpen = st[1];
  var rows = content.split("\n");
  var preview = rows.slice(0, lines || 3).join("\n");
  var hasMore = rows.length > (lines || 3);
  return (
    <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 10, border: "1px solid " + (auditResult ? (auditResult.score === 4 ? "#4ecca3" : auditResult.score >= 2 ? "#ff9800" : "#e94560") : "#16213e") }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{emoji}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>{title}</span>
          {auditResult && <span style={{ fontSize: 10, fontWeight: 700, color: auditResult.score === 4 ? "#4ecca3" : auditResult.score >= 2 ? "#ff9800" : "#e94560" }}>{auditResult.score}/4</span>}
        </div>
        <CopyBtn text={content} label={auditResult && auditResult.score < 4 ? "Copier quand même" : undefined} />
      </div>
      <div style={{
        background: "#1a1a2e", borderRadius: 8, padding: 12, fontSize: 12, color: "#8892b0", lineHeight: 1.6,
        whiteSpace: "pre-wrap", fontFamily: "inherit", maxHeight: open ? "none" : 100, overflow: "hidden", position: "relative",
      }}>
        {open ? content : preview}
        {!open && hasMore && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: "linear-gradient(transparent, #1a1a2e)" }} />}
      </div>
      {hasMore && (
        <button onClick={function() { setOpen(!open); }} style={{
          background: "none", border: "none", color: "#e94560", fontSize: 11, fontWeight: 600, cursor: "pointer", marginTop: 6, padding: 0,
        }}>{open ? "\u25B2 Réduire" : "\u25BC Voir tout"}</button>
      )}
      {auditResult && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {auditResult.tests.map(function(t) {
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10, color: t.passed ? "#4ecca3" : "#e94560" }}>{t.passed ? "\u2714" : "\u2718"}</span>
                  <span style={{ fontSize: 9, color: t.passed ? "#8892b0" : "#ccd6f6", fontWeight: t.passed ? 400 : 600 }}>{t.label}</span>
                </div>
              );
            })}
          </div>
          {auditResult.failed.length > 0 && (
            <div style={{ marginTop: 6 }}>
              {auditResult.failed.map(function(f) {
                return <div key={f.id} style={{ fontSize: 10, color: "#e94560", lineHeight: 1.5 }}>{"\u26A0\uFE0F"} {f.fix}</div>;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export function PositionCard({ pos, idx }) {
  return (
    <div style={{ background: "#0f3460", borderRadius: 10, padding: 14, marginBottom: 8, border: "1px solid #16213e", borderLeft: "3px solid " + (pos.pillarSource === "take" ? "#3498db" : "#e94560") }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#ccd6f6" }}>{"\u270D\uFE0F"} Prise de position #{idx + 1}</div>
          {pos.pillarSource && <span style={{ fontSize: 9, color: pos.pillarSource === "take" ? "#3498db" : "#e94560", background: "#1a1a2e", padding: "2px 6px", borderRadius: 6 }}>{pos.pillarSource === "take" ? "take" : "IA"}</span>}
        </div>
        <CopyBtn text={pos.title + "\n\n" + pos.text} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: pos.pillarSource === "take" ? "#3498db" : "#e94560", marginBottom: 6 }}>{pos.title}</div>
      <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6, whiteSpace: "pre-line" }}>{pos.text}</div>
    </div>
  );
}

/* ==============================
   END SCREEN
   ============================== */



export function SignalField({ bricks, targetRoleId }) {
  var inputSt = useState("");
  var signalInput = inputSt[0];
  var setSignalInput = inputSt[1];
  var resultSt = useState(null);
  var result = resultSt[0];
  var setResult = resultSt[1];

  function handleGenerate() {
    if (signalInput.trim().length < 10) return;
    var sigType = detectSignalType(signalInput);
    var script = generateSignalScript(signalInput, sigType, bricks, targetRoleId);
    setResult({ type: sigType, script: script });
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 10 }}>
        Tu as repéré un signal ? Levée de fonds, recrutement, départ d'un dirigeant, expansion. Colle-le ici. Le système croise avec ton Score et produit un script d'approche.
      </div>
      <textarea
        value={signalInput}
        onChange={function(e) { setSignalInput(e.target.value); }}
        placeholder="Ex : L'entreprise X vient de lever 15M en Serie B et recrute 3 AE..."
        style={{
          width: "100%", minHeight: 80, padding: 12, background: "#1a1a2e", border: "2px solid #16213e",
          borderRadius: 8, color: "#ccd6f6", fontSize: 12, lineHeight: 1.5, resize: "vertical",
          outline: "none", fontFamily: "inherit", boxSizing: "border-box",
        }}
      />
      <button
        onClick={handleGenerate}
        disabled={signalInput.trim().length < 10}
        style={{
          width: "100%", marginTop: 8, padding: 12,
          background: signalInput.trim().length >= 10 ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
          color: signalInput.trim().length >= 10 ? "#fff" : "#495670",
          border: signalInput.trim().length >= 10 ? "none" : "2px solid #16213e",
          borderRadius: 8, cursor: signalInput.trim().length >= 10 ? "pointer" : "not-allowed",
          fontWeight: 700, fontSize: 13, transition: "all 0.3s",
        }}
      >Produire le script d'approche</button>

      {result && (
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 14, marginTop: 12, borderLeft: "3px solid #4ecca3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 10, color: "#4ecca3", fontWeight: 700, letterSpacing: 1 }}>{result.type.label.toUpperCase()}</span>
              <span style={{ fontSize: 10, color: "#495670", marginLeft: 8 }}>Script contextualisé</span>
            </div>
            <CopyBtn text={result.script} label="Copier" />
          </div>
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.7, whiteSpace: "pre-line" }}>{result.script}</div>
          <div style={{ fontSize: 10, color: "#8892b0", marginTop: 8, lineHeight: 1.4 }}>
            Ce script est produit depuis ton Score. Il cite tes briques les plus fortes et le cauchemar probable de l'entreprise. Ajuste le ton et envoie.
          </div>
        </div>
      )}
    </div>
  );
}



export function CommentField({ bricks, vault, targetRoleId }) {
  var inputSt = useState("");
  var postInput = inputSt[0];
  var setPostInput = inputSt[1];
  var resultSt = useState(null);
  var result = resultSt[0];
  var setResult = resultSt[1];

  function handleGenerate() {
    if (postInput.trim().length < 20) return;
    var gen = generateLinkedInComment(postInput, bricks, vault, targetRoleId);
    setResult(gen);
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 10 }}>
        Colle un post LinkedIn. Le système vérifie 3 filtres avant de produire. Si le post ne passe pas, il te dit pourquoi.
      </div>
      <textarea
        value={postInput}
        onChange={function(e) { setPostInput(e.target.value); }}
        placeholder="Colle ici un post LinkedIn que tu veux commenter..."
        style={{
          width: "100%", minHeight: 80, padding: 12, background: "#1a1a2e", border: "2px solid #16213e",
          borderRadius: 8, color: "#ccd6f6", fontSize: 12, lineHeight: 1.5, resize: "vertical",
          outline: "none", fontFamily: "inherit", boxSizing: "border-box",
        }}
      />
      <button
        onClick={handleGenerate}
        disabled={postInput.trim().length < 20}
        style={{
          width: "100%", marginTop: 8, padding: 12,
          background: postInput.trim().length >= 20 ? "#0f3460" : "#1a1a2e",
          color: postInput.trim().length >= 20 ? "#ccd6f6" : "#495670",
          border: postInput.trim().length >= 20 ? "2px solid #3498db" : "2px solid #16213e",
          borderRadius: 8, cursor: postInput.trim().length >= 20 ? "pointer" : "not-allowed",
          fontWeight: 700, fontSize: 13, transition: "all 0.3s",
        }}
      >Analyser + Produire</button>

      {result && result.filterResult && (
        <div style={{ marginTop: 12 }}>
          {/* 3 FILTRES */}
          <div style={{ background: "#0a192f", borderRadius: 10, padding: 12, marginBottom: 10, border: "1px solid " + result.filterResult.verdictColor + "44" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: result.filterResult.verdictColor, letterSpacing: 1 }}>VERDICT : {result.filterResult.verdict}</span>
              {result.topic && result.topic !== "general" && (
                <span style={{ fontSize: 9, color: "#8892b0", background: "#1a1a2e", padding: "2px 8px", borderRadius: 4 }}>Sujet : {result.topic}</span>
              )}
            </div>
            {result.filterResult.filters.map(function(f) {
              return (
                <div key={f.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>{f.passed ? "\u2714\uFE0F" : "\u274C"}</span>
                  <div>
                    <div style={{ fontSize: 11, color: f.passed ? "#4ecca3" : "#e94560", fontWeight: 600 }}>{f.label}</div>
                    <div style={{ fontSize: 10, color: "#8892b0", lineHeight: 1.4 }}>{f.reason}</div>
                  </div>
                </div>
              );
            })}

            {/* PATTERNS TOXIQUES */}
            {result.filterResult.avoidPatterns.length > 0 && (
              <div style={{ background: "#e94560" + "15", borderRadius: 6, padding: 8, marginTop: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#e94560", letterSpacing: 1, marginBottom: 4 }}>POST À ÉVITER</div>
                {result.filterResult.avoidPatterns.map(function(p, i) {
                  return <div key={i} style={{ fontSize: 10, color: "#e94560", lineHeight: 1.4 }}>{p.label}</div>;
                })}
              </div>
            )}

            {/* TROU DETECTE */}
            {result.gap && result.gap.type !== "general" && (
              <div style={{ background: "#3498db" + "15", borderRadius: 6, padding: 8, marginTop: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#3498db", letterSpacing: 1, marginBottom: 4 }}>TROU DÉTECTÉ</div>
                <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600 }}>{result.gap.label}</div>
                <div style={{ fontSize: 10, color: "#8892b0", lineHeight: 1.4 }}>{result.gap.desc}</div>
              </div>
            )}
          </div>

          {/* LIKE RECOMMENDATION */}
          {result.likeAdvice && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 10, background: result.likeAdvice.color + "15", borderRadius: 6, border: "1px solid " + result.likeAdvice.color + "44" }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: result.likeAdvice.color, letterSpacing: 1, flexShrink: 0 }}>{result.likeAdvice.action}</span>
              <span style={{ fontSize: 10, color: "#8892b0" }}>{result.likeAdvice.reason}</span>
            </div>
          )}

          {/* COMMENTAIRE GENERE (seulement si verdict COMMENTE) */}
          {result.comment && (
            <div style={{ background: "#0f3460", borderRadius: 10, padding: 14, borderLeft: "3px solid #4ecca3" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: "#4ecca3", fontWeight: 700, letterSpacing: 1 }}>COMMENTAIRE</span>
                <CopyBtn text={result.comment} label="Copier" />
              </div>
              <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7 }}>{result.comment}</div>
              <div style={{ background: "#1a1a2e", borderRadius: 6, padding: 8, marginTop: 8 }}>
                <div style={{ fontSize: 10, color: "#495670", marginBottom: 2 }}>Brique injectée ({result.brickSource || "chiffre"})</div>
                <div style={{ fontSize: 10, color: "#8892b0", lineHeight: 1.4 }}>{result.brickUsed}</div>
                {result.pillarUsed && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 10, color: "#3498db", marginBottom: 1 }}>Pilier</div>
                    <div style={{ fontSize: 10, color: "#8892b0" }}>{result.pillarUsed}</div>
                  </div>
                )}
              </div>

              {/* AUDIT QUALITÉ COMMENTAIRE */}
              {result.commentAudit && (
                <div style={{ background: "#0a192f", borderRadius: 6, padding: 8, marginTop: 8, border: "1px solid " + result.commentAudit.verdictColor + "44" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: result.commentAudit.verdictColor, letterSpacing: 1 }}>QUALITÉ : {result.commentAudit.verdict} ({result.commentAudit.score}/{result.commentAudit.total})</span>
                  </div>
                  {result.commentAudit.tests.map(function(t) {
                    return (
                      <div key={t.name} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, flexShrink: 0 }}>{t.pass ? "\u2714\uFE0F" : "\u274C"}</span>
                        <div>
                          <span style={{ fontSize: 10, color: t.pass ? "#4ecca3" : "#e94560", fontWeight: 600 }}>{t.name}</span>
                          <span style={{ fontSize: 9, color: "#8892b0", marginLeft: 6 }}>{t.detail}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ fontSize: 10, color: "#8892b0", marginTop: 8, lineHeight: 1.4 }}>
                Zéro chiffre dans le commentaire. La situation suffit. L'auteur voit quelqu'un qui a fait. Il clique sur ton profil. Ta bio donne les preuves en 6 secondes.
              </div>
            </div>
          )}

          {/* MESSAGE SI PASSE */}
          {!result.comment && result.filterResult.verdict === "PASSE" && (
            <div style={{ background: "#e94560" + "15", borderRadius: 10, padding: 14, border: "1px solid #e94560" + "44" }}>
              <div style={{ fontSize: 12, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>Passe ce post.</div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
                Commenter ici gaspille ta crédibilité. Le filtre a détecté {result.filterResult.filters.filter(function(f) { return !f.passed; }).length} blocage{result.filterResult.filters.filter(function(f) { return !f.passed; }).length > 1 ? "s" : ""}. Cherche un post dans ton territoire avec un trou que tes briques comblent.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



export function EndScreen({ vault, setVault, bricks, duelResults, maturity, targetRoleId, nightmareCosts, trajectoryToggle, offersArray }) {
  var tabSt = useState("arsenal");
  var tab = tabSt[0];
  var setTab = tabSt[1];
  var phaseSt = useState("recherche");
  var capturePhase = phaseSt[0];
  var setCapturePhase = phaseSt[1];
  var brickViewSt = useState({});
  var brickViews = brickViewSt[0];
  var setBrickViews = brickViewSt[1];
  function setBrickView(brickId, view) {
    setBrickViews(function(prev) { var next = Object.assign({}, prev); next[brickId] = view; return next; });
  }
  var scriptTabSt = useState("email");
  var scriptTab = scriptTabSt[0];
  var setScriptTab = scriptTabSt[1];
  var defaultSection = trajectoryToggle === "j_y_suis" ? "linkedin" : "scripts";
  var arsenalSectionSt = useState(defaultSection);
  var arsenalSection = arsenalSectionSt[0];
  var setArsenalSection = arsenalSectionSt[1];
  function toggleArsenalSection(id) { setArsenalSection(arsenalSection === id ? null : id); }

  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var missions = bricks.filter(function(b) { return b.type === "mission"; });
  var cicatrices = validated.filter(function(b) { return b.brickType === "cicatrice"; });
  var decisions = validated.filter(function(b) { return b.brickCategory === "decision"; });
  var influences = validated.filter(function(b) { return b.brickCategory === "influence"; });
  var duelAnswered = duelResults.filter(function(r) { return r.answer; });
  var duelFailles = duelResults.filter(function(r) { return !r.answer; });

  // Coût de l'Incompétence Percue
  var kpiGaps = [];
  if (validated.length < 7) kpiGaps.push({ kpi: "Briques de preuve", msg: "Tu es muet sur " + (7 - validated.length) + " preuves. Le recruteur contrôlera cette partie de la négociation." });
  if (duelFailles.length > 0) kpiGaps.push({ kpi: "Failles de combat", msg: "Tu as " + duelFailles.length + " faille" + (duelFailles.length > 1 ? "s" : "") + " ouvertes. Le recruteur va tomber dessus." });
  if (decisions.length === 0) kpiGaps.push({ kpi: "Aucune brique décision", msg: "Tu n'as documenté aucun arbitrage. Le recruteur ne sait pas si tu sais trancher." });
  if (influences.length === 0) kpiGaps.push({ kpi: "Aucune brique influence", msg: "Tu n'as documenté aucun alignement. Le recruteur ne sait pas si tu sais naviguer la politique interne." });

  // Measurement hygiene diagnostic
  var totalAnswered = validated.length + missions.length;
  var missionRatio = totalAnswered > 0 ? Math.round((missions.length / totalAnswered) * 100) : 0;
  var measurementDiag = null;
  if (missions.length === 0 && validated.length >= 5) {
    measurementDiag = { level: "fort", color: "#4ecca3", title: "Hygiène de mesure : forte", msg: "Tu as répondu à chaque question avec un chiffre. Tu mesures ce que tu fais. C'est rare. Le recruteur verra un professionnel qui ne négocie pas avec des impressions." };
  } else if (missions.length >= 1 && missions.length <= 2) {
    measurementDiag = { level: "moyen", color: "#ff9800", title: "Hygiène de mesure : moyenne", msg: missions.length + " question" + (missions.length > 1 ? "s" : "") + " sans chiffre sur " + totalAnswered + ". Tu mesures une partie de ton impact. Les missions te donnent les étapes pour récupérer le reste. Chaque mission complétée installe le réflexe de mesurer." };
  } else if (missions.length >= 3) {
    measurementDiag = { level: "faible", color: "#e94560", title: "Hygiène de mesure : absente", msg: missions.length + " questions sur " + totalAnswered + " sans chiffre (" + missionRatio + "%). Ce n'est pas un problème de mémoire. C'est un mode de fonctionnement : tu opères sans mesurer l'impact de ce que tu fais. Chaque trimestre sans tableau de bord est un trimestre de négociation perdu. Les missions ne sont pas des corvées. Ce sont les premiers pas vers un réflexe qui change tout." };
  }
  if (missions.length > 0) {
    kpiGaps.push({ kpi: "Déconnexion action-mesure", msg: missions.length + " mission" + (missions.length > 1 ? "s" : "") + " en attente. " + missionRatio + "% de tes réponses n'ont pas de preuve. Le professionnel qui mesure fixe son prix. Celui qui ne mesure pas accepte celui qu'on lui donne." });
  }
  var leveragePct = Math.round((validated.length / 9) * 100);
  leveragePct = Math.min(leveragePct, 100);

  // Elasticity summary
  var elasticBricks = validated.filter(function(b) { return b.elasticity === "élastique"; });

  var capturePings = {
    recherche: [
      { month: "Janvier", text: "Tu as fini ton Q4. Quel est le chiffre final du pipeline ? Quel obstacle as-tu brisé ?" },
      { month: "Février", text: "Quelle compétence as-tu utilisée ce mois-ci qui n'existait pas dans ta fiche de poste il y a un an ?" },
      { month: "Mars", text: "Quel indicateur as-tu suivi ce mois ? Quel chiffre a bougé ? Si la réponse est 'aucun', tu opères dans le noir." },
    ],
    en_poste: [
      { month: "Janvier", text: "Tu viens de finir un projet. Quel impact mesurable ? Quel feedback de ton N+1 ?" },
      { month: "Février", text: "Tu as résolu un problème interne. Quel indicateur a bougé ? De combien ? Nouvelle brique." },
      { month: "Mars", text: "Ouvre ton tableau de bord. Quel chiffre a changé depuis le mois dernier grâce à toi ? Si tu n'as pas de tableau de bord, c'est le premier problème à résoudre." },
    ],
    négociation: [
      { month: "Janvier", text: "Tu prépares ton entretien annuel. Quelles briques mobiliser pour justifier +15% ?" },
      { month: "Février", text: "Tu vises une promotion. L'IA identifie les 2 briques manquantes pour le niveau supérieur." },
      { month: "Mars", text: "Combien de tes réalisations du trimestre as-tu documentées avec un chiffre ? Ce que tu n'as pas mesuré, tu ne le négocieras pas." },
    ],
    freelance: [
      { month: "Janvier", text: "Quelles sont les 3 décisions les plus coûteuses que tu as prises ce mois pour ton client ? Ton rapport de valeur en dépend." },
      { month: "Février", text: "Ton client pense que 'tout va bien' parce que tu fais bien ton job. Quelles catastrophes as-tu évitées ce mois ? L'IA produit ton rapport de valeur." },
      { month: "Mars", text: "Quel indicateur as-tu fait bouger ce mois chez ton client ? Mets le chiffre dans ton rapport. Pas de chiffre, pas de justification d'honoraires." },
    ],
  };
  var pings = capturePings[capturePhase] || capturePings.recherche;


  // ========== ARSENAL SECTIONS (defined once, rendered in trajectory-specific order) ==========
  var sectionScripts = (
    <div>
          <button onClick={function() { toggleArsenalSection("scripts"); }} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", background: arsenalSection === "scripts" ? "#0f3460" : "#1a1a2e",
            border: arsenalSection === "scripts" ? "1px solid #e94560" : "1px solid #16213e",
            borderRadius: 10, cursor: "pointer", marginBottom: arsenalSection === "scripts" ? 12 : 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: arsenalSection === "scripts" ? "#e94560" : "#8892b0" }}>{"\uD83C\uDFAF"} Scripts de contact{trajectoryToggle !== "j_y_suis" ? " " : ""}</span>
            {trajectoryToggle !== "j_y_suis" && <span style={{ fontSize: 8, color: "#e94560", background: "#e94560" + "22", padding: "2px 6px", borderRadius: 4, fontWeight: 700, letterSpacing: 1 }}>PRIORITÉ</span>}
            <span style={{ fontSize: 12, color: "#495670" }}>{arsenalSection === "scripts" ? "\u25B2" : "\u25BC"}</span>
          </button>
          {arsenalSection === "scripts" && (function() {
            var scripts = generateContactScripts(bricks, targetRoleId);
            if (!scripts) return <Deliverable emoji={"\uD83C\uDFAF"} title="Script de contact" content="[Valide des briques pour produire les scripts.]" lines={2} />;
            var variants = { email: scripts.email, dm: scripts.dm, n1: scripts.n1, rh: scripts.rh };
            var currentText = variants[scriptTab] || scripts.email;
            var currentScore = scoreContactScript(currentText, bricks);
            var diltsP = analyzeDiltsProgression(currentText);
            var openD = getDiltsLabel(diltsP.opens);
            var closeD = getDiltsLabel(diltsP.closes);
            var channelInfo = SCRIPT_CHANNELS.find(function(c) { return c.id === scriptTab; }) || SCRIPT_CHANNELS[0];
            return (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>{"\uD83C\uDFAF"} SCRIPTS DE CONTACT — 4 VARIANTES</div>
                <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                  {SCRIPT_CHANNELS.map(function(ch) {
                    var active = scriptTab === ch.id;
                    var chScore = scoreContactScript(variants[ch.id] || "", bricks);
                    return (
                      <button key={ch.id} onClick={function() { setScriptTab(ch.id); }} style={{
                        flex: 1, padding: "8px 4px", fontSize: 10, fontWeight: 600,
                        background: active ? "#e94560" : "#1a1a2e",
                        color: active ? "#fff" : "#8892b0",
                        border: "none", borderRadius: 6, cursor: "pointer", textAlign: "center",
                      }}>
                        <div>{ch.icon} {ch.label}</div>
                        <div style={{ fontSize: 9, marginTop: 2, color: active ? "#fff" : (chScore.score >= 8 ? "#4ecca3" : chScore.score >= 5 ? "#ff9800" : "#e94560") }}>{chScore.score}/10</div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ background: "#0f3460", borderRadius: 10, padding: 14, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6" }}>{channelInfo.icon} {channelInfo.label}</span>
                    <CopyBtn text={currentText} label="Copier" />
                  </div>
                  <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7, whiteSpace: "pre-line", marginBottom: 10 }}>{currentText}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 9, color: openD.color, background: openD.color + "22", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>Registre {diltsP.opens} — {openD.name}</span>
                    <span style={{ fontSize: 9, color: "#495670" }}>{"\u2192"}</span>
                    <span style={{ fontSize: 9, color: closeD.color, background: closeD.color + "22", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>Registre {diltsP.closes} — {closeD.name}</span>
                    {diltsP.progression > 0 && <span style={{ fontSize: 9, color: "#4ecca3" }}>+{diltsP.progression}</span>}
                    {diltsP.progression <= 0 && <span style={{ fontSize: 9, color: "#e94560" }}>{"\u26A0\uFE0F"}</span>}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: currentScore.score >= 8 ? "#4ecca3" : currentScore.score >= 5 ? "#ff9800" : "#e94560", marginBottom: 6 }}>Score : {currentScore.score}/10 ({currentScore.passedCount}/6 tests)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {currentScore.tests.map(function(t) {
                      return (
                        <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                          <span style={{ fontSize: 10, color: t.passed ? "#4ecca3" : "#e94560", flexShrink: 0 }}>{t.passed ? "\u2714" : "\u2718"}</span>
                          <div>
                            <span style={{ fontSize: 10, color: t.passed ? "#8892b0" : "#ccd6f6", fontWeight: 600 }}>{t.label}</span>
                            {!t.passed && <span style={{ fontSize: 10, color: "#e94560", marginLeft: 6 }}>{t.fix}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 10, color: "#ff9800", fontWeight: 600, marginBottom: 4 }}>{"\uD83D\uDCA1"} INSTRUCTION</div>
                  <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>{channelInfo.instruction}</div>
                </div>
              </div>
            );
          })()}

    </div>
  );
  var sectionBioLK = (
    <div>
          <button onClick={function() { toggleArsenalSection("bio"); }} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", background: arsenalSection === "bio" ? "#0f3460" : "#1a1a2e",
            border: arsenalSection === "bio" ? "1px solid #e94560" : "1px solid #16213e",
            borderRadius: 10, cursor: "pointer", marginBottom: arsenalSection === "bio" ? 12 : 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: arsenalSection === "bio" ? "#e94560" : "#8892b0" }}>{"\uD83D\uDCDD"} Bio LinkedIn</span>
            <span style={{ fontSize: 12, color: "#495670" }}>{arsenalSection === "bio" ? "\u25B2" : "\u25BC"}</span>
          </button>
          {arsenalSection === "bio" && (
            <div style={{ marginBottom: 12 }}>
              {(function() {
                var bioContent = generateBio(bricks, vault, trajectoryToggle);
                var bioAudit = auditDeliverable("bio", bioContent, bricks);
                return <Deliverable emoji={"\uD83D\uDCDD"} title="Bio LinkedIn" content={bioContent} lines={3} auditResult={bioAudit} />;
              })()}
            </div>
          )}

    </div>
  );
  var sectionCV = (
    <div>
          <button onClick={function() { toggleArsenalSection("cv"); }} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", background: arsenalSection === "cv" ? "#0f3460" : "#1a1a2e",
            border: arsenalSection === "cv" ? "1px solid #e94560" : "1px solid #16213e",
            borderRadius: 10, cursor: "pointer", marginBottom: arsenalSection === "cv" ? 12 : 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: arsenalSection === "cv" ? "#e94560" : "#8892b0" }}>{"\uD83D\uDCC4"} CV + Carte de march\u00e9</span>
            <span style={{ fontSize: 12, color: "#495670" }}>{arsenalSection === "cv" ? "\u25B2" : "\u25BC"}</span>
          </button>
          {arsenalSection === "cv" && (
            <div style={{ marginBottom: 12 }}>
              {(function() {
                var cvContent = generateCV(bricks, targetRoleId, trajectoryToggle);
                var cvAudit = auditDeliverable("cv", cvContent, bricks);
                return <Deliverable emoji={"\uD83D\uDCC4"} title="CV r\u00e9\u00e9crit" content={cvContent} lines={4} auditResult={cvAudit} />;
              })()}
              <ImpactReportPanel bricks={bricks} vault={vault} targetRoleId={targetRoleId} trajectoryToggle={trajectoryToggle} />
              <MarketMap bricks={bricks} offersArray={offersArray} targetRoleId={targetRoleId} />
            </div>
          )}

    </div>
  );
  var sectionCombat = (
    <div>
          <button onClick={function() { toggleArsenalSection("combat"); }} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", background: arsenalSection === "combat" ? "#0f3460" : "#1a1a2e",
            border: arsenalSection === "combat" ? "1px solid #e94560" : "1px solid #16213e",
            borderRadius: 10, cursor: "pointer", marginBottom: arsenalSection === "combat" ? 12 : 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: arsenalSection === "combat" ? "#e94560" : "#8892b0" }}>{"\uD83D\uDEE1\uFE0F"} Combat ({duelAnswered.length} réponses, {duelFailles.length} failles)</span>
            <span style={{ fontSize: 12, color: "#495670" }}>{arsenalSection === "combat" ? "\u25B2" : "\u25BC"}</span>
          </button>
          {arsenalSection === "combat" && (
            <div style={{ marginBottom: 12 }}>

          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>PRISES DE POSITION</div>
          {(function() {
            var positions = generatePositions(bricks, vault);
            if (positions.length === 0) return (
              <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, borderLeft: "3px solid #495670" }}>
                <div style={{ fontSize: 12, color: "#495670" }}>Aucune prise de position produite. Valide des piliers et des briques d'abord.</div>
              </div>
            );
            return positions.map(function(p, i) { return <PositionCard key={i} pos={p} idx={i} />; });
          })()}

          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginTop: 20, marginBottom: 12 }}>RÉPONSES DE COMBAT ({duelAnswered.length})</div>
          {duelResults.map(function(r, i) {
            return (
              <div key={i} style={{ background: r.answer ? "#0f3460" : "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 6, borderLeft: r.answer ? "3px solid #e94560" : "3px solid #495670" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", flex: 1 }}>{r.answer ? "\uD83D\uDEE1\uFE0F" : "\u26A0\uFE0F"} {r.question}</div>
                  {r.answer && <CopyBtn text={r.question + "\n\n" + r.answer} label="Copier" />}
                </div>
                {r.answer && <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{r.answer}</div>}
                {!r.answer && <div style={{ fontSize: 12, color: "#e94560" }}>Faille ouverte.</div>}
                {r.wordWarning && <div style={{ fontSize: 11, color: "#ff9800", marginTop: 4 }}>{r.wordWarning}</div>}
              </div>
            );
          })}

          <div style={{ background: "#1a1a2e", borderRadius: 10, padding: 16, marginTop: 20, borderLeft: "3px solid #e94560" }}>
            <div style={{ fontSize: 12, color: "#495670", fontWeight: 600, marginBottom: 6 }}>{"\uD83D\uDD10"} NON EXPORTABLE</div>
            <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.7 }}>
              {validated.length} Briques {"\u00B7"} {vault.pillars} Piliers
            </div>
            <div style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 600, marginTop: 8, fontStyle: "italic" }}>"Tu as le PDF. Ton cerveau numérique reste ici."</div>
          </div>

          {/* ITERATION 7 — QUESTIONS DE DIAGNOSTIC (post-Duel) */}
          {(function() {
            var diagQuestions = generateDiagnosticQuestions(bricks, targetRoleId);
            if (diagQuestions.length === 0) return null;
            return (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>QUESTIONS DE DIAGNOSTIC ({diagQuestions.length})</div>
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 12 }}>
                  Questions calibrées sur tes briques les plus fortes. Tu ne poses pas des questions de curiosité. Tu poses des questions que tu es le seul à avoir la crédibilité de poser.
                </div>
                {diagQuestions.map(function(q, i) {
                  return (
                    <div key={i} style={{ background: "#0f3460", borderRadius: 8, padding: 14, marginBottom: 8, borderLeft: "3px solid " + q.color }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <span style={{ fontSize: 10, color: q.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{q.type}</span>
                        <CopyBtn text={"NIVEAU 1 :\n" + q.level1 + "\n\nNIVEAU 2 :\n" + q.level2} label="Copier" />
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#4ecca3", fontWeight: 600, marginBottom: 3 }}>PREMIÈRE RENCONTRE</div>
                        <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, fontStyle: "italic" }}>"{q.level1}"</div>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#ff9800", fontWeight: 600, marginBottom: 3 }}>ENTRETIEN AVANCÉ</div>
                        <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, fontStyle: "italic" }}>"{q.level2}"</div>
                      </div>
                      <div style={{ background: "#1a1a2e", borderRadius: 6, padding: 8, marginTop: 6 }}>
                        <div style={{ fontSize: 10, color: "#495670", marginBottom: 2 }}>Brique source : {q.brickRef}</div>
                        <div style={{ fontSize: 10, color: "#8892b0", lineHeight: 1.4 }}>{q.logic}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

            </div>
          )}

    </div>
  );
  var sectionLinkedin = (
    <div>
          <button onClick={function() { toggleArsenalSection("linkedin"); }} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", background: arsenalSection === "linkedin" ? "#0f3460" : "#1a1a2e",
            border: arsenalSection === "linkedin" ? "1px solid #3498db" : "1px solid #16213e",
            borderRadius: 10, cursor: "pointer", marginBottom: arsenalSection === "linkedin" ? 12 : 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: arsenalSection === "linkedin" ? "#3498db" : "#8892b0" }}>{"\uD83D\uDCE3"} LinkedIn (posts, commentaires, signaux){trajectoryToggle === "j_y_suis" ? " " : ""}</span>
            {trajectoryToggle === "j_y_suis" && <span style={{ fontSize: 8, color: "#3498db", background: "#3498db" + "22", padding: "2px 6px", borderRadius: 4, fontWeight: 700, letterSpacing: 1 }}>PRIORITÉ</span>}
            <span style={{ fontSize: 12, color: "#495670" }}>{arsenalSection === "linkedin" ? "\u25B2" : "\u25BC"}</span>
          </button>
          {arsenalSection === "linkedin" && (
            <div style={{ marginBottom: 12 }}>

          {/* ITERATION 4 — CHAMP "COLLE UN SIGNAL" */}
          <div style={{ marginTop: 0 }}>
            <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>COLLE UN SIGNAL</div>
            <SignalField bricks={bricks} targetRoleId={targetRoleId} />
          </div>

          {/* CHAMP "COMMENTE UN POST" */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: "#3498db", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>COMMENTE UN POST LINKEDIN</div>
            <CommentField bricks={bricks} vault={vault} targetRoleId={targetRoleId} />
          </div>

          {/* POSTS LINKEDIN GENERES */}
          {(function() {
            var posts = generateLinkedInPosts(bricks, vault, targetRoleId);
            if (posts.length === 0) return null;
            var seqAlert = checkDiltsSequence(posts);
            var dt = posts.diltsTarget || computeDiltsTarget(vault && vault.diltsHistory ? vault.diltsHistory : []);
            var targetInfo = getDiltsLabel(dt.targetLevel);
            var history = vault && vault.diltsHistory ? vault.diltsHistory : [];

            function recordDiltsPublish(diltsLevel) {
              var entry = { level: diltsLevel, date: new Date().toISOString() };
              setVault(function(prev) {
                var h = prev.diltsHistory ? prev.diltsHistory.slice() : [];
                h.push(entry);
                return Object.assign({}, prev, { diltsHistory: h });
              });
            }

            return (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>POSTS LINKEDIN PRODUITS ({posts.length})</div>

                {/* CALIBREUR DILTS */}
                <div style={{ background: "#0a192f", borderRadius: 10, padding: 14, marginBottom: 16, border: "1px solid " + targetInfo.color }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: targetInfo.color, letterSpacing: 1, marginBottom: 8 }}>CALIBRAGE DILTS — SEQUENCE</div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                    {DILTS_LEVELS.filter(function(d) { return d.level >= 2 && d.level <= 5; }).map(function(d) {
                      var postsAtLevel = history.filter(function(h) { return h.level === d.level; }).length;
                      var isTarget = d.level === dt.targetLevel;
                      var isCompleted = postsAtLevel >= 2;
                      var isPartial = postsAtLevel === 1;
                      return (
                        <div key={d.level} style={{ flex: 1, textAlign: "center" }}>
                          <div style={{
                            height: 6, borderRadius: 3, marginBottom: 4,
                            background: isCompleted ? d.color : isPartial ? d.color + "66" : "#1a1a2e",
                            border: isTarget ? "2px solid " + d.color : "1px solid #495670",
                          }}></div>
                          <div style={{ fontSize: 8, color: isTarget ? d.color : "#495670", fontWeight: isTarget ? 700 : 400 }}>{d.level}</div>
                          <div style={{ fontSize: 7, color: isTarget ? d.color : "#495670" }}>{d.name.slice(0, 5)}</div>
                          {postsAtLevel > 0 && <div style={{ fontSize: 8, color: d.color }}>{postsAtLevel}/2</div>}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: targetInfo.color, lineHeight: 1.5 }}>
                    Cible : Registre {dt.targetLevel} — {targetInfo.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
                    {dt.reason}
                  </div>
                  {history.length > 0 && (
                    <div style={{ fontSize: 10, color: "#495670", marginTop: 6 }}>{history.length} post{history.length > 1 ? "s" : ""} dans la séquence</div>
                  )}
                </div>

                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 12 }}>
                  Calibrés sur Registre {dt.targetLevel}. Brique et cadrage sélectionnés pour pousser vers le niveau {targetInfo.name}.
                </div>
                {seqAlert && seqAlert.stagnant && (
                  <div style={{ background: "#ff9800" + "22", borderRadius: 8, padding: 10, marginBottom: 12, border: "1px solid #ff9800" }}>
                    <div style={{ fontSize: 11, color: "#ff9800", lineHeight: 1.5 }}>{"\u26A0\uFE0F"} {seqAlert.message}</div>
                  </div>
                )}
                {posts.map(function(post, i) {
                  var diltsInfo = getDiltsLabel(post.diltsLevel || 1);
                  var scoreColor = post.globalScore >= 7 ? "#4ecca3" : post.globalScore >= 5 ? "#ff9800" : "#e94560";
                  var onTarget = post.diltsLevel === dt.targetLevel;
                  return (
                    <div key={i} style={{ background: "#0f3460", borderRadius: 10, padding: 14, marginBottom: 16, borderLeft: "3px solid " + (onTarget ? targetInfo.color : "#495670") }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 10, color: post.pillarSource === "take" ? "#3498db" : "#e94560", fontWeight: 700, letterSpacing: 1 }}>POST {i + 1}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor }}>{post.globalScore}/10</span>
                          <span style={{ fontSize: 10, color: "#495670" }}>{post.charCount} car.</span>
                          {onTarget && <span style={{ fontSize: 9, color: targetInfo.color, background: targetInfo.color + "22", padding: "2px 6px", borderRadius: 4 }}>SUR CIBLE</span>}
                          {!onTarget && <span style={{ fontSize: 9, color: "#ff9800", background: "#ff980022", padding: "2px 6px", borderRadius: 4 }}>HORS CIBLE (Dilts {post.diltsLevel})</span>}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <CopyBtn text={post.text} label="Copier" />
                          <button onClick={function() { recordDiltsPublish(post.diltsLevel); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(post.text); }} style={{
                            padding: "5px 12px", background: "#4ecca3" + "22", color: "#4ecca3",
                            border: "1px solid #4ecca3", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 11,
                          }}>{"\u2713"} Publie</button>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, color: diltsInfo.color, background: diltsInfo.color + "22", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>Dilts {post.diltsLevel} — {diltsInfo.name}</span>
                        <span style={{ fontSize: 9, color: post.hookScore >= 7 ? "#4ecca3" : post.hookScore >= 4 ? "#ff9800" : "#e94560", background: "#1a1a2e", padding: "2px 8px", borderRadius: 6 }}>Hook {post.hookScore}/10</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7, whiteSpace: "pre-line", marginBottom: 10 }}>{post.text}</div>

                      {post.hookTests && (
                        <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#ff9800", marginBottom: 4 }}>ACCROCHE — 6 tests Marie Hook</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {post.hookTests.map(function(t) {
                              return <span key={t.id} style={{ fontSize: 9, color: t.passed ? "#4ecca3" : "#e94560" }}>{t.passed ? "\u2714" : "\u2718"} {t.label}</span>;
                            })}
                          </div>
                        </div>
                      )}

                      {post.bodyRetention && post.bodyRetention.issues.length > 0 && (
                        <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#ff9800", marginBottom: 4 }}>CORPS — rétention</div>
                          {post.bodyRetention.issues.map(function(issue, j) {
                            return <div key={j} style={{ fontSize: 10, color: "#e94560", lineHeight: 1.5 }}>{"\u26A0\uFE0F"} {issue}</div>;
                          })}
                        </div>
                      )}

                      {post.expertCritique && (
                        <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#9b59b6", marginBottom: 4 }}>EXPERT ÉCRITURE</div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
                            {post.expertCritique.miroir.map(function(m, j) {
                              return <span key={"m" + j} style={{ fontSize: 9, color: m.passed ? "#4ecca3" : "#e94560" }}>{m.passed ? "\u2714" : "\u2718"} {m.label}</span>;
                            })}
                          </div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {post.expertCritique.luisEnrique.map(function(l, j) {
                              return <span key={"l" + j} style={{ fontSize: 9, color: l.passed ? "#4ecca3" : "#e94560" }}>{l.passed ? "\u2714" : "\u2718"} {l.label}</span>;
                            })}
                          </div>
                        </div>
                      )}

                      {post.firstComment && (
                        <div style={{ background: "#16213e", borderRadius: 8, padding: 10, marginBottom: 8, borderLeft: "2px solid #3498db" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#3498db" }}>PREMIER COMMENTAIRE</span>
                            <CopyBtn text={post.firstComment} label="Copier le commentaire" />
                          </div>
                          <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{post.firstComment}</div>
                          <div style={{ fontSize: 9, color: "#495670", marginTop: 4 }}>Publie. Attends 30 secondes. Colle ton commentaire.</div>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, color: "#495670", background: "#1a1a2e", padding: "2px 8px", borderRadius: 6 }}>Pilier : {post.pillar.length > 30 ? post.pillar.slice(0, 30) + "..." : post.pillar}</span>
                        <span style={{ fontSize: 9, color: "#495670", background: "#1a1a2e", padding: "2px 8px", borderRadius: 6 }}>Brique : {post.brickUsed}</span>
                      </div>
                    </div>
                  );
                })}
                <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: "#ff9800", fontWeight: 600, marginBottom: 4 }}>{"\uD83D\uDCA1"} INSTRUCTION</div>
                  <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>Publie entre 7h30 et 8h30 en semaine. Réponds à tous les commentaires dans les 2 premières heures.</div>
                </div>
                <div style={{ fontSize: 10, color: "#495670", lineHeight: 1.5, marginTop: 8 }}>
                  Chaque Rendez-vous produit de nouvelles briques. De nouvelles briques produisent de nouveaux posts. L'abonnement alimente le flux.
                </div>
              </div>
            );
          })()}

            </div>
          )}

    </div>
  );
  var sectionLettre = (
    <div>
          <button onClick={function() { toggleArsenalSection("lettre"); }} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", background: arsenalSection === "lettre" ? "#0f3460" : "#1a1a2e",
            border: arsenalSection === "lettre" ? "1px solid #ff9800" : "1px solid #16213e",
            borderRadius: 10, cursor: "pointer", marginBottom: arsenalSection === "lettre" ? 12 : 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: arsenalSection === "lettre" ? "#ff9800" : "#8892b0" }}>{"\u2709\uFE0F"} Lettre de motivation</span>
            <span style={{ fontSize: 12, color: "#495670" }}>{arsenalSection === "lettre" ? "\u25B2" : "\u25BC"}</span>
          </button>
          {arsenalSection === "lettre" && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, borderLeft: "3px solid #ff9800" }}>
                <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>ASSEMBLE. NE GÉNÈRE PAS.</div>
                <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.7, marginBottom: 16 }}>
                  52% des candidats utilisent l'IA pour leur lettre. Le résultat : des lettres identiques. Ton avantage : tu as des briques blindées. Assemble-les.
                </div>

                {(function() {
                  var cauchemarCoverage = computeCauchemarCoverageDetailed(bricks, nightmareCosts || {});
                  var topCauchemar = cauchemarCoverage.filter(function(c) { return c.covered && c.cost; }).sort(function(a, b) { return (b.cost.high || 0) - (a.cost.high || 0); })[0];
                  var topBrick = validated.length > 0 ? validated[0] : null;
                  var discoveryQ = topBrick && topBrick.discoveryQuestions && topBrick.discoveryQuestions.length > 0 ? topBrick.discoveryQuestions[0] : "Quel est le problème que ce poste résout en priorité ?";

                  return (
                    <div>
                      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#e94560", fontWeight: 700, marginBottom: 6 }}>PARAGRAPHE 1 — Le cauchemar du décideur</div>
                        <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
                          {topCauchemar
                            ? "\"" + topCauchemar.label + " coûte entre " + (topCauchemar.cost.low ? (topCauchemar.cost.low / 1000).toFixed(0) + "K" : "?") + " et " + (topCauchemar.cost.high ? (topCauchemar.cost.high / 1000).toFixed(0) + "K" : "?") + " par an à une entreprise de votre taille.\""
                            : "Copie le cauchemar le plus coûteux depuis ta Carte des Cauchemars."
                          }
                        </div>
                        {topCauchemar && <CopyBtn text={topCauchemar.label + " coûte entre " + (topCauchemar.cost.low ? (topCauchemar.cost.low / 1000).toFixed(0) + "K" : "?") + " et " + (topCauchemar.cost.high ? (topCauchemar.cost.high / 1000).toFixed(0) + "K" : "?") + " par an à une entreprise de votre taille."} label="Copier" />}
                      </div>

                      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#4ecca3", fontWeight: 700, marginBottom: 6 }}>PARAGRAPHE 2 — Ta brique la plus forte</div>
                        <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
                          {topBrick
                            ? "\"" + topBrick.text + "\""
                            : "Copie ta brique blindée la plus forte depuis ton Score."
                          }
                        </div>
                        {topBrick && <CopyBtn text={topBrick.text} label="Copier" />}
                      </div>

                      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#3498db", fontWeight: 700, marginBottom: 6 }}>PARAGRAPHE 3 — Ta question discovery</div>
                        <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6, fontStyle: "italic" }}>
                          "{discoveryQ}"
                        </div>
                        <CopyBtn text={discoveryQ} label="Copier" />
                      </div>

                      <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.6, marginTop: 12 }}>
                        Trois paragraphes. Un coût. Une preuve. Une question. Le recruteur lit un chiffre ancré, pas une liste de qualités. Ta lettre ne ressemble à aucune autre parce qu'elle contient ce que l'IA ne produit pas : tes vrais chiffres.
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

    </div>
  );
  var sectionFiche = (
    <div>
          <button onClick={function() { toggleArsenalSection("fiche"); }} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", background: arsenalSection === "fiche" ? "#0f3460" : "#1a1a2e",
            border: arsenalSection === "fiche" ? "1px solid #e94560" : "1px solid #16213e",
            borderRadius: 10, cursor: "pointer", marginBottom: arsenalSection === "fiche" ? 12 : 6,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: arsenalSection === "fiche" ? "#e94560" : "#8892b0" }}>{"\u2694\uFE0F"} Fiche de combat</span>
            <span style={{ fontSize: 12, color: "#495670" }}>{arsenalSection === "fiche" ? "\u25B2" : "\u25BC"}</span>
          </button>
          {arsenalSection === "fiche" && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, borderLeft: "3px solid #e94560" }}>
                <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>GARDE-LA SUR TES GENOUX PENDANT L'ENTRETIEN.</div>
                <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.7, marginBottom: 16 }}>
                  Une page. Cauchemars du décideur. Tes 3 briques avec contre-arguments. Questions discovery. Pitch. La règle du silence. Tu n'oublies rien.
                </div>

                {(function() {
                  var cauchemarCoverage = computeCauchemarCoverageDetailed(bricks, nightmareCosts || {});
                  var topCauchemars = cauchemarCoverage.filter(function(c) { return c.covered && c.cost; }).sort(function(a, b) { return (b.cost.high || 0) - (a.cost.high || 0); }).slice(0, 3);
                  var top3 = validated.slice(0, 3);
                  var takePillar = vault && vault.selectedPillars ? vault.selectedPillars.find(function(p) { return p.source === "take"; }) : null;
                  var takeText = takePillar ? takePillar.title : null;
                  var discoveryQsLocal = {
                    enterprise_ae: "Quels sont les enjeux de croissance principaux de votre équipe cette année ?",
                    head_of_growth: "Quel canal d'acquisition vous préoccupe le plus en ce moment ?",
                    strategic_csm: "Quel est le segment de clients qui produit le plus de friction aujourd'hui ?",
                    senior_pm: "Quel est l'arbitrage produit le plus difficile que l'équipe n'a pas encore tranché ?",
                    ai_architect: "Quel cas d'usage IA est bloqué depuis le plus longtemps ?",
                    engineering_manager: "Quel est le frein technique que l'équipe n'arrive pas à débloquer ?",
                    management_consultant: "Quel est le problème qui a déclenché ce recrutement ?",
                    strategy_associate: "Quelle décision stratégique attend des données que personne ne produit ?",
                    operations_manager: "Quelle friction inter-équipes consomme le plus de temps ?",
                    fractional_coo: "Qu'est-ce que le CEO ne devrait plus faire lui-même dans 6 mois ?",
                  };
                  var roleDisc = discoveryQsLocal[targetRoleId] || "Avant que je déroule mon parcours, quels sont vos enjeux clés sur ce poste ?";
                  var roleData = TARGET_ROLES.find(function(r) { return r.id === targetRoleId; });
                  var roleName = roleData ? roleData.role : "Non défini";

                  var ready = top3.length >= 1;

                  function generateFiche() {
                    var html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Fiche de Combat - " + roleName + "</title><style>";
                    html += "@page{size:A4;margin:20mm 18mm}";
                    html += "body{font-family:Helvetica,Arial,sans-serif;background:#0b1120;color:#ccd6f6;margin:0;padding:24px 28px;font-size:11px;line-height:1.5}";
                    html += ".header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #e94560;padding-bottom:8px;margin-bottom:14px}";
                    html += ".header-tag{font-size:9px;letter-spacing:2px;color:#e94560;text-transform:uppercase;font-weight:bold}";
                    html += ".header-brand{font-size:8px;color:#495670}";
                    html += ".role{font-size:18px;font-weight:bold;margin-bottom:14px}";
                    html += ".section-tag{font-size:8px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;margin-bottom:6px}";
                    html += ".card{background:#0f1830;border-radius:6px;padding:8px 10px;margin-bottom:5px}";
                    html += ".card-row{display:flex;justify-content:space-between;align-items:center}";
                    html += ".cost{color:#e94560;font-weight:bold;font-size:11px}";
                    html += ".brick-card{background:#0f1830;border-radius:6px;padding:8px 10px;margin-bottom:5px;border-left:3px solid #4ecca3}";
                    html += ".brick-num{font-size:8px;color:#4ecca3;font-weight:bold;letter-spacing:1px;text-transform:uppercase;margin-bottom:2px}";
                    html += ".brick-text{font-size:10px;color:#ccd6f6;margin-bottom:3px}";
                    html += ".contre{font-size:9px;color:#495670;margin-top:2px}";
                    html += ".disc-card{background:#0f1830;border-radius:6px;padding:6px 10px;margin-bottom:4px;display:flex;gap:12px;align-items:baseline}";
                    html += ".disc-label{font-size:7px;color:#3498db;font-weight:bold;letter-spacing:1px;text-transform:uppercase;flex-shrink:0;width:80px}";
                    html += ".disc-q{font-size:10px;color:#ccd6f6}";
                    html += ".pitch-box{background:#0f1830;border-radius:6px;padding:10px;border-left:3px solid #9b59b6;margin-bottom:10px}";
                    html += ".pitch-text{font-size:10px;color:#ccd6f6;line-height:1.6}";
                    html += ".silence-box{background:rgba(233,69,96,0.1);border:1px solid rgba(233,69,96,0.3);border-radius:6px;padding:8px 10px;margin-top:10px}";
                    html += ".silence-tag{font-size:9px;color:#e94560;font-weight:bold;margin-bottom:3px}";
                    html += ".silence-text{font-size:10px;color:#ccd6f6}";
                    html += ".footer{display:flex;justify-content:space-between;margin-top:14px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.04);font-size:7px;color:#495670}";
                    html += ".section-gap{margin-top:12px}";
                    html += "</style></head><body>";

                    // Header
                    html += "<div class='header'><div class='header-tag'>Fiche de combat</div><div class='header-brand'>ABNEG@TION</div></div>";
                    html += "<div class='role'>" + roleName + "</div>";

                    // Cauchemars
                    html += "<div class='section-tag' style='color:#e94560'>CAUCHEMARS DU DÉCIDEUR</div>";
                    if (topCauchemars.length > 0) {
                      topCauchemars.forEach(function(c) {
                        var lo = c.cost.low ? Math.round(c.cost.low / 1000) + "K" : "?";
                        var hi = c.cost.high ? Math.round(c.cost.high / 1000) + "K" : "?";
                        html += "<div class='card'><div class='card-row'><span>" + c.label + "</span><span class='cost'>" + lo + " - " + hi + "/an</span></div></div>";
                      });
                    } else {
                      html += "<div class='card'><span style='color:#495670'>Aucun cauchemar chiffré. Complète la Carte des Cauchemars.</span></div>";
                    }

                    // Top 3 briques + contre-arguments
                    html += "<div class='section-gap'></div><div class='section-tag' style='color:#4ecca3'>TOP 3 BRIQUES + CONTRE-ARGUMENTS</div>";
                    if (top3.length > 0) {
                      top3.forEach(function(b, i) {
                        html += "<div class='brick-card'>";
                        html += "<div class='brick-num'>Preuve " + (i + 1) + " (" + (b.brickCategory || "chiffre") + ")</div>";
                        html += "<div class='brick-text'>" + b.text + "</div>";
                        if (b.stressTest && b.stressTest.length > 0) {
                          html += "<div class='contre'>" + b.stressTest[0].label + " -> " + b.stressTest[0].defense + "</div>";
                        }
                        html += "</div>";
                      });
                    } else {
                      html += "<div class='card'><span style='color:#495670'>Score vide.</span></div>";
                    }

                    // Questions discovery
                    html += "<div class='section-gap'></div><div class='section-tag' style='color:#3498db'>QUESTIONS DISCOVERY</div>";
                    var discs = [
                      ["Discovery", roleDisc],
                      ["Déclencheur", "Qu'est-ce qui a déclenché ce recrutement ?"],
                      ["Cicatrice", "Quel profil ne voulez-vous surtout pas reproduire ?"],
                      ["Cadrage", "Quelle partie de mon parcours voulez-vous que je développe en priorité ?"]
                    ];
                    discs.forEach(function(d) {
                      html += "<div class='disc-card'><div class='disc-label'>" + d[0] + "</div><div class='disc-q'>" + d[1] + "</div></div>";
                    });

                    // Pitch Chrono
                    var discoveryClose = top3.length > 0 && top3[0].discoveryQuestions && top3[0].discoveryQuestions.length > 0 ? top3[0].discoveryQuestions[0] : "Quel est le problème que ce poste résout en priorité ?";
                    html += "<div class='section-gap'></div><div class='section-tag' style='color:#9b59b6'>PITCH 90 SECONDES — CHRONO</div>";
                    var chronoData = [
                      { label: "CAUCHEMAR", time: "0-15s", color: "#e94560", hint: "Ouvre sur le problème du décideur" },
                      { label: "PREUVE 1", time: "15-30s", color: "#4ecca3", hint: "Un chiffre. Un contexte. Un résultat." },
                      { label: "PREUVE 2", time: "30-45s", color: "#4ecca3", hint: "Angle complémentaire" },
                      { label: "MÉTHODE", time: "45-70s", color: "#3498db", hint: "Ce que tu feras chez eux" },
                      { label: "QUESTION", time: "70-90s", color: "#ff9800", hint: "Tu reprends le cadre" },
                    ];
                    var chronoContent = [takeText || "", top3[0] ? top3[0].text : "", top3[1] ? top3[1].text : "", top3[2] ? top3[2].text : "", discoveryClose];
                    html += "<div style='display:flex;flex-direction:column;gap:4px'>";
                    chronoData.forEach(function(bloc, bi) {
                      var content = chronoContent[bi] || "";
                      if (content.length > 80) content = content.slice(0, 80) + "...";
                      html += "<div style='display:flex;gap:8px;align-items:stretch'>";
                      html += "<div style='width:50px;flex-shrink:0;background:" + bloc.color + "22;border-radius:4px;display:flex;align-items:center;justify-content:center;padding:4px'>";
                      html += "<span style='font-size:8px;font-weight:bold;color:" + bloc.color + "'>" + bloc.time + "</span></div>";
                      html += "<div style='flex:1;background:#1a1a2e;border-radius:4px;padding:6px 8px;border-left:2px solid " + bloc.color + "'>";
                      html += "<span style='font-size:8px;font-weight:bold;color:" + bloc.color + "'>" + bloc.label + "</span> ";
                      html += "<span style='font-size:9px;color:#ccd6f6'>" + content + "</span>";
                      html += "<div style='font-size:7px;color:#495670;font-style:italic'>" + bloc.hint + "</div>";
                      html += "</div></div>";
                    });
                    html += "</div>";
                    html += "<div style='font-size:8px;color:#8892b0;margin-top:6px'>Pas de texte à réciter. Une structure à suivre. Tes mots viennent de toi.</div>";

                    // Silence
                    html += "<div class='silence-box'><div class='silence-tag'>LE SILENCE</div><div class='silence-text'>Le recruteur se tait. Ne remplis pas. Laisse-le revenir. Celui qui parle en premier perd le cadre.</div></div>";

                    // Plan 90 jours
                    var plan90 = generatePlan90(bricks, targetRoleId, offersArray);
                    if (plan90) {
                      html += "<div style='margin-top:20px;page-break-before:always'>";
                      html += "<div style='font-size:14px;font-weight:bold;color:#9b59b6;margin-bottom:4px'>PLAN 90 JOURS — " + plan90.role.toUpperCase() + "</div>";
                      html += "<div style='font-size:9px;color:#8892b0;margin-bottom:12px'>Cadence " + plan90.cadenceLabel + "</div>";
                      if (plan90.ouverture) html += "<div style='font-size:10px;color:#e94560;font-style:italic;margin-bottom:12px;line-height:1.5'>" + plan90.ouverture + "</div>";
                      plan90.phases.forEach(function(p) {
                        html += "<div style='background:#1a1a2e;border-radius:6px;padding:10px;margin-bottom:8px;border-left:3px solid " + p.color + "'>";
                        html += "<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:6px'>";
                        html += "<span style='font-size:11px;font-weight:bold;color:" + p.color + "'>" + p.label + "</span>";
                        html += "<span style='font-size:8px;font-weight:bold;color:" + p.color + ";background:" + p.color + "22;padding:2px 6px;border-radius:4px'>" + p.tag + "</span></div>";
                        if (p.cauchemar) html += "<div style='font-size:9px;color:#e94560;margin-bottom:6px'>\uD83D\uDCA2 " + p.cauchemar + " " + (p.cauchemarCost ? "(" + p.cauchemarCost + "/an)" : "") + "</div>";
                        p.actions.forEach(function(a) { html += "<div style='font-size:10px;color:#ccd6f6;line-height:1.6;padding-left:8px'>\u2192 " + a + "</div>"; });
                        if (p.brick) html += "<div style='font-size:9px;color:#4ecca3;margin-top:6px;line-height:1.4'>\uD83E\uDDF1 " + (p.brick.length > 100 ? p.brick.slice(0, 100) + "..." : p.brick) + "</div>";
                        if (p.rdvSouverainete) html += "<div style='font-size:8px;font-weight:bold;color:#9b59b6;margin-top:6px;background:#9b59b622;display:inline-block;padding:2px 6px;border-radius:4px'>\u23F0 " + p.rdvSouverainete + "</div>";
                        html += "</div>";
                      });
                      if (plan90.take) {
                        html += "<div style='background:#1a1a2e;border-radius:6px;padding:10px;margin-top:4px'>";
                        html += "<div style='font-size:8px;font-weight:bold;color:#ff9800;margin-bottom:4px'>TAKE — FIL ROUGE</div>";
                        html += "<div style='font-size:10px;color:#ccd6f6;font-style:italic;line-height:1.5'>\"" + plan90.take + "\"</div></div>";
                      }
                      html += "</div>";
                    }

                    // Footer
                    html += "<div class='footer'><span>Abneg@tion - L'IA extrait. Tu décides.</span><span>abnegation-fawn.vercel.app</span></div>";

                    html += "</body></html>";

                    var w = window.open("", "_blank");
                    if (w) {
                      w.document.write(html);
                      w.document.close();
                      setTimeout(function() { w.print(); }, 400);
                    }
                  }

                  return (
                    <div>
                      {/* Preview */}
                      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#e94560", fontWeight: 700, marginBottom: 4 }}>CAUCHEMARS</div>
                        <div style={{ fontSize: 12, color: topCauchemars.length > 0 ? "#ccd6f6" : "#495670" }}>
                          {topCauchemars.length > 0 ? topCauchemars.length + " cauchemar" + (topCauchemars.length > 1 ? "s" : "") + " chiffre" + (topCauchemars.length > 1 ? "s" : "") : "Aucun (complète la Carte)"}
                        </div>
                      </div>
                      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#4ecca3", fontWeight: 700, marginBottom: 4 }}>BRIQUES + CONTRE-ARGUMENTS</div>
                        <div style={{ fontSize: 12, color: top3.length > 0 ? "#ccd6f6" : "#495670" }}>
                          {top3.length > 0 ? top3.length + " brique" + (top3.length > 1 ? "s" : "") + " avec stress test" : "Score vide"}
                        </div>
                      </div>
                      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#3498db", fontWeight: 700, marginBottom: 4 }}>QUESTIONS DISCOVERY</div>
                        <div style={{ fontSize: 12, color: "#ccd6f6" }}>4 questions calibrées ({roleName})</div>
                      </div>
                      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#9b59b6", fontWeight: 700, marginBottom: 4 }}>CHRONO 90s + SILENCE</div>
                        <div style={{ fontSize: 12, color: takeText ? "#ccd6f6" : "#495670" }}>
                          {takeText ? "Pitch complet + règle du silence" : "Take manquant (valide tes Piliers)"}
                        </div>
                      </div>

                      <button onClick={generateFiche} disabled={!ready} style={{
                        width: "100%", padding: 14, marginTop: 8,
                        background: ready ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#16213e",
                        color: ready ? "#fff" : "#495670",
                        border: "none", borderRadius: 10, cursor: ready ? "pointer" : "default",
                        fontWeight: 700, fontSize: 14,
                      }}>
                        {ready ? "Produire la Fiche de Combat \u2192" : "Valide au moins 1 brique pour produire"}
                      </button>
                      {ready && (
                        <div style={{ fontSize: 11, color: "#495670", textAlign: "center", marginTop: 8 }}>
                          Ouvre une page. Imprime en PDF. Garde-la sur tes genoux.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
    </div>
  );

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>{"\uD83D\uDE80"}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#ccd6f6", marginBottom: 6 }}>Arsenal calibré.</div>
        <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6 }}>
          {validated.length} briques ({decisions.length > 0 || influences.length > 0 ? "chiffre + décision + influence" : "chiffre"}).
          {cicatrices.length > 0 ? " " + cicatrices.length + " cicatrice" + (cicatrices.length > 1 ? "s" : "") + "." : ""}
          {missions.length > 0 ? " " + missions.length + " mission" + (missions.length > 1 ? "s" : "") + " (" + missionRatio + "% sans preuve)." : ""}
          {" "}{duelAnswered.length} réponses de combat.
          {elasticBricks.length > 0 ? " " + elasticBricks.length + " briques sur marché élastique." : ""}
        </div>

        {/* CALIBRATION MESSAGE — Item 5: 3 postures par trajectoire */}
        <div style={{ background: "#0f3460", borderRadius: 8, padding: 12, marginTop: 12, textAlign: "left" }}>
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
            {trajectoryToggle === "j_y_suis"
              ? "10 000 professionnels de ton secteur publient cette semaine. 9 990 partagent des conseils génériques. Toi tu publies un diagnostic sectoriel ancré sur un vécu que l'IA ne peut pas inventer. Ton prochain poste ne viendra pas d'une offre. Il viendra de quelqu'un qui prononce ton nom dans une salle où tu n'es pas."
              : "500 personnes ont postulé à la même offre. 490 ont envoyé un CV générique. Tu as un CV forgé depuis des preuves chiffrées et un script ancré sur le cauchemar du décideur. Tes prises de position, l'IA ne sait pas les écrire. Tu es dans les 5."
            }
          </div>
        </div>

        {/* Contexte post-Forge — friction marché */}
        <div style={{ background: "#e94560" + "12", borderRadius: 8, padding: 10, marginTop: 8, textAlign: "left", border: "1px solid #e94560" + "22" }}>
          <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700, color: "#e94560" }}>{MARKET_DATA.friction.ghosting}% des candidats</span> n'obtiennent aucun retour après avoir postulé. Durée moyenne de chômage cadre : {MARKET_DATA.friction.duree_chomage_jours.min}-{MARKET_DATA.friction.duree_chomage_jours.max} jours. Ton Arsenal réduit ces chiffres. Les briques blindées passent le tri. Les scripts ancrent la négociation.
          </div>
          <div style={{ fontSize: 8, color: "#495670", marginTop: 4 }}>Données : APEC 2022-2023, Baromètre Unédic 2025.</div>
        </div>

        {measurementDiag && (
          <div style={{ fontSize: 12, color: measurementDiag.color, fontWeight: 600, marginTop: 8 }}>
            {measurementDiag.level === "fort" ? "\uD83D\uDCCA" : measurementDiag.level === "moyen" ? "\u26A0\uFE0F" : "\uD83D\uDEA8"} {measurementDiag.title}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {(trajectoryToggle === "j_y_suis" ? [
          { id: "arsenal", label: "Ton Arsenal", emoji: "\u2694\uFE0F" },
          { id: "thermostat", label: "Thermostat", emoji: "\uD83C\uDF21\uFE0F" },
          { id: "coffre", label: "Score", emoji: "\uD83D\uDD10" },
        ] : [
          { id: "arsenal", label: "Ton Arsenal", emoji: "\u2694\uFE0F" },
          { id: "coffre", label: "Score", emoji: "\uD83D\uDD10" },
        ]).map(function(t) {
          var act = tab === t.id;
          return (
            <button key={t.id} onClick={function() { setTab(t.id); }} style={{
              flex: 1, padding: "10px 8px", background: act ? "#e94560" : "#1a1a2e",
              border: act ? "2px solid #e94560" : "2px solid #16213e",
              borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700,
              color: act ? "#fff" : "#8892b0", transition: "all 0.2s",
            }}>{t.emoji} {t.label}</button>
          );
        })}
      </div>

      {/* ARSENAL TAB */}
      {tab === "arsenal" && (
        <div>
          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>TON LEVIER DE NÉGOCIATION</div>

          {trajectoryToggle !== "j_y_suis" ? (
            <div>
              {/* PROSPECTION — Scripts + Bio LinkedIn + LinkedIn posts/signaux */}
              <div style={{ fontSize: 10, color: "#4ecca3", fontWeight: 700, letterSpacing: 1.5, marginBottom: 8, marginTop: 4, textTransform: "uppercase" }}>{"\uD83C\uDFAF"} Prospection</div>
              {sectionScripts}
              {sectionBioLK}
              {sectionLinkedin}

              {/* ENTRETIEN — CV, Lettre, Fiche de Combat, Combat */}
              <div style={{ fontSize: 10, color: "#ff9800", fontWeight: 700, letterSpacing: 1.5, marginBottom: 8, marginTop: 20, textTransform: "uppercase" }}>{"\u2694\uFE0F"} Entretien</div>
              {sectionCV}
              {sectionLettre}
              {sectionFiche}
              {sectionCombat}
            </div>
          ) : (
            <div>
              {/* J_Y_SUIS: 3 sections (LinkedIn + Bio + Fiche de Combat) */}
              {sectionLinkedin}
              {sectionBioLK}
              {sectionFiche}
            </div>
          )}

        </div>
      )}
      {/* THERMOSTAT TAB — subscribers only (j_y_suis) */}
      {tab === "thermostat" && trajectoryToggle === "j_y_suis" && (function() {
        var thermoValidated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
        var thermoBlinded = thermoValidated.filter(function(b) { return b.blinded; });
        var diltsHistory = vault && vault.diltsHistory ? vault.diltsHistory : [];
        var thermoState = getDiltsThermometerState(diltsHistory);
        var diltsTarget = computeDiltsTarget(diltsHistory);
        var diltsLabel = getDiltsLabel(thermoState.effectiveLevel);
        var thermoCoverage = computeCauchemarCoverage(bricks);
        var thermoCovered = thermoCoverage.filter(function(c) { return c.covered; });
        var thermoCostLow = 0; var thermoCostHigh = 0;
        thermoCovered.forEach(function(cc) {
          var cauch = getActiveCauchemars().find(function(c) { return c.id === cc.id; });
          if (cauch) { thermoCostLow += cauch.costRange[0]; thermoCostHigh += cauch.costRange[1]; }
        });
        var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
        var cadence = roleData ? roleData.cadence : 90;
        var cadenceLabel = roleData ? roleData.cadenceLabel : "Trimestrielle";

        // Brick freshness calculation (simulated — in production, use brick.validatedAt)
        var now = Date.now();
        var freshBricks = thermoValidated.filter(function(b) { return !b.validatedAt || (now - b.validatedAt) < 30 * 24 * 3600 * 1000; });
        var agingBricks = thermoValidated.filter(function(b) { return b.validatedAt && (now - b.validatedAt) >= 30 * 24 * 3600 * 1000 && (now - b.validatedAt) < 90 * 24 * 3600 * 1000; });
        var staleBricks = thermoValidated.filter(function(b) { return b.validatedAt && (now - b.validatedAt) >= 90 * 24 * 3600 * 1000; });

        // Next RDV
        var nextRdvDate = new Date();
        nextRdvDate.setDate(nextRdvDate.getDate() + cadence);
        var rdvFormatted = nextRdvDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

        // Notification
        var hasNotif = thermoState.decay > 0 || staleBricks.length > 0;

        return (
          <div style={{ padding: "0 0 20px 0" }}>

            {/* NOTIFICATION BANNER */}
            {hasNotif && (
              <div style={{ background: "#e94560" + "22", borderRadius: 10, padding: 14, marginBottom: 16, border: "1px solid #e94560" + "44" }}>
                <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, marginBottom: 6 }}>{"\u26A0\uFE0F"} ALERTE THERMOSTAT</div>
                <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
                  {staleBricks.length > 0 ? staleBricks.length + " brique" + (staleBricks.length > 1 ? "s" : "") + " dépasse" + (staleBricks.length > 1 ? "nt" : "") + " 90 jours. Ton signal se dégrade." : ""}
                  {thermoState.decay > 0 ? " Ton registre Dilts a baissé. " + thermoState.weeksInactive + " semaine" + (thermoState.weeksInactive > 1 ? "s" : "") + " sans signal." : ""}
                </div>
              </div>
            )}

            {/* SCORE DE FRAÎCHEUR GLOBAL */}
            <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 16, borderLeft: "4px solid " + (staleBricks.length > 0 ? "#e94560" : agingBricks.length > 0 ? "#ff9800" : "#4ecca3") }}>
              <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>THERMOSTAT</div>

              {/* Freshness bars */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <div style={{ flex: 1, textAlign: "center", background: "#1a1a2e", borderRadius: 8, padding: 10, borderTop: "3px solid #4ecca3" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#4ecca3" }}>{freshBricks.length}</div>
                  <div style={{ fontSize: 9, color: "#4ecca3", fontWeight: 600 }}>Fraîches</div>
                  <div style={{ fontSize: 8, color: "#495670" }}>&lt; 30 jours</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", background: "#1a1a2e", borderRadius: 8, padding: 10, borderTop: "3px solid #ff9800" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#ff9800" }}>{agingBricks.length}</div>
                  <div style={{ fontSize: 9, color: "#ff9800", fontWeight: 600 }}>Vieillissantes</div>
                  <div style={{ fontSize: 8, color: "#495670" }}>30-90 jours</div>
                </div>
                <div style={{ flex: 1, textAlign: "center", background: "#1a1a2e", borderRadius: 8, padding: 10, borderTop: "3px solid #e94560" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#e94560" }}>{staleBricks.length}</div>
                  <div style={{ fontSize: 9, color: "#e94560", fontWeight: 600 }}>Périmées</div>
                  <div style={{ fontSize: 8, color: "#495670" }}>&gt; 90 jours</div>
                </div>
              </div>

              {/* Valeur + Visibilité + Coût */}
              <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #16213e" }}>
                <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 700, marginBottom: 4 }}>VALEUR PROUVÉE</div>
                <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
                  {thermoCovered.length} cauchemar{thermoCovered.length > 1 ? "s" : ""} couvert{thermoCovered.length > 1 ? "s" : ""}. Coût cumulé : {formatCost(thermoCostLow)}-{formatCost(thermoCostHigh)}/an. {thermoBlinded.length} brique{thermoBlinded.length > 1 ? "s" : ""} blindée{thermoBlinded.length > 1 ? "s" : ""}.
                </div>
              </div>

              <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #16213e" }}>
                <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 700, marginBottom: 4 }}>VISIBILITÉ</div>
                <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
                  Registre : {diltsLabel.name} ({thermoState.effectiveLevel}/5).
                  {thermoState.decay > 0 ? " Signal en baisse depuis " + thermoState.weeksInactive + " semaine" + (thermoState.weeksInactive > 1 ? "s" : "") + "." : " Signal stable."}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: thermoState.decay > 0 ? "#e94560" : "#8892b0", fontWeight: 700, marginBottom: 4 }}>COÛT DU SILENCE</div>
                <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
                  {thermoState.decay > 0
                    ? "Ton thermostat a baissé. Chaque semaine sans signal, tu sors du top 5% des profils visibles."
                    : "Ton thermostat est stable. 1 signal par semaine suffit."
                  }
                </div>
              </div>
            </div>

            {/* PROCHAIN RENDEZ-VOUS DE SOUVERAINETÉ */}
            <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 16, borderLeft: "4px solid #9b59b6" }}>
              <div style={{ fontSize: 11, color: "#9b59b6", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>PROCHAIN RENDEZ-VOUS DE SOUVERAINETÉ</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>{rdvFormatted}</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6, marginBottom: 8 }}>
                Cadence {cadenceLabel.toLowerCase()} — {roleData ? roleData.role : "Rôle non défini"}.
              </div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
                {roleData ? roleData.cadenceReason : ""}
              </div>
            </div>

            {/* BRIQUES A RAFRAICHIR */}
            {(agingBricks.length > 0 || staleBricks.length > 0) && (
              <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, borderLeft: "4px solid #ff9800" }}>
                <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>BRIQUES À RAFRAÎCHIR ({agingBricks.length + staleBricks.length})</div>
                {staleBricks.concat(agingBricks).map(function(b, i) {
                  var age = b.validatedAt ? Math.floor((now - b.validatedAt) / (24 * 3600 * 1000)) : 0;
                  var isStale = age >= 90;
                  return (
                    <div key={i} style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 6, borderLeft: "3px solid " + (isStale ? "#e94560" : "#ff9800") }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 12, color: "#ccd6f6", flex: 1 }}>{b.text.length > 80 ? b.text.slice(0, 80) + "..." : b.text}</div>
                        <div style={{ fontSize: 9, color: isStale ? "#e94560" : "#ff9800", fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{age}j</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* POSTS DE LA SEMAINE — branché depuis generateWeeklyPosts */}
            {(function() {
              var weeklyResult = generateWeeklyPosts(bricks, vault, targetRoleId);
              var weeklyPosts = weeklyResult.posts;
              var weeklyRejected = weeklyResult.rejected;
              if (weeklyPosts.length === 0 && weeklyRejected.length === 0) return null;
              return (
                <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginTop: 16, borderLeft: "4px solid #4ecca3" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 700, letterSpacing: 1 }}>POSTS DE LA SEMAINE</div>
                    <span style={{ fontSize: 10, color: "#8892b0" }}>{weeklyPosts.length} prêt{weeklyPosts.length > 1 ? "s" : ""}</span>
                  </div>
                  {weeklyPosts.length === 0 && (
                    <div style={{ fontSize: 12, color: "#495670", textAlign: "center", padding: 12 }}>
                      Pas assez de briques blindées pour produire des posts. Blinde ton Score.
                    </div>
                  )}
                  {weeklyPosts.map(function(post, pi) {
                    var postDilts = getDiltsLabel(post.diltsLevel);
                    return (
                      <div key={pi} style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: pi < weeklyPosts.length - 1 ? 10 : 0 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 9, color: postDilts.color, background: postDilts.color + "22", padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>{postDilts.name}</span>
                          <span style={{ fontSize: 9, color: "#8892b0", background: "#1a1a2e", padding: "2px 6px", borderRadius: 6 }}>{post.formatLabel}</span>
                          {post.marieScore && <span style={{ fontSize: 9, color: post.marieScore >= 7 ? "#4ecca3" : "#ff9800", background: "#1a1a2e", padding: "2px 6px", borderRadius: 6 }}>Marie {post.marieScore}/10</span>}
                        </div>
                        <div style={{ fontSize: 10, color: "#495670", marginBottom: 6 }}>Source : {post.brickText.length > 60 ? post.brickText.slice(0, 60) + "..." : post.brickText}</div>
                        <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: 8 }}>{post.text}</div>
                        <CopyBtn text={post.text} label="Copier" />
                      </div>
                    );
                  })}
                  <div style={{ fontSize: 10, color: "#495670", lineHeight: 1.5, marginTop: 8 }}>
                    Publie entre 7h30 et 8h30 en semaine. Réponds à tous les commentaires dans les 2 premières heures.
                  </div>
                </div>
              );
            })()}

            {/* ACTIONS RAPIDES — sleep mode */}
            {(function() {
              var sleepComment = generateSleepComment(bricks, vault, targetRoleId);
              var sleepBrick = proposeSleepBrick(vault);
              if (!sleepComment && !sleepBrick) return null;
              return (
                <div style={{ background: "#16213e", borderRadius: 12, padding: 16, marginTop: 16, borderLeft: "4px solid #3498db" }}>
                  <div style={{ fontSize: 11, color: "#3498db", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>ACTIONS RAPIDES</div>
                  {sleepComment && (
                    <div style={{ marginBottom: sleepBrick ? 10 : 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 11 }}>{"\uD83D\uDCAC"}</span>
                        <span style={{ fontSize: 11, color: "#8892b0", fontWeight: 600 }}>Commentaire de la semaine ({sleepComment.effort})</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.5 }}>{sleepComment.suggestion}</div>
                    </div>
                  )}
                  {sleepBrick && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 11 }}>{"\u2795"}</span>
                        <span style={{ fontSize: 11, color: "#8892b0", fontWeight: 600 }}>Nouvelle brique ({sleepBrick.effort})</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.5 }}>{sleepBrick.suggestion}</div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* COFFRE-FORT TAB */}
      {tab === "coffre" && (
        <div>
          {/* BRIQUES with category + elasticity tags + audit badges */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6" }}>{"\uD83E\uDDF1"} Briques de Preuve ({validated.length})</div>
              <CopyBtn text={validated.map(function(b) { return b.text + " [" + b.kpi + "] [" + (b.brickCategory || "chiffre") + "]" + (b.elasticity ? " [" + b.elasticity + "]" : ""); }).join("\n\n")} label="Exporter briques" />
            </div>
            {/* EXPORT TRANSPORTABLE — with re-scan */}
            {(function() {
              var withAnon = validated.filter(function(b) { return b.anonymizedText; });
              if (withAnon.length === 0) return null;
              var allClean = withAnon.every(function(b) {
                var rescan = auditAnonymization(b.anonymizedText, false);
                return rescan.totalFindings === 0;
              });
              var exportText = withAnon.map(function(b) { return b.anonymizedText; }).join("\n\n");
              return (
                <div style={{ background: allClean ? "#4ecca3" + "11" : "#e94560" + "11", borderRadius: 8, padding: 10, marginBottom: 10, border: "1px solid " + (allClean ? "#4ecca3" : "#e94560") }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 11, color: allClean ? "#4ecca3" : "#e94560", fontWeight: 600 }}>
                        {allClean ? "\uD83D\uDD12 Versions transportables propres" : "\u26A0\uFE0F Re-scan : éléments détectés"}
                      </div>
                      <div style={{ fontSize: 10, color: "#8892b0", marginTop: 2 }}>
                        {withAnon.length} version{withAnon.length > 1 ? "s" : ""} — re-scannée{withAnon.length > 1 ? "s" : ""} à l'export
                      </div>
                    </div>
                    {allClean && <CopyBtn text={exportText} label="Exporter" />}
                  </div>
                  {!allClean && (
                    <div style={{ fontSize: 11, color: "#e94560", marginTop: 6 }}>Export bloqué. Une ou plusieurs versions transportables contiennent des éléments sensibles détectés au re-scan.</div>
                  )}
                </div>
              );
            })()}
            {validated.map(function(b) {
              var cat = b.brickCategory && CATEGORY_LABELS[b.brickCategory];
              var elast = b.elasticity && ELASTICITY_LABELS[b.elasticity];
              var activeView = brickViews[b.id] || "brut";
              var hasVersions = b.cvVersion || b.interviewVersions;
              return (
                <div key={b.id} style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 6, borderLeft: "3px solid " + (cat ? cat.color : "#e94560") }}>
                  {hasVersions && (
                    <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                      {["brut", "cv", "rh", "n1", "dir", "disco", "stress"].map(function(v) {
                        var labels = { brut: "Brut", cv: "CV", rh: "RH", n1: "N+1", dir: "Direction", disco: "Questions", stress: "\u26A1 Stress" };
                        var active = activeView === v;
                        if (v === "stress" && !b.stressTest) return null;
                        return (
                          <button key={v} onClick={function() { setBrickView(b.id, v); }} style={{
                            padding: "3px 8px", fontSize: 9, fontWeight: 600,
                            background: active ? (v === "stress" ? "#ff9800" : "#e94560") : "#1a1a2e",
                            color: active ? "#fff" : "#8892b0",
                            border: "none", borderRadius: 6, cursor: "pointer",
                          }}>{labels[v]}</button>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 6 }}>
                    {activeView === "brut" && b.text}
                    {activeView === "cv" && (b.cvVersion || b.text)}
                    {activeView === "rh" && (b.interviewVersions ? b.interviewVersions.rh : b.text)}
                    {activeView === "n1" && (b.interviewVersions ? b.interviewVersions.n1 : b.text)}
                    {activeView === "dir" && (b.interviewVersions ? b.interviewVersions.direction : b.text)}
                    {activeView === "disco" && (b.discoveryQuestions ? b.discoveryQuestions.join("\n\n") : "Aucune question produite.")}
                    {activeView === "stress" && b.stressTest && (
                      <div>
                        <div style={{ fontSize: 10, color: "#ff9800", fontWeight: 700, marginBottom: 8 }}>STRESS TEST — {b.stressTest.length} angles d'attaque</div>
                        {b.stressTest.map(function(angle, ai) {
                          var sourceColor = angle.source === "offre" ? "#3498db" : angle.source === "marche" ? "#9b59b6" : "#ff9800";
                          var sourceLabel = angle.source === "offre" ? "OFFRE" : angle.source === "marche" ? "MARCHÉ" : "";
                          return (
                            <div key={ai} style={{ background: "#1a1a2e", borderRadius: 6, padding: 8, marginBottom: 6 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: sourceColor, marginBottom: 4 }}>{(ai + 1) + ". " + angle.label}{sourceLabel ? " — " + sourceLabel : ""}</div>
                              <div style={{ fontSize: 11, color: "#e94560", lineHeight: 1.5, marginBottom: 6, fontStyle: "italic" }}>{angle.attack}</div>
                              <div style={{ fontSize: 11, color: "#4ecca3", lineHeight: 1.5 }}>{"\u2192"} {angle.defense}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {activeView !== "brut" && (
                    <CopyBtn text={activeView === "cv" ? (b.cvVersion || b.text) : activeView === "rh" ? (b.interviewVersions ? b.interviewVersions.rh : b.text) : activeView === "n1" ? (b.interviewVersions ? b.interviewVersions.n1 : b.text) : activeView === "dir" ? (b.interviewVersions ? b.interviewVersions.direction : b.text) : activeView === "disco" ? (b.discoveryQuestions ? b.discoveryQuestions.join("\n\n") : "") : b.text} label="Copier" />
                  )}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, color: cat ? cat.color : "#e94560", background: "#1a1a2e", padding: "2px 8px", borderRadius: 10 }}>
                      {b.brickType === "cicatrice" ? "cicatrice" : cat ? cat.label.toLowerCase() : b.kpi}
                    </span>
                    {elast && <span style={{ fontSize: 10, color: elast.color, background: "#1a1a2e", padding: "2px 8px", borderRadius: 10 }}>{elast.icon} {elast.label}</span>}
                  </div>
                  {b.nightmareText && (
                    <div style={{ fontSize: 11, color: "#e74c3c", marginTop: 6, lineHeight: 1.4 }}>{"\uD83D\uDCA2"} {b.nightmareText}</div>
                  )}
                  {b.anonymizedText && (
                    <div style={{ fontSize: 11, color: "#95a5a6", marginTop: 4, lineHeight: 1.4 }}>{"\uD83D\uDD12"} Transportable : "{b.anonymizedText}"</div>
                  )}
                  {b.kpiRefMatch && (
                    <div style={{ fontSize: 11, color: b.kpiRefMatch.elasticity === "élastique" ? "#4ecca3" : b.kpiRefMatch.elasticity === "sous_pression" ? "#e94560" : "#8892b0", marginTop: 4, lineHeight: 1.4 }}>
                      {b.kpiRefMatch.elasticity === "élastique" ? "\u2197\uFE0F" : b.kpiRefMatch.elasticity === "sous_pression" ? "\u2198\uFE0F" : "\u2194\uFE0F"} {b.kpiRefMatch.name} : {b.kpiRefMatch.why}
                    </div>
                  )}
                  {(function() {
                    var vuln = auditBrickVulnerability(b);
                    if (!vuln) return null;
                    return (
                      <div style={{ fontSize: 10, color: vuln.color, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <span>{vuln.level === "blindee" ? "\uD83D\uDEE1\uFE0F" : vuln.level === "credible" ? "\u26A0\uFE0F" : "\uD83D\uDEA8"}</span>
                        <span>{vuln.level === "blindee" ? "Blindée" : vuln.level === "credible" ? "À blinder" : "Vulnérable"}</span>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {/* CAUCHEMAR COST SUMMARY — negotiation ammunition */}
          {(function() {
            var detailedCoverage = computeCauchemarCoverageDetailed(bricks, nightmareCosts || {});
            var withCosts = detailedCoverage.filter(function(c) { return c.cost; });
            var vulnerableCoverage = detailedCoverage.filter(function(c) { return c.covered && c.vulnerability && c.vulnerability.level === "vulnerable"; });
            if (withCosts.length === 0 && detailedCoverage.every(function(c) { return !c.covered; })) return null;
            return (
              <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 16, borderLeft: "3px solid #e94560" }}>
                <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>{"\uD83D\uDCA2"} CARTE DES CAUCHEMARS</div>
                {detailedCoverage.map(function(c) {
                  return (
                    <div key={c.id} style={{ background: "#1a1a2e", borderRadius: 6, padding: 8, marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, color: c.covered ? "#4ecca3" : "#e94560" }}>{c.covered ? "\u2705" : "\u274C"}</span>
                          <span style={{ fontSize: 12, color: "#ccd6f6" }}>{c.label}</span>
                        </div>
                        {c.covered && c.vulnerability && (
                          <span style={{ fontSize: 9, color: c.vulnerability.color, background: "#0f3460", padding: "2px 6px", borderRadius: 4 }}>
                            {c.vulnerability.level === "blindee" ? "\uD83D\uDEE1\uFE0F" : c.vulnerability.level === "credible" ? "\u26A0\uFE0F" : "\uD83D\uDEA8"} {c.vulnerability.level}
                          </span>
                        )}
                      </div>
                      {c.cost && (
                        <div style={{ fontSize: 11, color: "#e94560", marginTop: 4 }}>{"\uD83D\uDCB0"} Impact : {c.cost}</div>
                      )}
                      {c.covered && (
                        <div style={{ fontSize: 10, color: "#495670", marginTop: 2 }}>{c.brickCount} brique{c.brickCount > 1 ? "s" : ""} couvre{c.brickCount > 1 ? "nt" : ""} ce cauchemar</div>
                      )}
                    </div>
                  );
                })}
                {withCosts.length > 0 && (
                  <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6, marginTop: 8 }}>
                    Ta négociation ne porte pas sur ton salaire. Elle porte sur la disparition de {withCosts.length === 1 ? "ce problème qui coûte " + withCosts[0].cost : "ces problèmes"}. Le recruteur ne paie pas ta compétence. Il paie la fin de sa douleur.
                  </div>
                )}
                {vulnerableCoverage.length > 0 && (
                  <div style={{ background: "#e94560" + "22", borderRadius: 6, padding: 8, marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: "#e94560", lineHeight: 1.5 }}>
                      {vulnerableCoverage.length} cauchemar{vulnerableCoverage.length > 1 ? "s" : ""} couvert{vulnerableCoverage.length > 1 ? "s" : ""} par des briques vulnérables. Tu te positionnes comme le remède mais ta preuve est faible. Si le problème persiste, tu deviens la cible.
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* DIAGNOSTIC DE MESURE */}
          {measurementDiag && (
            <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 16, borderLeft: "3px solid " + measurementDiag.color }}>
              <div style={{ fontSize: 11, color: measurementDiag.color, fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>{measurementDiag.level === "fort" ? "\uD83D\uDCCA" : measurementDiag.level === "moyen" ? "\u26A0\uFE0F" : "\uD83D\uDEA8"} {measurementDiag.title.toUpperCase()}</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>{measurementDiag.msg}</div>
              {missions.length > 0 && (
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6, marginTop: 8 }}>
                  Ratio : {validated.length} brique{validated.length > 1 ? "s" : ""} prouvée{validated.length > 1 ? "s" : ""} / {missions.length} mission{missions.length > 1 ? "s" : ""} sans chiffre.
                  {missionRatio >= 50 ? " La majorité de ton activité est invisible. Tu négocies à l'aveugle." : ""}
                </div>
              )}
            </div>
          )}

          {/* MISSIONS */}
          {missions.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>{"\uD83D\uDCCB"} Missions en attente ({missions.length})</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 8 }}>Chaque mission complétée ne remplit pas seulement ton arsenal. Elle installe un réflexe : mesurer ce que tu fais pendant que tu le fais.</div>
              {missions.map(function(m) {
                return (
                  <div key={m.id} style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 6, borderLeft: "3px solid #ff9800" }}>
                    <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 4 }}>{m.text}</div>
                    <span style={{ fontSize: 10, color: "#ff9800" }}>Complète cette mission. La prochaine fois, mesure en temps réel.</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* PILIERS */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>{"\uD83C\uDFDB\uFE0F"} Piliers ({vault.pillars})</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>Tes piliers définissent l'angle de chaque livrable. L'IA injecte tes convictions comme des variables fixes dans chaque texte produit.</div>
          </div>

          {/* STYLE ENGINE — now tracks corrections */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>{"\u270D\uFE0F"} Éditeur de Contraintes : {vault.corrections} correction{vault.corrections > 1 ? "s" : ""}</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 8 }}>Le moteur apprend de tes corrections, pas de tes validations. Chaque modification enseigne ta voix. Après 50 corrections, l'IA écrit comme toi.</div>
            <Bar pct={Math.min(100, vault.corrections * 2)} />
          </div>

          {/* INDICE DE LEVIER */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>{"\u2694\uFE0F"} Indice de Levier</div>
            <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, border: "1px dashed #e94560" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 600 }}>POUVOIR DE NÉGOCIATION</div>
                <span style={{ fontSize: 14, color: leveragePct >= 70 ? "#4ecca3" : "#e94560", fontWeight: 800 }}>{leveragePct}%</span>
              </div>
              <Bar pct={leveragePct} />
              {elasticBricks.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#4ecca3" }}>
                  {"\u2197\uFE0F"} {elasticBricks.length} brique{elasticBricks.length > 1 ? "s" : ""} sur marché élastique. Tu te positionnes là où la demande accélère.
                </div>
              )}
              {kpiGaps.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>CE QUE TU LAISSES SUR LA TABLE</div>
                  {kpiGaps.map(function(g, i) {
                    return (
                      <div key={i} style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 6, borderLeft: "3px solid #e94560" }}>
                        <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 3 }}>{g.kpi}</div>
                        <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{g.msg}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {kpiGaps.length === 0 && (
                <div style={{ marginTop: 12, fontSize: 12, color: "#4ecca3", fontWeight: 600 }}>Aucune faille détectée. Ton levier est maximal sur les critères Forge.</div>
              )}
            </div>
          </div>

          {/* CAPTURE PINGS */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>{"\uD83D\uDD14"} Interrogatoire de Capture</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[
                { id: "recherche", label: "Recherche" },
                { id: "en_poste", label: "En poste" },
                { id: "négociation", label: "Négociation" },
                { id: "freelance", label: "Freelance" },
              ].map(function(p) {
                var act = capturePhase === p.id;
                return (
                  <button key={p.id} onClick={function() { setCapturePhase(p.id); }} style={{
                    flex: 1, padding: "6px 4px", fontSize: 11, fontWeight: 700,
                    background: act ? "#e94560" : "#1a1a2e", color: act ? "#fff" : "#495670",
                    border: act ? "1px solid #e94560" : "1px solid #16213e",
                    borderRadius: 6, cursor: "pointer",
                  }}>{p.label}</button>
                );
              })}
            </div>
            <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, border: "1px solid #16213e" }}>
              {capturePhase === "freelance" && (
                <div style={{ fontSize: 12, color: "#4ecca3", lineHeight: 1.5, marginBottom: 12, padding: "8px 10px", background: "#1a1a2e", borderRadius: 8, borderLeft: "3px solid #4ecca3" }}>
                  Mode freelance : chaque ping produit un rapport de valeur que tu envoies à ton client pour justifier tes honoraires. Tu ne notes pas pour te souvenir. Tu blindes pour facturer.
                </div>
              )}
              {pings.map(function(ping, i) {
                return (
                  <div key={i} style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: i < pings.length - 1 ? 12 : 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? "#e94560" : "#495670", marginTop: 4, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 11, color: "#495670", marginBottom: 4 }}>PING — {ping.month}</div>
                        <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.5, fontWeight: 600 }}>"{ping.text}"</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BRIEF DE NÉGOCIATION — cauchemars as leverage */}
          {(function() {
            var coverage = computeCauchemarCoverage(bricks);
            var coveredWithCost = coverage.filter(function(c) { return c.covered && c.costRange; });
            if (coveredWithCost.length === 0) return null;
            var totalCostMin = 0;
            var totalCostMax = 0;
            coveredWithCost.forEach(function(c) { totalCostMin += c.costRange[0]; totalCostMax += c.costRange[1]; });
            var hasElastic = coveredWithCost.some(function(c) { return c.hasElasticCovering; });
            return (
              <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid #4ecca3" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>{"\uD83D\uDCB0"}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ccd6f6" }}>BRIEF DE NÉGOCIATION</div>
                    <div style={{ fontSize: 11, color: "#4ecca3" }}>Cadrage par le coût du problème, pas par ton salaire</div>
                  </div>
                </div>
                <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 6 }}>Tu couvres {coveredWithCost.length} cauchemar{coveredWithCost.length > 1 ? "s" : ""} représentant un coût sectoriel de :</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#4ecca3" }}>
                    {(totalCostMin / 1000).toFixed(0)}K - {(totalCostMax / 1000).toFixed(0)}K{"\u20AC"}/an
                  </div>
                  <div style={{ fontSize: 11, color: "#495670", marginTop: 4 }}>Fourchette basée sur les moyennes Mid-Market SaaS</div>
                </div>
                {coveredWithCost.map(function(c) {
                  return (
                    <div key={c.id} style={{ background: "#1a1a2e", borderRadius: 6, padding: 8, marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: "#ccd6f6", fontWeight: 600 }}>{c.label}</span>
                        <span style={{ fontSize: 10, color: "#e94560" }}>{(c.costRange[0] / 1000).toFixed(0)}-{(c.costRange[1] / 1000).toFixed(0)}K{"\u20AC"}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.4 }}>{c.costContext}</div>
                      {c.hasElasticCovering && (
                        <div style={{ fontSize: 10, color: "#4ecca3", marginTop: 3 }}>{"\u2197\uFE0F"} Couvert par une brique élastique. Position de remède crédible.</div>
                      )}
                      {c.covered && !c.hasElasticCovering && (
                        <div style={{ fontSize: 10, color: "#ff9800", marginTop: 3 }}>{"\u26A0\uFE0F"} Couvert par une brique stable. Levier de négociation limité.</div>
                      )}
                    </div>
                  );
                })}
                <div style={{ background: hasElastic ? "#4ecca3" + "15" : "#ff9800" + "15", borderRadius: 6, padding: 8, marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: hasElastic ? "#4ecca3" : "#ff9800", lineHeight: 1.5, fontWeight: 600 }}>
                    {hasElastic
                      ? "Ta négociation ne porte pas sur ton salaire. Elle porte sur le coût de ne pas te recruter. Le cauchemar coûte " + (totalCostMin / 1000).toFixed(0) + "-" + (totalCostMax / 1000).toFixed(0) + "K\u20AC/an. Ton package est une fraction de ce risque."
                      : "Tes briques couvrent des cauchemars mais aucune n'est sur un KPI élastique. Ton levier de négociation est réel mais contestable. Cherche un angle élastique."
                    }
                  </div>
                </div>
              </div>
            );
          })()}

          {/* THERMOSTAT TEASER — shown once at end of Forge, all green, sells subscription */}
          {targetRoleId && KPI_REFERENCE[targetRoleId] && (function() {
            var roleData = KPI_REFERENCE[targetRoleId];
            var validatedBricks = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
            var blindedBricks = validatedBricks.filter(function(b) { return b.blinded; });
            var decayDate = new Date();
            decayDate.setDate(decayDate.getDate() + 90);
            var decayStr = decayDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
            var nextRdv = new Date();
            nextRdv.setDate(nextRdv.getDate() + roleData.cadence);
            var rdvStr = nextRdv.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

            return (
              <div style={{ background: "#0f3460", borderRadius: 12, padding: 20, marginBottom: 16, border: "1px solid #4ecca3" }}>
                <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>{"\uD83C\uDF21\uFE0F"} THERMOSTAT — ÉTAT ACTUEL</div>

                {/* All green today */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <div style={{ flex: 1, textAlign: "center", background: "#4ecca3" + "15", borderRadius: 8, padding: 10, border: "1px solid #4ecca3" + "33" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#4ecca3" }}>{validatedBricks.length}</div>
                    <div style={{ fontSize: 9, color: "#4ecca3", fontWeight: 600 }}>Briques fraîches</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center", background: "#4ecca3" + "15", borderRadius: 8, padding: 10, border: "1px solid #4ecca3" + "33" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#4ecca3" }}>{blindedBricks.length}</div>
                    <div style={{ fontSize: 9, color: "#4ecca3", fontWeight: 600 }}>Blindées</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center", background: "#4ecca3" + "15", borderRadius: 8, padding: 10, border: "1px solid #4ecca3" + "33" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#4ecca3" }}>0</div>
                    <div style={{ fontSize: 9, color: "#4ecca3", fontWeight: 600 }}>Périmées</div>
                  </div>
                </div>

                {/* Decay warning */}
                <div style={{ background: "#e94560" + "15", borderRadius: 8, padding: 14, border: "1px solid #e94560" + "33", marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e94560", marginBottom: 6 }}>Aujourd'hui tout est vert.</div>
                  <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.7 }}>
                    Le {decayStr}, ces {validatedBricks.length} briques auront perdu 40% de leur valeur. Un recruteur qui te contacte dans 3 mois entendra un pitch construit sur des chiffres anciens. Le marché aura bougé. Tes preuves non.
                  </div>
                </div>

                {/* RDV preview */}
                <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#9b59b6", fontWeight: 700 }}>PROCHAIN RENDEZ-VOUS DE SOUVERAINETÉ</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#ccd6f6", marginTop: 4 }}>{rdvStr}</div>
                    </div>
                    <div style={{ fontSize: 9, color: "#8892b0", textAlign: "right" }}>
                      <div>Cadence {roleData.cadenceLabel.toLowerCase()}</div>
                      <div>{roleData.role}</div>
                    </div>
                  </div>
                </div>

                {/* What Thermostat does */}
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6 }}>
                  Le Thermostat surveille la fraîcheur de chaque brique, te prévient quand ton signal se dégrade, et programme tes Rendez-vous de Souveraineté. Il fonctionne avec l'abonnement.
                </div>
              </div>
            );
          })()}

          {/* SCRIPT DE NÉGOCIATION */}
          {(function() {
            var negoBrief = computeNegotiationBrief(bricks);
            var bluffRisks = detectBluffRisk(bricks);
            if (!negoBrief) return null;
            return (
              <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid #4ecca3" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>{"\u2694\uFE0F"}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#ccd6f6" }}>SCRIPT DE NÉGOCIATION</div>
                    <div style={{ fontSize: 11, color: "#4ecca3" }}>{negoBrief.coveredCount} cauchemar{negoBrief.coveredCount > 1 ? "s" : ""} couvert{negoBrief.coveredCount > 1 ? "s" : ""} / Impact total : {formatCost(negoBrief.totalCostLow)}-{formatCost(negoBrief.totalCostHigh)}/an</div>
                  </div>
                </div>

                {/* Each covered cauchemar = one negotiation lever */}
                {negoBrief.lines.map(function(line, i) {
                  var strengthColor = line.strength === "fort" ? "#4ecca3" : line.strength === "moyen" ? "#ff9800" : "#e94560";
                  return (
                    <div key={i} style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8, borderLeft: "3px solid " + strengthColor }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6" }}>{line.cauchemar}</span>
                        <span style={{ fontSize: 9, color: strengthColor, background: "#0f3460", padding: "2px 8px", borderRadius: 6 }}>
                          {line.strength === "fort" ? "\uD83D\uDEE1\uFE0F fort" : line.strength === "moyen" ? "\u26A0\uFE0F moyen" : "\uD83D\uDEA8 faible"} ({line.brickCount} brique{line.brickCount > 1 ? "s" : ""})
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#e94560", marginBottom: 4 }}>{"\uD83D\uDCB0"} {formatCost(line.costLow)}-{formatCost(line.costHigh)}/an — {line.costLogic}</div>
                      <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, fontStyle: "italic" }}>"{line.negoFrame}"</div>
                      {line.hasCicatrice && (
                        <div style={{ fontSize: 10, color: "#ff9800", marginTop: 4 }}>{"\uD83D\uDD25"} Bonus : tu as assumé un échec sur ce terrain. Le recruteur sait que tu connais les pièges.</div>
                      )}
                    </div>
                  );
                })}

                {/* ALERTE BLUFF */}
                {bluffRisks.length > 0 && (
                  <div style={{ background: "#e94560" + "22", borderRadius: 8, padding: 12, marginTop: 4 }}>
                    <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{"\uD83D\uDEA8"} ALERTE BLUFF</div>
                    {bluffRisks.map(function(risk, i) {
                      return (
                        <div key={i} style={{ marginBottom: i < bluffRisks.length - 1 ? 6 : 0 }}>
                          <div style={{ fontSize: 11, color: "#ccd6f6", fontWeight: 600, marginBottom: 2 }}>{risk.cauchemar}</div>
                          <div style={{ fontSize: 11, color: "#e94560", lineHeight: 1.5 }}>{risk.reason}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Mode d'emploi */}
                <div style={{ background: "#16213e", borderRadius: 6, padding: 10, marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.6 }}>
                    Mode d'emploi : n'arrive pas en disant "je vaux X". Arrive en disant "votre problème coûte {formatCost(negoBrief.totalCostLow)}-{formatCost(negoBrief.totalCostHigh)} par an. Voici comment je l'ai résolu. Voici ce que ça vaut." Le recruteur ne paie pas ta compétence. Il paie la fin de sa douleur.
                  </div>
                </div>
              </div>
            );
          })()}

          {/* PARCOURS ALTERNATIFS — cross-role matching */}
          <CrossRoleInsight bricks={bricks} targetRoleId={targetRoleId} trajectoryToggle={trajectoryToggle} />

          {/* CTA — tied to Thermostat */}
          <div style={{ borderTop: "1px solid #495670", paddingTop: 20, marginTop: 8, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>Le Thermostat surveille. Tu décides.</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6, marginBottom: 16 }}>
              Score de fraîcheur de chaque brique. Alerte quand ton signal se dégrade. Rendez-vous de Souveraineté programmés. Duel illimité. Score mis à jour en continu.
            </div>
            <button style={{
              width: "100%", padding: 16, background: "linear-gradient(135deg, #e94560, #c81d4e)",
              color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 15,
              boxShadow: "0 4px 20px rgba(233,69,96,0.3)",
            }}>Activer le Thermostat — 10€/mois</button>
            <div style={{ fontSize: 11, color: "#495670", marginTop: 10 }}>Tes briques restent accessibles en lecture seule sans abonnement.</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==============================
   DIAGNOSTIC SCREEN — Entrée gratuite 4 blocs
   Remplace la phase "ready" en mode actif
   ============================== */


