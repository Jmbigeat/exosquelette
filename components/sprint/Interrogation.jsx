"use client";
import { useState, useRef, useCallback } from "react";
import { CATEGORY_LABELS, ELASTICITY_LABELS } from "@/lib/sprint/references";
import { analyzeVerbs, auditAnonymization, hasBlame, hasDecisionMarkers, hasExternalization, hasInfluenceMarkers, hasNumbers } from "@/lib/sprint/analysis";
import { formatCost, getActiveCauchemars, assessBrickArmor } from "@/lib/sprint/scoring";
import { analyzeTakeDepth, auditBrickVulnerability, getBrickFields, matchKpiToReference, takeToiPillar } from "@/lib/sprint/bricks";
import Tooltip from "@/components/ui/Tooltip";
import VOCABULARY from "@/lib/vocabulary";
import { generateAdvocacyText, generateInternalAdvocacy } from "@/lib/sprint/generators";
import { BricksRecap } from "@/components/sprint/panels";

var SIDE_PROJECT_OWNERSHIP = /sur\s+mon\s+temps\s+libre|à\s+titre\s+personnel|sans\s+employeur|sans\s+client|en\s+dehors\s+du\s+boulot|mon\s+projet|ma\s+passion|j'ai\s+créé\s+seul|de\s+zéro\s+sans\s+équipe/i;
var SIDE_PROJECT_TYPE = /side.?project|projet\s+perso|open.?source|bénévolat|association|blog|app|outil|contribution\s+libre/i;
var SIDE_PROJECT_EXPLICIT = /side.?project|projet\s+personnel/i;

function detectSideProject(text) {
  var t = text || "";
  return (SIDE_PROJECT_OWNERSHIP.test(t) && SIDE_PROJECT_TYPE.test(t)) || SIDE_PROJECT_EXPLICIT.test(t);
}

export function FeedbackToast({ brick, onDone }) {
  var opState = useState(0);
  var opacity = opState[0];
  var setOpacity = opState[1];
  useState(function() {
    var t1 = setTimeout(function() { setOpacity(1); }, 50);
    var t2 = setTimeout(function() { setOpacity(0); }, 3200);
    var t3 = setTimeout(function() { onDone(); }, 3800);
    return function() { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  });
  var catLabel = brick.brickType === "cicatrice" ? "Cicatrice" : brick.brickType === "take" ? "Prise de position" : brick.brickCategory && CATEGORY_LABELS[brick.brickCategory] ? CATEGORY_LABELS[brick.brickCategory].label : "";
  var isHard = brick.brickCategory === "decision" || brick.brickCategory === "influence" || brick.brickType === "cicatrice";
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      background: isHard ? "#0f3460" : "#0f3460", border: isHard ? "2px solid #4ecca3" : "1px solid #e94560", borderRadius: 12,
      padding: "16px 20px", maxWidth: 420, width: "90%", zIndex: 999,
      opacity: opacity, transition: "opacity 0.4s ease",
      boxShadow: isHard ? "0 8px 32px rgba(78,204,163,0.3)" : "0 8px 32px rgba(233,69,96,0.25)",
    }}>
      <div style={{ fontSize: 11, color: isHard ? "#4ecca3" : "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
        {brick.type === "mission" ? "\uD83D\uDCCB MISSION ASSIGNÉE" : brick.corrected ? "\u270D\uFE0F BRIQUE CORRIGÉE" : "\u2705 BRIQUE FORGÉE"}
        {catLabel && brick.type !== "mission" ? " — " + catLabel.toUpperCase() : ""}
      </div>
      <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 10 }}>
        "{brick.text.length > 70 ? brick.text.slice(0, 70) + "..." : brick.text}"
      </div>
      {brick.type !== "mission" && brick.usedIn && (
        <div>
          <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 4 }}>ALIMENTE MAINTENANT :</div>
          {brick.usedIn.map(function(u, i) {
            return <div key={i} style={{ fontSize: 12, color: "#8892b0", paddingLeft: 8, marginBottom: 2 }}>{"\u2192"} {u}</div>;
          })}
        </div>
      )}
      {isHard && brick.type !== "mission" && (
        <div style={{ fontSize: 11, color: "#4ecca3", marginTop: 8, borderTop: "1px solid #16213e", paddingTop: 6 }}>
          {brick.brickType === "cicatrice" ? "Échec assumé. C'est la brique la plus rare de ton Score." : brick.brickCategory === "decision" ? "Arbitrage documenté. Aucun outil de CV ne produit ça." : "Influence prouvée. Le recruteur ne peut pas tester ça autrement qu'en entretien."}
        </div>
      )}
    </div>
  );
}


export function AddBrick({ onAdd }) {
  var openState = useState(false);
  var isOpen = openState[0];
  var setIsOpen = openState[1];
  var txtState = useState("");
  var text = txtState[0];
  var setText = txtState[1];
  var kpiState = useState("");
  var kpi = kpiState[0];
  var setKpi = kpiState[1];
  var catState = useState("chiffre");
  var category = catState[0];
  var setCategory = catState[1];
  var doneState = useState(false);
  var justAdded = doneState[0];
  var setJustAdded = doneState[1];
  function handleAdd() {
    if (text.trim().length < 10) return;
    onAdd(text.trim(), kpi.trim() || "À définir", category, "manual");
    setText(""); setKpi("");
    setJustAdded(true);
    setTimeout(function() { setJustAdded(false); setIsOpen(false); }, 1800);
  }
  if (justAdded) {
    return (
      <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, textAlign: "center", marginTop: 16 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>{"\u2705"}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>Brique ajoutée et structurée.</div>
      </div>
    );
  }
  if (!isOpen) {
    return (
      <button onClick={function() { setIsOpen(true); }} style={{
        width: "100%", marginTop: 16, padding: 14, background: "#1a1a2e",
        border: "2px dashed #495670", borderRadius: 10, cursor: "pointer",
        color: "#8892b0", fontSize: 13, fontWeight: 600, textAlign: "center",
      }}>
        <div>{"\u2795"} L'IA a rat{"\u00E9"} quelque chose ?</div>
        <div style={{ fontSize: 11, fontWeight: 400, color: "#495670", marginTop: 4 }}>D{"\u00E9"}cris-le en 1 phrase, je le structure pour toi.</div>
      </button>
    );
  }
  return (
    <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginTop: 16 }}>
      <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>AJOUTER UNE BRIQUE</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["chiffre", "decision", "influence"].map(function(c) {
          var cat = CATEGORY_LABELS[c];
          var act = category === c;
          return (
            <button key={c} onClick={function() { setCategory(c); }} style={{
              flex: 1, padding: "6px 4px", fontSize: 11, fontWeight: 700,
              background: act ? cat.color + "22" : "#1a1a2e", color: act ? cat.color : "#495670",
              border: act ? "1px solid " + cat.color : "1px solid #16213e",
              borderRadius: 6, cursor: "pointer",
            }}>{cat.label}</button>
          );
        })}
      </div>
      <textarea value={text} onChange={function(e) { setText(e.target.value); }}
        placeholder={category === "chiffre" ? "Ex : J'ai formé 12 commerciaux, 8 ont atteint leur quota en 4 mois." : category === "decision" ? "Ex : Le board voulait X, j'ai choisi Y parce que Z." : "Ex : 3 directeurs bloquaient, j'ai aligné tout le monde en montrant le coût d'opportunité."}
        style={{ width: "100%", minHeight: 70, padding: 12, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 8, color: "#ccd6f6", fontSize: 13, lineHeight: 1.5, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 8 }}
      />
      <input value={kpi} onChange={function(e) { setKpi(e.target.value); }}
        placeholder="KPI associé (optionnel)"
        style={{ width: "100%", padding: 10, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 8, color: "#ccd6f6", fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 12 }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleAdd} disabled={text.trim().length < 10} style={{
          flex: 1, padding: 12,
          background: text.trim().length >= 10 ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
          color: text.trim().length >= 10 ? "#fff" : "#495670",
          border: "none", borderRadius: 8, cursor: text.trim().length >= 10 ? "pointer" : "default", fontWeight: 700, fontSize: 13,
        }}>Ajouter au Score</button>
        <button onClick={function() { setIsOpen(false); setText(""); setKpi(""); }} style={{
          padding: "12px 16px", background: "#1a1a2e", color: "#8892b0", border: "2px solid #495670", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
        }}>Annuler</button>
      </div>
    </div>
  );
}

/* ==============================
   INTERROGATOIRE — 3 brick types + correction flow + verb analysis + sectoral codes
   ============================== */


export function Interrogation({ seeds, bricks, onForge, onCorrect, onMission, onSkip, onAddBrick, paranoMode, targetRoleId, trajectoryToggle }) {
  var ansState = useState("");
  var answer = ansState[0];
  var setAnswer = ansState[1];
  var fieldsState = useState({ f1: "", f2: "", f3: "", f4: "" });
  var fields = fieldsState[0];
  var setFields = fieldsState[1];
  var phaseState = useState("question");
  var phase = phaseState[0];
  var setPhase = phaseState[1];
  var missionTriggered = useState(false);
  var isMission = missionTriggered[0];
  var setIsMission = missionTriggered[1];
  var confrontState = useState(null);
  var confrontMsg = confrontState[0];
  var setConfrontMsg = confrontState[1];
  var editState = useState("");
  var editText = editState[0];
  var setEditText = editState[1];
  var verbState = useState(null);
  var verbData = verbState[0];
  var setVerbData = verbState[1];
  var verbDismissedState = useState(false);
  var verbDismissed = verbDismissedState[0];
  var setVerbDismissed = verbDismissedState[1];
  var cicOverrideState = useState(null);
  var cicOverride = cicOverrideState[0];
  var setCicOverride = cicOverrideState[1];
  var anonEditState = useState("");
  var anonEdit = anonEditState[0];
  var setAnonEdit = anonEditState[1];
  var anonAuditState = useState(null);
  var anonAudit = anonAuditState[0];
  var setAnonAudit = anonAuditState[1];
  var almostEditState = useState(false);
  var almostEditing = almostEditState[0];
  var setAlmostEditing = almostEditState[1];
  var almostTextState = useState("");
  var almostText = almostTextState[0];
  var setAlmostText = almostTextState[1];

  var validated = bricks.filter(function(b) { return b.status === "validated"; });
  var missionItems = bricks.filter(function(b) { return b.type === "mission"; });
  var processed = seeds.filter(function(s) { return bricks.some(function(b) { return b.id === s.id; }); });
  var pending = seeds.filter(function(s) { return !bricks.some(function(b) { return b.id === s.id; }); });

  if (pending.length === 0) {
    return (
      <div>
        <div style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{"\u2705"}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>
            {validated.length} brique{validated.length > 1 ? "s" : ""} + {missionItems.length} mission{missionItems.length > 1 ? "s" : ""}
          </div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6 }}>
            {missionItems.length > 0 ? "Les missions deviennent des briques quand tu apportes la preuve." : "Elles alimenteront ton CV, tes réponses d'entretien et tes posts LinkedIn automatiquement."}
          </div>
        </div>
        <BricksRecap bricks={bricks} />
        <AddBrick onAdd={onAddBrick} />
      </div>
    );
  }

  var seed = pending[0];
  var effectiveText = seed.generatedText || answer;

  if (phase === "forging") {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>{"\u2699\uFE0F"}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>L'IA analyse ta réponse...</div>
        <div style={{ fontSize: 12, color: "#8892b0" }}>Croisement avec le contexte marché.</div>
      </div>
    );
  }

  // TRIAGE — client chooses instead of automatic mission
  if (phase === "triage") {
    var hasDecision = hasDecisionMarkers(answer);
    var hasInfluence = hasInfluenceMarkers(answer);
    var hasRichContent = answer.trim().split(" ").length >= 15;
    return (
      <div>
        <div style={{ background: "#1a1a2e", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid #3498db" }}>
          <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>TRIAGE</div>
          <div style={{ fontSize: 14, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 12 }}>
            Ta réponse ne contient pas de chiffre.
            {hasDecision || hasInfluence ? " Mais l'IA détecté des marqueurs de " + (hasDecision ? "decision" : "") + (hasDecision && hasInfluence ? " et d'" : "") + (hasInfluence ? "influence" : "") + "." : ""}
            {!hasDecision && !hasInfluence && hasRichContent ? " Mais ta réponse est riche (" + answer.trim().split(" ").length + " mots)." : ""}
            {!hasDecision && !hasInfluence && !hasRichContent ? " L'IA n'a pas détecté de marqueurs de décision ou d'influence." : ""}
          </div>
          <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 4 }}>CE QUE L'IA A DÉTECTÉ DANS TA RÉPONSE</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>
              Chiffres : <span style={{ color: "#e94560" }}>aucun</span>
              {hasDecision && <span> {"\u00B7"} Marqueurs de décision : <span style={{ color: "#9b59b6" }}>oui</span></span>}
              {hasInfluence && <span> {"\u00B7"} Marqueurs d'influence : <span style={{ color: "#3498db" }}>oui</span></span>}
              {!hasDecision && <span> {"\u00B7"} Marqueurs de décision : <span style={{ color: "#495670" }}>non</span></span>}
              {!hasInfluence && <span> {"\u00B7"} Marqueurs d'influence : <span style={{ color: "#495670" }}>non</span></span>}
              {" "}{"\u00B7"} Longueur : {answer.trim().split(" ").length} mots
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 600, marginBottom: 10 }}>Que veux-tu faire ?</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={function() { setPhase("forging"); setTimeout(function() { setPhase("review"); }, 1200); }} style={{
            padding: 14, background: "#0f3460", color: "#ccd6f6", border: "2px solid #4ecca3", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, textAlign: "left",
          }}>
            <span style={{ color: "#4ecca3" }}>{"\u2192"}</span> Forge une brique avec ce que j'ai donné
            <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 400, marginTop: 2 }}>L'IA structure ta réponse sans chiffre. La brique sera moins précise mais existera.</div>
          </button>
          <button onClick={function() { setPhase("mission"); setIsMission(true); }} style={{
            padding: 14, background: "#0f3460", color: "#ccd6f6", border: "2px solid #ff9800", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, textAlign: "left",
          }}>
            <span style={{ color: "#ff9800" }}>{"\u2192"}</span> Assigne la mission, je reviendrai avec le chiffre
            <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 400, marginTop: 2 }}>L'IA te donne les étapes pour récupérer la preuve. La brique sera forgée quand tu reviendras.</div>
          </button>
          <button onClick={function() { setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); }} style={{
            padding: 14, background: "#1a1a2e", color: "#8892b0", border: "2px solid #495670", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, textAlign: "left",
          }}>
            <span style={{ color: "#495670" }}>{"\u2192"}</span> Je reformule ma réponse
            <div style={{ fontSize: 11, color: "#495670", fontWeight: 400, marginTop: 2 }}>Tu repars de zéro sur cette question.</div>
          </button>
        </div>
      </div>
    );
  }

  // MISSION REVIEW
  if (phase === "mission") {
    var totalProcessed = bricks.length;
    var missionCount = bricks.filter(function(b) { return b.type === "mission"; }).length + 1; // +1 for current
    var brickCount = bricks.filter(function(b) { return b.status === "validated"; }).length;
    var missionRatio = totalProcessed > 0 ? Math.round((missionCount / (missionCount + brickCount)) * 100) : 100;
    var isHighMissions = missionCount >= 3;

    return (
      <div>
        <div style={{ background: "#1a1a2e", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid #ff9800" }}>
          <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>MISSION ASSIGNÉE</div>
          <div style={{ fontSize: 14, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 12 }}>{seed.missionText}</div>
          <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 4 }}>POURQUOI UNE MISSION ET PAS UNE BRIQUE</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>Ta réponse ne contient pas de chiffre. Sans chiffre, l'IA forge du vent. Un recruteur détecté la différence entre une preuve et une impression.</div>
          </div>
          {isHighMissions && (
            <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, borderLeft: "3px solid #e94560" }}>
              <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>DIAGNOSTIC DE MESURE</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
                C'est ta {missionCount}e mission sur {missionCount + brickCount} questions. {missionRatio}% de tes réponses n'ont pas de chiffre. Ce n'est pas un problème de mémoire. C'est un mode de fonctionnement : tu opères sans mesurer l'impact de ce que tu fais.
              </div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6, marginTop: 6 }}>
                Chaque mission que tu complètes ne remplit pas seulement ton arsenal. Elle installe un réflexe : mesurer ce que tu fais pendant que tu le fais. Le professionnel qui négocie avec des preuves fixe son prix. Celui qui négocie avec des impressions accepte celui qu'on lui donne.
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={function() { onMission(seed); setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setIsMission(false); }} style={{
            flex: 1, padding: 14, background: "#0f3460", color: "#ccd6f6", border: "2px solid #ff9800", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Archiver la mission</button>
          <button onClick={function() { setPhase("question"); setIsMission(false); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); }} style={{
            padding: "14px 16px", background: "#1a1a2e", color: "#8892b0", border: "2px solid #495670", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Réessayer</button>
        </div>
      </div>
    );
  }

  // CONFRONTATION
  if (phase === "confront") {
    return (
      <div>
        <div style={{ background: "#1a1a2e", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid #e94560" }}>
          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>CONFRONTATION</div>
          <div style={{ fontSize: 14, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 12 }}>{confrontMsg}</div>
          <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>Reformule ta réponse en incluant ta part de responsabilité.</div>
        </div>
        <button onClick={function() { setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setConfrontMsg(null); }} style={{
          width: "100%", padding: 14, background: "#0f3460", color: "#ccd6f6", border: "2px solid #e94560", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>Reformuler ma réponse</button>
      </div>
    );
  }

  // CORRECTION MODE — editing the generated brick text
  if (phase === "correcting") {
    return (
      <div>
        <div style={{ fontSize: 11, color: "#9b59b6", fontWeight: 600, marginBottom: 8, letterSpacing: 1 }}>RETOUCHE DE LA BRIQUE</div>
        <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 12 }}>
          Modifie le texte. Chaque correction enseigne ta voix à l'IA. Le Style Engine apprend de tes choix, pas de tes validations.
        </div>
        <textarea value={editText} onChange={function(e) { setEditText(e.target.value); }}
          style={{ width: "100%", minHeight: 90, padding: 14, background: "#1a1a2e", border: "2px solid #9b59b6", borderRadius: 10, color: "#ccd6f6", fontSize: 14, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 12 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={function() {
            if (editText.trim().length >= 10) {
              if (seed.anonymizedText) {
                setAnonEdit(seed.anonymizedText);
                // Store corrected text temporarily — we'll need it after anon review
                seed._correctedText = editText.trim();
                setPhase("anon_review_correct");
              } else {
                onCorrect(seed, editText.trim());
                setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setEditText(""); setVerbData(null); setVerbDismissed(false); setCicOverride(null);
              }
            }
          }} disabled={editText.trim().length < 10} style={{
            flex: 1, padding: 14, background: editText.trim().length >= 10 ? "linear-gradient(135deg, #9b59b6, #8e44ad)" : "#1a1a2e",
            color: editText.trim().length >= 10 ? "#fff" : "#495670",
            border: "none", borderRadius: 10, cursor: editText.trim().length >= 10 ? "pointer" : "default", fontWeight: 700, fontSize: 14,
          }}>Archiver la correction</button>
          <button onClick={function() { setPhase("review"); setEditText(""); }} style={{
            padding: "14px 16px", background: "#1a1a2e", color: "#8892b0", border: "2px solid #495670", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Annuler</button>
        </div>
      </div>
    );
  }

  // ANONYMIZATION REVIEW — multi-pass audit with defense in depth
  if (phase === "anon_review" || phase === "anon_review_correct") {
    var isCorrection = phase === "anon_review_correct";
    var audit = auditAnonymization(anonEdit, paranoMode);
    var hasSensitive = audit.totalFindings > 0;
    // Build highlighted text
    var highlightedParts = [];
    if (hasSensitive) {
      var sorted = audit.findings.slice().sort(function(a, b) { return a.start - b.start; });
      var lastEnd = 0;
      sorted.forEach(function(f) {
        if (f.start > lastEnd) highlightedParts.push({ text: anonEdit.substring(lastEnd, f.start), sensitive: false });
        highlightedParts.push({ text: f.value, sensitive: true, type: f.type, pass: f.pass });
        lastEnd = f.end;
      });
      if (lastEnd < anonEdit.length) highlightedParts.push({ text: anonEdit.substring(lastEnd), sensitive: false });
    }
    var typeLabels = { entreprise: "Entreprise", montant: "Montant", email: "Email", telephone: "Téléphone", date: "Date", nom_propre: "Nom propre", localisation: "Localisation", marqueur_secteur: "Marqueur secteur" };

    function handleAnonConfirm() {
      // Re-scan final text before archiving (defense layer 5)
      var finalAudit = auditAnonymization(anonEdit.trim(), paranoMode);
      var auditTrail = {
        initialAudit: audit,
        finalAudit: finalAudit,
        paranoMode: paranoMode,
        userConfirmed: true,
        confirmedAt: Date.now(),
        findingsAtConfirm: finalAudit.totalFindings,
      };
      var reviewedSeed = Object.assign({}, seed, { generatedText: effectiveText, sideProject: detectSideProject(effectiveText), anonymizedText: anonEdit.trim(), anonAuditTrail: auditTrail, advocacyText: generateAdvocacyText(effectiveText, seed.brickCategory, seed.type, seed.nightmareText), internalAdvocacy: generateInternalAdvocacy(effectiveText, seed.brickCategory, seed.type, seed.elasticity) });
      if (isCorrection) {
        onCorrect(reviewedSeed, editText.trim());
        setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setEditText(""); setAnonEdit(""); setAnonAudit(null); setVerbData(null); setVerbDismissed(false); setCicOverride(null);
      } else {
        onForge(reviewedSeed);
        setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setAnonEdit(""); setAnonAudit(null); setVerbData(null); setVerbDismissed(false); setCicOverride(null);
      }
    }

    return (
      <div>
        {/* AUDIT HEADER */}
        <div style={{ background: "#1a1a2e", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid " + audit.confidenceColor }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: audit.confidenceColor, fontWeight: 600, letterSpacing: 1 }}>
              {hasSensitive ? "\u26A0\uFE0F VÉRIFICATION REQUISE" : "\uD83D\uDD12 AUDIT ANONYMISATION"}
              {isCorrection ? " (BRIQUE CORRIGÉE)" : ""}
            </div>
          </div>

          {/* PASS-BY-PASS RESULTS */}
          <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 6 }}>RAPPORT D'AUDIT — {audit.passesClean}/{audit.passesTotal} PASSES PROPRES</div>
            {audit.passes.map(function(p, i) {
              var clean = p.findings.length === 0;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: clean ? "#4ecca3" : "#e94560" }}>{clean ? "\u2705" : "\u274C"}</span>
                  <span style={{ fontSize: 11, color: "#8892b0" }}>Passe {i + 1} : {p.name}</span>
                  {!clean && <span style={{ fontSize: 10, color: "#e94560" }}>({p.findings.length} élément{p.findings.length > 1 ? "s" : ""})</span>}
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 12 }}>
            {hasSensitive
              ? audit.totalFindings + " élément" + (audit.totalFindings > 1 ? "s" : "") + " détecté" + (audit.totalFindings > 1 ? "s" : "") + " sur 3 passes. Vérifie et corrige avant d'archiver."
              : "3 passes exécutées. 0 élément détecté. Vérifie quand même : l'IA peut rater des éléments."
            }
          </div>

          {/* Highlighted preview */}
          {hasSensitive && (
            <div style={{ background: "#0f3460", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13, color: "#ccd6f6", lineHeight: 1.6 }}>
              {highlightedParts.map(function(p, i) {
                if (p.sensitive) {
                  return <span key={i} style={{ background: "#e94560", color: "#fff", padding: "1px 4px", borderRadius: 3, fontSize: 12 }} title={p.type + " (" + p.pass + ")"}>{p.text}</span>;
                }
                return <span key={i}>{p.text}</span>;
              })}
            </div>
          )}

          {/* Detected items grouped by pass */}
          {hasSensitive && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 6 }}>DÉTAILS PAR PASSE</div>
              {audit.passes.filter(function(p) { return p.findings.length > 0; }).map(function(p, pi) {
                return (
                  <div key={pi} style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 10, color: "#8892b0", marginBottom: 3 }}>{p.name} :</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {p.findings.map(function(f, fi) {
                        return (
                          <span key={fi} style={{ fontSize: 10, color: "#e94560", background: "#0f3460", padding: "2px 8px", borderRadius: 8, border: "1px solid #e94560" }}>
                            {typeLabels[f.type] || f.type} : {f.value}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Editable textarea */}
          <div style={{ fontSize: 11, color: "#8892b0", marginBottom: 6 }}>Édite la version transportable ci-dessous :</div>
          <textarea value={anonEdit} onChange={function(e) { setAnonEdit(e.target.value); }}
            style={{ width: "100%", minHeight: 80, padding: 12, background: "#0f3460", border: "2px solid " + audit.confidenceColor, borderRadius: 10, color: "#ccd6f6", fontSize: 13, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 11, color: "#495670", marginTop: 4 }}>
            Supprime les noms d'entreprise, montants absolus, données spécifiques. Garde la logique et les ratios.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleAnonConfirm} style={{
            flex: 1, padding: 14, background: isCorrection ? "linear-gradient(135deg, #9b59b6, #8e44ad)" : "linear-gradient(135deg, #e94560, #c81d4e)",
            color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
          }}>
            {hasSensitive ? "J'ai vérifié — Archiver" : "Confirmer et archiver"}
            {isCorrection ? " la correction" : ""}
          </button>
          <button onClick={function() { setPhase(isCorrection ? "correcting" : "review"); setAnonEdit(""); setAnonAudit(null); }} style={{
            padding: "14px 16px", background: "#1a1a2e", color: "#8892b0", border: "2px solid #495670", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Retour</button>
        </div>
      </div>
    );
  }

  // BRICK REVIEW — with verb analysis + sectoral code + advocacy + elasticity + correction option + KPI référence
  if (phase === "review") {
    // TAKE TYPE — special review showing depth analysis + pillar preview
    if (seed.type === "take") {
      var takeAnalysis = verbData && verbData.takeAnalysis ? verbData.takeAnalysis : analyzeTakeDepth(answer, seed.surfacePatterns);
      var pillarPreview = takeToiPillar(answer, takeAnalysis);
      return (
        <div>
          <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#3498db", fontWeight: 600, letterSpacing: 1 }}>PRISE DE POSITION {takeAnalysis.level === "deep" ? "FORGÉE" : "DÉTECTÉE"}</span>
              {(function() { var ready = /(\d[\d.,]*\s*[KkMm]?\s*[%€$£])|([\+\-]\s*\d[\d.,]*\s*[KkMm]?\s*[%€$£])|([x×]\s*\d[\d.,]*)/.test(answer || ""); return (
              <span style={{ fontSize: 10, color: ready ? "#4ecca3" : "#ff9800", background: "#1a1a2e", padding: "2px 8px", borderRadius: 10 }}>
                {ready ? "prête" : "à armer"}
              </span>); })()}
            </div>
            <div style={{ fontSize: 14, color: "#ccd6f6", lineHeight: 1.7, marginBottom: 14, fontStyle: "italic" }}>"{answer}"</div>

            {/* Depth diagnostic */}
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 10, borderLeft: "3px solid " + (takeAnalysis.level === "deep" ? "#4ecca3" : "#ff9800") }}>
              <div style={{ fontSize: 11, color: takeAnalysis.level === "deep" ? "#4ecca3" : "#ff9800", fontWeight: 600, marginBottom: 4 }}>
                {takeAnalysis.level === "deep" ? "VISION CONTRARIANTE DÉTECTÉE" : "VISION PARTIELLE"}
              </div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>
                {takeAnalysis.level === "deep"
                  ? "Tu as un angle personnel, des exemples concrets et un raisonnement causal. C'est une thèse, pas une opinion. Elle deviendra un pilier de ta singularité."
                  : "Ta position est là. Mais elle manque de " + (
                    takeAnalysis.foundDepth.indexOf("contrarian") === -1 ? "contrepoint (qu'est-ce que les autres pensent à tort ?)" :
                    takeAnalysis.foundDepth.indexOf("personal") === -1 ? "vécu (qu'est-ce que TU as vu que les autres n'ont pas vu ?)" :
                    takeAnalysis.foundDepth.indexOf("causal") === -1 ? "logique causale (pourquoi c'est vrai ?)" :
                    "spécificité (donne un exemple concret)."
                  )
                }
              </div>
              {takeAnalysis.foundDepth.length > 0 && (
                <div style={{ fontSize: 10, color: "#495670", marginTop: 4 }}>Marqueurs détectés : {takeAnalysis.foundDepth.join(", ")}</div>
              )}
            </div>

            {/* Pillar preview */}
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #3498db" }}>
              <div style={{ fontSize: 10, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>PILIER CANDIDAT</div>
              <div style={{ fontSize: 13, color: "#ccd6f6", fontWeight: 700, marginBottom: 2 }}>{pillarPreview.title}</div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>{pillarPreview.desc}</div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: "#8892b0", textAlign: "center", marginBottom: 12 }}>
            Cette prise de position alimentera tes piliers, tes posts et tes commentaires LinkedIn.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={function() { onForge(Object.assign({}, seed, { takeText: answer, takeAnalysis: takeAnalysis, pillarPreview: pillarPreview })); setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setVerbData(null); setVerbDismissed(false); setCicOverride(null); }} style={{
              flex: 1, padding: 14, background: "linear-gradient(135deg, #e94560, #c81d4e)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
            }}>Valider</button>
            <button onClick={function() { setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setVerbData(null); }} style={{
              flex: 1, padding: 14, background: "#1a1a2e", color: "#8892b0", border: "2px solid #495670", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
            }}>Reformuler</button>
          </div>
        </div>
      );
    }

    var cat = CATEGORY_LABELS[seed.brickCategory];
    var elast = seed.elasticity && ELASTICITY_LABELS[seed.elasticity];
    var kpiMatch = targetRoleId ? matchKpiToReference(seed.kpi || "", targetRoleId) : null;
    var isSousPression = kpiMatch && kpiMatch.elasticity === "sous_pression";
    var computedAdvocacy = generateAdvocacyText(effectiveText, seed.brickCategory, seed.type, seed.nightmareText);
    var computedInternalAdvocacy = generateInternalAdvocacy(effectiveText, seed.brickCategory, seed.type, seed.elasticity);
    return (
      <div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: seed.type === "cicatrice" ? "#ff9800" : cat ? cat.color : "#e94560", fontWeight: 600, letterSpacing: 1 }}>
              {seed.type === "cicatrice" ? "CICATRICE FORGÉE" : "BRIQUE FORGÉE"}
            </span>
            {cat && <span style={{ fontSize: 10, color: cat.color, background: "#1a1a2e", padding: "2px 8px", borderRadius: 10 }}>{cat.label}</span>}
            {elast && <span style={{ fontSize: 10, color: elast.color, background: "#1a1a2e", padding: "2px 8px", borderRadius: 10 }}>{elast.icon} {elast.label}</span>}
          </div>
          <div style={{ fontSize: 15, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 14 }}>&quot;{effectiveText}&quot;</div>

          {/* KPI REFERENCE MATCH — authoritative classification */}
          {kpiMatch && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 10, borderLeft: "3px solid " + (isSousPression ? "#e94560" : kpiMatch.elasticity === "élastique" ? "#4ecca3" : "#8892b0") }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: isSousPression ? "#e94560" : kpiMatch.elasticity === "élastique" ? "#4ecca3" : "#8892b0", fontWeight: 600 }}>
                  {isSousPression ? "\uD83D\uDEA8 KPI SOUS PRESSION" : kpiMatch.elasticity === "élastique" ? "\u2197\uFE0F KPI ÉLASTIQUE" : "\u2194\uFE0F KPI STABLE"}
                </span>
                <span style={{ fontSize: 10, color: "#495670", background: "#0f3460", padding: "2px 8px", borderRadius: 8 }}>
                  {kpiMatch.name}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 4 }}>{kpiMatch.why}</div>
              {isSousPression && (
                <div style={{ background: (seed.generatedText && hasDecisionMarkers(seed.generatedText) ? "#ff9800" : "#e94560") + "22", borderRadius: 6, padding: 8, marginTop: 6 }}>
                  <div style={{ fontSize: 12, color: seed.generatedText && hasDecisionMarkers(seed.generatedText) ? "#ff9800" : "#e94560", fontWeight: 600, lineHeight: 1.5 }}>
                    {seed.generatedText && hasDecisionMarkers(seed.generatedText)
                      ? "Ce KPI est automatisable, mais ta brique montre un arbitrage humain. Le recruteur verra la décision, pas juste le chiffre. Renforce l'angle décision pour blinder cette preuve."
                      : "Ce KPI est automatisable. L'IA fait ça pour 0,01 euros. Si c'est ta meilleure preuve, tu négocies à la baisse. Trouve un angle élastique ou accepte que cette brique est faible."}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BLUFF ALERT — elastic KPI covering a quantified cauchemar */}
          {kpiMatch && seed.kpi && (function() {
            var matchedCauchemar = getActiveCauchemars().filter(function(c) {
              return c.kpis.some(function(k) { return seed.kpi.indexOf(k) !== -1 || k.indexOf(seed.kpi) !== -1; });
            })[0];
            if (!matchedCauchemar) return null;
            var costStr = formatCost(matchedCauchemar.costRange[0]) + "-" + formatCost(matchedCauchemar.costRange[1]);
            var negoText = matchedCauchemar.negoFrame ? matchedCauchemar.negoFrame.replace("{cost}", costStr) : null;
            return (
              <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 10, borderLeft: "3px solid " + (isSousPression ? "#e94560" : "#ff9800") }}>
                <div style={{ fontSize: 11, color: isSousPression ? "#e94560" : "#ff9800", fontWeight: 600, marginBottom: 4 }}>
                  {isSousPression ? "\uD83D\uDEA8 BLUFF CRITIQUE" : "\u26A0\uFE0F LEVIER DE NÉGOCIATION"} — {matchedCauchemar.label.toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 6 }}>
                  Ce cauchemar coûte {costStr}{"\u20AC"}/{matchedCauchemar.costUnit} dans le secteur. {matchedCauchemar.costContext}
                </div>
                {isSousPression ? (
                  <div style={{ fontSize: 12, color: seed.generatedText && hasDecisionMarkers(seed.generatedText) ? "#ff9800" : "#e94560", lineHeight: 1.5, fontWeight: 600 }}>
                    {seed.generatedText && hasDecisionMarkers(seed.generatedText)
                      ? "Ce cauchemar est couvert par un KPI automatisable, mais ta brique montre un arbitrage. Le recruteur verra la décision. Renforce cet angle."
                      : "Tu couvres ce cauchemar avec un KPI automatisable. Le recruteur sait que l'IA fait ce travail. Tu es le remède avec un outil que tout le monde a. Trouve un angle élastique."}
                  </div>
                ) : (
                  <div>
                    {negoText && (
                      <div style={{ fontSize: 12, color: "#4ecca3", lineHeight: 1.5, fontStyle: "italic", marginBottom: 4 }}>"{negoText}"</div>
                    )}
                    <div style={{ fontSize: 11, color: "#ff9800", lineHeight: 1.5 }}>
                      Si tu revendiques cette solution et que le problème persiste après ton arrivée, tu deviens la cible. Ta preuve doit être reproductible.
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* VULNERABILITY AUDIT — warns if positioned as remedy with weak proof */}
          {seed.generatedText && (function() {
            var vuln = auditBrickVulnerability({ text: seed.generatedText, corrected: false });
            if (!vuln || vuln.level === "blindee") return null;
            return (
              <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 10, borderLeft: "3px solid " + vuln.color }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: vuln.color, fontWeight: 600 }}>
                    {vuln.level === "vulnerable" ? "\uD83D\uDEA8 BRIQUE VULNERABLE" : "\u26A0\uFE0F BRIQUE A BLINDER"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{vuln.msg}</div>
                {vuln.level === "vulnerable" && (
                  <div style={{ fontSize: 11, color: "#e94560", marginTop: 6, lineHeight: 1.4 }}>Corrige cette brique avant de l'archiver. Le bouton "Retoucher" te permet de l'enrichir.</div>
                )}
              </div>
            );
          })()}

          {/* CICATRICE — valorization without classification */}
          {seed.type === "cicatrice" && answer && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #ff9800", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, marginBottom: 4 }}>CICATRICE ASSUMÉE</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>Tu viens de raconter un échec. Le système le transforme en preuve de maturité. 95% des candidats mentent ou esquivent. Tu te sépares d'eux.</div>
            </div>
          )}

          {/* ADVOCACY FRAMING — enhanced for hard questions */}
          {computedAdvocacy && (function() {
            var isHard = seed.brickCategory === "decision" || seed.brickCategory === "influence" || seed.type === "cicatrice";
            return (
              <div style={{ background: isHard ? "#0f3460" : "#1a1a2e", borderRadius: isHard ? 10 : 8, padding: isHard ? 16 : 10, borderLeft: "3px solid #4ecca3", marginBottom: 10, boxShadow: isHard ? "0 2px 12px rgba(78,204,163,0.15)" : "none" }}>
                <div style={{ fontSize: isHard ? 12 : 11, color: "#4ecca3", fontWeight: 600, marginBottom: isHard ? 8 : 4 }}>
                  {isHard ? "\uD83C\uDFAF CE QUE TON INTERVIEWEUR DIRA A SON DIRECTEUR" : "CE QUE TON INTERVIEWEUR DIRA A SON DIRECTEUR"}
                </div>
                <div style={{ fontSize: isHard ? 14 : 12, color: "#ccd6f6", lineHeight: 1.6, fontStyle: "italic" }}>"{computedAdvocacy}"</div>
                {isHard && (
                  <div style={{ background: "#4ecca3" + "15", borderRadius: 6, padding: 8, marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: "#4ecca3", lineHeight: 1.5 }}>
                      {seed.type === "cicatrice"
                        ? "Tu viens d'assumer un échec et de le transformer en preuve de maturité. 95% des candidats mentent ou esquivent. Tu viens de te séparer d'eux."
                        : seed.brickCategory === "decision"
                        ? "Tu viens de documenter un arbitrage. C'est la preuve la plus rare en entretien. N'importe qui cite un chiffre. Personne ne montre comment il décide sous pression."
                        : "Tu viens de montrer comment tu alignes des gens qui ne veulent pas s'aligner. C'est le genre de preuve que les recruteurs n'arrivent pas à extraire en entretien. Tu l'as écrite."
                      }
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* CADRAGE INTERNE — what your N+1 loses if you leave (j_y_suis only) */}
          {computedInternalAdvocacy && trajectoryToggle === "j_y_suis" && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #3498db", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>CE QUE TON N+1 PERD SI TU PARS</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5 }}>{computedInternalAdvocacy}</div>
            </div>
          )}

          {/* AUDIT DE CONTRÔLE — bluff de l'expert */}
          {seed.controlRisk && (
            <div style={{ background: "#e94560" + "15", borderRadius: 8, padding: 10, borderLeft: "3px solid #ff9800", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, marginBottom: 4 }}>{"\u26A0\uFE0F"} AUDIT DE CONTRÔLE</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5 }}>{seed.controlRisk}</div>
              <div style={{ fontSize: 11, color: "#e94560", lineHeight: 1.5, marginTop: 6 }}>Si tu te positionnes comme le remède et que le problème persiste, tu deviens la cible. Ta brique doit décrire ce que TU contrôles, pas ce que ton équipe a fait.</div>
            </div>
          )}

          {/* CAUCHEMAR DU DÉCIDEUR — le problème que tu résous */}
          {seed.nightmareText && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #e74c3c", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#e74c3c", fontWeight: 600, marginBottom: 4 }}>LE CAUCHEMAR QUE TU RÉSOUS</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5 }}>{seed.nightmareText}</div>
            </div>
          )}

          {/* VERB ANALYSIS — linguistic mirror with override */}
          {verbData && !verbDismissed && (verbData.foundProcess.length > 0 || verbData.foundAvoidance.length > 0) && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #9b59b6", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "#9b59b6", fontWeight: 600 }}>TON LANGAGE</span>
                <span style={{ fontSize: 10, color: "#495670", background: "#0f3460", padding: "2px 8px", borderRadius: 8 }}>
                  {verbData.foundProcess.length + verbData.foundAvoidance.length} verbe{verbData.foundProcess.length + verbData.foundAvoidance.length > 1 ? "s" : ""} signalé{verbData.foundProcess.length + verbData.foundAvoidance.length > 1 ? "s" : ""}
                </span>
              </div>
              {verbData.foundProcess.length > 0 && (
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 4 }}>
                  Verbes de processus détectés : <span style={{ color: "#e94560" }}>{verbData.foundProcess.join(", ")}</span>. Le recruteur lit : rôle secondaire.
                </div>
              )}
              {verbData.foundAvoidance.length > 0 && (
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 4 }}>
                  Verbes d'évitement détectés : <span style={{ color: "#e94560" }}>{verbData.foundAvoidance.join(", ")}</span>. Le recruteur lit : pas d'engagement.
                </div>
              )}
              {verbData.foundResult.length > 0 && (
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5, marginBottom: 4 }}>
                  Verbes de résultat : <span style={{ color: "#4ecca3" }}>{verbData.foundResult.join(", ")}</span>. Le recruteur lit : acteur.
                </div>
              )}
              <button onClick={function() { setVerbDismissed(true); }} style={{
                padding: "4px 10px", fontSize: 11, background: "#0f3460", color: "#495670", border: "1px solid #495670", borderRadius: 6, cursor: "pointer", fontWeight: 600, marginTop: 4,
              }}>Ces verbes sont justifiés ici</button>
            </div>
          )}
          {verbDismissed && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #495670", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#495670", fontWeight: 600 }}>LANGAGE : alerte écartée par toi. L'IA en prend note.</div>
            </div>
          )}

          {/* SECTORAL CODE CONTRAST */}
          {seed.sectoralNote && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #3498db", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>TRADUCTION SECTORIELLE</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{seed.sectoralNote}</div>
            </div>
          )}

          {/* ELASTICITY NOTE */}
          {seed.elasticityNote && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid " + (elast ? elast.color : "#8892b0"), marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: elast ? elast.color : "#8892b0", fontWeight: 600, marginBottom: 4 }}>ÉLASTICITÉ DU MARCHÉ</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{seed.elasticityNote}</div>
            </div>
          )}

          {/* OMEGA NOTE */}
          {seed.omegaNote && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #ff9800", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, marginBottom: 4 }}>ATTENTION : IMPACT PERSONNEL</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{seed.omegaNote}</div>
            </div>
          )}

          {/* VERSION ANONYMISEE — transportable sans risque */}
          {seed.anonymizedText && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #95a5a6", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#95a5a6", fontWeight: 600, marginBottom: 4 }}>APERÇU — VERSION TRANSPORTABLE</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5 }}>"{seed.anonymizedText}"</div>
              <div style={{ fontSize: 11, color: "#495670", marginTop: 6 }}>Tu pourras vérifier et éditer cette version avant archivage. L'IA détecte les éléments sensibles. C'est toi qui valides.</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <span style={{ background: "#1a1a2e", color: seed.type === "cicatrice" ? "#ff9800" : "#e94560", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>KPI : {seed.kpi}</span>
            {seed.skills.map(function(s) {
              return <span key={s} style={{ background: "#1a1a2e", color: "#8892b0", fontSize: 11, padding: "4px 10px", borderRadius: 20 }}>{s}</span>;
            })}
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #e94560" }}>
            <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 6 }}>SI VALIDÉE, CETTE BRIQUE ALIMENTERA :</div>
            {seed.usedIn.map(function(u, i) { return <div key={i} style={{ fontSize: 12, color: "#8892b0", marginBottom: 2 }}>{"\u2192"} {u}</div>; })}
          </div>
        </div>

        {/* INLINE ALMOST-EDIT MODE */}
        {almostEditing && (
          <div style={{ background: "#1a1a2e", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>TA VERSION</div>
            <textarea value={almostText} onChange={function(e) { setAlmostText(e.target.value); }}
              style={{ width: "100%", minHeight: 90, padding: 14, background: "#0f3460", border: "2px solid #ff9800", borderRadius: 10, color: "#ccd6f6", fontSize: 14, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 12 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={function() {
                if (almostText.trim().length < 10) return;
                var correctedSeed = Object.assign({}, seed, { generatedText: effectiveText, originalText: effectiveText, sideProject: detectSideProject(almostText.trim()), advocacyText: generateAdvocacyText(almostText.trim(), seed.brickCategory, seed.type, seed.nightmareText), internalAdvocacy: generateInternalAdvocacy(almostText.trim(), seed.brickCategory, seed.type, seed.elasticity) });
                if (seed.anonymizedText) {
                  correctedSeed._correctedText = almostText.trim();
                  setAnonEdit(seed.anonymizedText);
                  setEditText(almostText.trim());
                  setAlmostEditing(false); setAlmostText("");
                  setPhase("anon_review_correct");
                } else {
                  onCorrect(correctedSeed, almostText.trim());
                  setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setVerbData(null); setVerbDismissed(false); setCicOverride(null); setAlmostEditing(false); setAlmostText("");
                }
              }} disabled={almostText.trim().length < 10} style={{
                flex: 1, padding: 14,
                background: almostText.trim().length >= 10 ? "linear-gradient(135deg, #ff9800, #e67e22)" : "#1a1a2e",
                color: almostText.trim().length >= 10 ? "#fff" : "#495670",
                border: "none", borderRadius: 10, cursor: almostText.trim().length >= 10 ? "pointer" : "default", fontWeight: 700, fontSize: 14,
              }}>Valider ma version</button>
              <button onClick={function() { setAlmostEditing(false); setAlmostText(""); }} style={{
                padding: "14px 16px", background: "#1a1a2e", color: "#8892b0", border: "2px solid #495670", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
              }}>Annuler</button>
            </div>
          </div>
        )}

        {/* THREE-WAY ACTION: Archiver / Presque / Retoucher / Rejeter */}
        {!almostEditing && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={function() {
            var forgedSeed = Object.assign({}, seed, { generatedText: effectiveText, sideProject: detectSideProject(effectiveText), advocacyText: generateAdvocacyText(effectiveText, seed.brickCategory, seed.type, seed.nightmareText), internalAdvocacy: generateInternalAdvocacy(effectiveText, seed.brickCategory, seed.type, seed.elasticity) });
            if (seed.anonymizedText) { setAnonEdit(seed.anonymizedText); setPhase("anon_review"); }
            else { onForge(forgedSeed); setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setVerbData(null); setVerbDismissed(false); setCicOverride(null); }
          }} style={{
            flex: 1, padding: 14, background: "linear-gradient(135deg, #e94560, #c81d4e)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
          }}>Archiver</button>
          <button onClick={function() { setAlmostText(effectiveText); setAlmostEditing(true); }} style={{
            flex: 1, padding: 14, background: "#0f3460", color: "#ff9800", border: "2px solid #ff9800", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 11,
          }}>Presque {"\u2014"} voici ma version</button>
          <button onClick={function() { setEditText(effectiveText); setPhase("correcting"); }} style={{
            padding: "14px 12px", background: "#0f3460", color: "#9b59b6", border: "2px solid #9b59b6", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 12,
          }}>Retoucher</button>
          <button onClick={function() { setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setVerbData(null); setVerbDismissed(false); setCicOverride(null); }} style={{
            padding: "14px 12px", background: "#1a1a2e", color: "#495670", border: "2px solid #1a1a2e", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12,
          }}>Rejeter</button>
        </div>
        )}
      </div>
    );
  }

  var canSubmit = answer.trim().length >= 10;

  function handleSubmit() {
    if (!canSubmit) return;
    var text = answer.trim();

    // UNFAIR ADVANTAGE — straight to review, no confrontation
    if (seed.type === "unfair_advantage") {
      var verbs = analyzeVerbs(text);
      setVerbData(verbs);
      setPhase("forging");
      setTimeout(function() { setPhase("review"); }, 1500);
      return;
    }

    // TAKE TYPE — analyze depth, not numbers
    if (seed.type === "take") {
      var takeDepth = analyzeTakeDepth(text, seed.surfacePatterns);
      if (takeDepth.level === "surface") {
        setConfrontMsg("Ta réponse est celle de 90% des professionnels de ton secteur. C'est un récit dominant, pas une prise de position. Un recruteur qui lit ça ne retient rien. Creuse. Qu'est-ce que ton expérience t'a montré que les articles de blog ne disent pas ?");
        setPhase("confront");
        return;
      }
      setVerbData({ takeAnalysis: takeDepth });
      setPhase("forging");
      setTimeout(function() { setPhase("review"); }, 1500);
      return;
    }

    // Blame detection for cicatrice seeds
    if (seed.blameDetection && hasBlame(text)) {
      setConfrontMsg("Tu blâmes le produit ou le prix. Quel était le budget réel du prospect ? Quelle étape de qualification as-tu sautée ? C'est là que le deal s'est perdu.");
      setPhase("confront");
      return;
    }
    // Externalization detection
    if (seed.externalizeDetection && hasExternalization(text)) {
      setConfrontMsg("Tu n'as cité aucun facteur sous ton contrôle. Le recruteur entend : cette personne ne prend pas de responsabilité. Trouve ta part dans cet échec.");
      setPhase("confront");
      return;
    }
    // Verb analysis on the client's raw answer
    var verbs = analyzeVerbs(text);
    setVerbData(verbs);
    // Decision/influence detection — skip mission mode if markers found
    if (seed.brickCategory === "decision" || seed.brickCategory === "influence") {
      setPhase("forging");
      setTimeout(function() { setPhase("review"); }, 1500);
      return;
    }
    // For chiffre type: if answer has decision/influence markers, also forge (not mission)
    if (!hasNumbers(text) && seed.type === "preuve" && seed.brickCategory === "chiffre") {
      if (hasDecisionMarkers(text) || hasInfluenceMarkers(text)) {
        setPhase("forging");
        setTimeout(function() { setPhase("review"); }, 1500);
        return;
      }
      if (seed.missionText) {
        setPhase("forging");
        setTimeout(function() { setPhase("triage"); }, 1200);
        return;
      }
    }
    setPhase("forging");
    setTimeout(function() { setPhase("review"); }, 1500);
  }

  // Determine question label based on brick category
  var categoryLabels = { chiffre: "HYPOTHÈSE", decision: "HYPOTHÈSE", influence: "HYPOTHÈSE" };
  var qLabel = seed.type === "take" ? "PRISE DE POSITION" : seed.type === "cicatrice" ? "CICATRICE" : categoryLabels[seed.brickCategory] || "HYPOTHÈSE";

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#495670", marginBottom: 4 }}>
          <span>Question {processed.length + 1} / {seeds.length}</span>
          <span>{validated.length} brique{validated.length > 1 ? "s" : ""} {missionItems.length > 0 ? ("+ " + missionItems.length + " mission" + (missionItems.length > 1 ? "s" : "")) : ""}</span>
        </div>
        <div style={{ width: "100%", background: "#1a1a2e", borderRadius: 6, height: 4, overflow: "hidden" }}>
          <div style={{ width: ((processed.length / seeds.length) * 100) + "%", height: "100%", background: "#e94560", borderRadius: 6, transition: "width 0.4s ease" }} />
        </div>
      </div>
      <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: seed.type === "take" ? "#3498db" : seed.type === "cicatrice" ? "#ff9800" : CATEGORY_LABELS[seed.brickCategory] ? CATEGORY_LABELS[seed.brickCategory].color : "#e94560", fontWeight: 600, letterSpacing: 1 }}>
            {qLabel} #{seed.id}{seed.type !== "take" && seed.type !== "cicatrice" ? " — Basée sur ton profil × le marché" : ""}
          </span>
          {seed.elasticity && ELASTICITY_LABELS[seed.elasticity] && (
            <span style={{ fontSize: 10, color: ELASTICITY_LABELS[seed.elasticity].color, background: "#1a1a2e", padding: "2px 8px", borderRadius: 10 }}>
              {ELASTICITY_LABELS[seed.elasticity].icon} {ELASTICITY_LABELS[seed.elasticity].label}
            </span>
          )}
        </div>
        <div style={{ fontSize: 16, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 14, fontWeight: 600 }}>{seed.question}</div>
        <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, borderLeft: "3px solid #495670" }}>
          <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 4 }}>POURQUOI CETTE QUESTION</div>
          <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{seed.context}</div>
        </div>
      </div>
      {/* 4-FIELD STRUCTURED INPUT — Item 1 */}
      {(function() {
        var fieldDefs = getBrickFields(seed);
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 4 }}>
            {fieldDefs.map(function(f, i) {
              var fKey = "f" + (i + 1);
              return (
                <div key={f.key}>
                  <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 600, marginBottom: 3 }}>{f.label}</div>
                  <input
                    value={fields[fKey] || ""}
                    onChange={function(e) {
                      var upd = Object.assign({}, fields);
                      upd[fKey] = e.target.value;
                      setFields(upd);
                      // Assemble all fields into answer for downstream compat
                      var assembled = fieldDefs.map(function(fd, j) { return upd["f" + (j + 1)] || ""; }).filter(function(v) { return v.trim().length > 0; }).join("\n\n");
                      setAnswer(assembled);
                    }}
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: 10, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 8, color: "#ccd6f6", fontSize: 13, lineHeight: 1.4, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                </div>
              );
            })}
          </div>
        );
      })()}
      <div style={{ fontSize: 11, color: canSubmit ? "#495670" : "#e94560", marginBottom: 12, textAlign: "right" }}>
        {canSubmit ? (seed.type === "take" ? "L'IA analyse la profondeur de ta position" : seed.type === "unfair_advantage" ? "L'IA croise avec tes briques" : seed.brickCategory === "chiffre" && seed.type === "preuve" && !hasNumbers(answer) ? "Attention : pas de chiffre détecté" : "L'IA structure ta réponse") : "Remplis au moins 2 champs"}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleSubmit} disabled={!canSubmit} style={{
          flex: 2, padding: 14,
          background: canSubmit ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
          color: canSubmit ? "#fff" : "#495670",
          border: "none", borderRadius: 10, cursor: canSubmit ? "pointer" : "default", fontWeight: 700, fontSize: 14,
        }}>Forger</button>
        <button onClick={function() { onSkip(seed.id); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); }} style={{
          flex: 1, padding: 14, background: "#1a1a2e", color: "#495670",
          border: "2px solid #1a1a2e", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12,
        }}>Passer</button>
      </div>
      <BricksRecap bricks={bricks} />
    </div>
  );
}

/* ==============================
   STRESS TEST — Chantier 4
   Deuxième lame d'extraction dans l'Assemblage
   ============================== */

var STRESS_ANGLES = [
  {
    key: "angle1",
    armorCase: "chiffres",
    attack: "Prouve-le avec des chiffres. Pas un ordre de grandeur. Le chiffre exact.",
    fields: [
      { key: "exact", label: "Le chiffre exact", placeholder: "Ex : +34% en 6 mois sur 12 comptes" },
      { key: "period", label: "Sur quelle période", placeholder: "Ex : entre janvier et juin 2024" },
      { key: "baseline", label: "Comparé à quoi", placeholder: "Ex : la moyenne équipe était +8%" },
    ],
  },
  {
    key: "angle2",
    armorCase: "décision",
    attack: "Tu exécutais ou tu décidais ? Quelle décision as-tu prise que personne d'autre n'aurait prise ?",
    fields: [
      { key: "situation", label: "Quelle était la situation", placeholder: "Ex : le board voulait couper le budget R&D de 40%" },
      { key: "decision", label: "Qu'as-tu décidé", placeholder: "Ex : j'ai proposé un pivot vers le segment mid-market" },
      { key: "result", label: "Quel résultat", placeholder: "Ex : pipeline +60% en Q3 sans augmentation de budget" },
    ],
  },
  {
    key: "angle3",
    armorCase: "transférabilité",
    attack: "Tu l'as fait là-bas. Tu le refais ici ? Qu'est-ce qui était spécifique au contexte et qu'est-ce qui marche partout ?",
    fields: [
      { key: "specific", label: "Le contexte était spécifique comment ?", placeholder: "Ex : un marché de niche avec 200 prospects identifiés" },
      { key: "transferable", label: "Qu'est-ce qui marche quel que soit le contexte ?", placeholder: "Ex : le framework de qualification en 4 étapes que j'ai structuré" },
    ],
  },
  {
    key: "angle4",
    armorCase: "influence",
    attack: "Qui as-tu embarqué ? Le résultat c'est une chose. Qui a bougé grâce à toi ?",
    fields: [
      { key: "who", label: "Qui a bougé grâce à toi", placeholder: "Ex : 3 directeurs régionaux qui bloquaient le déploiement" },
      { key: "how", label: "Comment tu les as convaincus", placeholder: "Ex : présentation du coût d'inaction chiffré devant le COMEX" },
    ],
  },
  {
    key: "angle5",
    armorCase: null,
    attack: "Le marché dit que ce problème coûte cher. Comment ta preuve se compare au benchmark ?",
    fields: [
      { key: "benchmark", label: "Ton résultat vs le marché", placeholder: "Ex : la moyenne secteur est 15%, j'ai atteint 34%" },
    ],
  },
];

var SOLO_MARKERS = ["seul", "solo", "fondateur", "freelance", "indépendant", "sans équipe", "zéro équipe", "de a à z", "j'ai construit", "j'ai créé", "j'ai lancé", "side project", "bootstrap", "l'ia", "l'outil", "claude", "llm", "co-pilote", "copilote", "agent ia", "chatgpt", "ia proposait", "ia a proposé"];

function isSoloBrick(brickText) {
  var lower = (brickText || "").toLowerCase();
  return SOLO_MARKERS.some(function(m) { return lower.indexOf(m) !== -1; });
}

var ANGLE4_SOLO = {
  key: "angle4",
  armorCase: "influence",
  attack: "Qui as-tu convaincu d'utiliser ce que tu as construit ?",
  fields: [
    { key: "who", label: "Qui a utilisé / testé / acheté ?", placeholder: "Ex : 3 early adopters qui ont testé le prototype en beta" },
    { key: "how", label: "Comment tu les as convaincus ?", placeholder: "Ex : démonstration live du gain de temps sur leur workflow" },
  ],
};

var ARMOR_COLORS = { armored: "#4ecca3", credible: "#3498db", vulnerable: "#e94560" };
var ARMOR_LABELS = { armored: "Blindée", credible: "Crédible", vulnerable: "Vulnérable" };
var VERDICT_COLORS = { complete: "#4ecca3", partial: "#ff9800", empty: "#495670" };
var VERDICT_LABELS = { complete: "Matériau complet", partial: "Matériau partiel", empty: "Rien de nouveau" };

function analyzeStressResponse(angleKey, responseFields) {
  var fullText = Object.keys(responseFields).map(function(k) { return responseFields[k] || ""; }).join(" ").toLowerCase();
  if (fullText.trim().length < 5) return "empty";

  if (angleKey === "angle1") {
    var hasDigit = /\d/.test(fullText);
    var hasPeriod = ["mois", "semaine", "trimestre", "an", "jour", "q1", "q2", "q3", "q4", "janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre", "2024", "2025", "2023", "2022"].some(function(m) { return fullText.indexOf(m) !== -1; });
    var hasComparison = ["%", "moyenne", "comparé", "compare", "versus", "vs", "base", "avant", "après", "apres"].some(function(m) { return fullText.indexOf(m) !== -1; });
    if (hasDigit && (hasPeriod || hasComparison)) return "complete";
    if (hasDigit) return "partial";
    return "empty";
  }

  if (angleKey === "angle2") {
    var hasDecision = ["décidé", "decide", "choisi", "tranché", "tranche", "proposé", "propose", "arbitré", "arbitre", "recommandé", "recommande", "imposé", "impose"].some(function(m) { return fullText.indexOf(m) !== -1; });
    var hasTension = ["voulait", "bloquait", "refusait", "poussait", "exigeait", "insistait", "demandait", "situation", "contexte", "problème", "probleme"].some(function(m) { return fullText.indexOf(m) !== -1; });
    var hasResult = /\d/.test(fullText) || ["résultat", "resultat", "impact", "obtenu", "atteint", "gagné", "gagne"].some(function(m) { return fullText.indexOf(m) !== -1; });
    if (hasDecision && hasTension && hasResult) return "complete";
    if (hasDecision || (hasTension && hasResult)) return "partial";
    return "empty";
  }

  if (angleKey === "angle3") {
    var hasSpecific = ["spécifique", "specifique", "contexte", "particulier", "niche", "secteur", "marché", "marche", "entreprise"].some(function(m) { return fullText.indexOf(m) !== -1; });
    var hasTransferable = ["process", "méthode", "methode", "framework", "système", "systeme", "outil", "template", "playbook", "reproductible", "scalable", "structuré", "structure", "automatisé", "automatise", "partout", "quel que soit", "applicable", "universel"].some(function(m) { return fullText.indexOf(m) !== -1; });
    if (hasSpecific && hasTransferable) return "complete";
    if (hasTransferable) return "partial";
    return "empty";
  }

  if (angleKey === "angle4") {
    var hasWho = ["directeur", "manager", "équipe", "equipe", "collègue", "collegue", "cto", "ceo", "vp", "board", "comité", "comite", "stakeholder", "sponsor", "direction", "client", "utilisateur", "testeur", "early adopter", "beta testeur", "prospect", "acheteur"].some(function(m) { return fullText.indexOf(m) !== -1; });
    var hasHow = ["convaincu", "présenté", "presente", "démontré", "demontre", "aligné", "aligne", "embarqué", "embarque", "mobilisé", "mobilise", "fédéré", "federe", "pitch", "montré", "montre", "adopté", "adopte", "recommandé", "recommande", "converti", "testé", "teste"].some(function(m) { return fullText.indexOf(m) !== -1; });
    if (hasWho && hasHow) return "complete";
    if (hasWho || hasHow) return "partial";
    return "empty";
  }

  if (angleKey === "angle5") {
    var hasBenchmark = /\d/.test(fullText) && ["moyenne", "marché", "marche", "benchmark", "secteur", "industrie", "comparé", "compare", "%"].some(function(m) { return fullText.indexOf(m) !== -1; });
    if (hasBenchmark) return "complete";
    if (/\d/.test(fullText)) return "partial";
    return "empty";
  }

  return "empty";
}

function getVerdictMessage(angleKey, verdict) {
  if (verdict === "complete") {
    var msgs = {
      angle1: "Chiffre, période et comparaison. La case se coche.",
      angle2: "Situation, décision et résultat. Tu ne récitais pas un process. Tu décidais.",
      angle3: "Tu sépares le spécifique du transférable. Ta méthode voyage avec toi.",
      angle4: "Tu as nommé qui a bougé et comment. L'influence est documentée.",
      angle5: "Ton résultat est ancré dans un benchmark. Le recruteur a un repère.",
    };
    return msgs[angleKey] || "Matériau complet.";
  }
  if (verdict === "partial") {
    var partialMsgs = {
      angle1: "Tu as un chiffre mais sans période ni comparaison. Ça reste fragile.",
      angle2: "Il y a un signal de décision mais le triptyque situation/décision/résultat est incomplet.",
      angle3: "Tu évoques la méthode mais le contraste spécifique/transférable n'est pas clair.",
      angle4: "Tu mentionnes des acteurs mais le mécanisme de conviction n'est pas visible.",
      angle5: "Il y a un chiffre mais sans benchmark sectoriel, le recruteur ne peut pas ancrer.",
    };
    return partialMsgs[angleKey] || "Signal détecté mais pas assez fort.";
  }
  var emptyMsgs = {
    angle1: "L'outil cherchait un chiffre, une période et une comparaison. Rien détecté.",
    angle2: "L'outil cherchait une situation, une décision et un résultat. Rien détecté.",
    angle3: "L'outil cherchait la distinction entre le spécifique et le transférable. Rien détecté.",
    angle4: "L'outil cherchait qui a bougé et comment tu les as convaincus. Rien détecté.",
    angle5: "L'outil cherchait un chiffre comparé à un benchmark marché. Rien détecté.",
  };
  return emptyMsgs[angleKey] || "Aucun marqueur détecté.";
}

/**
 * BrickStressTest — V2 Chantier 4
 * Renders validated bricks with expandable stress test interface.
 * Each brick shows 5 attack angles; 1 recommended based on missing armor case.
 * Armored bricks (4/4) hide the buttons.
 * @param {{ bricks: Array, onBrickUpdate: Function, nightmareCosts: object, offersArray: Array }} props
 */
export function BrickStressTest({ bricks, onBrickUpdate, nightmareCosts, offersArray, navigateToBrick, onNavigateDone }) {
  var expandedState = useState(null);
  var expandedId = expandedState[0];
  var setExpandedId = expandedState[1];
  var activeAngleState = useState(null);
  var activeAngle = activeAngleState[0];
  var setActiveAngle = activeAngleState[1];
  var responseState = useState({});
  var responseFields = responseState[0];
  var setResponseFields = responseState[1];

  // Chantier 10B — external navigation from Arsenal "Aller à la brique"
  var navRef = useRef(null);
  if (navigateToBrick && navigateToBrick !== navRef.current) {
    navRef.current = navigateToBrick;
    if (navigateToBrick.brickId) {
      setExpandedId(navigateToBrick.brickId);
    }
    if (onNavigateDone) onNavigateDone();
  }

  var validated = bricks.filter(function(b) { return b.status === "validated" && b.type === "brick"; });

  if (validated.length === 0) return null;

  function getRecommendedAngle(armor) {
    if (!armor.hasNumbers) return "angle1";
    if (!armor.hasDecisionMarkers) return "angle2";
    if (!armor.hasTransferability) return "angle3";
    if (!armor.hasInfluenceMarkers) return "angle4";
    return "angle3"; // When first 3 cases are checked, recommend transferability
  }

  function findCoveredNightmare(brick) {
    var cauchemars = getActiveCauchemars();
    if (!cauchemars || !brick.kpi) return null;
    var found = null;
    cauchemars.forEach(function(c) {
      if (!found && c.kpis && c.kpis.some(function(k) { return brick.kpi.indexOf(k) !== -1 || k.indexOf(brick.kpi) !== -1; })) {
        found = c;
      }
    });
    return found;
  }

  function handleValidate(brick, angle) {
    var verdict = analyzeStressResponse(angle.key, responseFields);
    var updatedBrick = Object.assign({}, brick);
    if (!updatedBrick.stressTest) {
      updatedBrick.stressTest = {
        angle1: { attempted: false, response: null, verdict: null },
        angle2: { attempted: false, response: null, verdict: null },
        angle3: { attempted: false, response: null, verdict: null },
        angle4: { attempted: false, response: null, verdict: null },
        angle5: { attempted: false, response: null, verdict: null },
      };
    }
    updatedBrick.stressTest[angle.key] = {
      attempted: true,
      response: Object.assign({}, responseFields),
      verdict: verdict,
    };
    // Angle 3 transferability: set flag if complete
    if (angle.key === "angle3" && verdict === "complete") {
      updatedBrick.stressTestAngle3Validated = true;
    }
    onBrickUpdate(updatedBrick);
    setResponseFields({});
    setActiveAngle(null);
  }

  function hasOfferData() {
    return offersArray && offersArray.length > 0 && offersArray.some(function(o) { return o.parsedSignals && o.parsedSignals.totalSignals > 0; });
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>STRESS TEST<Tooltip term="Stress test" text={VOCABULARY.stressTest} /> — BLINDAGE<Tooltip term="Blindage" text={VOCABULARY.blindage} /> DES BRIQUES</div>
      <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 16, lineHeight: 1.5 }}>
        Chaque brique est testée sur 4 axes. L'angle recommandé remplit la case manquante dans ton blindage.
      </div>
      {validated.map(function(brick) {
        var armor = assessBrickArmor(brick);
        var isExpanded = expandedId === brick.id;
        var isArmored = armor.status === "armored";
        var recommended = isArmored ? null : getRecommendedAngle(armor);
        var nightmare = findCoveredNightmare(brick);

        return (
          <div key={brick.id} style={{ background: "#1a1a2e", borderRadius: 10, marginBottom: 8, border: "1px solid " + (isArmored ? "#4ecca3" + "44" : "#16213e"), overflow: "hidden" }}>
            {/* BRICK HEADER — clickable toggle */}
            <div onClick={function() { setExpandedId(isExpanded ? null : brick.id); setActiveAngle(null); setResponseFields({}); }} style={{
              padding: 14, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: ARMOR_COLORS[armor.status], background: ARMOR_COLORS[armor.status] + "22", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                    {ARMOR_LABELS[armor.status]} {armor.depth}/4
                  </span>
                  {armor.depth > 0 && armor.depth < 4 && (
                    <span style={{ fontSize: 9, color: "#495670" }}>manque : {armor.missing.join(", ")}</span>
                  )}
                  {isArmored && <span style={{ fontSize: 9, color: "#4ecca3" }}>4 cases validées</span>}
                </div>
                <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.5 }}>
                  {brick.text.length > 100 ? brick.text.slice(0, 100) + "..." : brick.text}
                </div>
              </div>
              <span style={{ fontSize: 14, color: "#495670", marginLeft: 8, flexShrink: 0 }}>{isExpanded ? "\u25B2" : "\u25BC"}</span>
            </div>

            {/* EXPANDED CONTENT */}
            {isExpanded && (
              <div style={{ padding: "0 14px 14px 14px" }}>
                {/* Full text in gray */}
                <div style={{ fontSize: 12, color: "#495670", lineHeight: 1.6, marginBottom: 12, fontStyle: "italic", borderLeft: "2px solid #16213e", paddingLeft: 10 }}>
                  {brick.text}
                </div>

                {/* 4 ARMOR CASES VISUAL */}
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {[
                    { key: "hasNumbers", label: "Chiffres", ok: armor.hasNumbers },
                    { key: "hasDecisionMarkers", label: "Décision", ok: armor.hasDecisionMarkers },
                    { key: "hasInfluenceMarkers", label: "Influence", ok: armor.hasInfluenceMarkers },
                    { key: "hasTransferability", label: "Transférabilité", ok: armor.hasTransferability },
                  ].map(function(c) {
                    return (
                      <div key={c.key} style={{
                        flex: 1, padding: "6px 4px", borderRadius: 6, textAlign: "center",
                        background: c.ok ? "#4ecca3" + "22" : "#16213e",
                        border: "1px solid " + (c.ok ? "#4ecca3" : "#495670" + "44"),
                      }}>
                        <div style={{ fontSize: 12, marginBottom: 2 }}>{c.ok ? "\u2705" : "\u2B1C"}</div>
                        <div style={{ fontSize: 9, color: c.ok ? "#4ecca3" : "#495670", fontWeight: 600 }}>{c.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* PREVIOUS STRESS TEST RESULTS */}
                {brick.stressTest && (function() {
                  var pastResults = STRESS_ANGLES.filter(function(a) { return brick.stressTest[a.key] && brick.stressTest[a.key].attempted; });
                  if (pastResults.length === 0) return null;
                  return (
                    <div style={{ marginBottom: 12 }}>
                      {pastResults.map(function(a) {
                        var st = brick.stressTest[a.key];
                        return (
                          <div key={a.key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 10, color: VERDICT_COLORS[st.verdict], fontWeight: 600 }}>{VERDICT_LABELS[st.verdict]}</span>
                            <span style={{ fontSize: 10, color: "#495670" }}>— {a.armorCase || "benchmark"}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* ANGLE BUTTONS — hidden for armored bricks */}
                {!isArmored && !activeAngle && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {STRESS_ANGLES.map(function(angle) {
                      // Angle 5 only shows if offer/benchmark data exists
                      if (angle.key === "angle5" && !hasOfferData()) return null;
                      // Angle 4 solo variant for solo bricks
                      var displayAngle = angle.key === "angle4" && isSoloBrick(brick.text) ? ANGLE4_SOLO : angle;
                      var alreadyAttempted = brick.stressTest && brick.stressTest[angle.key] && brick.stressTest[angle.key].attempted;
                      var isRec = angle.key === recommended;
                      return (
                        <button key={angle.key} disabled={alreadyAttempted}
                          onClick={function() { if (!alreadyAttempted) { setActiveAngle(displayAngle); setResponseFields({}); } }}
                          style={{
                            padding: "10px 14px", textAlign: "left", cursor: alreadyAttempted ? "default" : "pointer",
                            background: alreadyAttempted ? "#0a0a1a" : isRec ? "#e94560" + "22" : "#0f3460",
                            border: alreadyAttempted ? "1px solid #16213e" : isRec ? "2px solid #e94560" : "1px solid #16213e",
                            borderRadius: 8, opacity: alreadyAttempted ? 0.4 : 1,
                            textDecoration: alreadyAttempted ? "line-through" : "none",
                          }}>
                          <div style={{ fontSize: 12, color: alreadyAttempted ? "#495670" : isRec ? "#e94560" : "#8892b0", fontWeight: isRec ? 700 : 600 }}>
                            {isRec && !alreadyAttempted ? "\u2192 " : ""}{displayAngle.attack.split(".")[0]}
                          </div>
                          {isRec && !alreadyAttempted && (
                            <div style={{ fontSize: 10, color: "#e94560", marginTop: 2 }}>Recommandé — remplit la case « {angle.armorCase} »</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ACTIVE ANGLE — attack + cost + response fields */}
                {activeAngle && (
                  <div>
                    {/* Attack in red */}
                    <div style={{ background: "#e94560" + "22", borderRadius: 8, padding: 12, marginBottom: 10, borderLeft: "3px solid #e94560" }}>
                      <div style={{ fontSize: 14, color: "#e94560", fontWeight: 700, lineHeight: 1.6 }}>{activeAngle.attack}</div>
                    </div>

                    {/* Nightmare cost anchor */}
                    {nightmare && (
                      <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 10, borderLeft: "3px solid #ff9800" }}>
                        <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, marginBottom: 4 }}>COÛT DU CAUCHEMAR — {nightmare.label.toUpperCase()}</div>
                        <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5 }}>
                          {formatCost(nightmare.costRange[0])}-{formatCost(nightmare.costRange[1])}{"\u20AC"}/{nightmare.costUnit}. {nightmare.costContext}
                        </div>
                      </div>
                    )}
                    {!nightmare && (
                      <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: "#495670", lineHeight: 1.5 }}>Chaque réponse crédible réduit le risque perçu par le recruteur. Ton chiffre est ton bouclier.</div>
                      </div>
                    )}

                    {/* Response fields */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                      {activeAngle.fields.map(function(f) {
                        return (
                          <div key={f.key}>
                            <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 600, marginBottom: 3 }}>{f.label}</div>
                            <input
                              value={responseFields[f.key] || ""}
                              onChange={function(e) {
                                var upd = Object.assign({}, responseFields);
                                upd[f.key] = e.target.value;
                                setResponseFields(upd);
                              }}
                              placeholder={f.placeholder}
                              style={{ width: "100%", padding: 10, background: "#0a0a1a", border: "2px solid #16213e", borderRadius: 8, color: "#ccd6f6", fontSize: 13, lineHeight: 1.4, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Validate + Cancel */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={function() { handleValidate(brick, activeAngle); }}
                        disabled={Object.keys(responseFields).every(function(k) { return !responseFields[k] || responseFields[k].trim().length === 0; })}
                        style={{
                          flex: 1, padding: 12,
                          background: "linear-gradient(135deg, #e94560, #c81d4e)", color: "#fff",
                          border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
                        }}>Valider ma défense</button>
                      <button onClick={function() { setActiveAngle(null); setResponseFields({}); }} style={{
                        padding: "12px 16px", background: "#1a1a2e", color: "#8892b0",
                        border: "1px solid #495670", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12,
                      }}>Annuler</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ==============================
   PILLARS + LOCKED
   ============================== */

