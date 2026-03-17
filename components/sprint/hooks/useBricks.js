"use client";
import { useState, useRef } from "react";
import { matchKpiToReference, generateBrickVersions } from "@/lib/sprint/bricks";
import { generateAdvocacyText, generateInternalAdvocacy, generateStressTest } from "@/lib/sprint/generators";

/**
 * Manages brick lifecycle: forge, correct, mission, skip, manual add, update.
 * Extracted from Sprint.jsx — all brick state and mutation functions.
 *
 * targetRoleId and offersArray are stored in refs to avoid stale closures
 * in handler functions — they update every render via the parameter.
 *
 * @param {object} initialState - initial persisted state (from page.js)
 * @param {string|null} targetRoleId - target role ID for KPI matching
 * @param {Array} offersArray - current offers array for stress test generation
 * @returns {{ bricks, setBricks, vault, setVault, takes, setTakes, nextId, setNextId, toastBrick, setToastBrick, navigateToBrick, setNavigateToBrick, handleForge, handleCorrect, handleMission, handleSkip, handleAddBrick, handleBrickUpdate }}
 */
export function useBricks(initialState, targetRoleId, offersArray) {
  // Refs to avoid stale closures in handlers
  var roleRef = useRef(targetRoleId);
  roleRef.current = targetRoleId;
  var offersRef = useRef(offersArray);
  offersRef.current = offersArray;

  var brState = useState(initialState && initialState.bricks ? initialState.bricks : []);
  var bricks = brState[0];
  var setBricks = brState[1];

  var vState = useState(
    initialState && initialState.vault
      ? initialState.vault
      : { bricks: 0, missions: 0, pillars: 0, corrections: 0, diltsHistory: [] }
  );
  var vault = vState[0];
  var setVault = vState[1];

  var takesState = useState(initialState && initialState.takes ? initialState.takes : []);
  var takes = takesState[0];
  var setTakes = takesState[1];

  var nextIdState = useState(initialState && initialState.nextId ? initialState.nextId : 100);
  var nextId = nextIdState[0];
  var setNextId = nextIdState[1];

  var toastState = useState(null);
  var toastBrick = toastState[0];
  var setToastBrick = toastState[1];

  var navigateToBrickState = useState(null);
  var navigateToBrick = navigateToBrickState[0];
  var setNavigateToBrick = navigateToBrickState[1];

  function handleForge(seed) {
    var rid = roleRef.current;
    var offers = offersRef.current;

    // TAKE TYPE — store as take, not brick
    if (seed.type === "take") {
      var take = {
        id: seed.id,
        text: seed.takeText,
        analysis: seed.takeAnalysis,
        pillar: seed.pillarPreview,
        status: "validated",
      };
      setTakes(function (prev) {
        return prev.concat([take]);
      });
      // Also store in bricks array for seed tracking (so allSeedsDone works)
      setBricks(function (prev) {
        return prev.concat([
          {
            id: seed.id,
            text: seed.takeText,
            kpi: null,
            skills: [],
            usedIn: seed.usedIn,
            status: "validated",
            type: "take",
            brickType: "take",
            sideProject: seed.sideProject || false,
          },
        ]);
      });
      setVault(function (prev) {
        var sp = prev.selectedPillars || [];
        sp = sp.concat([
          {
            id: seed.id,
            title: seed.pillarPreview ? seed.pillarPreview.title : "",
            desc: seed.pillarPreview ? seed.pillarPreview.desc : "",
            source: "take",
          },
        ]);
        return Object.assign({}, prev, { pillars: sp.length, selectedPillars: sp });
      });
      return;
    }

    var kpiMatch = rid ? matchKpiToReference(seed.kpi || "", rid) : null;
    var brick = {
      id: seed.id,
      text: seed.generatedText,
      kpi: seed.kpi,
      skills: seed.skills,
      usedIn: seed.usedIn,
      status: "validated",
      owned: true,
      brickType: seed.type,
      brickCategory: seed.brickCategory,
      elasticity: seed.elasticity,
      nightmareText: seed.nightmareText || null,
      anonymizedText: seed.anonymizedText || null,
      anonAuditTrail: seed.anonAuditTrail || null,
      anonStatus: seed.anonAuditTrail
        ? seed.anonAuditTrail.findingsAtConfirm === 0
          ? "OK"
          : "partiel"
        : seed.anonymizedText
          ? "non_audite"
          : null,
      kpiRefMatch: kpiMatch,
      internalAdvocacy:
        seed.internalAdvocacy ||
        generateInternalAdvocacy(seed.generatedText, seed.brickCategory, seed.type, seed.elasticity),
      controlRisk: seed.controlRisk || null,
      advocacyText:
        seed.advocacyText ||
        generateAdvocacyText(seed.generatedText, seed.brickCategory, seed.type, seed.nightmareText),
      fields: seed.structuredFields || null,
      type: "brick",
      corrected: false,
      sideProject: seed.sideProject || false,
    };
    var versions = generateBrickVersions(brick, rid);
    brick.cvVersion = versions.cvVersion;
    brick.interviewVersions = versions.interviewVersions;
    brick.discoveryQuestions = versions.discoveryQuestions;
    brick.stressTest = generateStressTest(brick, rid, offers);
    setBricks(function (prev) {
      return prev.concat([brick]);
    });
    setVault(function (prev) {
      return Object.assign({}, prev, { bricks: prev.bricks + 1 });
    });
    setToastBrick(brick);
  }

  function handleCorrect(seed, correctedText) {
    var rid = roleRef.current;
    var offers = offersRef.current;

    var kpiMatch = rid ? matchKpiToReference(seed.kpi || "", rid) : null;
    var brick = {
      id: seed.id,
      text: correctedText,
      kpi: seed.kpi,
      skills: seed.skills,
      usedIn: seed.usedIn,
      status: "validated",
      owned: true,
      brickType: seed.type,
      brickCategory: seed.brickCategory,
      elasticity: seed.elasticity,
      nightmareText: seed.nightmareText || null,
      anonymizedText: seed.anonymizedText || null,
      anonAuditTrail: seed.anonAuditTrail || null,
      anonStatus: seed.anonAuditTrail
        ? seed.anonAuditTrail.findingsAtConfirm === 0
          ? "OK"
          : "partiel"
        : seed.anonymizedText
          ? "non_audite"
          : null,
      kpiRefMatch: kpiMatch,
      internalAdvocacy:
        seed.internalAdvocacy ||
        generateInternalAdvocacy(correctedText, seed.brickCategory, seed.type, seed.elasticity),
      controlRisk: seed.controlRisk || null,
      advocacyText:
        seed.advocacyText || generateAdvocacyText(correctedText, seed.brickCategory, seed.type, seed.nightmareText),
      // No structuredFields on correction path — editText may differ from original f1..f4
      fields: seed.structuredFields || null,
      type: "brick",
      corrected: true,
      sideProject: seed.sideProject || false,
      originalText: seed.originalText || null,
    };
    var versions = generateBrickVersions(brick, rid);
    brick.cvVersion = versions.cvVersion;
    brick.interviewVersions = versions.interviewVersions;
    brick.discoveryQuestions = versions.discoveryQuestions;
    brick.stressTest = generateStressTest(brick, rid, offers);
    setBricks(function (prev) {
      return prev.concat([brick]);
    });
    setVault(function (prev) {
      return Object.assign({}, prev, { bricks: prev.bricks + 1, corrections: prev.corrections + 1 });
    });
    setToastBrick(brick);
  }

  function handleMission(seed) {
    var mission = {
      id: seed.id,
      text: seed.missionText,
      kpi: seed.kpi,
      skills: [],
      usedIn: [],
      status: "pending",
      owned: false,
      type: "mission",
      sideProject: false,
    };
    setBricks(function (prev) {
      return prev.concat([mission]);
    });
    setVault(function (prev) {
      return Object.assign({}, prev, { missions: prev.missions + 1 });
    });
    setToastBrick(mission);
  }

  function handleSkip(id) {
    setBricks(function (prev) {
      return prev.concat([
        { id: id, text: "", kpi: "", skills: [], usedIn: [], status: "skipped", type: "brick", sideProject: false },
      ]);
    });
  }

  function handleAddBrick(text, kpi, category, brickSourceType) {
    var rid = roleRef.current;
    var newBrick = {
      id: nextId,
      text: text,
      kpi: kpi,
      skills: [],
      usedIn: ["CV", "Simulateur", "Posts"],
      status: "validated",
      owned: true,
      brickType: "preuve",
      brickCategory: category || "chiffre",
      type: brickSourceType || "brick",
      corrected: false,
      sideProject: false,
    };
    var versions = generateBrickVersions(newBrick, rid);
    newBrick.cvVersion = versions.cvVersion;
    newBrick.interviewVersions = versions.interviewVersions;
    newBrick.discoveryQuestions = versions.discoveryQuestions;
    setNextId(nextId + 1);
    setBricks(function (prev) {
      return prev.concat([newBrick]);
    });
    setVault(function (prev) {
      return Object.assign({}, prev, { bricks: prev.bricks + 1 });
    });
  }

  function handleBrickUpdate(updatedBrick) {
    setBricks(function (prev) {
      return prev.map(function (b) {
        return b.id === updatedBrick.id ? updatedBrick : b;
      });
    });
  }

  return {
    bricks: bricks,
    setBricks: setBricks,
    vault: vault,
    setVault: setVault,
    takes: takes,
    setTakes: setTakes,
    nextId: nextId,
    setNextId: setNextId,
    toastBrick: toastBrick,
    setToastBrick: setToastBrick,
    navigateToBrick: navigateToBrick,
    setNavigateToBrick: setNavigateToBrick,
    handleForge: handleForge,
    handleCorrect: handleCorrect,
    handleMission: handleMission,
    handleSkip: handleSkip,
    handleAddBrick: handleAddBrick,
    handleBrickUpdate: handleBrickUpdate,
  };
}
