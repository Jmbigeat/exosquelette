"use client";
import { useState, useEffect, useRef } from "react";

// Lib modules
import { KPI_REFERENCE, STEPS, DUEL_QUESTIONS } from "@/lib/sprint/references";
import { computeDensityScore, getActiveCauchemars, setActiveCauchemarsGlobal, computeCauchemarCoverage, assessBrickArmor } from "@/lib/sprint/scoring";
import { parseOfferSignals, buildActiveCauchemars, mergeOfferSignals, checkOfferCoherence } from "@/lib/sprint/offers";
import { generateAdaptiveSeeds, matchKpiToReference, getAdaptivePillars, generateBrickVersions } from "@/lib/sprint/bricks";
import { generateAdvocacyText, generateInternalAdvocacy, generateStressTest } from "@/lib/sprint/generators";
import { getMaturityLevel } from "@/lib/sprint/analysis";
import { migrateState, CURRENT_VERSION } from "@/lib/sprint/migrations";
import { hasReachedSignatureThreshold, generateMaskedHypotheses, computeMetaPatterns, crossReferenceSignature, validateSignatureFormulation, isSignatureArmored } from "@/lib/sprint/signature";

// Component modules
import { Bar, Nav, Pillars, OffersManager } from "@/components/sprint/ui";
import { Vault, CVPreview, InvestmentIndex, WorkBench, CrossRoleInsight, Arsenal } from "@/components/sprint/panels";
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
  var currentSalaryState = useState(initialState && initialState.currentSalary != null ? initialState.currentSalary : null);
  var currentSalary = currentSalaryState[0];
  var setCurrentSalary = currentSalaryState[1];

  // Chantier 7 — Ta signature
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
      offersArray: offersArray, offerNextId: offerNextId, urgenceMode: urgenceMode, aiPillarRecs: aiPillarRecs, currentSalary: currentSalary, signature: signature, _version: CURRENT_VERSION, _savedAt: Date.now(),
    };
    // Immediate localStorage save (no debounce)
    try { localStorage.setItem("sprint_state", JSON.stringify(stateObj)); } catch (e) {}
    if (!onStateChange) return;
    if (persistRef.current) clearTimeout(persistRef.current);
    persistRef.current = setTimeout(function() {
      onStateChange(stateObj);
    }, 500);
  }, [screen, activeStep, bricks, vault, sprintDone, nextId, duelResults, targetRoleId, nightmareCosts, takes, parsedOffers, offersArray, offerNextId, aiPillarRecs, signature]);

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

  /**
   * buildDuelQuestions — Chantier 5
   * Fusionne questions classiques (DUEL_QUESTIONS) + questions dérivées des briques.
   * Shuffle l'ensemble. Retourne au format attendu par Duel.jsx.
   */
  function buildDuelQuestions(classicQuestions, allBricks, roleId) {
    var validated = allBricks.filter(function(b) { return b.status === "validated" && b.type === "brick"; });
    var strong = validated.filter(function(b) {
      var armor = assessBrickArmor(b);
      return armor.status === "armored" || armor.status === "credible";
    });

    function snippet(b) {
      var t = b.text || "";
      return t.length > 60 ? t.slice(0, 60) + "..." : t;
    }

    var attackTemplates = [
      { intent: "Reproductibilité", make: function(b) { return "Vous dites : \"" + snippet(b) + "\". C'est dans un contexte précis. Qu'est-ce qui garantit que ça marche ici ?"; }, danger: "Si tu ne peux pas séparer le contexte de la méthode, ta brique est contextuelle. Le recruteur lit : chanceux, pas compétent.", idealAngle: "Sépare le spécifique du transférable. Nomme la méthode, pas seulement le résultat." },
      { intent: "Attribution", make: function(b) { return "\"" + snippet(b) + "\" — c'est ton travail ou celui de l'équipe ?"; }, danger: "Si tu dis 'c'était collectif' sans nuancer, le recruteur ne sait plus quel est ton impact individuel.", idealAngle: "Nomme ta contribution spécifique. 'L'équipe exécutait, j'ai structuré le framework et arbitré les priorités.'" },
      { intent: "Résistance au doute", make: function(b) { return "\"" + snippet(b) + "\" — le recruteur dit : 'J'ai du mal à y croire. Prouvez-le.'"; }, danger: "Si tu te justifies avec des mots, tu perds. Les données parlent.", idealAngle: "Réponds avec le chiffre, la période, et la méthode. Pas d'émotion. Des faits." },
      { intent: "Obsolescence", make: function(b) { return "\"" + snippet(b) + "\" — c'était il y a combien de temps ? Le marché a changé depuis, non ?"; }, danger: "Si tu ne montres pas que ta compétence est à jour, le recruteur classe : profil passé.", idealAngle: "Montre que le principe est intemporel même si le contexte change. 'La méthode s'applique quel que soit le cycle.'" },
    ];

    var personalQuestions = [];
    strong.forEach(function(b, i) {
      if (i >= 4) return;
      var tpl = attackTemplates[i % attackTemplates.length];
      personalQuestions.push({
        id: 100 + i,
        question: tpl.make(b),
        intent: tpl.intent,
        brickRef: "brick_" + b.id,
        danger: tpl.danger,
        idealAngle: tpl.idealAngle,
      });
    });

    var all = classicQuestions.concat(personalQuestions);
    // Fisher-Yates shuffle
    for (var i = all.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = all[i];
      all[i] = all[j];
      all[j] = temp;
    }
    return all;
  }

  var duelQRef = useRef(null);

  /**
   * handleDuelComplete — Chantier 5
   * Stocke le résultat du Duel, flag les briques mobilisées.
   * Ne met PAS sprintDone à true pour permettre le recommencement.
   */
  function handleDuelComplete(results) {
    setDuelResults(results);
    // Flag mobilized bricks
    var answeredRefs = results.filter(function(r) { return r.answer; }).map(function(r) { return r.brickRef; });
    setBricks(function(prev) {
      return prev.map(function(b) {
        if (b.status !== "validated" || b.type !== "brick") return b;
        // Direct match for generated questions (brickRef = "brick_" + id)
        var directMatch = answeredRefs.some(function(ref) { return ref === "brick_" + b.id; });
        // Text match: check if any answer contains keywords from the brick
        var textMatch = false;
        if (!directMatch && b.text) {
          var brickWords = b.text.toLowerCase().split(/\s+/).filter(function(w) { return w.length > 4; });
          results.forEach(function(r) {
            if (r.answer) {
              var aLower = r.answer.toLowerCase();
              var matches = brickWords.filter(function(w) { return aLower.indexOf(w) !== -1; });
              if (matches.length >= 2) textMatch = true;
            }
          });
        }
        if (directMatch || textMatch) return Object.assign({}, b, { duelTested: true });
        return b;
      });
    });
  }

  function handleDuelRedo() {
    setDuelResults([]);
    duelQRef.current = null;
  }

  function handleBrickUpdate(updatedBrick) {
    setBricks(function(prev) {
      return prev.map(function(b) { return b.id === updatedBrick.id ? updatedBrick : b; });
    });
  }

  var allSeedsDone = seeds.every(function(s) {
    return bricks.some(function(b) { return b.id === s.id; });
  });

  var density = computeDensityScore({ bricks: bricks, nightmares: getActiveCauchemars(), pillars: vault, signature: signature, duelResults: duelResults, cvBricks: [] });

  // Chantier 7 — Ta signature: threshold check
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
    // Cross-reference
    var crossResult = crossReferenceSignature(sigResponse, sigHypothesesRef.current || []);
    sigCrossRef.current = crossResult;
    setSigScreen("cross");
  }

  function handleSigCrossNext(chosenHypIndex) {
    // In divergence mode, chosenHypIndex indicates which hypothesis the user picked
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
      // After 2 rejections, let through anyway but mark it
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

  // Signature screens component
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
            <div style={subtitleStyle}>TA SIGNATURE</div>
            <div style={titleStyle}>La question</div>
            <div style={labelStyle}>
              Pour quoi tes anciens coll{"\u00E8"}gues ou ton manager te sollicitent quand personne d{"'"}autre ne r{"\u00E9"}sout le probl{"\u00E8"}me ?
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
                Pense {"\u00E0"} la derni{"\u00E8"}re fois qu{"'"}un coll{"\u00E8"}gue t{"'"}a appel{"\u00E9"} en urgence. C{"'"}{"é"}tait pour r{"\u00E9"}soudre quoi exactement ?
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
              {"\u00AB"} {sigResponse} {"\u00BB"}
            </div>

            {cross.type === "convergence" && (
              <div>
                <div style={{ fontSize: 13, color: "#4ecca3", fontWeight: 700, marginBottom: 8 }}>Convergence forte</div>
                <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 8 }}>{cross.diagnostic}</div>
                <div style={{ padding: 12, background: "#4ecca3" + "15", border: "1px solid #4ecca3" + "40", borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "#4ecca3", fontWeight: 600, marginBottom: 4 }}>Hypoth{"\u00E8"}se confirm{"\u00E9"}e</div>
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
                      <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>Hypoth{"\u00E8"}se {i + 1}</div>
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
                      <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>Hypoth{"\u00E8"}se {i + 1}</div>
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
              En une phrase, qu{"'"}est-ce que tu es le seul {"\u00E0"} prouver ?
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
                <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 6 }}>Suggestion assist{"\u00E9"}e</div>
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
      if (duelResults.length > 0) {
        var answeredCount = duelResults.filter(function(r) { return r.answer; }).length;
        var testedBricks = bricks.filter(function(b) { return b.duelTested; });
        return (
          <div style={{ textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{"\uD83D\uDEE1\uFE0F"}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>
              Duel terminé — {answeredCount} réponse{answeredCount > 1 ? "s" : ""} forgée{answeredCount > 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6, marginBottom: 6 }}>
              {testedBricks.length} brique{testedBricks.length > 1 ? "s" : ""} mobilisée{testedBricks.length > 1 ? "s" : ""} pendant le Duel.
            </div>
            <div style={{ fontSize: 12, color: "#495670", lineHeight: 1.5, marginBottom: 20 }}>
              Score de densité mis à jour. Tu peux refaire le Duel avec de nouvelles questions ou terminer la Forge.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleDuelRedo} style={{
                flex: 1, padding: 14, background: "#0f3460", color: "#ccd6f6",
                border: "2px solid #e94560", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
              }}>Refaire le Duel</button>
              <button onClick={function() { setSprintDone(true); }} style={{
                flex: 1, padding: 14, background: "linear-gradient(135deg, #e94560, #c81d4e)", color: "#fff",
                border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
              }}>Terminer la Forge</button>
            </div>
          </div>
        );
      }
      if (!duelQRef.current) {
        duelQRef.current = buildDuelQuestions(DUEL_QUESTIONS, bricks, targetRoleId);
      }
      return <Duel questions={duelQRef.current} bricks={bricks} onComplete={handleDuelComplete} targetRoleId={targetRoleId} />;
    }
    return null;
  }

  return (
    <div style={wrap}>
      {renderSignatureOverlay()}
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
      {!sprintDone && signature && (
        <div style={{ marginBottom: 12, padding: 12, background: "#4ecca3" + "10", border: "1px solid #4ecca3" + "30", borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 700, marginBottom: 2 }}>TA SIGNATURE {signature.armored ? "\u2014 BLIND\u00C9E" : ""}</div>
              <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.4 }}>{signature.formulation}</div>
              {signature.metaPatterns && (
                <div style={{ fontSize: 10, color: "#495670", marginTop: 4 }}>
                  Arch{"\u00E9"}type : {signature.metaPatterns.archetype} | Tempo : {signature.metaPatterns.tempo} | Modificateur : {signature.metaPatterns.modifier}
                  {signature.assistedFormulation ? " | Assist\u00E9e" : ""}
                </div>
              )}
            </div>
            <div style={{ fontSize: 20 }}>{signature.armored ? "\uD83D\uDEE1\uFE0F" : "\u2728"}</div>
          </div>
        </div>
      )}
      {!sprintDone && <Nav steps={STEPS} active={activeStep} onSelect={setActiveStep} density={density} />}
      {!sprintDone && activeStep >= 1 && (
        <Arsenal
          density={density}
          bricks={bricks}
          nightmares={getActiveCauchemars()}
          signatureThreshold={hasReachedSignatureThreshold(bricks)}
          signature={signature}
          vault={vault}
          duelResults={duelResults}
        />
      )}
      {!sprintDone && offersArray.length > 0 && <OffersManager offersArray={offersArray} onAdd={handleAddOffer} onRemove={handleRemoveOffer} coherence={offerCoherence} targetRoleId={targetRoleId} />}
      {!sprintDone && <Vault v={vault} maturity={maturity} bricks={bricks} nightmareCosts={nightmareCosts} onCostChange={function(cId, val) { setNightmareCosts(function(prev) { var next = Object.assign({}, prev); next[cId] = val; return next; }); }} />}
      {!sprintDone && <CVPreview bricks={bricks} />}
      {!sprintDone && <InvestmentIndex bricks={bricks} />}
      {!sprintDone && <CrossRoleInsight bricks={bricks} targetRoleId={targetRoleId} />}
      {!sprintDone && vault.bricks > 0 && (
        <div style={{ marginBottom: 12 }}>
          <button onClick={function() {
            if (!urgenceMode) {
              if (confirm("L'Établi : tes scripts seront construits avec les briques disponibles, blindées ou non. Un script sans preuve chiffrée ouvre une conversation. Il ne la ferme pas. Activer ?")) {
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
              + "\n\nTon Score est sauvegardé. Tu reviens quand tu veux.";
            if (confirm(summary)) { setSprintDone(true); }
          }} style={{
            width: "100%", padding: "10px 16px", background: "none",
            border: "1px solid #495670", borderRadius: 10, cursor: "pointer",
            fontSize: 12, color: "#495670", fontWeight: 600,
          }}>Mise en Veille</button>
          <div style={{ fontSize: 10, color: "#495670", textAlign: "center", marginTop: 4 }}>Pause la Forge. Tes briques restent.</div>
        </div>
      )}
      {!sprintDone && <WorkBench bricks={bricks} targetRoleId={targetRoleId} vault={vault} offersArray={offersArray} isActive={urgenceMode} currentSalary={currentSalary} onSalaryChange={setCurrentSalary} signature={signature} />}
      <div style={{ background: "#16213e", borderRadius: 12, padding: 20 }}>
        {renderContent()}
      </div>
      {toastBrick && <FeedbackToast brick={toastBrick} onDone={function() { setToastBrick(null); }} />}
    </div>
  );
}
