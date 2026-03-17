"use client";
import { useState, useEffect, useRef } from "react";
import { assessBrickArmor, getActiveCauchemars } from "@/lib/sprint/scoring";
import { hasReachedSignatureThreshold, generateMaskedHypotheses, computeMetaPatterns, crossReferenceSignature, validateSignatureFormulation, isSignatureArmored } from "@/lib/sprint/signature";
import Tooltip from "@/components/ui/Tooltip";
import VOCABULARY from "@/lib/vocabulary";

/**
 * Manages Signature detection and overlay lifecycle.
 * Triggers at 3 armored bricks × 2+ different cauchemars.
 * 3 screens: question → cross-reference → formulation.
 *
 * @param {object} initialState - persisted state (from page.js)
 * @param {Array} bricks - all bricks (from useBricks)
 * @returns {{ signature, setSignature, sigScreen, sigThresholdReached, renderSignatureOverlay }}
 */
export function useSignature(initialState, bricks) {
  var signatureState = useState(initialState && initialState.signature ? initialState.signature : null);
  var signature = signatureState[0];
  var setSignature = signatureState[1];

  var sigScreenState = useState(null); // null | "question" | "cross" | "formulate"
  var sigScreen = sigScreenState[0];
  var setSigScreen = sigScreenState[1];

  var sigResponseState = useState("");
  var sigResponse = sigResponseState[0];
  var setSigResponse = sigResponseState[1];

  var sigHypothesesRef = useRef(null);
  var sigCrossRef = useRef(null);

  var sigFormulationState = useState("");
  var sigFormulation = sigFormulationState[0];
  var setSigFormulation = sigFormulationState[1];

  var sigRejectCountRef = useRef(0);

  var sigValidationErrorState = useState(null);
  var sigValidationError = sigValidationErrorState[0];
  var setSigValidationError = sigValidationErrorState[1];

  var sigThresholdTriggeredRef = useRef(false);

  var sigThresholdReached = !signature && hasReachedSignatureThreshold(bricks);

  // Auto-trigger signature screens when threshold is reached (once per session)
  useEffect(function() {
    if (sigThresholdReached && !sigThresholdTriggeredRef.current && !signature && !sigScreen) {
      sigThresholdTriggeredRef.current = true;
      // Generate hypotheses in background
      var armored = bricks.filter(function(b) {
        return b.status === "validated" && b.type === "brick" && assessBrickArmor(b).status === "armored";
      });
      sigHypothesesRef.current = generateMaskedHypotheses(armored, getActiveCauchemars());
      setSigScreen("question");
    }
  }, [sigThresholdReached, signature, sigScreen]);

  function handleSigQuestionNext() {
    if (sigResponse.trim().split(/\s+/).length < 5) return;
    var crossResult = crossReferenceSignature(sigResponse, sigHypothesesRef.current || []);
    sigCrossRef.current = crossResult;
    setSigScreen("cross");
  }

  function handleSigCrossNext(chosenHypIndex) {
    if (sigCrossRef.current && sigCrossRef.current.type === "divergence" && chosenHypIndex != null && sigHypothesesRef.current) {
      sigCrossRef.current.chosenHypothesis = sigHypothesesRef.current[chosenHypIndex];
    }
    setSigScreen("formulate");
  }

  function handleSigValidate() {
    var validation = validateSignatureFormulation(sigFormulation, bricks);
    if (!validation.valid) {
      sigRejectCountRef.current = (sigRejectCountRef.current || 0) + 1;
      setSigValidationError(validation);
      if (sigRejectCountRef.current < 2) return;
    }

    var armoredBricks = bricks.filter(function(b) {
      return b.status === "validated" && b.type === "brick" && assessBrickArmor(b).status === "armored";
    });
    var meta = computeMetaPatterns(armoredBricks);
    var isArmored = isSignatureArmored(sigFormulation, bricks);
    var sigObj = {
      formulation: sigFormulation.trim(),
      metaPatterns: meta,
      armored: isArmored,
      hypotheses: sigHypothesesRef.current || [],
      crossResult: sigCrossRef.current || {},
      assistedFormulation: sigRejectCountRef.current >= 2,
    };
    setSignature(sigObj);
    setSigScreen(null);
    setSigValidationError(null);
  }

  function renderSignatureOverlay() {
    if (!sigScreen) return null;

    var overlayStyle = {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(10,10,26,0.95)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, overflow: "auto",
    };
    var cardStyle = {
      background: "#1a1a2e", borderRadius: 16, padding: 32, maxWidth: 560,
      width: "100%", border: "1px solid #16213e",
    };
    var titleStyle = { fontSize: 20, fontWeight: 800, color: "#ccd6f6", marginBottom: 4 };
    var subtitleStyle = { fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 16 };
    var labelStyle = { fontSize: 14, color: "#8892b0", lineHeight: 1.7, marginBottom: 16 };
    var inputStyle = {
      width: "100%", padding: 14, background: "#0a0a1a", color: "#ccd6f6",
      border: "1px solid #16213e", borderRadius: 10, fontSize: 14,
      fontFamily: "'Inter', sans-serif", resize: "vertical", minHeight: 80,
      outline: "none", boxSizing: "border-box",
    };
    var btnStyle = function(active) {
      return {
        width: "100%", padding: 14, marginTop: 16,
        background: active ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#0f3460",
        color: active ? "#fff" : "#495670",
        border: "none", borderRadius: 10, cursor: active ? "pointer" : "default",
        fontWeight: 700, fontSize: 14, opacity: active ? 1 : 0.5,
      };
    };

    // Screen 1: Question comportementale
    if (sigScreen === "question") {
      var wordCount = sigResponse.trim().split(/\s+/).filter(function(w) { return w.length > 0; }).length;
      var isEnough = wordCount >= 5;
      var showFallback = wordCount > 0 && wordCount < 5;
      return (
        <div style={overlayStyle}>
          <div style={cardStyle}>
            <div style={subtitleStyle}>TA SIGNATURE<Tooltip term="Signature" text={VOCABULARY.signature} /></div>
            <div style={titleStyle}>La question</div>
            <div style={labelStyle}>
              Pour quoi tes anciens collègues ou ton manager te sollicitent quand personne d{"'"}autre ne résout le problème ?
            </div>
            <textarea
              style={inputStyle}
              value={sigResponse}
              onChange={function(e) { setSigResponse(e.target.value); }}
              placeholder="Décris la situation concrète..."
              rows={4}
            />
            {showFallback && (
              <div style={{ fontSize: 12, color: "#e94560", marginTop: 8, lineHeight: 1.5 }}>
                Pense à la dernière fois qu{"'"}un collègue t{"'"}a appelé en urgence. C{"'"}était pour résoudre quoi exactement ?
              </div>
            )}
            <button style={btnStyle(isEnough)} onClick={isEnough ? handleSigQuestionNext : undefined}>
              Suivant
            </button>
          </div>
        </div>
      );
    }

    // Screen 2: Croisement
    if (sigScreen === "cross") {
      var cross = sigCrossRef.current || {};
      var hyps = sigHypothesesRef.current || [];
      return (
        <div style={overlayStyle}>
          <div style={cardStyle}>
            <div style={subtitleStyle}>TA SIGNATURE</div>
            <div style={titleStyle}>Le croisement</div>
            <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6, marginBottom: 16, padding: 12, background: "#0a0a1a", borderRadius: 8, borderLeft: "3px solid #e94560" }}>
              {"«"} {sigResponse} {"»"}
            </div>

            {cross.type === "convergence" && (
              <div>
                <div style={{ fontSize: 13, color: "#4ecca3", fontWeight: 700, marginBottom: 8 }}>Convergence forte</div>
                <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 8 }}>{cross.diagnostic}</div>
                <div style={{ padding: 12, background: "#4ecca3" + "15", border: "1px solid #4ecca3" + "40", borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "#4ecca3", fontWeight: 600, marginBottom: 4 }}>Hypothèse confirmée</div>
                  <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.5 }}>{cross.matchedHypothesis ? cross.matchedHypothesis.text : ""}</div>
                </div>
                <button style={btnStyle(true)} onClick={function() { handleSigCrossNext(null); }}>Suivant</button>
              </div>
            )}

            {cross.type === "partial" && (
              <div>
                <div style={{ fontSize: 13, color: "#3498db", fontWeight: 700, marginBottom: 8 }}>Convergence partielle</div>
                <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 12 }}>{cross.diagnostic}</div>
                {hyps.map(function(h, i) {
                  return (
                    <div key={i} style={{ padding: 12, background: "#3498db" + "10", border: "1px solid #3498db" + "30", borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>Hypothèse {i + 1}</div>
                      <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.5 }}>{h.text}</div>
                    </div>
                  );
                })}
                <button style={btnStyle(true)} onClick={function() { handleSigCrossNext(null); }}>Suivant</button>
              </div>
            )}

            {cross.type === "divergence" && (
              <div>
                <div style={{ fontSize: 13, color: "#e94560", fontWeight: 700, marginBottom: 8 }}>Divergence</div>
                <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 12 }}>{cross.diagnostic}</div>
                <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 12 }}>Choisis la force que tu veux armer :</div>
                {hyps.map(function(h, i) {
                  return (
                    <button key={i} onClick={function() { handleSigCrossNext(i); }} style={{
                      width: "100%", padding: 14, marginBottom: 8, background: "#0a0a1a",
                      border: "1px solid #e94560" + "60", borderRadius: 10, cursor: "pointer",
                      textAlign: "left",
                    }}>
                      <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>Hypothèse {i + 1}</div>
                      <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.5 }}>{h.text}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Screen 3: Formulation
    if (sigScreen === "formulate") {
      var cross2 = sigCrossRef.current || {};
      var rejectCount = sigRejectCountRef.current || 0;
      var showAssist = rejectCount >= 2 && sigValidationError && !sigValidationError.valid;
      var assistHyp = sigHypothesesRef.current && sigHypothesesRef.current.length > 0 ? sigHypothesesRef.current[0] : null;
      if (cross2.matchedHypothesis) assistHyp = cross2.matchedHypothesis;
      if (cross2.chosenHypothesis) assistHyp = cross2.chosenHypothesis;
      return (
        <div style={overlayStyle}>
          <div style={cardStyle}>
            <div style={subtitleStyle}>TA SIGNATURE</div>
            <div style={titleStyle}>Ta formulation</div>
            <div style={{ padding: 12, background: "#0a0a1a", borderRadius: 8, marginBottom: 16, borderLeft: "3px solid #3498db" }}>
              <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>Diagnostic</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{cross2.diagnostic || ""}</div>
            </div>
            <div style={labelStyle}>
              En une phrase, qu{"'"}est-ce que tu es le seul à prouver ?
            </div>
            <textarea
              style={inputStyle}
              value={sigFormulation}
              onChange={function(e) { setSigFormulation(e.target.value); setSigValidationError(null); }}
              placeholder="Une phrase. Pas de buzzword. Des faits."
              rows={3}
            />
            {sigFormulation.trim().length > 0 && (
              <div style={{ fontSize: 11, color: "#495670", marginTop: 4 }}>
                {sigFormulation.trim().split(/\s+/).length} / 25 mots
              </div>
            )}
            {sigValidationError && !sigValidationError.valid && rejectCount < 2 && (
              <div style={{ fontSize: 12, color: "#e94560", marginTop: 8, lineHeight: 1.5 }}>
                {sigValidationError.suggestion}
              </div>
            )}
            {showAssist && assistHyp && (
              <div style={{ marginTop: 12, padding: 14, background: "#e94560" + "12", border: "1px dashed #e94560" + "60", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 6 }}>Suggestion assistée</div>
                <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.5, fontStyle: "italic" }}>{assistHyp.text}</div>
                <button onClick={function() { setSigFormulation(assistHyp.text); setSigValidationError(null); }} style={{
                  marginTop: 8, padding: "6px 12px", background: "#e94560" + "30",
                  border: "1px solid #e94560", borderRadius: 6, cursor: "pointer",
                  fontSize: 11, color: "#e94560", fontWeight: 600,
                }}>Utiliser cette suggestion</button>
              </div>
            )}
            <button style={btnStyle(sigFormulation.trim().length > 0)} onClick={function() {
              if (sigFormulation.trim().length === 0) return;
              handleSigValidate();
            }}>
              Valider
            </button>
          </div>
        </div>
      );
    }

    return null;
  }

  return {
    signature: signature, setSignature: setSignature,
    sigScreen: sigScreen, sigThresholdReached: sigThresholdReached,
    renderSignatureOverlay: renderSignatureOverlay,
  };
}
