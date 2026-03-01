"use client";
import { useState, useEffect, useRef } from "react";

// Lib modules
import { KPI_REFERENCE, STEPS, DUEL_QUESTIONS } from "@/lib/sprint/references";
import { computeDensityScore, getActiveCauchemars, setActiveCauchemarsGlobal, computeCauchemarCoverage } from "@/lib/sprint/scoring";
import { parseOfferSignals, buildActiveCauchemars, mergeOfferSignals, checkOfferCoherence } from "@/lib/sprint/offers";
import { generateAdaptiveSeeds, matchKpiToReference, getAdaptivePillars, generateBrickVersions } from "@/lib/sprint/bricks";
import { generateAdvocacyText, generateInternalAdvocacy, generateStressTest } from "@/lib/sprint/generators";
import { getMaturityLevel } from "@/lib/sprint/analysis";
import { migrateState, CURRENT_VERSION } from "@/lib/sprint/migrations";

// Component modules
import { Bar, Nav, Pillars, OffersManager } from "@/components/sprint/ui";
import { Vault, CVPreview, InvestmentIndex, WorkBench, CrossRoleInsight } from "@/components/sprint/panels";
import { FeedbackToast, Interrogation, BrickStressTest } from "@/components/sprint/Interrogation";
import { Duel } from "@/components/sprint/Duel";
import { EndScreen } from "@/components/sprint/EndScreen";
import { Onboarding } from "@/components/sprint/Onboarding";

export default function Sprint({ initialState, onStateChange, onScan }) {
  if (initialState) initialState = migrateState(initialState);
  var scrState = useState(initialState && initialState.screen ? initialState.screen : "onboarding");
  var screen = scrState[0];
  var setScreen = scrState[1];
  var stepState = useState(initialState && initialState.activeStep != null ? initialState.activeStep : 0);
  var activeStep = stepState[0];
  var setActiveStep = stepState[1];
  var brState = useState(initialState && initialState.bricks ? initialState.bricks : []);
  var bricks = brState[0];
  var setBricks = brState[1];
  var vState = useState(initialState && initialState.vault ? initialState.vault : { bricks: 0, missions: 0, pillars: 0, corrections: 0, diltsHistory: [] });
  var vault = vState[0];
  var setVault = vState[1];
  var doneState = useState(initialState && initialState.sprintDone ? initialState.sprintDone : false);
  var sprintDone = doneState[0];
  var setSprintDone = doneState[1];
  var toastState = useState(null);
  var toastBrick = toastState[0];
  var setToastBrick = toastState[1];
  var nextIdState = useState(initialState && initialState.nextId ? initialState.nextId : 100);
  var nextId = nextIdState[0];
  var setNextId = nextIdState[1];
  var duelState = useState(initialState && initialState.duelResults ? initialState.duelResults : []);
  var duelResults = duelState[0];
  var setDuelResults = duelState[1];
  var paranoState = useState(true);
  var paranoMode = paranoState[0];
  var roleState = useState(initialState && initialState.targetRoleId ? initialState.targetRoleId : null);
  var targetRoleId = roleState[0];
  var setTargetRoleId = roleState[1];
  var costState = useState(initialState && initialState.nightmareCosts ? initialState.nightmareCosts : {});
  var nightmareCosts = costState[0];
  var setNightmareCosts = costState[1];
  var takesState = useState(initialState && initialState.takes ? initialState.takes : []);
  var takes = takesState[0];
  var setTakes = takesState[1];
  var seedsState = useState(function() {
    return initialState && initialState.targetRoleId ? generateAdaptiveSeeds(initialState.targetRoleId) : generateAdaptiveSeeds(null);
  });
  var seeds = seedsState[0];
  var setSeeds = seedsState[1];
  var parsedOffersState = useState(initialState && initialState.parsedOffers ? initialState.parsedOffers : null);
  var parsedOffers = parsedOffersState[0];
  var setParsedOffers = parsedOffersState[1];
  var offersArrayState = useState(initialState && initialState.offersArray ? initialState.offersArray : []);
  var offersArray = offersArrayState[0];
  var setOffersArray = offersArrayState[1];
  var offerNextIdState = useState(initialState && initialState.offerNextId ? initialState.offerNextId : 1);
  var offerNextId = offerNextIdState[0];
  var setOfferNextId = offerNextIdState[1];
  var urgenceState = useState(initialState && initialState.urgenceMode ? initialState.urgenceMode : false);
  var urgenceMode = urgenceState[0];
  var setUrgenceMode = urgenceState[1];
  var aiPillarRecsState = useState(initialState && initialState.aiPillarRecs != null ? initialState.aiPillarRecs : null);
  var aiPillarRecs = aiPillarRecsState[0];
  var setAiPillarRecs = aiPillarRecsState[1];

  // Synchronous init: set cauchemars BEFORE first render so getActiveCauchemars() is correct
  if (targetRoleId) {
    setActiveCauchemarsGlobal(buildActiveCauchemars(null, targetRoleId));
  }

  // Recalculate merged signals when offersArray changes
  var offerCoherence = checkOfferCoherence(offersArray);

  function recalcOffersSignals(updatedOffers) {
    var merged = mergeOfferSignals(updatedOffers, targetRoleId);
    setParsedOffers(merged);
    if (targetRoleId) {
      setActiveCauchemarsGlobal(buildActiveCauchemars(null, targetRoleId));
    }
  }

  function handleAddOffer(text) {
    var newOffer = { id: offerNextId, text: text, parsedSignals: parseOfferSignals(text, targetRoleId) };
    var updated = offersArray.concat([newOffer]);
    setOffersArray(updated);
    setOfferNextId(offerNextId + 1);
    recalcOffersSignals(updated);
  }

  function handleRemoveOffer(offerId) {
    var updated = offersArray.filter(function(o) { return o.id !== offerId; });
    setOffersArray(updated);
    recalcOffersSignals(updated);
  }

  // Set global active cauchemars whenever role changes
  useEffect(function() {
    if (targetRoleId) {
      setActiveCauchemarsGlobal(buildActiveCauchemars(null, targetRoleId));
    }
  }, [targetRoleId]);

  // Persistence : notify parent on every meaningful state change
  var persistRef = useRef(null);
  useEffect(function() {
    var stateObj = {
      screen: screen, activeStep: activeStep, bricks: bricks, vault: vault,
      sprintDone: sprintDone, nextId: nextId, duelResults: duelResults,
      targetRoleId: targetRoleId, nightmareCosts: nightmareCosts,
      takes: takes, parsedOffers: parsedOffers,
      offersArray: offersArray, offerNextId: offerNextId, urgenceMode: urgenceMode, aiPillarRecs: aiPillarRecs, _version: CURRENT_VERSION, _savedAt: Date.now(),
    };
    // Immediate localStorage save (no debounce)
    try { localStorage.setItem("sprint_state", JSON.stringify(stateObj)); } catch (e) {}
    if (!onStateChange) return;
    if (persistRef.current) clearTimeout(persistRef.current);
    persistRef.current = setTimeout(function() {
      onStateChange(stateObj);
    }, 500);
  }, [screen, activeStep, bricks, vault, sprintDone, nextId, duelResults, targetRoleId, nightmareCosts, takes, parsedOffers, offersArray, offerNextId, aiPillarRecs]);

  // Fetch AI pillar recommendations ONCE, persist result
  useEffect(function() {
    if (aiPillarRecs !== null || !targetRoleId) return;
    var pillars = getAdaptivePillars(targetRoleId);
    var takePillars = takes.filter(function(t) { return t.status === "validated" && t.pillar; });
    if (pillars.length === 0) return;
    var cancelled = false;
    fetch("/api/recommend-pillars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pillars: pillars.map(function(p) { return { id: p.id, title: p.title, desc: p.desc }; }),
        takes: takePillars.map(function(t) { return { title: t.pillar.title, desc: t.pillar.desc, text: t.text }; }),
      }),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) { if (!cancelled && Array.isArray(data)) setAiPillarRecs(data); })
      .catch(function() { if (!cancelled) setAiPillarRecs([]); });
    return function() { cancelled = true; };
  }, [aiPillarRecs, targetRoleId]);

  function handleRefreshPillarRecs() {
    setAiPillarRecs(null);
  }

  var maturity = getMaturityLevel(bricks);

  function handleForge(seed) {
    // TAKE TYPE — store as take, not brick
    if (seed.type === "take") {
      var take = {
        id: seed.id,
        text: seed.takeText,
        analysis: seed.takeAnalysis,
        pillar: seed.pillarPreview,
        status: "validated",
      };
      setTakes(function(prev) { return prev.concat([take]); });
      // Also store in bricks array for seed tracking (so allSeedsDone works)
      setBricks(function(prev) { return prev.concat([{ id: seed.id, text: seed.takeText, kpi: null, skills: [], usedIn: seed.usedIn, status: "validated", type: "take", brickType: "take", sideProject: seed.sideProject || false }]); });
      setVault(function(prev) {
        var sp = prev.selectedPillars || [];
        sp = sp.concat([{ id: seed.id, title: seed.pillarPreview ? seed.pillarPreview.title : "", desc: seed.pillarPreview ? seed.pillarPreview.desc : "", source: "take" }]);
        return Object.assign({}, prev, { pillars: sp.length, selectedPillars: sp });
      });
      return;
    }

    var kpiMatch = targetRoleId ? matchKpiToReference(seed.kpi || "", targetRoleId) : null;
    var brick = {
      id: seed.id, text: seed.generatedText, kpi: seed.kpi,
      skills: seed.skills, usedIn: seed.usedIn,
      status: "validated", owned: true, brickType: seed.type,
      brickCategory: seed.brickCategory, elasticity: seed.elasticity,
      nightmareText: seed.nightmareText || null,
      anonymizedText: seed.anonymizedText || null,
      anonAuditTrail: seed.anonAuditTrail || null,
      anonStatus: seed.anonAuditTrail ? (seed.anonAuditTrail.findingsAtConfirm === 0 ? "OK" : "partiel") : (seed.anonymizedText ? "non_audite" : null),
      kpiRefMatch: kpiMatch,
      internalAdvocacy: seed.internalAdvocacy || generateInternalAdvocacy(seed.generatedText, seed.brickCategory, seed.type, seed.elasticity),
      controlRisk: seed.controlRisk || null,
      advocacyText: seed.advocacyText || generateAdvocacyText(seed.generatedText, seed.brickCategory, seed.type, seed.nightmareText),
      type: "brick", corrected: false, sideProject: seed.sideProject || false,
    };
    var versions = generateBrickVersions(brick, targetRoleId);
    brick.cvVersion = versions.cvVersion;
    brick.interviewVersions = versions.interviewVersions;
    brick.discoveryQuestions = versions.discoveryQuestions;
    brick.stressTest = generateStressTest(brick, targetRoleId, offersArray);
    setBricks(function(prev) { return prev.concat([brick]); });
    setVault(function(prev) { return Object.assign({}, prev, { bricks: prev.bricks + 1 }); });
    setToastBrick(brick);
  }

  function handleCorrect(seed, correctedText) {
    var kpiMatch = targetRoleId ? matchKpiToReference(seed.kpi || "", targetRoleId) : null;
    var brick = {
      id: seed.id, text: correctedText, kpi: seed.kpi,
      skills: seed.skills, usedIn: seed.usedIn,
      status: "validated", owned: true, brickType: seed.type,
      brickCategory: seed.brickCategory, elasticity: seed.elasticity,
      nightmareText: seed.nightmareText || null,
      anonymizedText: seed.anonymizedText || null,
      anonAuditTrail: seed.anonAuditTrail || null,
      anonStatus: seed.anonAuditTrail ? (seed.anonAuditTrail.findingsAtConfirm === 0 ? "OK" : "partiel") : (seed.anonymizedText ? "non_audite" : null),
      kpiRefMatch: kpiMatch,
      internalAdvocacy: seed.internalAdvocacy || generateInternalAdvocacy(correctedText, seed.brickCategory, seed.type, seed.elasticity),
      controlRisk: seed.controlRisk || null,
      advocacyText: seed.advocacyText || generateAdvocacyText(correctedText, seed.brickCategory, seed.type, seed.nightmareText),
      type: "brick", corrected: true, sideProject: seed.sideProject || false,
    };
    var versions = generateBrickVersions(brick, targetRoleId);
    brick.cvVersion = versions.cvVersion;
    brick.interviewVersions = versions.interviewVersions;
    brick.discoveryQuestions = versions.discoveryQuestions;
    brick.stressTest = generateStressTest(brick, targetRoleId, offersArray);
    setBricks(function(prev) { return prev.concat([brick]); });
    setVault(function(prev) { return Object.assign({}, prev, { bricks: prev.bricks + 1, corrections: prev.corrections + 1 }); });
    setToastBrick(brick);
  }

  function handleMission(seed) {
    var mission = {
      id: seed.id, text: seed.missionText, kpi: seed.kpi,
      skills: [], usedIn: [], status: "pending", owned: false, type: "mission", sideProject: false,
    };
    setBricks(function(prev) { return prev.concat([mission]); });
    setVault(function(prev) { return Object.assign({}, prev, { missions: prev.missions + 1 }); });
    setToastBrick(mission);
  }

  function handleSkip(id) {
    setBricks(function(prev) { return prev.concat([{ id: id, text: "", kpi: "", skills: [], usedIn: [], status: "skipped", type: "brick", sideProject: false }]); });
  }

  function handleAddBrick(text, kpi, category) {
    var newBrick = { id: nextId, text: text, kpi: kpi, skills: [], usedIn: ["CV", "Simulateur", "Posts"], status: "validated", owned: true, brickType: "preuve", brickCategory: category || "chiffre", type: "brick", corrected: false, sideProject: false };
    var versions = generateBrickVersions(newBrick, targetRoleId);
    newBrick.cvVersion = versions.cvVersion;
    newBrick.interviewVersions = versions.interviewVersions;
    newBrick.discoveryQuestions = versions.discoveryQuestions;
    setNextId(nextId + 1);
    setBricks(function(prev) { return prev.concat([newBrick]); });
    setVault(function(prev) { return Object.assign({}, prev, { bricks: prev.bricks + 1 }); });
  }

  function handleValPillars(count, selectedIds, takePillars, aiPillars) {
    // Store which pillars were selected with their source info
    var selectedPillars = selectedIds.map(function(id) {
      var tp = takePillars.find(function(p) { return p.id === id; });
      if (tp) return { id: id, title: tp.title, desc: tp.desc, source: "take", depth: tp.depth };
      var ap = aiPillars.find(function(p) { return p.id === id; });
      if (ap) return { id: id, title: ap.title, desc: ap.desc, source: "ai" };
      return { id: id, source: "unknown" };
    });
    setVault(function(prev) { return Object.assign({}, prev, { pillars: count, selectedPillars: selectedPillars }); });
    setActiveStep(2);
  }

  function handleDuelComplete(results) {
    setDuelResults(results);
    setSprintDone(true);
  }

  function handleBrickUpdate(updatedBrick) {
    setBricks(function(prev) {
      return prev.map(function(b) { return b.id === updatedBrick.id ? updatedBrick : b; });
    });
  }

  var allSeedsDone = seeds.every(function(s) {
    return bricks.some(function(b) { return b.id === s.id; });
  });

  var density = computeDensityScore({ bricks: bricks, nightmares: getActiveCauchemars(), pillars: vault, signature: null, duelResults: duelResults, cvBricks: [] });

  var wrap = {
    color: "#ccd6f6",
    fontFamily: "'Inter', -apple-system, sans-serif",
    background: "#0a0a1a",
    minHeight: "100vh",
    padding: "20px",
  };

  if (screen === "onboarding") {
    return (
      <div style={wrap}>
        <Onboarding onStart={function(role, offerSignals, rawOfferText) {
          setTargetRoleId(role);
          setParsedOffers(offerSignals);
          setSeeds(generateAdaptiveSeeds(role));
          if (rawOfferText && rawOfferText.trim().length > 20) {
            var firstOffer = { id: 1, text: rawOfferText.trim(), parsedSignals: parseOfferSignals(rawOfferText, role) };
            setOffersArray([firstOffer]);
            setOfferNextId(2);
          }
          setScreen("sprint");
        }} onScan={onScan} />
      </div>
    );
  }

  function renderContent() {
    if (sprintDone) return <EndScreen vault={vault} setVault={setVault} bricks={bricks} duelResults={duelResults} maturity={maturity} targetRoleId={targetRoleId} nightmareCosts={nightmareCosts} offersArray={offersArray} />;
    if (activeStep === 0) {
      return (
        <div>
          <Interrogation seeds={seeds} bricks={bricks} onForge={handleForge} onCorrect={handleCorrect} onMission={handleMission} onSkip={handleSkip} onAddBrick={handleAddBrick} paranoMode={paranoMode} targetRoleId={targetRoleId} />
          {allSeedsDone && density.unlocks.forge && (
            <button onClick={function() { setActiveStep(1); }} style={{
              width: "100%", marginTop: 16, padding: 14, background: "#0f3460", color: "#ccd6f6",
              border: "2px solid #e94560", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
            }}>Passer à l'Assemblage {"\u2192"}</button>
          )}
          {allSeedsDone && !density.unlocks.forge && (function() {
            var cov = computeCauchemarCoverage(bricks);
            var covOk = cov.every(function(c) { return c.covered; });
            var brickOk = density.details.brickCount >= 3;
            return (
              <div style={{ background: "#e94560" + "22", borderRadius: 10, padding: 14, marginTop: 16, textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>{"🔒"} Verrou de Blindage</div>
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>
                  {!brickOk && ("Il faut au moins 3 briques validées pour passer à l'Assemblage. Tu en as " + density.details.brickCount + ". ")}
                  {!covOk && ("Couverture cauchemars incomplète : " + cov.filter(function(c) { return c.covered; }).length + "/" + cov.length + ". Couvre tous les cauchemars actifs.")}
                  {brickOk && covOk && "Verrou en cours de calcul…"}
                </div>
              </div>
            );
          })()}
        </div>
      );
    }
    if (activeStep === 1) return (
      <div>
        <BrickStressTest bricks={bricks} onBrickUpdate={handleBrickUpdate} nightmareCosts={nightmareCosts} offersArray={offersArray} />
        <Pillars pillars={getAdaptivePillars(targetRoleId)} takes={takes} onVal={handleValPillars} recommendations={aiPillarRecs} onRefresh={handleRefreshPillarRecs} />
      </div>
    );
    if (activeStep === 2) {
      return <Duel questions={DUEL_QUESTIONS} bricks={bricks} onComplete={handleDuelComplete} targetRoleId={targetRoleId} />;
    }
    return null;
  }

  return (
    <div style={wrap}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>ABNEG@TION</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#ccd6f6" }}>La Forge {"—"} Calibrage en cours</div>
        {targetRoleId && KPI_REFERENCE[targetRoleId] && (
          <div style={{ fontSize: 11, color: "#495670", marginTop: 4 }}>{"\uD83C\uDFAF"} {KPI_REFERENCE[targetRoleId].role} ({KPI_REFERENCE[targetRoleId].sector})</div>
        )}
      </div>
      {!sprintDone && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8892b0", marginBottom: 6 }}>
            <span style={{ color: density.score >= 70 ? "#4ecca3" : density.score >= 50 ? "#3498db" : "#e94560" }}>
              Densité : {density.score}%
            </span>
            <span>
              {density.score < 50 ? "Verrou actif — blinde tes briques" : density.score < 70 ? "Seuil de sortie : 70%" : "\uD83D\uDD13 Arsenal prêt"}
            </span>
          </div>
          <Bar pct={density.score} />
        </div>
      )}
      {!sprintDone && <Nav steps={STEPS} active={activeStep} onSelect={setActiveStep} density={density} />}
      {!sprintDone && offersArray.length > 0 && <OffersManager offersArray={offersArray} onAdd={handleAddOffer} onRemove={handleRemoveOffer} coherence={offerCoherence} targetRoleId={targetRoleId} />}
      {!sprintDone && <Vault v={vault} maturity={maturity} bricks={bricks} nightmareCosts={nightmareCosts} onCostChange={function(cId, val) { setNightmareCosts(function(prev) { var next = Object.assign({}, prev); next[cId] = val; return next; }); }} />}
      {!sprintDone && <CVPreview bricks={bricks} />}
      {!sprintDone && <InvestmentIndex bricks={bricks} />}
      {!sprintDone && <CrossRoleInsight bricks={bricks} targetRoleId={targetRoleId} />}
      {!sprintDone && vault.bricks > 0 && (
        <div style={{ marginBottom: 12 }}>
          <button onClick={function() {
            if (!urgenceMode) {
              if (confirm("L'Établi : tes scripts seront générés avec les briques disponibles, blindées ou non. Un script sans preuve chiffrée ouvre une conversation. Il ne la ferme pas. Activer ?")) {
                setUrgenceMode(true);
              }
            } else {
              setUrgenceMode(false);
            }
          }} style={{
            width: "100%", padding: "10px 16px", background: urgenceMode ? "#e94560" + "22" : "#1a1a2e",
            border: "1px solid " + (urgenceMode ? "#e94560" : "#16213e"), borderRadius: 10,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>{urgenceMode ? "\u26A1" : "\u26A1"}</span>
              <span style={{ fontSize: 12, color: urgenceMode ? "#e94560" : "#495670", fontWeight: 700 }}>
                {urgenceMode ? "ÉTABLI ACTIF" : "Activer l'Établi"}
              </span>
            </div>
            <div style={{
              width: 36, height: 20, borderRadius: 10, background: urgenceMode ? "#e94560" : "#0f3460",
              position: "relative", transition: "background 0.3s",
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: 8, background: "#ccd6f6",
                position: "absolute", top: 2, left: urgenceMode ? 18 : 2, transition: "left 0.3s",
              }} />
            </div>
          </button>
          {!urgenceMode && (
            <div style={{ fontSize: 10, color: "#495670", textAlign: "center", marginTop: 4 }}>Active l'Établi pour recevoir tes scripts et CV pendant la Forge.</div>
          )}
        </div>
      )}
      {!sprintDone && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #16213e" }}>
          <button onClick={function() {
            var v = bricks.filter(function(b) { return b.status === "validated"; });
            var bl = v.filter(function(b) { return b.blinded; });
            var cov = computeCauchemarCoverage(bricks).filter(function(c) { return c.covered; });
            var mis = bricks.filter(function(b) { return b.type === "mission"; });
            var summary = v.length + " brique" + (v.length > 1 ? "s" : "") + " forgée" + (v.length > 1 ? "s" : "") + ". "
              + bl.length + " blindée" + (bl.length > 1 ? "s" : "") + ". "
              + cov.length + " cauchemar" + (cov.length > 1 ? "s" : "") + " couvert" + (cov.length > 1 ? "s" : "") + "."
              + (mis.length > 0 ? " " + mis.length + " mission" + (mis.length > 1 ? "s" : "") + " en attente." : "")
              + "\n\nTon Coffre-Fort est sauvegardé. Tu reviens quand tu veux.";
            if (confirm(summary)) { setSprintDone(true); }
          }} style={{
            width: "100%", padding: "10px 16px", background: "none",
            border: "1px solid #495670", borderRadius: 10, cursor: "pointer",
            fontSize: 12, color: "#495670", fontWeight: 600,
          }}>Mise en Veille</button>
          <div style={{ fontSize: 10, color: "#495670", textAlign: "center", marginTop: 4 }}>Pause la Forge. Tes briques restent.</div>
        </div>
      )}
      {!sprintDone && <WorkBench bricks={bricks} targetRoleId={targetRoleId} vault={vault} offersArray={offersArray} isActive={urgenceMode} />}
      <div style={{ background: "#16213e", borderRadius: 12, padding: 20 }}>
        {renderContent()}
      </div>
      {toastBrick && <FeedbackToast brick={toastBrick} onDone={function() { setToastBrick(null); }} />}
    </div>
  );
}
