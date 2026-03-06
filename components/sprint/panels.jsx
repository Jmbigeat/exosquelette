"use client";
import { useState } from "react";
import { KPI_REFERENCE, CATEGORY_LABELS, CAUCHEMAR_TEMPLATES_BY_ROLE } from "@/lib/sprint/references";
import { computeCrossRoleMatching } from "@/lib/sprint/bricks";
import { extractBrickSummary } from "@/lib/sprint/analysis";
import { computeEffort, getActiveCauchemars, computeCauchemarCoverage, computeCauchemarCoverageDetailed, computeDensityScore, assessBrickArmor, formatCost } from "@/lib/sprint/scoring";
import { hasReachedSignatureThreshold, applySignatureFilter } from "@/lib/sprint/signature";
import { generateCV, generateBio, generateContactScripts, generateTransitionScript, extractBestNum, generatePlan30jRH, generateReplacementReport, generateRaiseArgument, generatePlan90jN1, generateInterviewQuestions, generateCVLine, generateInterviewVersions } from "@/lib/sprint/generators";
import { parseInternalSignals } from "@/lib/sprint/offers";
import { generateLinkedInPosts, generateWeeklyPosts, generateSleepComment, proposeSleepBrick } from "@/lib/sprint/linkedin";
import { getDiltsThermometerState, getDiltsLabel, computeDiltsTarget, DILTS_EDITORIAL_MAPPING } from "@/lib/sprint/dilts";
import { CopyBtn } from "./ui";
import { auditDeliverable } from "@/lib/audit";

var DELIVERABLE_AUDIENCE = {
  dm: "external",
  email: "external",
  cv: "external",
  bio: "external",
  plan30j: "external",
  posts: "external",
  questions: "external",
  interview_prep: "external",
  report: "internal",
  argument: "internal",
  plan90j: "internal",
};

var AUDIT_LABELS = {
  A: { pass: "Éléments du Coffre-Fort présents", fail: "Livrable trop générique" },
  B: { pass: "Preuve référencée", fail: "Aucune preuve référencée" },
  C: { pass: "Orienté destinataire", fail: "Parle de toi avant le recruteur" },
  D: { pass: "Format respecté", fail: "Dépasse le format" },
};

var AUDIT_C_FAIL_LABELS = {
  external: "Parle de toi avant le recruteur",
  internal: "Parle de toi avant le coût pour ton manager",
  cv: "Compétences avant réalisations",
  interview_prep: "Version entretien centrée sur toi",
};

var PRIORITY_ORDER = ["B", "A", "C", "D"];

function AuditBlock(props) {
  var auditResult = props.auditResult;
  var onCopy = props.onCopy;
  var copiedId = props.copiedId;
  var copyId = props.copyId;
  var text = props.text;
  var onCorrect = props.onCorrect;
  var corrections = props.corrections || 0;
  var maxCorrections = 2;
  var isVitrine = props.isVitrine;
  var type = props.type || "";
  var onGoForge = props.onGoForge;

  if (!auditResult) return null;

  var score = auditResult.score;
  var scoreColor = score === 4 ? "#4ecca3" : score === 3 ? "#ff9800" : "#e94560";

  // Find most impactful failed principle for redirection
  var mostImpactant = null;
  if (auditResult.failed.length > 0) {
    for (var i = 0; i < PRIORITY_ORDER.length; i++) {
      var p = PRIORITY_ORDER[i];
      if (auditResult.failed.some(function(f) { return f.principle === p; })) {
        mostImpactant = p;
        break;
      }
    }
  }

  return (
    <div style={{ background: "#0d0d1a", borderRadius: 8, padding: 10, marginTop: 8, borderLeft: "3px solid " + scoreColor }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor }}>Score : {score}/4</span>
        {score === 4 && <span style={{ fontSize: 10, color: "#4ecca3" }}>Livrable prêt.</span>}
      </div>

      {score === 4 ? null : (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
          {auditResult.passed.map(function(p) {
            return (
              <div key={p} style={{ fontSize: 10, color: "#4ecca3", lineHeight: 1.4 }}>
                {"\u2713"} {AUDIT_LABELS[p] ? AUDIT_LABELS[p].pass : p}{p === "D" ? " " + type : ""}
              </div>
            );
          })}
          {auditResult.failed.map(function(f) {
            var label = AUDIT_LABELS[f.principle] ? AUDIT_LABELS[f.principle].fail : f.principle;
            if (f.principle === "C") {
              if (type === "cv") label = AUDIT_C_FAIL_LABELS.cv;
              else if (type === "interview_prep") label = AUDIT_C_FAIL_LABELS.interview_prep;
              else if (DELIVERABLE_AUDIENCE[type] === "internal") label = AUDIT_C_FAIL_LABELS.internal;
              else label = AUDIT_C_FAIL_LABELS.external;
            }
            if (f.principle === "D") label = "Dépasse le format " + type;
            return (
              <div key={f.principle} style={{ fontSize: 10, color: "#e94560", lineHeight: 1.4 }}>
                {"\u2717"} {label}
              </div>
            );
          })}
        </div>
      )}

      {/* Correction exhausted — redirect to Forge */}
      {corrections >= maxCorrections && score < 4 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5, marginBottom: 6 }}>
            Ton matériau ne suffit pas pour ce livrable. Retourne à la Forge et blinde une brique sur {mostImpactant === "B" ? "la preuve chiffrée" : mostImpactant === "A" ? "un contexte spécifique" : mostImpactant === "C" ? "l'orientation destinataire" : "le format du canal"}.
          </div>
          {onGoForge && (
            <button onClick={onGoForge} style={{
              padding: "5px 12px", fontSize: 10, background: "#e94560", color: "#fff",
              border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600,
            }}>Aller à la Forge</button>
          )}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        {!isVitrine && score < 4 && corrections < maxCorrections && onCorrect && (
          <button onClick={onCorrect} style={{
            padding: "3px 10px", fontSize: 10, background: "#0f3460",
            color: "#ccd6f6", border: "1px solid #16213e",
            borderRadius: 6, cursor: "pointer", fontWeight: 600,
          }}>Corriger</button>
        )}
        {score === 4 ? (
          <button onClick={function() { onCopy(text, copyId); }} style={{
            padding: "3px 10px", fontSize: 10, background: copiedId === copyId ? "#4ecca3" : "#4ecca3",
            color: "#0a0a0a", border: "1px solid #4ecca3",
            borderRadius: 6, cursor: "pointer", fontWeight: 600,
          }}>{copiedId === copyId ? "\u2705 Copié" : "Copier"}</button>
        ) : (
          <button onClick={function() { onCopy(text, copyId); }} style={{
            padding: "3px 10px", fontSize: 10, background: copiedId === copyId ? "#4ecca3" : "#495670",
            color: copiedId === copyId ? "#0a0a0a" : "#8892b0", border: "1px solid " + (copiedId === copyId ? "#4ecca3" : "#495670"),
            borderRadius: 6, cursor: "pointer", fontWeight: 600,
          }}>{copiedId === copyId ? "\u2705 Copié" : "Copier quand même"}</button>
        )}
      </div>
    </div>
  );
}

export function InvestmentIndex({ bricks }) {
  var effort = computeEffort(bricks || []);
  if (effort.total === 0) return null;
  var hasCicatrices = effort.breakdown.cicatrices > 0;
  var exState = useState(false);
  var expanded = exState[0];
  var setExpanded = exState[1];

  var level = effort.total >= 30 ? "dense" : effort.total >= 15 ? "solide" : effort.total >= 6 ? "en cours" : "debut";
  var levelColor = level === "dense" ? "#4ecca3" : level === "solide" ? "#3498db" : level === "en cours" ? "#ff9800" : "#495670";

  return (
    <div style={{ background: "#16213e", borderRadius: 12, padding: 16, marginBottom: 24 }}>
      <button onClick={function() { setExpanded(!expanded); }} style={{
        width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{"\u26A1"}</span>
            <span style={{ color: "#ccd6f6", fontWeight: 700, fontSize: 13 }}>TON INVESTISSEMENT</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: levelColor, fontWeight: 700 }}>{level}</span>
            <span style={{ fontSize: 12, color: "#495670" }}>{expanded ? "\u25B2" : "\u25BC"}</span>
          </div>
        </div>
      </button>
      {expanded && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
            {level === "dense"
              ? "Tu as fait un travail que la majorité des candidats ne fera jamais. Le recruteur verra la différence entre quelqu'un qui a préparé et quelqu'un qui a récité."
              : level === "solide"
              ? "Investissement solide. Chaque brique supplémentaire creuse l'écart avec les candidats qui arrivent les mains vides."
              : level === "en cours"
              ? "Début d'investissement. Continue. La valeur arrive quand le travail devient inconfortable."
              : "Premier pas. La Forge démarre. Chaque réponse construit ton arsenal."
            }
          </div>
          {hasCicatrices && (
            <div style={{ fontSize: 11, color: "#ff9800", marginTop: 6 }}>Tu as assumé tes échecs. C'est le signal le plus rare en entretien.</div>
          )}
        </div>
      )}
    </div>
  );
}

export function Vault({ v, maturity, bricks, nightmareCosts, onCostChange }) {
  var coverage = nightmareCosts ? computeCauchemarCoverageDetailed(bricks || [], nightmareCosts) : computeCauchemarCoverage(bricks || []);
  var coveredCount = coverage.filter(function(c) { return c.covered; }).length;
  var items = [
    { l: "Briques de Preuve", val: v.bricks, mx: 9, e: "\uD83E\uDDF1" },
    { l: "Missions en cours", val: v.missions, mx: 5, e: "\uD83D\uDCCB" },
    { l: "Piliers Singularité", val: v.pillars, mx: 4, e: "\uD83C\uDFDB\uFE0F" },
  ];
  var matLabels = { executant: "Exécutant", optimiseur: "Accélérateur", architecte: "Architecte" };
  var matColors = { executant: "#495670", optimiseur: "#e94560", architecte: "#4ecca3" };
  return (
    <div style={{ background: "#16213e", borderRadius: 12, padding: 20, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{"\uD83D\uDD10"}</span>
          <span style={{ color: "#e94560", fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>SCORE</span>
        </div>
        {maturity && (
          <span style={{ fontSize: 10, color: matColors[maturity] || "#495670", background: "#1a1a2e", padding: "4px 10px", borderRadius: 10, fontWeight: 700, letterSpacing: 1 }}>
            {matLabels[maturity] || ""}
          </span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {items.map(function(it) {
          return (
            <div key={it.l} style={{ background: "#1a1a2e", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 4 }}>{it.e} {it.l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#ccd6f6" }}>
                {it.val}{it.u || ""} <span style={{ fontSize: 12, color: "#495670", fontWeight: 400 }}>/ {it.mx}{it.u || ""}</span>
              </div>
            </div>
          );
        })}
      </div>
      {/* CAUCHEMAR COVERAGE — with costs and vulnerability */}
      {bricks && bricks.length > 0 && (
        <div style={{ marginTop: 12, background: "#1a1a2e", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 6 }}>{"\uD83D\uDCA2"} Cauchemars couverts</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: coveredCount === coverage.length ? "#4ecca3" : "#e94560", marginBottom: 8 }}>
            {coveredCount} <span style={{ fontSize: 12, color: "#495670", fontWeight: 400 }}>/ {coverage.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {coverage.map(function(c) {
              var vuln = c.vulnerability || null;
              return (
                <div key={c.id} style={{ background: "#16213e", borderRadius: 6, padding: 8 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: c.covered ? "#4ecca3" : "#e94560" }}>{c.covered ? "\u2705" : "\u274C"}</span>
                    <span style={{ fontSize: 11, color: c.covered ? "#4ecca3" : "#8892b0", flex: 1 }}>{c.label}</span>
                    {c.covered && vuln && (
                      <span style={{ fontSize: 9, color: vuln.color, background: "#1a1a2e", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                        {vuln.level === "blindee" ? "\uD83D\uDEE1\uFE0F" : vuln.level === "credible" ? "\u26A0\uFE0F" : "\uD83D\uDEA8"} {vuln.level}
                      </span>
                    )}
                  </div>
                  {/* Reference cost range */}
                  {c.costRange && (
                    <div style={{ fontSize: 10, color: "#e94560", marginBottom: 3 }}>
                      {"\uD83D\uDCB0"} Coût sectoriel : {(c.costRange[0] / 1000).toFixed(0)}K - {(c.costRange[1] / 1000).toFixed(0)}K€/{c.costUnit}
                    </div>
                  )}
                  {/* Negotiation framing for covered cauchemars */}
                  {c.covered && c.costRange && c.hasElasticCovering && (
                    <div style={{ background: "#4ecca3" + "15", borderRadius: 4, padding: 6, marginBottom: 3 }}>
                      <div style={{ fontSize: 10, color: "#4ecca3", lineHeight: 1.4 }}>
                        {"\u2197\uFE0F"} Levier de négociation : ta brique couvre un cauchemar élastique à {(c.costRange[0] / 1000).toFixed(0)}-{(c.costRange[1] / 1000).toFixed(0)}K€. Ta négociation commence par ce chiffre.
                      </div>
                    </div>
                  )}
                  {/* Bluff alert for elastic coverage */}
                  {c.covered && c.hasElasticCovering && (
                    <div style={{ background: "#ff9800" + "15", borderRadius: 4, padding: 6, marginBottom: 3 }}>
                      <div style={{ fontSize: 10, color: "#ff9800", lineHeight: 1.4 }}>
                        {"\u26A0\uFE0F"} Alerte bluff : tu te positionnes comme le remède. Si le problème persiste après ton arrivée, tu es la cible. Ta preuve est-elle reproductible ?
                      </div>
                    </div>
                  )}
                  {/* Cost input */}
                  {onCostChange && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: "#495670" }}>{"\uD83D\uDCB0"}</span>
                      <input
                        type="text"
                        placeholder="Coût estimé (ex: 180K/trimestre)"
                        value={c.cost || ""}
                        onChange={function(e) { onCostChange(c.id, e.target.value); }}
                        style={{ flex: 1, background: "#0a0a1a", border: "1px solid #16213e", borderRadius: 4, padding: "4px 8px", color: "#ccd6f6", fontSize: 11, outline: "none", fontFamily: "inherit" }}
                      />
                    </div>
                  )}
                  {c.cost && (
                    <div style={{ fontSize: 10, color: "#e94560", marginTop: 3 }}>Impact : {c.cost}</div>
                  )}
                  {/* Vulnerability warning */}
                  {c.covered && vuln && vuln.level !== "blindee" && (
                    <div style={{ fontSize: 10, color: vuln.color, marginTop: 4, lineHeight: 1.4 }}>{vuln.msg}</div>
                  )}
                </div>
              );
            })}
          </div>
          {coveredCount < coverage.length && (
            <div style={{ fontSize: 11, color: "#e94560", marginTop: 6 }}>{coverage.length - coveredCount} cauchemar{coverage.length - coveredCount > 1 ? "s" : ""} sans remède. Le recruteur le verra.</div>
          )}
          {coverage.some(function(c) { return c.covered && c.vulnerability && c.vulnerability.level === "vulnerable"; }) && (
            <div style={{ background: "#e94560" + "22", borderRadius: 6, padding: 8, marginTop: 8 }}>
              <div style={{ fontSize: 11, color: "#e94560", lineHeight: 1.5, fontWeight: 600 }}>Tu te positionnes comme le remède. Si tes briques sont faibles et que le problème persiste après ton embauche, tu deviens la cible. Blinde tes briques ou baisse tes prétentions.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CVPreview({ bricks }) {
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return null;
  var TARGET_BRICKS = 5;

  // Score each brick for CV ranking
  var cauchemars = getActiveCauchemars();
  var scored = validated.map(function(b) {
    var score = 0;
    if (b.kpi && cauchemars.some(function(c) { return c.kpis.some(function(k) { return b.kpi.indexOf(k.slice(0, 6)) !== -1 || k.indexOf((b.kpi || "").slice(0, 6)) !== -1; }); })) score += 10;
    if (/\d/.test(b.text)) score += 5;
    if (/via|grâce à|méthode|process|déployé|mis en place|construit|structuré/i.test(b.text)) score += 3;
    if (b.elasticity === "élastique") score += 2;
    return { brick: b, score: score };
  });
  scored.sort(function(a, b) { return b.score - a.score; });

  // Greedy select: prioritize cauchemar coverage, then by score
  var selected = [];
  var coveredCauchIds = {};
  scored.forEach(function(s) {
    if (selected.length >= TARGET_BRICKS) return;
    var coversNew = s.brick.kpi && cauchemars.some(function(c) {
      if (coveredCauchIds[c.id]) return false;
      return c.kpis.some(function(k) { return s.brick.kpi.indexOf(k.slice(0, 6)) !== -1 || k.indexOf(s.brick.kpi.slice(0, 6)) !== -1; });
    });
    if (coversNew) {
      selected.push(s);
      cauchemars.forEach(function(c) {
        if (c.kpis.some(function(k) { return s.brick.kpi.indexOf(k.slice(0, 6)) !== -1 || k.indexOf(s.brick.kpi.slice(0, 6)) !== -1; })) coveredCauchIds[c.id] = true;
      });
    }
  });
  scored.forEach(function(s) {
    if (selected.length >= TARGET_BRICKS) return;
    if (selected.indexOf(s) === -1) selected.push(s);
  });

  var cvBricks = selected.map(function(s) { return s.brick; });
  var excluded = validated.filter(function(b) { return cvBricks.indexOf(b) === -1; });

  // Split CV bricks: those with a number go in CV, others need retouching
  var cvReady = cvBricks.filter(function(b) { return extractBestNum(b.text || "") !== null; });
  var needsNumber = cvBricks.filter(function(b) { return extractBestNum(b.text || "") === null; });

  var filledCount = cvReady.length;
  var pct = Math.round((filledCount / TARGET_BRICKS) * 100);
  var cvState = useState(false);
  var expanded = cvState[0];
  var setExpanded = cvState[1];
  return (
    <div style={{ background: "#16213e", borderRadius: 12, padding: 16, marginBottom: 24 }}>
      <button onClick={function() { setExpanded(!expanded); }} style={{
        width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: expanded ? 12 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{"\uD83D\uDCC4"}</span>
            <span style={{ color: "#ccd6f6", fontWeight: 700, fontSize: 13 }}>TON CV EN CONSTRUCTION</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: pct >= 100 ? "#4ecca3" : "#e94560", fontWeight: 700 }}>{filledCount}/{TARGET_BRICKS}</span>
            <span style={{ fontSize: 12, color: "#495670" }}>{expanded ? "\u25B2" : "\u25BC"}</span>
          </div>
        </div>
      </button>
      {expanded && (
        <div>
          {/* Mini progress bar */}
          <div style={{ width: "100%", background: "#1a1a2e", borderRadius: 6, height: 4, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ width: Math.min(pct, 100) + "%", height: "100%", background: pct >= 100 ? "#4ecca3" : "linear-gradient(90deg, #e94560, #ff6b6b)", borderRadius: 6, transition: "width 0.5s ease" }} />
          </div>
          {/* CV Lines */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {cvReady.map(function(b, idx) {
              var catColor = b.brickCategory && CATEGORY_LABELS[b.brickCategory] ? CATEGORY_LABELS[b.brickCategory].color : "#495670";
              return (
                <div key={idx} style={{ background: "#1a1a2e", borderRadius: 8, padding: "8px 12px", borderLeft: "3px solid " + catColor }}>
                  <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.4 }}>
                    {extractBrickSummary(b.text)}{b.kpi ? <span style={{ color: "#8892b0" }}>{" (" + b.kpi.trim().replace(/\.$/, "").replace(/\(([^)]+)\)/g, "— $1") + ")"}</span> : null}
                  </div>
                </div>
              );
            })}
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, TARGET_BRICKS - cvReady.length) }).map(function(_, idx) {
              return (
                <div key={"empty" + idx} style={{ background: "#1a1a2e", borderRadius: 8, padding: "8px 12px", borderLeft: "3px solid #1a1a2e", opacity: 0.3 }}>
                  <div style={{ fontSize: 12, color: "#495670", lineHeight: 1.4 }}>
                    {"\u2588\u2588\u2588\u2588 \u2588\u2588\u2588\u2588\u2588\u2588 \u2588\u2588\u2588 \u2588\u2588\u2588\u2588\u2588 \u2588\u2588\u2588\u2588\u2588\u2588\u2588 \u2588\u2588\u2588"}
                  </div>
                </div>
              );
            })}
          </div>
          {filledCount < TARGET_BRICKS && (
            <div style={{ fontSize: 11, color: "#e94560", marginTop: 8, textAlign: "center" }}>
              {TARGET_BRICKS - filledCount} ligne{TARGET_BRICKS - filledCount > 1 ? "s" : ""} vide{TARGET_BRICKS - filledCount > 1 ? "s" : ""}. Le recruteur voit les trous.
            </div>
          )}
          {filledCount >= TARGET_BRICKS && (
            <div style={{ fontSize: 11, color: "#4ecca3", marginTop: 8, textAlign: "center" }}>
              CV complet. Chaque ligne est une preuve. Le recruteur n'a rien à deviner.
            </div>
          )}
          {needsNumber.length > 0 && (
            <div style={{ marginTop: 12, borderTop: "1px solid #1a1a2e", paddingTop: 10 }}>
              <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, marginBottom: 6 }}>BRIQUES À RETOUCHER ({needsNumber.length})</div>
              <div style={{ fontSize: 10, color: "#495670", marginBottom: 8 }}>Ajoute un chiffre pour intégrer le CV.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {needsNumber.map(function(b, idx) {
                  var catColor = b.brickCategory && CATEGORY_LABELS[b.brickCategory] ? CATEGORY_LABELS[b.brickCategory].color : "#495670";
                  return (
                    <div key={"need" + idx} style={{ background: "#1a1a2e", borderRadius: 6, padding: "6px 10px", borderLeft: "2px solid #ff9800", opacity: 0.7 }}>
                      <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.4 }}>
                        {extractBrickSummary(b.text)}{b.kpi ? <span style={{ color: "#8892b0" }}>{" (" + b.kpi.trim().replace(/\.$/, "").replace(/\(([^)]+)\)/g, "— $1") + ")"}</span> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {excluded.length > 0 && (
            <div style={{ marginTop: 12, borderTop: "1px solid #1a1a2e", paddingTop: 10 }}>
              <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 6 }}>BRIQUES HORS CV ({excluded.length})</div>
              <div style={{ fontSize: 10, color: "#495670", marginBottom: 8 }}>Ces briques alimentent le Duel et les scripts mais pas le CV.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {excluded.map(function(b, idx) {
                  var catColor = b.brickCategory && CATEGORY_LABELS[b.brickCategory] ? CATEGORY_LABELS[b.brickCategory].color : "#495670";
                  return (
                    <div key={"ex" + idx} style={{ background: "#1a1a2e", borderRadius: 6, padding: "6px 10px", borderLeft: "2px solid " + catColor, opacity: 0.5 }}>
                      <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.4 }}>
                        {extractBrickSummary(b.text)}{b.kpi ? <span style={{ color: "#8892b0" }}>{" (" + b.kpi.trim().replace(/\.$/, "").replace(/\(([^)]+)\)/g, "— $1") + ")"}</span> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BricksRecap({ bricks }) {
  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var missions = bricks.filter(function(b) { return b.type === "mission"; });
  var expandedState = useState({});
  var expanded = expandedState[0];
  var setExpanded = expandedState[1];
  var coverage = computeCauchemarCoverage(bricks);
  if (validated.length === 0 && missions.length === 0) return null;

  function isCovering(brick) {
    return coverage.some(function(c) {
      return c.covered && c.coveringBricks && c.coveringBricks.some(function(cb) { return cb.id === brick.id; });
    });
  }

  function toggleExpand(id) {
    setExpanded(function(prev) {
      var next = Object.assign({}, prev);
      next[id] = !next[id];
      return next;
    });
  }

  return (
    <div style={{ marginTop: 16 }}>
      {validated.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>{"\uD83E\uDDF1"} BRIQUES ({validated.length})</div>
          {validated.map(function(b) {
            var cat = b.brickCategory && CATEGORY_LABELS[b.brickCategory];
            var covering = isCovering(b);
            var isOpen = expanded[b.id];
            return (
              <div key={b.id} onClick={function() { toggleExpand(b.id); }} style={{ background: "#0f3460", borderRadius: 8, padding: "8px 12px", marginBottom: 6, borderLeft: "3px solid " + (cat ? cat.color : "#e94560"), cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: cat ? cat.color : "#e94560", background: "#1a1a2e", padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>
                    {b.brickType === "cicatrice" ? "cicatrice" : b.brickType === "take" ? "position" : cat ? cat.label.toLowerCase() : "preuve"}
                  </span>
                  {b.kpi && (
                    <span style={{ fontSize: 10, color: "#8892b0", background: "#1a1a2e", padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>
                      {b.kpi.length > 30 ? b.kpi.slice(0, 27) + "..." : b.kpi}
                    </span>
                  )}
                  {covering && (
                    <span style={{ fontSize: 10, color: "#4ecca3", background: "#4ecca3" + "22", padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>
                      {"\u2705"} cauchemar
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: "#495670", marginLeft: "auto" }}>{isOpen ? "\u25B2" : "\u25BC"}</span>
                </div>
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.4 }}>
                  {isOpen ? b.text : extractBrickSummary(b.text)}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {missions.length > 0 && (
        <div style={{ marginTop: validated.length > 0 ? 12 : 0 }}>
          <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>{"\uD83D\uDCCB"} MISSIONS ({missions.length})</div>
          {missions.map(function(m) {
            var isMOpen = expanded["m" + m.id];
            return (
              <div key={m.id} onClick={function() { toggleExpand("m" + m.id); }} style={{ background: "#1a1a2e", borderRadius: 8, padding: "8px 12px", marginBottom: 6, borderLeft: "3px solid #495670", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "#495670", background: "#0f3460", padding: "2px 8px", borderRadius: 10 }}>mission</span>
                  <span style={{ fontSize: 10, color: "#495670", marginLeft: "auto" }}>{isMOpen ? "\u25B2" : "\u25BC"}</span>
                </div>
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.4 }}>
                  {isMOpen ? m.text : extractBrickSummary(m.text)}
                </div>
                <span style={{ fontSize: 10, color: "#495670", marginTop: 4, display: "inline-block" }}>en attente de preuve</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function WorkBench({ bricks, targetRoleId, trajectoryToggle, vault, offersArray, isActive, currentSalary, onSalaryChange, signature, duelResults, onClose, pieces, displayMode, consumePiece, isSubscribed, user, onGoForge }) {
  var selectedOfferState = useState(0);
  var selectedOfferIdx = selectedOfferState[0];
  var setSelectedOfferIdx = selectedOfferState[1];
  var copiedState = useState(null);
  var copiedId = copiedState[0];
  var setCopiedId = copiedState[1];
  var tabState = useState("externe");
  var activeTab = tabState[0];
  var setActiveTab = tabState[1];
  var internalDescState = useState("");
  var internalDesc = internalDescState[0];
  var setInternalDesc = internalDescState[1];

  // Chantier 14 — tracking première génération par type de livrable
  var generatedOnceState = useState({});
  var generatedOnce = generatedOnceState[0];
  var setGeneratedOnce = generatedOnceState[1];

  // Chantier 17 — correction counters per deliverable and toast
  var corrCounterState = useState({});
  var corrCounters = corrCounterState[0];
  var setCorrCounters = corrCounterState[1];
  var toastState = useState(null);
  var toastMsg = toastState[0];
  var setToastMsg = toastState[1];

  function handleGenerate(type, generatorFn) {
    if (!generatedOnce[type]) {
      setGeneratedOnce(function(prev) { return Object.assign({}, prev, (function() { var o = {}; o[type] = true; return o; })()); });
      generatorFn();
      return;
    }
    var allowed = consumePiece ? consumePiece(type) : true;
    if (!allowed) return;
    generatorFn();
  }

  var isVitrine = displayMode === "vitrine";

  if (!isActive) return null;

  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  if (validated.length === 0) return null;

  var blindedCount = validated.filter(function(b) { return b.blinded; }).length;
  var duelPassed = duelResults && duelResults.length > 0;

  // Generate scripts for selected offer or global
  var targetOffer = offersArray && offersArray.length > 0 ? offersArray[selectedOfferIdx] || offersArray[0] : null;
  var rawScripts = generateContactScripts(bricks, targetRoleId, targetOffer);
  var scripts = rawScripts && signature
    ? { dm: applySignatureFilter(rawScripts.dm, signature), email: applySignatureFilter(rawScripts.email, signature) }
    : rawScripts;
  var rawCV = generateCV(bricks, targetRoleId, trajectoryToggle);
  var cvText = signature ? applySignatureFilter(rawCV, signature) : rawCV;
  var rawBio = validated.length >= 2 ? generateBio(bricks, vault, trajectoryToggle) : null;
  var bioText = rawBio && signature ? applySignatureFilter(rawBio, signature) : rawBio;
  var rawPlan30j = generatePlan30jRH(bricks, targetRoleId, targetOffer ? targetOffer.parsedSignals : null);
  var plan30jText = signature ? applySignatureFilter(rawPlan30j, signature) : rawPlan30j;

  // LinkedIn posts by pillar
  var linkedInPosts = generateLinkedInPosts(bricks, vault, targetRoleId);

  // Interview questions state
  var questionsState = useState(null);
  var questionsText = questionsState[0];
  var setQuestionsText = questionsState[1];

  // Interview prep state (chantier 16)
  var interviewPrepState = useState(null);
  var interviewPrepData = interviewPrepState[0];
  var setInterviewPrepData = interviewPrepState[1];
  var interviewTabState = useState({});
  var interviewTabs = interviewTabState[0];
  var setInterviewTabs = interviewTabState[1];

  // Internal generators
  var internalSignals = internalDesc.trim().length > 10 ? parseInternalSignals(internalDesc, targetRoleId) : null;
  var salaryNum = currentSalary ? parseInt(currentSalary) : null;
  if (salaryNum && isNaN(salaryNum)) salaryNum = null;
  var rawReplacement = generateReplacementReport(bricks, targetRoleId, salaryNum, internalSignals);
  var replacementText = signature ? applySignatureFilter(rawReplacement, signature) : rawReplacement;
  var rawRaise = generateRaiseArgument(bricks, targetRoleId, salaryNum);
  var raiseText = signature ? applySignatureFilter(rawRaise, signature) : rawRaise;
  var rawPlan90j = generatePlan90jN1(bricks, targetRoleId, internalSignals);
  var plan90jText = signature ? applySignatureFilter(rawPlan90j, signature) : rawPlan90j;

  // Chantier 17 — Compute audits for static deliverables
  var auditCauchemars = getActiveCauchemars();
  var auditDm = scripts ? auditDeliverable("dm", scripts.dm, bricks, auditCauchemars, "external") : null;
  var auditEmail = scripts ? auditDeliverable("email", scripts.email, bricks, auditCauchemars, "external") : null;
  var auditCv = auditDeliverable("cv", cvText, bricks, auditCauchemars, "external");
  var auditBio = bioText ? auditDeliverable("bio", bioText, bricks, auditCauchemars, "external") : null;
  var auditPlan30j = auditDeliverable("plan30j", plan30jText, bricks, auditCauchemars, "external");
  var auditReplacement = auditDeliverable("report", replacementText, bricks, auditCauchemars, "internal");
  var auditRaise = auditDeliverable("argument", raiseText, bricks, auditCauchemars, "internal");
  var auditPlan90j = auditDeliverable("plan90j", plan90jText, bricks, auditCauchemars, "internal");

  // Audit for lazy deliverables (questions, interview_prep) stored in state
  var questionsAuditState = useState(null);
  var questionsAudit = questionsAuditState[0];
  var setQuestionsAudit = questionsAuditState[1];
  var interviewPrepAuditState = useState(null);
  var interviewPrepAudit = interviewPrepAuditState[0];
  var setInterviewPrepAudit = interviewPrepAuditState[1];

  function handleCorrect(delivType, regenerateFn) {
    var key = delivType;
    var current = corrCounters[key] || 0;
    if (current >= 2) return;
    setCorrCounters(function(prev) { var next = Object.assign({}, prev); next[key] = (prev[key] || 0) + 1; return next; });
    regenerateFn();
    setToastMsg("Correction " + (current + 1) + "/2 appliquée.");
    setTimeout(function() { setToastMsg(null); }, 3000);
  }

  var qualityLevel = blindedCount >= 3 ? "blinde" : blindedCount >= 1 ? "partiel" : "nu";
  var qualityColor = qualityLevel === "blinde" ? "#4ecca3" : qualityLevel === "partiel" ? "#ff9800" : "#e94560";
  var qualityLabel = qualityLevel === "blinde" ? "PREUVE BLINDÉE" : qualityLevel === "partiel" ? "PARTIELLEMENT BLINDÉ" : "SANS PREUVE CHIFFRÉE";

  function handleCopy(text, id) {
    if (navigator.clipboard) { navigator.clipboard.writeText(text); }
    setCopiedId(id);
    setTimeout(function() { setCopiedId(null); }, 2000);
  }

  var externeCount = (scripts ? 2 : 0) + (cvText && validated.length > 0 ? 1 : 0) + (bioText ? 1 : 0) + 1 + (linkedInPosts && linkedInPosts.length > 0 ? 1 : 0) + 1; // +1 plan 30j, +1 posts piliers, +1 questions entretien
  var interneCount = 3; // replacement, raise, plan 90j

  return (
    <div style={{ background: "#0d1b2a", borderRadius: 12, overflow: "hidden" }}>
      {/* HEADER — with close button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{"\u26A1"}</span>
          <span style={{ color: "#ccd6f6", fontWeight: 700, fontSize: 15 }}>L'ÉTABLI</span>
          <span style={{ fontSize: 10, color: qualityColor, background: qualityColor + "22", padding: "2px 8px", borderRadius: 8, fontWeight: 700 }}>{externeCount + interneCount} armes</span>
          <span style={{ fontSize: 9, color: qualityColor, background: qualityColor + "15", padding: "1px 6px", borderRadius: 6 }}>{qualityLabel}</span>
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            background: "none", border: "1px solid #495670", borderRadius: 8,
            color: "#8892b0", cursor: "pointer", padding: "4px 12px", fontSize: 12, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 4,
          }}>{"\u2190"} Retour</button>
        )}
      </div>

      <div style={{ padding: "0 16px 16px" }}>

          {/* Chantier 17 — Toast correction */}
          {toastMsg && (
            <div style={{ background: "#0f3460", fontSize: 11, color: "#ccd6f6", padding: "8px 16px", borderRadius: 8, marginBottom: 12, textAlign: "center" }}>
              {toastMsg}
            </div>
          )}

          {/* Chantier 14 — Alerte à 2 pièces */}
          {!isSubscribed && pieces != null && pieces <= 2 && pieces > 0 && (
            <div style={{ background: "#1a1a2e", fontSize: 12, color: "#ff6b6b", padding: "10px 16px", borderRadius: 8, marginBottom: 12 }}>
              🪙 {pieces} pièce{pieces > 1 ? "s" : ""} restante{pieces > 1 ? "s" : ""}. Chaque régénération en consomme 1.
            </div>
          )}

          {/* ONGLETS — 3 tabs */}
          <div style={{ display: "flex", gap: 0, marginBottom: 12 }}>
            <button onClick={function() { setActiveTab("externe"); }} style={{
              flex: 1, padding: "8px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 1, cursor: "pointer",
              background: activeTab === "externe" ? "#e94560" + "22" : "#1a1a2e",
              color: activeTab === "externe" ? "#e94560" : "#495670",
              border: "1px solid " + (activeTab === "externe" ? "#e94560" : "#16213e"),
              borderRadius: "8px 0 0 8px",
            }}>EXTERNE</button>
            <button onClick={function() { setActiveTab("interne"); }} style={{
              flex: 1, padding: "8px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 1, cursor: "pointer",
              background: activeTab === "interne" ? "#3498db" + "22" : "#1a1a2e",
              color: activeTab === "interne" ? "#3498db" : "#495670",
              border: "1px solid " + (activeTab === "interne" ? "#3498db" : "#16213e"),
              borderRadius: "0 0 0 0",
            }}>INTERNE</button>
            <button onClick={function() { setActiveTab("preparation"); }} style={{
              flex: 1, padding: "8px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 1,
              cursor: duelPassed ? "pointer" : "default",
              background: activeTab === "preparation" ? "#ff9800" + "22" : "#1a1a2e",
              color: activeTab === "preparation" ? "#ff9800" : (duelPassed ? "#495670" : "#495670"),
              border: "1px solid " + (activeTab === "preparation" ? "#ff9800" : "#16213e"),
              borderRadius: "0 8px 8px 0",
              opacity: duelPassed ? 1 : 0.4,
            }}>PRÉPARATION</button>
          </div>

          {/* Avertissement qualité */}
          {qualityLevel !== "blinde" && (
            <div style={{ background: "#e94560" + "15", borderRadius: 8, padding: 10, marginBottom: 12, borderLeft: "3px solid #e94560" }}>
              <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, marginBottom: 4 }}>AVERTISSEMENT</div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
                {qualityLevel === "nu"
                  ? "Tes scripts n'ont aucune preuve chiffrée. Le hiring manager sera intrigué, pas convaincu. Blinde tes briques pour passer de \"intéressant\" à \"évident.\""
                  : "Certaines briques ne sont pas blindées (" + blindedCount + "/" + validated.length + " blindées). Le script utilise la meilleure preuve disponible. Blinde le reste pour renforcer l'arsenal."}
              </div>
            </div>
          )}

          {/* ======== ONGLET EXTERNE ======== */}
          {activeTab === "externe" && (
            <div>
              <div style={{ fontSize: 10, color: "#495670", marginBottom: 10, lineHeight: 1.4 }}>
                Destinataire : recruteur, RH, hiring manager. Il ne te connaît pas. Tu dois prouver ta valeur.
              </div>

              {/* Sélecteur d'offre */}
              {offersArray && offersArray.length > 1 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: "#495670", fontWeight: 600, marginBottom: 4, letterSpacing: 1 }}>CALIBRER SUR :</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {offersArray.map(function(o, i) {
                      var isSelected = i === selectedOfferIdx;
                      return (
                        <button key={o.id} onClick={function() { setSelectedOfferIdx(i); }} style={{
                          padding: "4px 10px", fontSize: 10, borderRadius: 6, cursor: "pointer", fontWeight: 600,
                          background: isSelected ? qualityColor + "22" : "#1a1a2e", border: "1px solid " + (isSelected ? qualityColor : "#16213e"),
                          color: isSelected ? qualityColor : "#8892b0",
                        }}>{"\uD83C\uDFAF"} Offre {i + 1}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DM LINKEDIN */}
              {scripts && (
                <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: qualityColor, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>{"\uD83D\uDCE8"} DM LINKEDIN</div>
                  <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{scripts.dm}</div>
                  <AuditBlock auditResult={auditDm} text={scripts.dm} copyId="dm" copiedId={copiedId} onCopy={handleCopy} type="dm" isVitrine={isVitrine} corrections={corrCounters["dm"] || 0} onGoForge={onGoForge} onCorrect={function() {
                    handleCorrect("dm", function() {
                      var hints = auditDm ? auditDm.correctionHints : [];
                      var raw = generateContactScripts(bricks, targetRoleId, targetOffer, hints);
                      if (raw) scripts.dm = signature ? applySignatureFilter(raw.dm, signature) : raw.dm;
                    });
                  }} />
                </div>
              )}

              {/* EMAIL */}
              {scripts && (
                <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>{"\u2709\uFE0F"} EMAIL</div>
                  <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 120, overflow: "auto" }}>{scripts.email}</div>
                  <AuditBlock auditResult={auditEmail} text={scripts.email} copyId="email" copiedId={copiedId} onCopy={handleCopy} type="email" isVitrine={isVitrine} corrections={corrCounters["email"] || 0} onGoForge={onGoForge} onCorrect={function() {
                    handleCorrect("email", function() {
                      var hints = auditEmail ? auditEmail.correctionHints : [];
                      var raw = generateContactScripts(bricks, targetRoleId, targetOffer, hints);
                      if (raw) scripts.email = signature ? applySignatureFilter(raw.email, signature) : raw.email;
                    });
                  }} />
                </div>
              )}

              {/* CV */}
              <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>{"\uD83D\uDCC4"} CV ({validated.length} brique{validated.length > 1 ? "s" : ""})</div>
                <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 100, overflow: "auto" }}>{cvText}</div>
                <AuditBlock auditResult={auditCv} text={cvText} copyId="cv" copiedId={copiedId} onCopy={handleCopy} type="cv" isVitrine={isVitrine} corrections={corrCounters["cv"] || 0} onGoForge={onGoForge} onCorrect={function() {
                  handleCorrect("cv", function() {
                    var hints = auditCv ? auditCv.correctionHints : [];
                    var raw = generateCV(bricks, targetRoleId, trajectoryToggle, hints);
                    cvText = signature ? applySignatureFilter(raw, signature) : raw;
                  });
                }} />
              </div>

              {/* PRÉPARATION ENTRETIEN — chantier 16 */}
              <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1 }}>{"\uD83C\uDFA4"} PRÉPARATION ENTRETIEN</div>
                    <div style={{ fontSize: 9, color: "#495670", marginTop: 2 }}>{validated.length} brique{validated.length > 1 ? "s" : ""} × 3 versions</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {!isVitrine && (
                      <button onClick={function() {
                        handleGenerate("interview_prep", function() {
                          var cauchs = getActiveCauchemars();
                          var data = validated.map(function(b) {
                            var cvLine = generateCVLine(b, targetRoleId);
                            var versions = generateInterviewVersions(b, targetRoleId, cauchs);
                            if (signature) {
                              cvLine = applySignatureFilter(cvLine, signature);
                              versions = { rh: applySignatureFilter(versions.rh, signature), n1: applySignatureFilter(versions.n1, signature), direction: applySignatureFilter(versions.direction, signature) };
                            }
                            return { summary: extractBrickSummary(b.text), cvLine: cvLine, versions: versions, brickType: b.brickType };
                          });
                          setInterviewPrepData(data);
                          // Build full text for audit
                          var fullText = data.map(function(item) {
                            return "Version CV : " + item.cvLine + "\nVersion RH :\n" + item.versions.rh + "\nVersion N+1 :\n" + item.versions.n1 + "\nVersion Direction :\n" + item.versions.direction;
                          }).join("\n\n");
                          setInterviewPrepAudit(auditDeliverable("interview_prep", fullText, bricks, cauchs, "external"));
                        });
                      }} style={{
                        padding: "3px 10px", fontSize: 10, background: "#0f3460",
                        color: "#ccd6f6", border: "1px solid #16213e",
                        borderRadius: 6, cursor: "pointer", fontWeight: 600,
                      }}>{generatedOnce["interview_prep"] ? "Régénérer (1 \uD83E\uDE99)" : "Générer"}</button>
                    )}
                  </div>
                </div>
                {interviewPrepData ? (
                  <div>
                    {interviewPrepData.map(function(item, idx) {
                      var activeTab = interviewTabs[idx] || "rh";
                      return (
                        <div key={idx} style={{ borderTop: idx > 0 ? "1px solid #1a1a3e" : "none", paddingTop: idx > 0 ? 10 : 0, marginTop: idx > 0 ? 10 : 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>Brique {idx + 1} : {item.summary}</div>
                          <div style={{ background: "#0d0d1a", borderRadius: 6, padding: 8, marginBottom: 8 }}>
                            <div style={{ fontSize: 9, color: "#495670", fontWeight: 600, letterSpacing: 1, marginBottom: 3 }}>VERSION CV (6 sec)</div>
                            <div style={{ fontSize: 11, color: "#8892b0", fontFamily: "JetBrains Mono, monospace", lineHeight: 1.5 }}>{item.cvLine}</div>
                          </div>
                          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                            {["rh", "n1", "direction"].map(function(tab) {
                              var labels = { rh: "RH", n1: "N+1", direction: "Direction" };
                              var isActiveTab = activeTab === tab;
                              return (
                                <button key={tab} onClick={function() { setInterviewTabs(function(prev) { var next = Object.assign({}, prev); next[idx] = tab; return next; }); }} style={{
                                  padding: "3px 10px", fontSize: 10, fontWeight: 600,
                                  background: isActiveTab ? "#e94560" : "transparent",
                                  color: isActiveTab ? "#fff" : "#8892b0",
                                  border: "1px solid " + (isActiveTab ? "#e94560" : "#1a1a3e"),
                                  borderRadius: 6, cursor: "pointer",
                                }}>{labels[tab]}</button>
                              );
                            })}
                          </div>
                          <div style={{ background: "#111125", borderRadius: 6, padding: 10 }}>
                            <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{item.versions[activeTab]}</div>
                          </div>
                        </div>
                      );
                    })}
                    <AuditBlock auditResult={interviewPrepAudit} text={(function() {
                      var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
                      var roleName = roleData ? roleData.role : "ce poste";
                      var copyText = "# Préparation entretien — " + roleName + "\n\n";
                      interviewPrepData.forEach(function(item, i) {
                        copyText += "## Brique " + (i + 1) + " : " + item.summary + "\n";
                        copyText += "Version CV : " + item.cvLine + "\n\n";
                        copyText += "Version RH :\n" + item.versions.rh + "\n\n";
                        copyText += "Version N+1 :\n" + item.versions.n1 + "\n\n";
                        copyText += "Version Direction :\n" + item.versions.direction + "\n\n";
                      });
                      return copyText.trim();
                    })()} copyId="interview_prep" copiedId={copiedId} onCopy={handleCopy} type="interview_prep" isVitrine={isVitrine} corrections={corrCounters["interview_prep"] || 0} onGoForge={onGoForge} onCorrect={function() {
                      handleCorrect("interview_prep", function() {
                        var cauchs = getActiveCauchemars();
                        var hints = interviewPrepAudit ? interviewPrepAudit.correctionHints : [];
                        var data = validated.map(function(b) {
                          var cvLine = generateCVLine(b, targetRoleId, hints);
                          var versions = generateInterviewVersions(b, targetRoleId, cauchs, hints);
                          if (signature) {
                            cvLine = applySignatureFilter(cvLine, signature);
                            versions = { rh: applySignatureFilter(versions.rh, signature), n1: applySignatureFilter(versions.n1, signature), direction: applySignatureFilter(versions.direction, signature) };
                          }
                          return { summary: extractBrickSummary(b.text), cvLine: cvLine, versions: versions, brickType: b.brickType };
                        });
                        setInterviewPrepData(data);
                        var fullText = data.map(function(item) {
                          return "Version CV : " + item.cvLine + "\nVersion RH :\n" + item.versions.rh + "\nVersion N+1 :\n" + item.versions.n1 + "\nVersion Direction :\n" + item.versions.direction;
                        }).join("\n\n");
                        setInterviewPrepAudit(auditDeliverable("interview_prep", fullText, bricks, cauchs, "external"));
                      });
                    }} />
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "#495670", lineHeight: 1.5 }}>
                    {isVitrine ? "Livrable figé en mode vitrine." : "Génère la version CV + 3 versions entretien (RH, N+1, Direction) pour chaque brique."}
                  </div>
                )}
              </div>

              {/* BIO LINKEDIN */}
              {bioText ? (
                <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>{"\uD83D\uDC64"} BIO LINKEDIN</div>
                  <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{bioText}</div>
                  <AuditBlock auditResult={auditBio} text={bioText} copyId="bio" copiedId={copiedId} onCopy={handleCopy} type="bio" isVitrine={isVitrine} corrections={corrCounters["bio"] || 0} onGoForge={onGoForge} onCorrect={function() {
                    handleCorrect("bio", function() {
                      var hints = auditBio ? auditBio.correctionHints : [];
                      var raw = generateBio(bricks, vault, trajectoryToggle, hints);
                      bioText = signature ? applySignatureFilter(raw, signature) : raw;
                    });
                  }} />
                </div>
              ) : (
                <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10, opacity: 0.4 }}>
                  <div style={{ fontSize: 11, color: "#495670", fontWeight: 700 }}>{"\uD83D\uDD12"} BIO LINKEDIN — 2 briques minimum</div>
                </div>
              )}

              {/* PLAN 30 JOURS RH */}
              <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>{"\uD83D\uDCC5"} PLAN 30 JOURS RH</div>
                <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto" }}>{plan30jText}</div>
                <AuditBlock auditResult={auditPlan30j} text={plan30jText} copyId="plan30j" copiedId={copiedId} onCopy={handleCopy} type="plan30j" isVitrine={isVitrine} corrections={corrCounters["plan30j"] || 0} onGoForge={onGoForge} onCorrect={function() {
                  handleCorrect("plan30j", function() {
                    var hints = auditPlan30j ? auditPlan30j.correctionHints : [];
                    var raw = generatePlan30jRH(bricks, targetRoleId, targetOffer ? targetOffer.parsedSignals : null, hints);
                    plan30jText = signature ? applySignatureFilter(raw, signature) : raw;
                  });
                }} />
              </div>

              {/* POSTS LINKEDIN (PILIERS) */}
              {linkedInPosts && linkedInPosts.length > 0 ? (
                <div style={{ background: "#16213e", borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: "#3498db", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>{"\uD83D\uDCDD"} POSTS (PILIERS)</div>
                  {linkedInPosts.map(function(p, idx) {
                    var postText = signature ? applySignatureFilter(p.text, signature) : p.text;
                    var postCopyId = "post_" + idx;
                    var postAudit = auditDeliverable("posts", postText, bricks, auditCauchemars, "external");
                    return (
                      <div key={idx} style={{ background: "#0d1b2a", borderRadius: 8, padding: 12, marginBottom: idx < linkedInPosts.length - 1 ? 10 : 0 }}>
                        <div style={{ fontSize: 10, color: "#3498db", fontWeight: 600, marginBottom: 6 }}>Pilier : {p.pillar}</div>
                        <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 180, overflow: "auto" }}>{postText}</div>
                        {p.contextLine && (
                          <div style={{ fontSize: 10, color: "#495670", fontStyle: "italic", marginTop: 8, lineHeight: 1.4 }}>{p.contextLine}</div>
                        )}
                        <AuditBlock auditResult={postAudit} text={postText} copyId={postCopyId} copiedId={copiedId} onCopy={handleCopy} type="posts" isVitrine={isVitrine} corrections={corrCounters[postCopyId] || 0} onGoForge={onGoForge} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ background: "#16213e", borderRadius: 10, padding: 12, opacity: 0.4 }}>
                  <div style={{ fontSize: 11, color: "#495670", fontWeight: 700 }}>{"\uD83D\uDD12"} POSTS (PILIERS) — 2 briques + piliers requis</div>
                </div>
              )}

              {/* QUESTIONS ENTRETIEN */}
              <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1 }}>{"\uD83C\uDFAF"} QUESTIONS ENTRETIEN</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {!isVitrine && (
                      <button onClick={function() {
                        handleGenerate("questions", function() {
                          var targetOff = offersArray && offersArray.length > 0 ? offersArray[selectedOfferIdx] || offersArray[0] : null;
                          var signals = targetOff ? targetOff.parsedSignals : null;
                          var raw = generateInterviewQuestions(
                            bricks.filter(function(b) { return b.status === "validated"; }),
                            targetRoleId,
                            getActiveCauchemars(),
                            signals,
                            signature
                          );
                          var text = signature ? applySignatureFilter(raw, signature) : raw;
                          setQuestionsText(text);
                          setQuestionsAudit(auditDeliverable("questions", text, bricks, auditCauchemars, "external"));
                        });
                      }} style={{
                        padding: "3px 10px", fontSize: 10, background: "#0f3460",
                        color: "#ccd6f6", border: "1px solid #16213e",
                        borderRadius: 6, cursor: "pointer", fontWeight: 600,
                      }}>{generatedOnce["questions"] ? "Régénérer (1 \uD83E\uDE99)" : "Générer"}</button>
                    )}
                  </div>
                </div>
                {questionsText ? (
                  <div>
                    <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto" }}>{questionsText}</div>
                    <AuditBlock auditResult={questionsAudit} text={questionsText} copyId="questions" copiedId={copiedId} onCopy={handleCopy} type="questions" isVitrine={isVitrine} corrections={corrCounters["questions"] || 0} onGoForge={onGoForge} onCorrect={function() {
                      handleCorrect("questions", function() {
                        var hints = questionsAudit ? questionsAudit.correctionHints : [];
                        var targetOff = offersArray && offersArray.length > 0 ? offersArray[selectedOfferIdx] || offersArray[0] : null;
                        var signals = targetOff ? targetOff.parsedSignals : null;
                        var raw = generateInterviewQuestions(bricks.filter(function(b) { return b.status === "validated"; }), targetRoleId, getActiveCauchemars(), signals, signature, hints);
                        var text = signature ? applySignatureFilter(raw, signature) : raw;
                        setQuestionsText(text);
                        setQuestionsAudit(auditDeliverable("questions", text, bricks, auditCauchemars, "external"));
                      });
                    }} />
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "#495670", lineHeight: 1.5 }}>
                    {isVitrine ? "Livrable figé en mode vitrine." : "Croise tes briques × cauchemars × signaux d'offre pour générer des questions de niveau 3 à 6."}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======== ONGLET INTERNE ======== */}
          {activeTab === "interne" && (
            <div>
              <div style={{ fontSize: 10, color: "#495670", marginBottom: 10, lineHeight: 1.4 }}>
                Destinataire : ton manager actuel (N+1). Il te connaît. Tu dois prouver le coût de ton départ.
              </div>

              {/* Champ salaire */}
              <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: "#8892b0", fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Salaire actuel (optionnel)
                </label>
                <input
                  type="number"
                  placeholder="Ex : 65 000€"
                  value={currentSalary || ""}
                  onChange={function(e) { onSalaryChange(e.target.value ? parseInt(e.target.value) : null); }}
                  style={{
                    width: "100%", background: "#0a0a1a", border: "1px solid #16213e", borderRadius: 6,
                    padding: "8px 12px", color: "#ccd6f6", fontSize: 12, outline: "none", fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Champ contexte interne (optionnel) */}
              <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: "#8892b0", fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Contexte interne (optionnel — colle la description de ton poste ou les enjeux de ton équipe)
                </label>
                <textarea
                  placeholder="Ex : L'équipe est en surcharge depuis 3 mois, 2 départs récents, objectifs Q2 en retard..."
                  value={internalDesc}
                  onChange={function(e) { setInternalDesc(e.target.value); }}
                  rows={3}
                  style={{
                    width: "100%", background: "#0a0a1a", border: "1px solid #16213e", borderRadius: 6,
                    padding: "8px 12px", color: "#ccd6f6", fontSize: 11, outline: "none", fontFamily: "inherit",
                    resize: "vertical", lineHeight: 1.5, boxSizing: "border-box",
                  }}
                />
                {internalSignals && internalSignals.detected && (
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {internalSignals.signals.map(function(s) {
                      var strengthColor = s.strength === "fort" ? "#e94560" : s.strength === "moyen" ? "#ff9800" : "#495670";
                      return (
                        <span key={s.id} style={{
                          fontSize: 9, color: strengthColor, background: strengthColor + "22",
                          padding: "2px 6px", borderRadius: 4, fontWeight: 600,
                        }}>{s.label}</span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RAPPORT DE REMPLACEMENT */}
              <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>{"\uD83D\uDCCA"} RAPPORT DE REMPLACEMENT</div>
                <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto" }}>{replacementText}</div>
                <AuditBlock auditResult={auditReplacement} text={replacementText} copyId="replacement" copiedId={copiedId} onCopy={handleCopy} type="report" isVitrine={isVitrine} corrections={corrCounters["replacement"] || 0} onGoForge={onGoForge} onCorrect={function() {
                  handleCorrect("replacement", function() {
                    var hints = auditReplacement ? auditReplacement.correctionHints : [];
                    var raw = generateReplacementReport(bricks, targetRoleId, salaryNum, internalSignals, hints);
                    replacementText = signature ? applySignatureFilter(raw, signature) : raw;
                  });
                }} />
              </div>

              {/* ARGUMENTAIRE D'AUGMENTATION */}
              <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>{"\uD83D\uDCB0"} ARGUMENTAIRE D'AUGMENTATION</div>
                <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto" }}>{raiseText}</div>
                <AuditBlock auditResult={auditRaise} text={raiseText} copyId="raise" copiedId={copiedId} onCopy={handleCopy} type="argument" isVitrine={isVitrine} corrections={corrCounters["raise"] || 0} onGoForge={onGoForge} onCorrect={function() {
                  handleCorrect("raise", function() {
                    var hints = auditRaise ? auditRaise.correctionHints : [];
                    var raw = generateRaiseArgument(bricks, targetRoleId, salaryNum, hints);
                    raiseText = signature ? applySignatureFilter(raw, signature) : raw;
                  });
                }} />
              </div>

              {/* PLAN 90 JOURS N+1 */}
              <div style={{ background: "#16213e", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, color: "#3498db", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>{"\uD83D\uDCC5"} PLAN 90 JOURS N+1</div>
                <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto" }}>{plan90jText}</div>
                <AuditBlock auditResult={auditPlan90j} text={plan90jText} copyId="plan90j" copiedId={copiedId} onCopy={handleCopy} type="plan90j" isVitrine={isVitrine} corrections={corrCounters["plan90j"] || 0} onGoForge={onGoForge} onCorrect={function() {
                  handleCorrect("plan90j", function() {
                    var hints = auditPlan90j ? auditPlan90j.correctionHints : [];
                    var raw = generatePlan90jN1(bricks, targetRoleId, internalSignals, hints);
                    plan90jText = signature ? applySignatureFilter(raw, signature) : raw;
                  });
                }} />
              </div>
            </div>
          )}

          {/* ======== ONGLET PRÉPARATION ======== */}
          {activeTab === "preparation" && (
            <div>
              {duelPassed ? (
                <div>
                  <div style={{ fontSize: 10, color: "#ff9800", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>FICHES DE PRÉPARATION</div>
                  <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6, marginBottom: 16 }}>
                    Tes fiches de combat et de préparation Duel seront générées ici.
                  </div>
                  {/* TODO chantier 12+ — contenu des fiches de préparation */}
                  <div style={{ padding: 24, background: "#1a1a2e", borderRadius: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#495670", lineHeight: 1.5 }}>
                      Contenu en cours de construction.
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 32 }}>
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>{"\uD83D\uDEE1\uFE0F"}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>
                    Préparation verrouillée
                  </div>
                  <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6 }}>
                    Passe le Duel pour débloquer tes fiches de préparation.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chantier 14 — Vitrine CTA (pièces = 0) */}
          {isVitrine && (
            <div style={{ marginTop: 20, padding: 20, background: "#1a1a2e", borderRadius: 12, textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "#ccd6f6", fontWeight: 700, marginBottom: 16, lineHeight: 1.5 }}>
                Tes livrables sont figés.
              </div>
              <button onClick={function() {
                var userId = user && user.id ? user.id : "";
                var email = user && user.email ? user.email : "";
                fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: userId, email: email, type: "subscription" }) })
                  .then(function(r) { return r.json(); })
                  .then(function(data) { if (data.url) window.location.href = data.url; });
              }} style={{
                width: "100%", padding: 14, marginBottom: 10,
                background: "linear-gradient(135deg, #e94560, #c81d4e)", color: "#fff",
                border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
              }}>Continuer à forger — 10€/mois</button>
            </div>
          )}
        </div>
    </div>
  );
}

/* ==============================
   SUBSCRIPTION DASHBOARD
   Zone 1 — Thermostat (3 lignes)
   Zone 2 — Posts de la semaine (2-3 survivants)
   Zone 3 — Resume Score
   Zone grisee — Posts ecartes (optionnelle)
   ============================== */

/* LEGACY — SubscriptionDashboard. Posts hebdo et sleep mode branchés dans le tab Thermostat (ligne ~8685). */

export function SubscriptionDashboard({ bricks, vault, targetRoleId, trajectoryToggle, offersArray }) {
  var expandRejectedState = useState(false);
  var showRejected = expandRejectedState[0];
  var setShowRejected = expandRejectedState[1];
  var copiedState = useState(null);
  var copiedId = copiedState[0];
  var setCopiedId = copiedState[1];
  var publishedState = useState(null);
  var publishedId = publishedState[0];
  var setPublishedId = publishedState[1];

  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });
  var blinded = validated.filter(function(b) { return b.blinded; });
  var diltsHistory = vault && vault.diltsHistory ? vault.diltsHistory : [];
  var thermoState = getDiltsThermometerState(diltsHistory);
  var diltsTarget = computeDiltsTarget(diltsHistory);
  var diltsLabel = getDiltsLabel(thermoState.effectiveLevel);

  // Compute total cauchemar cost covered
  var coverage = computeCauchemarCoverage(bricks);
  var covered = coverage.filter(function(c) { return c.covered; });
  var totalCostLow = 0;
  var totalCostHigh = 0;
  covered.forEach(function(cc) {
    var cauch = getActiveCauchemars().find(function(c) { return c.id === cc.id; });
    if (cauch) { totalCostLow += cauch.costRange[0]; totalCostHigh += cauch.costRange[1]; }
  });

  // Generate weekly posts
  var weeklyResult = generateWeeklyPosts(bricks, vault, targetRoleId);
  var posts = weeklyResult.posts;
  var rejected = weeklyResult.rejected;

  // Sleep mode suggestions
  var sleepComment = generateSleepComment(bricks, vault, targetRoleId);
  var sleepBrick = proposeSleepBrick(vault);

  function handleCopy(text, id) {
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(function() { setCopiedId(null); }, 2000);
  }

  return (
    <div style={{ padding: "20px 0" }}>

      {/* SOUS-TITRE PERMANENT */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>DASHBOARD</div>
        <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6, maxWidth: 380, margin: "0 auto", fontStyle: "italic" }}>
          Ton expertise résout des problèmes à 6 chiffres. Ce dashboard existe pour que le marché le sache.
        </div>
      </div>

      {/* MILLER FIX — Carte des zones : ancre la perception 4 blocs, pas 12 lignes */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[
          { color: "#e94560", label: "Thermostat", count: 3 },
          { color: "#4ecca3", label: "Posts", count: posts.length },
          { color: "#ff9800", label: "Score", count: validated.length },
          { color: "#3498db", label: "Actions", count: (sleepComment ? 1 : 0) + (sleepBrick ? 1 : 0) },
        ].map(function(z, i) {
          return (
            <div key={i} style={{
              flex: 1, textAlign: "center", padding: "8px 4px",
              background: "#16213e", borderRadius: 8, borderTop: "3px solid " + z.color,
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: z.color }}>{z.count}</div>
              <div style={{ fontSize: 9, color: "#8892b0", fontWeight: 600, letterSpacing: 0.5 }}>{z.label}</div>
            </div>
          );
        })}
      </div>

      {/* ZONE 1 — THERMOSTAT */}
      <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 20, borderLeft: "4px solid #e94560" }}>
        <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>THERMOSTAT</div>

        {/* Ligne 1 — Valeur prouvée */}
        <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #16213e" }}>
          <div style={{ fontSize: 12, color: "#4ecca3", fontWeight: 700, marginBottom: 4 }}>VALEUR PROUVÉE</div>
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
            Tu résous {covered.length} cauchemar{covered.length > 1 ? "s" : ""} pour un coût cumulé de {formatCost(totalCostLow)}-{formatCost(totalCostHigh)} par an. Preuve : {blinded.length} brique{blinded.length > 1 ? "s" : ""} blindée{blinded.length > 1 ? "s" : ""} dans ton Score.
          </div>
        </div>

        {/* Ligne 2 — Visibilité */}
        <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #16213e" }}>
          <div style={{ fontSize: 12, color: "#ff9800", fontWeight: 700, marginBottom: 4 }}>VISIBILITÉ</div>
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
            Dernier post déclaré : {thermoState.lastPostDate ? "il y a " + thermoState.weeksInactive + " semaine" + (thermoState.weeksInactive > 1 ? "s" : "") : "aucun"}.
            {" "}Registre : {diltsLabel.name} ({thermoState.effectiveLevel}/5).
            {" "}Prochain registre : {DILTS_EDITORIAL_MAPPING[diltsTarget.targetLevel] ? DILTS_EDITORIAL_MAPPING[diltsTarget.targetLevel].registre : "Comportement"}.
          </div>
        </div>

        {/* Ligne 3 — Coût du silence */}
        <div>
          <div style={{ fontSize: 12, color: thermoState.decay > 0 ? "#e94560" : thermoState.isAlert ? "#ff9800" : "#8892b0", fontWeight: 700, marginBottom: 4 }}>COÛT DU SILENCE</div>
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
            {thermoState.decay > 0
              ? "Ton thermostat a baissé. Plafond atteint : " + getDiltsLabel(thermoState.plafond).name + ". Niveau effectif : " + diltsLabel.name + ". Chaque semaine sans signal, tu sors du top 5% des profils visibles. 2 millions de posts par jour sur LinkedIn. Sans signal, ton profil descend."
              : thermoState.isAlert
              ? "1 semaine sans signal. Tu es encore visible mais le compteur tourne. 94.8% des utilisateurs LinkedIn ne publient jamais. 1 post ou 2-3 commentaires cette semaine te maintiennent dans les 5% qui existent."
              : "Ton thermostat est stable. 1 signal par semaine minimum. Au-delà de 5, le bruit te dessert. Le cadre senior publie peu mais juste."
            }
          </div>
        </div>
      </div>

      {/* ZONE 2 — POSTS DE LA SEMAINE */}
      <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 20, borderLeft: "4px solid #4ecca3" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 700, letterSpacing: 1 }}>POSTS DE LA SEMAINE</div>
          <span style={{ fontSize: 10, color: "#8892b0" }}>{posts.length} prêt{posts.length > 1 ? "s" : ""}{rejected.length > 0 ? ", " + rejected.length + " écarté" + (rejected.length > 1 ? "s" : "") : ""}</span>
        </div>

        {posts.length === 0 && (
          <div style={{ fontSize: 12, color: "#495670", textAlign: "center", padding: 20 }}>
            Pas assez de briques blindées pour produire des posts. Blinde ton Score.
          </div>
        )}

        {posts.map(function(post, i) {
          var diltsInfo = getDiltsLabel(post.diltsLevel);
          var isCopied = copiedId === "post-" + i;
          var isPublished = publishedId === "post-" + i;
          return (
            <div key={i} style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: i < posts.length - 1 ? 10 : 0 }}>
              {/* Header badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 9, color: diltsInfo.color, background: diltsInfo.color + "22", padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>{diltsInfo.name}</span>
                <span style={{ fontSize: 9, color: "#8892b0", background: "#1a1a2e", padding: "2px 6px", borderRadius: 6 }}>{post.formatLabel}</span>
                {post.marieScore && <span style={{ fontSize: 9, color: post.marieScore >= 7 ? "#4ecca3" : "#ff9800", background: "#1a1a2e", padding: "2px 6px", borderRadius: 6 }}>Marie {post.marieScore}/10</span>}
                {post.stockPotential && <span style={{ fontSize: 9, color: "#9b59b6", background: "#9b59b6" + "22", padding: "2px 6px", borderRadius: 6 }}>Stock</span>}
                {!post.isBlinded && <span style={{ fontSize: 9, color: "#e94560", background: "#e94560" + "22", padding: "2px 6px", borderRadius: 6 }}>brique non blindée</span>}
              </div>

              {/* Brick source */}
              <div style={{ fontSize: 10, color: "#495670", marginBottom: 6 }}>Source : {post.brickText}</div>

              {/* Post text */}
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: 10 }}>{post.text}</div>

              {/* Stock angle */}
              {post.stockPotential && post.stockAngle && (
                <div style={{ fontSize: 10, color: "#9b59b6", marginBottom: 8, fontStyle: "italic" }}>{post.stockAngle}</div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={function() { handleCopy(post.text, "post-" + i); }} style={{
                  padding: "4px 12px", fontSize: 10, borderRadius: 6, cursor: "pointer", fontWeight: 600,
                  background: isCopied ? "#4ecca3" : "#0f3460", color: isCopied ? "#0a0a0a" : "#ccd6f6",
                  border: "1px solid " + (isCopied ? "#4ecca3" : "#16213e"),
                }}>{isCopied ? "\u2705 Copie" : "Copier"}</button>
                <button onClick={function() {
                  setPublishedId("post-" + i);
                  // In real implementation: add to vault.diltsHistory with date and level
                }} style={{
                  padding: "4px 12px", fontSize: 10, borderRadius: 6, cursor: "pointer", fontWeight: 600,
                  background: isPublished ? "#4ecca3" + "22" : "#1a1a2e", color: isPublished ? "#4ecca3" : "#495670",
                  border: "1px solid " + (isPublished ? "#4ecca3" : "#16213e"),
                }}>{isPublished ? "\u2705 Publié" : "Publié"}</button>
              </div>
            </div>
          );
        })}

        {/* Posts ecartes */}
        {rejected.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <button onClick={function() { setShowRejected(!showRejected); }} style={{
              background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#495670", fontWeight: 600, padding: 0,
            }}>{showRejected ? "\u25B2" : "\u25BC"} {rejected.length} post{rejected.length > 1 ? "s" : ""} écarté{rejected.length > 1 ? "s" : ""}</button>
            {showRejected && rejected.map(function(r, i) {
              return (
                <div key={"rej-" + i} style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginTop: 6, opacity: 0.6 }}>
                  <div style={{ fontSize: 10, color: "#e94560", fontWeight: 700, marginBottom: 4 }}>Écarté par {r.rejectSource}</div>
                  <div style={{ fontSize: 10, color: "#8892b0", lineHeight: 1.5, marginBottom: 4 }}>{r.rejectReason}</div>
                  <div style={{ fontSize: 10, color: "#495670", whiteSpace: "pre-wrap" }}>{r.text}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ZONE 3 — RESUME SCORE */}
      <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 20, borderLeft: "4px solid #ff9800" }}>
        <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>SCORE</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#ccd6f6" }}>{validated.length}</div>
            <div style={{ fontSize: 10, color: "#8892b0" }}>briques</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#4ecca3" }}>{blinded.length}</div>
            <div style={{ fontSize: 10, color: "#8892b0" }}>blindées</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#ff9800" }}>{covered.length}</div>
            <div style={{ fontSize: 10, color: "#8892b0" }}>cauchemars</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: diltsLabel.color }}>{thermoState.plafond}</div>
            <div style={{ fontSize: 10, color: "#8892b0" }}>Registre max</div>
          </div>
        </div>
      </div>

      {/* SLEEP MODE SUGGESTIONS */}
      {(sleepComment || sleepBrick) && (
        <div style={{ background: "#16213e", borderRadius: 12, padding: 16, borderLeft: "4px solid #3498db" }}>
          <div style={{ fontSize: 11, color: "#495670", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>ACTIONS RAPIDES</div>
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
      )}
    </div>
  );
}

export function CrossRoleInsight({ bricks, targetRoleId, trajectoryToggle }) {
  var exState = useState(false);
  var expanded = exState[0];
  var setExpanded = exState[1];

  var tScriptsState = useState({});
  var tScripts = tScriptsState[0];
  var setTScripts = tScriptsState[1];

  if (!targetRoleId) return null;

  var crossData = computeCrossRoleMatching(bricks, targetRoleId, trajectoryToggle);
  if (!crossData || crossData.alternatives.length === 0) return null;

  var isJySuis = trajectoryToggle === "j_y_suis";
  var isJyVais = trajectoryToggle === "j_y_vais";

  // Check if any alternative has strictly better elastic coverage
  var hasBetterPath = crossData.alternatives.some(function(a) { return a.elasticMatches > crossData.currentElastic; });

  return (
    <div style={{ background: "#16213e", borderRadius: 12, padding: 16, marginBottom: 24, border: hasBetterPath ? "1px solid #3498db" : "1px solid #16213e" }}>
      <button onClick={function() { setExpanded(!expanded); }} style={{
        width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{hasBetterPath ? "\uD83D\uDEA9" : "\uD83D\uDDFA\uFE0F"}</span>
            <span style={{ color: hasBetterPath ? "#3498db" : "#ccd6f6", fontWeight: 700, fontSize: 13 }}>
              {hasBetterPath ? "TERRAIN ALTERNATIF DÉTECTÉ" : "PARCOURS ALTERNATIFS"}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#495670" }}>{expanded ? "\u25B2" : "\u25BC"}</span>
        </div>
        {!expanded && hasBetterPath && (
          <div style={{ fontSize: 11, color: "#8892b0", marginTop: 4 }}>
            Tes briques couvrent mieux {crossData.alternatives[0].elasticMatches} KPIs élastiques de {crossData.alternatives[0].role} que {crossData.currentElastic} de {crossData.currentRole}.
          </div>
        )}
      </button>

      {expanded && (
        <div style={{ marginTop: 12 }}>
          {/* Current role coverage */}
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 600 }}>{crossData.currentRole}</div>
              <span style={{ fontSize: 10, color: "#495670" }}>ton choix</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 11, color: "#4ecca3" }}>{crossData.currentElastic} KPI{crossData.currentElastic > 1 ? "s" : ""} élastique{crossData.currentElastic > 1 ? "s" : ""}</span>
              <span style={{ fontSize: 11, color: "#495670" }}>{crossData.currentCoverage}% de couverture</span>
            </div>
          </div>

          {/* Alternative paths */}
          {crossData.alternatives.map(function(alt) {
            var isBetter = alt.elasticMatches > crossData.currentElastic;
            return (
              <div key={alt.roleId} style={{ background: isBetter ? "#0f3460" : "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 8, borderLeft: "3px solid " + (isBetter ? "#3498db" : "#495670") }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 12, color: isBetter ? "#3498db" : "#ccd6f6", fontWeight: 700 }}>{alt.role}</div>
                  <span style={{ fontSize: 10, color: isBetter ? "#3498db" : "#495670", background: "#1a1a2e", padding: "2px 8px", borderRadius: 6 }}>{alt.coverage}%</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#4ecca3" }}>{alt.elasticMatches} KPI{alt.elasticMatches > 1 ? "s" : ""} élastique{alt.elasticMatches > 1 ? "s" : ""}</span>
                  <span style={{ fontSize: 11, color: "#8892b0" }}>{alt.totalMatches} match{alt.totalMatches > 1 ? "es" : ""} total{alt.totalMatches > 1 ? "es" : ""}</span>
                </div>
                {alt.matchedKpis.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    {alt.matchedKpis.slice(0, 3).map(function(mk, i) {
                      return (
                        <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 2 }}>
                          <span style={{ fontSize: 10, color: "#4ecca3", flexShrink: 0 }}>{"\u2197\uFE0F"}</span>
                          <div>
                            <span style={{ fontSize: 10, color: "#ccd6f6" }}>{mk.kpi}</span>
                            <span style={{ fontSize: 9, color: "#495670" }}> {"\u2190"} {mk.brick}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
                  {isBetter
                    ? isJySuis
                      ? "Tes preuves couvrent mieux ce poste que celui que tu occupes. Tu as construit des preuves qui ouvrent un terrain que tu n'avais pas ciblé."
                      : isJyVais
                      ? "Ce poste est plus directement atteignable avec tes preuves actuelles. C'est une marche intermédiaire crédible avant ton objectif final."
                      : "Couverture supérieure à ton choix. Tes briques matchent ce terrain."
                    : "Terrain accessible. Tes briques couvrent une partie des KPIs élastiques de ce poste."
                  }
                </div>
                {/* TRANSITION SCRIPT — Item 6 */}
                {isBetter && (
                  <div style={{ marginTop: 8 }}>
                    {!tScripts[alt.roleId] && (
                      <button onClick={function() {
                        var upd = Object.assign({}, tScripts);
                        upd[alt.roleId] = generateTransitionScript(bricks, targetRoleId, alt);
                        setTScripts(upd);
                      }} style={{
                        padding: "6px 12px", fontSize: 11, background: "#1a1a2e", color: "#3498db", border: "1px solid #3498db", borderRadius: 6, cursor: "pointer", fontWeight: 600,
                      }}>Produire un script de transition</button>
                    )}
                    {tScripts[alt.roleId] && (
                      <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginTop: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: "#3498db", fontWeight: 600 }}>SCRIPT OUTSIDER</span>
                          <CopyBtn text={tScripts[alt.roleId]} label="Copier" />
                        </div>
                        <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5, whiteSpace: "pre-line" }}>{tScripts[alt.roleId]}</div>
                        <div style={{ fontSize: 10, color: "#495670", marginTop: 6 }}>Ton downside : 30 min de préparation. Son downside : 30 min d'écoute. L'upside : un profil que le process RH aurait éliminé mais qui résout le problème.</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ fontSize: 11, color: "#495670", lineHeight: 1.5, marginTop: 8 }}>
            Ce croisement tourne à chaque Rendez-vous de Souveraineté. Les briques que tu accumules en poste ouvrent progressivement de nouveaux terrains. Le système détecte quand tu es prêt.
          </div>
        </div>
      )}
    </div>
  );
}

/* ==============================
   ARSENAL — GPS DES MANQUES (Chantier 8)
   3 blocs : radar 6 axes, prochaine action, simulation delta
   Zéro donnée nouvelle : affichage des calculs existants
   ============================== */

export function Arsenal({ density, bricks, nightmares, signatureThreshold, signature, vault, duelResults, pieces, onGoToBrick, onClose }) {
  if (!density || !density.axes || density.axes.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#495670", lineHeight: 1.6 }}>Pas encore de données. Forge tes premières briques.</div>
      </div>
    );
  }
  var validated = (bricks || []).filter(function(b) { return b.status === "validated"; });
  if (validated.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#495670", lineHeight: 1.6 }}>Aucune brique validée. Forge ta première brique pour activer l{"'"}Arsenal.</div>
      </div>
    );
  }

  var axes = density.axes;
  var isVitrine = pieces != null && pieces <= 0;

  // Weakest axis
  var weakest = axes.reduce(function(min, ax) {
    return ax.pct < min.pct ? ax : min;
  }, axes[0]);

  // Cauchemar coverage
  var coverage = computeCauchemarCoverage(bricks || []);
  var uncovered = coverage.filter(function(c) { return !c.covered; });
  var uncoveredLabels = uncovered.map(function(c) { return c.label; });

  // Recommendation: best nightmare to cover next
  var recommendation = null;
  if (uncovered.length > 0 && nightmares) {
    var scored = uncovered.map(function(unc) {
      var nightmareObj = nightmares.find(function(n) { return n.id === unc.id; });
      var fakeKpi = nightmareObj && nightmareObj.kpis ? nightmareObj.kpis[0] : "";
      var fakeBrick = {
        id: 99999,
        text: "Résultat de 100K€ via méthode structurée déployée auprès de l'équipe de 12 personnes en 3 mois, décision validée par le comité",
        kpi: fakeKpi, skills: [], usedIn: [], status: "validated", type: "brick",
        brickType: "preuve", brickCategory: "chiffre", stressTestAngle3Validated: true, owned: true, corrected: false,
      };
      var simBricks = (bricks || []).concat([fakeBrick]);
      var simDensity = computeDensityScore({
        bricks: simBricks, nightmares: nightmares, pillars: vault || null,
        signature: signature || null, duelResults: duelResults || [], cvBricks: [],
      });
      var axesImproved = [];
      simDensity.axes.forEach(function(simAx, i) {
        if (simAx.pct > axes[i].pct) axesImproved.push(axes[i].name);
      });
      var wouldTriggerSig = !signatureThreshold && !signature && hasReachedSignatureThreshold(simBricks);
      return {
        nightmare: unc, nightmareObj: nightmareObj, axesImproved: axesImproved,
        axesCount: axesImproved.length, scoreDelta: simDensity.score - density.score,
        simScore: simDensity.score, wouldTriggerSig: wouldTriggerSig,
      };
    });
    scored.sort(function(a, b) {
      if (b.axesCount !== a.axesCount) return b.axesCount - a.axesCount;
      return b.scoreDelta - a.scoreDelta;
    });
    recommendation = scored[0];
  }

  function axeColor(pct) {
    if (pct >= 70) return "#4ecca3";
    if (pct >= 40) return "#3498db";
    return "#e94560";
  }

  // Determine recommended angle for "Aller à la brique"
  var recommendedAngle = recommendation && recommendation.axesImproved.length > 0
    ? recommendation.axesImproved[0] : null;

  return (
    <div>

      {/* Chantier 14 — Bandeau Mode Vitrine */}
      {displayMode === "vitrine" && (
        <div style={{
          background: "#1a1a2e",
          border: "1px solid #495670",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 16,
          fontSize: 12,
          color: "#8892b0",
          lineHeight: 1.5
        }}>
          <span style={{ color: "#ff6b6b", fontWeight: 700 }}>Mode Vitrine</span>
          {" — Tes livrables sont figés. La forge reste ouverte."}
        </div>
      )}

      {/* BLOC 1 — LE RADAR */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>RADAR 6 AXES</div>
        {axes.map(function(ax, i) {
          var isWeakest = ax.name === weakest.name;
          var color = axeColor(ax.pct);
          return (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <span style={{ fontSize: 11, color: isWeakest ? "#e94560" : "#8892b0", fontWeight: isWeakest ? 700 : 400 }}>
                  {isWeakest ? "\u25CF " : ""}{ax.name} <span style={{ fontSize: 9, color: "#495670" }}>({ax.weight}%)</span>
                </span>
                <span style={{ fontSize: 11, color: color, fontWeight: 700 }}>{ax.pct}%</span>
              </div>
              <div style={{ width: "100%", background: "#1a1a2e", borderRadius: 4, height: 6, overflow: "hidden" }}>
                <div style={{
                  width: Math.min(ax.pct, 100) + "%", height: "100%",
                  background: isWeakest ? "#e94560" : color, borderRadius: 4, transition: "width 0.5s ease",
                }} />
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: 10, padding: 10, background: "#1a1a2e", borderRadius: 8, borderLeft: "3px solid #e94560" }}>
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
            {"Axe faible : "}
            <span style={{ color: "#e94560", fontWeight: 700 }}>{weakest.name}</span>
            {" (" + weakest.pct + "%)."}
            {uncovered.length > 0
              ? " Cauchemar" + (uncovered.length > 1 ? "s" : "") + " non couvert" + (uncovered.length > 1 ? "s" : "") + " : " + uncoveredLabels.join(", ") + "."
              : " Tous les cauchemars sont couverts."
            }
          </div>
        </div>
      </div>

      {/* BLOC 2 — LA PROCHAINE ACTION */}
      {recommendation && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "#3498db", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>PROCHAINE ACTION</div>
          <div style={{ padding: 12, background: "#0f3460", borderRadius: 10, borderLeft: "3px solid #3498db" }}>
            <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7 }}>
              {"Prochaine action : blinde ta brique \u00AB "}
              <span style={{ color: "#e94560", fontWeight: 700 }}>{recommendation.nightmare.label}</span>
              {" \u00BB"}
              {recommendation.axesImproved.length > 0
                ? " sur l'angle " + recommendation.axesImproved.join(" et ") + "."
                : "."
              }
            </div>
            {recommendation.nightmare.nightmareShort && (
              <div style={{ fontSize: 11, color: "#8892b0", marginTop: 6, fontStyle: "italic", lineHeight: 1.5 }}>
                {recommendation.nightmare.nightmareShort}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BLOC 3 — LA SIMULATION */}
      {recommendation && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "#4ecca3", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>SIMULATION</div>
          <div style={{ padding: 12, background: "#1a1a2e", borderRadius: 10, borderLeft: "3px solid #4ecca3" }}>
            <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7 }}>
              {"Si tu blindes cette brique, ton score passe de "}
              <span style={{ color: "#e94560", fontWeight: 700 }}>{density.score}%</span>
              {" \u00E0 "}
              <span style={{ color: "#4ecca3", fontWeight: 700 }}>{recommendation.simScore}%</span>
              {"."}
              {recommendation.scoreDelta > 0 ? " (+" + recommendation.scoreDelta + " points)" : ""}
            </div>
            {recommendation.wouldTriggerSig && (
              <div style={{ marginTop: 8, padding: 8, background: "#4ecca3" + "15", borderRadius: 6, border: "1px solid #4ecca3" + "40" }}>
                <div style={{ fontSize: 11, color: "#4ecca3", lineHeight: 1.5, fontWeight: 600 }}>
                  {"Tu d\u00E9clenches l'\u00E9cran signature. Tes livrables \u00C9tabli gagnent le filtre pattern."}
                </div>
              </div>
            )}
            {signatureThreshold && !signature && (
              <div style={{ marginTop: 8, padding: 8, background: "#4ecca3" + "15", borderRadius: 6, border: "1px solid #4ecca3" + "40" }}>
                <div style={{ fontSize: 11, color: "#4ecca3", lineHeight: 1.5, fontWeight: 600 }}>
                  {"Seuil signature atteint. Blinde cette brique pour armer ta signature."}
                </div>
              </div>
            )}

            {/* BOUTON — Aller à la brique / Vitrine CTA */}
            {!isVitrine && onGoToBrick && (
              <button onClick={function() {
                var nightmareId = recommendation.nightmare ? recommendation.nightmare.id : null;
                onGoToBrick(nightmareId, recommendedAngle);
              }} style={{
                width: "100%", marginTop: 12, padding: 12,
                background: "linear-gradient(135deg, #e94560, #c81d4e)", color: "#fff",
                border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
              }}>Aller {"\u00E0"} la brique</button>
            )}
            {isVitrine && (
              <div style={{ marginTop: 12 }}>
                <button style={{
                  width: "100%", padding: 14,
                  background: "linear-gradient(135deg, #4ecca3, #2ecc71)", color: "#0a0a1a",
                  border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
                }}>Continuer {"\u00E0"} forger {"\u2014"} 10{"\u20AC"}/mois</button>
                <div style={{ fontSize: 11, color: "#8892b0", textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>
                  {"Ton score est \u00E0 " + density.score + "%. " + uncovered.length + " cauchemar" + (uncovered.length > 1 ? "s" : "") + " non couvert" + (uncovered.length > 1 ? "s" : "") + ". La Forge reste ouverte."}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All covered */}
      {uncovered.length === 0 && (
        <div style={{ padding: 12, background: "#4ecca3" + "15", borderRadius: 10, border: "1px solid #4ecca3" + "40", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#4ecca3", lineHeight: 1.6 }}>
            {"Tous les cauchemars sont couverts. Concentre-toi sur le blindage de tes briques les plus faibles pour monter en densit\u00E9."}
          </div>
          {/* Vitrine CTA when all covered but pieces = 0 */}
          {isVitrine && (
            <div style={{ marginTop: 12 }}>
              <button style={{
                width: "100%", padding: 14,
                background: "linear-gradient(135deg, #4ecca3, #2ecc71)", color: "#0a0a1a",
                border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
              }}>Continuer {"\u00E0"} forger {"\u2014"} 10{"\u20AC"}/mois</button>
              <div style={{ fontSize: 11, color: "#8892b0", textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>
                {"Ton score est \u00E0 " + density.score + "%. La Forge reste ouverte."}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warnings from density */}
      {density.warnings && density.warnings.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {density.warnings.map(function(w, i) {
            return (
              <div key={i} style={{ fontSize: 11, color: "#ff9800", lineHeight: 1.5, marginBottom: 4, paddingLeft: 8, borderLeft: "2px solid #ff9800" + "44" }}>
                {w}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ==============================
   CARTE DU MARCHÉ — offres × cauchemars × briques × élasticité
   Montre où le marché tire (offres), où tu es armé (briques),
   et où se trouvent les trous.
   ============================== */

export function MarketMap({ bricks, offersArray, targetRoleId }) {
  var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
  if (!roleData) return null;

  var templates = CAUCHEMAR_TEMPLATES_BY_ROLE[targetRoleId] || [];
  var validated = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; });

  // Build map data: for each KPI, compute demand (offers) and supply (bricks)
  var mapData = roleData.kpis.map(function(kpi, idx) {
    var template = templates[idx] || null;

    // DEMAND: count offers that signal this cauchemar
    var offerHits = 0;
    var matchedOffers = [];
    if (template && offersArray && offersArray.length > 0) {
      offersArray.forEach(function(offer) {
        var lower = (offer.text || "").toLowerCase().replace(/[éèê]/g, "e").replace(/[àâ]/g, "a");
        var hits = 0;
        template.kw.forEach(function(kw) { if (lower.indexOf(kw) !== -1) hits++; });
        if (hits > 0) { offerHits++; matchedOffers.push(offer.id); }
      });
    }

    // SUPPLY: count bricks covering this KPI
    var coveringBricks = validated.filter(function(b) {
      return b.kpi && kpi.name.toLowerCase().indexOf(b.kpi.toLowerCase().slice(0, 6)) !== -1;
    });

    // Also check broader text match
    if (coveringBricks.length === 0 && template) {
      coveringBricks = validated.filter(function(b) {
        var bLower = (b.text || "").toLowerCase();
        return template.kw.slice(0, 3).some(function(kw) { return bLower.indexOf(kw) !== -1; });
      });
    }

    // STATUS
    var status = "invisible"; // no demand, no supply
    if (offerHits > 0 && coveringBricks.length > 0) status = "arme"; // covered
    else if (offerHits > 0 && coveringBricks.length === 0) status = "trou"; // gap
    else if (offerHits === 0 && coveringBricks.length > 0) status = "reserve"; // ammo without demand

    return {
      kpi: kpi.name,
      elasticity: kpi.elasticity,
      why: kpi.why,
      cauchemar: template ? template.label : "",
      cost: template ? template.cost : [0, 0],
      offerHits: offerHits,
      brickCount: coveringBricks.length,
      status: status,
    };
  });

  // Sort: élastique first, then stable, then sous_pression
  var elastOrder = { "élastique": 0, "stable": 1, "sous_pression": 2 };
  mapData.sort(function(a, b) { return (elastOrder[a.elasticity] || 0) - (elastOrder[b.elasticity] || 0); });

  var statusColors = {
    arme: "#4ecca3",
    trou: "#e94560",
    reserve: "#3498db",
    invisible: "#495670",
  };
  var statusLabels = {
    arme: "ARMÉ",
    trou: "TROU",
    reserve: "RÉSERVE",
    invisible: "—",
  };
  var elastColors = {
    "élastique": "#4ecca3",
    "stable": "#ff9800",
    "sous_pression": "#e94560",
  };
  var elastLabels = {
    "élastique": "ÉLASTIQUE",
    "stable": "STABLE",
    "sous_pression": "SOUS PRESSION IA",
  };

  // Stats
  var trous = mapData.filter(function(d) { return d.status === "trou"; });
  var armes = mapData.filter(function(d) { return d.status === "arme"; });
  var elastiques = mapData.filter(function(d) { return d.elasticity === "élastique"; });
  var elastiquesArmes = elastiques.filter(function(d) { return d.status === "arme"; });

  return (
    <div style={{ marginTop: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>{"\uD83D\uDDFA\uFE0F"} CARTE DU MARCHÉ</div>

      {offersArray.length === 0 && (
        <div style={{ background: "#16213e", borderRadius: 10, padding: 14, color: "#8892b0", fontSize: 12, lineHeight: 1.5 }}>
          Colle des offres d'emploi pour activer la carte. L'outil croise les cauchemars détectés dans les offres avec tes briques validées.
        </div>
      )}

      {offersArray.length > 0 && (
        <div>
          {/* SUMMARY BAR */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, background: "#4ecca3" + "22", borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#4ecca3" }}>{armes.length}</div>
              <div style={{ fontSize: 9, color: "#4ecca3" }}>ARMÉS</div>
            </div>
            <div style={{ flex: 1, background: "#e94560" + "22", borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#e94560" }}>{trous.length}</div>
              <div style={{ fontSize: 9, color: "#e94560" }}>TROUS</div>
            </div>
            <div style={{ flex: 1, background: "#ff9800" + "22", borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#ff9800" }}>{elastiquesArmes.length}/{elastiques.length}</div>
              <div style={{ fontSize: 9, color: "#ff9800" }}>ÉLASTIQUES COUVERTS</div>
            </div>
          </div>

          {/* MAP GRID */}
          {mapData.map(function(d, i) {
            var sc = statusColors[d.status];
            var ec = elastColors[d.elasticity] || "#495670";
            return (
              <div key={i} style={{
                background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 6,
                borderLeft: "4px solid " + sc,
                opacity: d.status === "invisible" ? 0.5 : 1,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 8, color: ec, background: ec + "22", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{elastLabels[d.elasticity] || d.elasticity}</span>
                      <span style={{ fontSize: 8, color: sc, background: sc + "22", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{statusLabels[d.status]}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 600, lineHeight: 1.4 }}>{d.kpi}</div>
                    {d.cauchemar && <div style={{ fontSize: 10, color: "#8892b0", marginTop: 2 }}>{d.cauchemar}</div>}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 10, color: d.offerHits > 0 ? "#ff9800" : "#495670" }}>
                      {d.offerHits > 0 ? d.offerHits + " offre" + (d.offerHits > 1 ? "s" : "") : "—"}
                    </div>
                    <div style={{ fontSize: 10, color: d.brickCount > 0 ? "#4ecca3" : "#495670" }}>
                      {d.brickCount > 0 ? d.brickCount + " brique" + (d.brickCount > 1 ? "s" : "") : "—"}
                    </div>
                    {d.cost[1] > 0 && <div style={{ fontSize: 9, color: "#495670" }}>{formatCost(d.cost[0])}-{formatCost(d.cost[1])}/an</div>}
                  </div>
                </div>
              </div>
            );
          })}

          {/* DIAGNOSTIC */}
          {trous.length > 0 && (
            <div style={{ background: "#e94560" + "15", borderRadius: 10, padding: 12, marginTop: 12, border: "1px solid #e94560" + "44" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#e94560", letterSpacing: 1, marginBottom: 6 }}>TROUS — le marché demande, tu n'as pas de preuve</div>
              {trous.map(function(t, i) {
                var priorityTag = t.elasticity === "élastique" ? "URGENT" : "À TRAITER";
                var priorityColor = t.elasticity === "élastique" ? "#e94560" : "#ff9800";
                return (
                  <div key={i} style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 4 }}>
                    <span style={{ fontSize: 8, color: priorityColor, background: priorityColor + "22", padding: "1px 4px", borderRadius: 3, fontWeight: 700, marginRight: 6 }}>{priorityTag}</span>
                    {t.kpi} — {t.offerHits} offre{t.offerHits > 1 ? "s" : ""} signal{t.offerHits > 1 ? "ent" : "e"} ce cauchemar. Forge une brique.
                  </div>
                );
              })}
            </div>
          )}

          {trous.length === 0 && armes.length > 0 && (
            <div style={{ background: "#4ecca3" + "15", borderRadius: 10, padding: 12, marginTop: 12, border: "1px solid #4ecca3" + "44" }}>
              <div style={{ fontSize: 11, color: "#4ecca3", lineHeight: 1.5 }}>Zéro trou. Chaque cauchemar détecté dans tes offres est couvert par au moins une brique.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
