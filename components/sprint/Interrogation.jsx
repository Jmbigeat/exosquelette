"use client";
import { useState, useRef, useCallback } from "react";
import { CATEGORY_LABELS, ELASTICITY_LABELS } from "@/lib/sprint/references";
import { analyzeVerbs, auditAnonymization, hasBlame, hasDecisionMarkers, hasExternalization, hasInfluenceMarkers, hasNumbers } from "@/lib/sprint/analysis";
import { formatCost, getActiveCauchemars } from "@/lib/sprint/scoring";
import { analyzeTakeDepth, auditBrickVulnerability, getBrickFields, matchKpiToReference, takeToiPillar } from "@/lib/sprint/bricks";
import { generateAdvocacyText, generateInternalAdvocacy } from "@/lib/sprint/generators";

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
  var catLabel = brick.brickCategory && CATEGORY_LABELS[brick.brickCategory] ? CATEGORY_LABELS[brick.brickCategory].label : "";
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
        {catLabel && brick.type !== "mission" ? " \u2014 " + catLabel.toUpperCase() : ""}
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
          {brick.brickType === "cicatrice" ? "Échec assumé. C'est la brique la plus rare de ton Coffre-Fort." : brick.brickCategory === "decision" ? "Arbitrage documenté. Aucun générateur de CV ne produit ça." : "Influence prouvée. Le recruteur ne peut pas tester ça autrement qu'en entretien."}
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
    onAdd(text.trim(), kpi.trim() || "À définir", category);
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
      }}>{"\u2795"} L'IA a raté quelque chose ? Ajoute ta brique.</button>
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
        }}>Ajouter au Coffre-Fort</button>
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
            {missionItems.length > 0 ? "Les missions deviennent des briques quand tu apportes la preuve." : "Forgées à partir de tes réponses. Tu les incarnes. Tu les défendras."}
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
      var reviewedSeed = Object.assign({}, seed, { generatedText: effectiveText, anonymizedText: anonEdit.trim(), anonAuditTrail: auditTrail, advocacyText: generateAdvocacyText(effectiveText, seed.brickCategory, seed.type, seed.nightmareText), internalAdvocacy: generateInternalAdvocacy(effectiveText, seed.brickCategory, seed.type, seed.elasticity) });
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
              <span style={{ fontSize: 10, color: takeAnalysis.level === "deep" ? "#4ecca3" : takeAnalysis.level === "partial" ? "#ff9800" : "#e94560", background: "#1a1a2e", padding: "2px 8px", borderRadius: 10 }}>
                {takeAnalysis.level === "deep" ? "profonde" : takeAnalysis.level === "partial" ? "partielle" : "surface"}
              </span>
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
                <div style={{ background: "#e94560" + "22", borderRadius: 6, padding: 8, marginTop: 6 }}>
                  <div style={{ fontSize: 12, color: "#e94560", fontWeight: 600, lineHeight: 1.5 }}>
                    Ce KPI est automatisable. L'IA fait ça pour 0,01 euros. Si c'est ta meilleure preuve, tu négocies à la baisse. Trouve un angle élastique ou accepte que cette brique est faible.
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
                  <div style={{ fontSize: 12, color: "#e94560", lineHeight: 1.5, fontWeight: 600 }}>
                    Tu couvres ce cauchemar avec un KPI automatisable. Le recruteur sait que l'IA fait ce travail. Tu es le remède avec un outil que tout le monde a. Trouve un angle élastique.
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
            <div style={{ fontSize: 11, color: "#495670", fontWeight: 600, marginBottom: 6 }}>CETTE BRIQUE ALIMENTERA :</div>
            {seed.usedIn.map(function(u, i) { return <div key={i} style={{ fontSize: 12, color: "#8892b0", marginBottom: 2 }}>{"\u2192"} {u}</div>; })}
          </div>
        </div>

        {/* THREE-WAY ACTION: Archiver / Corriger / Rejeter */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={function() {
            var forgedSeed = Object.assign({}, seed, { generatedText: effectiveText, advocacyText: generateAdvocacyText(effectiveText, seed.brickCategory, seed.type, seed.nightmareText), internalAdvocacy: generateInternalAdvocacy(effectiveText, seed.brickCategory, seed.type, seed.elasticity) });
            if (seed.anonymizedText) { setAnonEdit(seed.anonymizedText); setPhase("anon_review"); }
            else { onForge(forgedSeed); setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setVerbData(null); setVerbDismissed(false); setCicOverride(null); }
          }} style={{
            flex: 1, padding: 14, background: "linear-gradient(135deg, #e94560, #c81d4e)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
          }}>Archiver</button>
          <button onClick={function() { setEditText(effectiveText); setPhase("correcting"); }} style={{
            flex: 1, padding: 14, background: "#0f3460", color: "#9b59b6", border: "2px solid #9b59b6", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Retoucher</button>
          <button onClick={function() { setPhase("question"); setAnswer(""); setFields({ f1: "", f2: "", f3: "", f4: "" }); setVerbData(null); setVerbDismissed(false); setCicOverride(null); }} style={{
            padding: "14px 12px", background: "#1a1a2e", color: "#495670", border: "2px solid #1a1a2e", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12,
          }}>Rejeter</button>
        </div>
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
  var categoryLabels = { chiffre: "CHIFFRE", decision: "DÉCISION", influence: "INFLUENCE" };
  var qLabel = seed.type === "take" ? "PRISE DE POSITION" : seed.type === "cicatrice" ? "CICATRICE" : categoryLabels[seed.brickCategory] || "INTERROGATOIRE";

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
            {qLabel} #{seed.id}
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
                      var assembled = fieldDefs.map(function(fd, j) { return upd["f" + (j + 1)] || ""; }).filter(function(v) { return v.trim().length > 0; }).join(". ") + ".";
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
   PILLARS + LOCKED
   ============================== */

