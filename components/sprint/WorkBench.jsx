"use client";
import { useState } from "react";
import { KPI_REFERENCE, REPLACEMENT_DATA_BY_ROLE } from "@/lib/sprint/references";
import { extractBrickSummary } from "@/lib/sprint/analysis";
import { getActiveCauchemars } from "@/lib/sprint/scoring";
import { applySignatureFilter } from "@/lib/sprint/signature";
import {
  generateCV,
  generateBio,
  generateContactScripts,
  generatePlan30jRH,
  generateReplacementReport,
  generateRaiseArgument,
  generatePlan90jN1,
  generateInterviewQuestions,
  generateCVLine,
  generateInterviewVersions,
  scoreContactScript,
  generateFollowUp,
  generateEmailSignature,
  generateSalaryComparison,
  generateOnePager,
  generateDiscoveryCall,
  generateFicheCombat,
} from "@/lib/sprint/generators";
import { parseInternalSignals } from "@/lib/sprint/offers";
import { generateLinkedInPosts } from "@/lib/sprint/linkedin";
import { getDiltsLabel, detectDiltsStagnation } from "@/lib/sprint/dilts";
import { CopyBtn } from "./ui";
import { auditDeliverable } from "@/lib/audit";
import {
  scoreHook as scoreHookPost,
  analyzeBodyRetention as analyzeBodyPost,
  marieHookFullPost,
  meroeAudit,
  generateHookVariants,
} from "@/lib/postScore";

var DELIVERABLE_AUDIENCE = {
  one_pager: "external",
  dm: "external",
  email: "external",
  cv: "external",
  bio: "external",
  plan30j: "external",
  posts: "external",
  questions: "external",
  discovery_call: "external",
  fiche_combat: "external",
  followup: "external",
  email_signature: "external",
  interview_prep: "external",
  report: "internal",
  argument: "internal",
  salary_comparison: "internal",
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
      if (
        auditResult.failed.some(function (f) {
          return f.principle === p;
        })
      ) {
        mostImpactant = p;
        break;
      }
    }
  }

  return (
    <div
      style={{
        background: "#0d0d1a",
        borderRadius: 8,
        padding: 10,
        marginTop: 8,
        borderLeft: "3px solid " + scoreColor,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor }}>Score : {score}/4</span>
        {score === 4 && <span style={{ fontSize: 10, color: "#4ecca3" }}>Livrable prêt.</span>}
      </div>

      {score === 4 ? null : (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
          {auditResult.passed.map(function (p) {
            return (
              <div key={p} style={{ fontSize: 10, color: "#4ecca3", lineHeight: 1.4 }}>
                {"\u2713"} {AUDIT_LABELS[p] ? AUDIT_LABELS[p].pass : p}
                {p === "D" ? " " + type : ""}
              </div>
            );
          })}
          {auditResult.failed.map(function (f) {
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
                {"✗"} {label}
              </div>
            );
          })}
        </div>
      )}

      {/* Correction exhausted — redirect to Forge */}
      {corrections >= maxCorrections && score < 4 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5, marginBottom: 6 }}>
            Ton matériau ne suffit pas pour ce livrable. Retourne à la Forge et blinde une brique sur{" "}
            {mostImpactant === "B"
              ? "la preuve chiffrée"
              : mostImpactant === "A"
                ? "un contexte spécifique"
                : mostImpactant === "C"
                  ? "l'orientation destinataire"
                  : "le format du canal"}
            .
          </div>
          {onGoForge && (
            <button
              onClick={onGoForge}
              style={{
                padding: "5px 12px",
                fontSize: 10,
                background: "#e94560",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Aller à la Forge
            </button>
          )}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        {!isVitrine && score < 4 && corrections < maxCorrections && onCorrect && (
          <button
            onClick={onCorrect}
            style={{
              padding: "3px 10px",
              fontSize: 10,
              background: "#0f3460",
              color: "#ccd6f6",
              border: "1px solid #16213e",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Corriger
          </button>
        )}
        {score === 4 ? (
          <button
            onClick={function () {
              onCopy(text, copyId);
            }}
            style={{
              padding: "3px 10px",
              fontSize: 10,
              background: copiedId === copyId ? "#4ecca3" : "#4ecca3",
              color: "#0a0a0a",
              border: "1px solid #4ecca3",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {copiedId === copyId ? "\u2705 Copié" : "Copier"}
          </button>
        ) : (
          <button
            onClick={function () {
              onCopy(text, copyId);
            }}
            style={{
              padding: "3px 10px",
              fontSize: 10,
              background: copiedId === copyId ? "#4ecca3" : "#495670",
              color: copiedId === copyId ? "#0a0a0a" : "#8892b0",
              border: "1px solid " + (copiedId === copyId ? "#4ecca3" : "#495670"),
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {copiedId === copyId ? "\u2705 Copié" : "Copier quand même"}
          </button>
        )}
      </div>
    </div>
  );
}

export function WorkBench({
  bricks,
  targetRoleId,
  trajectoryToggle,
  vault,
  offersArray,
  isActive,
  currentSalary,
  onSalaryChange,
  signature,
  duelResults,
  onClose,
  pieces,
  displayMode,
  consumePiece /* DEAD */,
  isSubscribed,
  user,
  onGoForge,
  obsoleteDeliverables,
  setObsoleteDeliverables,
  acvTarget,
  seniorityLevel,
}) {
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

  // Chantier 20 — Script de contact 4 variantes
  var scriptTabState = useState("dm");
  var activeScriptTab = scriptTabState[0];
  var setActiveScriptTab = scriptTabState[1];
  var scriptEditsState = useState({});
  var scriptEdits = scriptEditsState[0];
  var setScriptEdits = scriptEditsState[1];

  // Chantier 21 — Posts LinkedIn édition + scoring
  var postEditsState = useState({});
  var postEdits = postEditsState[0];
  var setPostEdits = postEditsState[1];

  // Follow-up post-entretien
  var followUpInputState = useState({
    shared: "",
    ambition: "",
    challenges: ["", "", ""],
    interviewerName: "",
    timing: "",
  });
  var followUpInput = followUpInputState[0];
  var setFollowUpInput = followUpInputState[1];
  var followUpTextState = useState(null);
  var followUpText = followUpTextState[0];
  var setFollowUpText = followUpTextState[1];
  var followUpAuditState = useState(null);
  var followUpAudit = followUpAuditState[0];
  var setFollowUpAudit = followUpAuditState[1];
  var emailSigTextState = useState(null);
  var emailSigText = emailSigTextState[0];
  var setEmailSigText = emailSigTextState[1];
  var emailSigAuditState = useState(null);
  var emailSigAudit = emailSigAuditState[0];
  var setEmailSigAudit = emailSigAuditState[1];

  // One-Pager state
  var onePagerTextState = useState(null);
  var onePagerText = onePagerTextState[0];
  var setOnePagerText = onePagerTextState[1];
  var onePagerAuditState = useState(null);
  var onePagerAudit = onePagerAuditState[0];
  var setOnePagerAudit = onePagerAuditState[1];

  // Discovery Call state
  var discoveryCallTextState = useState(null);
  var discoveryCallText = discoveryCallTextState[0];
  var setDiscoveryCallText = discoveryCallTextState[1];
  var discoveryCallAuditState = useState(null);
  var discoveryCallAudit = discoveryCallAuditState[0];
  var setDiscoveryCallAudit = discoveryCallAuditState[1];

  // Fiche de combat state
  var ficheCombatTextState = useState(null);
  var ficheCombatText = ficheCombatTextState[0];
  var setFicheCombatText = ficheCombatTextState[1];
  var ficheCombatAuditState = useState(null);
  var ficheCombatAudit = ficheCombatAuditState[0];
  var setFicheCombatAudit = ficheCombatAuditState[1];

  function handleGenerate(type, generatorFn) {
    if (!generatedOnce[type]) {
      setGeneratedOnce(function (prev) {
        return Object.assign(
          {},
          prev,
          (function () {
            var o = {};
            o[type] = true;
            return o;
          })()
        );
      });
      generatorFn();
      return;
    }
    var allowed = consumePiece ? consumePiece(type) : true; // DEAD
    if (!allowed) return;
    generatorFn();
  }

  function clearObsolete(type) {
    if (setObsoleteDeliverables) {
      setObsoleteDeliverables(function (prev) {
        var next = Object.assign({}, prev);
        delete next[type];
        return next;
      });
    }
  }

  function renderObsoleteIndicator(type, regenerateFn) {
    if (!obsoleteDeliverables || !obsoleteDeliverables[type] || !generatedOnce[type]) return null;
    return (
      <div
        style={{
          background: "#1a1a2e",
          borderRadius: 8,
          padding: 10,
          marginBottom: 8,
          borderLeft: "3px solid #ff9800",
        }}
      >
        <div style={{ fontSize: 11, color: "#ff9800", lineHeight: 1.5, marginBottom: 6 }}>
          {"\u26A0\uFE0F"} Tes offres ont changé depuis la dernière génération de ce livrable.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={function () {
              if (regenerateFn) regenerateFn();
              clearObsolete(type);
            }}
            style={{
              padding: "4px 12px",
              fontSize: 10,
              fontWeight: 600,
              borderRadius: 6,
              cursor: "pointer",
              background: "#ff9800",
              color: "#0a0a1a",
              border: "none",
            }}
          >
            Régénérer
          </button>
          <button
            onClick={function () {
              clearObsolete(type);
            }}
            style={{
              padding: "4px 12px",
              fontSize: 10,
              fontWeight: 600,
              borderRadius: 6,
              cursor: "pointer",
              background: "transparent",
              color: "#8892b0",
              border: "1px solid #495670",
            }}
          >
            Ignorer
          </button>
        </div>
      </div>
    );
  }

  var isVitrine = displayMode === "vitrine";

  if (!isActive) return null;

  var validated = bricks.filter(function (b) {
    return b.status === "validated" && b.brickType !== "take";
  });
  if (validated.length === 0) return null;

  var blindedCount = validated.filter(function (b) {
    return b.blinded;
  }).length;
  var duelPassed = duelResults && duelResults.length > 0;

  // Von Restorff — recommended deliverable highlight
  function getRecommendedDeliverable() {
    if (offersArray && offersArray.length > 0) return "one_pager";
    if (blindedCount >= 3) return "bio";
    if (duelPassed) return "interview_prep";
    return "one_pager";
  }
  var recommendedDeliverable = getRecommendedDeliverable();

  // Generate scripts for selected offer or global
  var targetOffer = offersArray && offersArray.length > 0 ? offersArray[selectedOfferIdx] || offersArray[0] : null;
  var rawScripts = generateContactScripts(bricks, targetRoleId, targetOffer);
  var scripts =
    rawScripts && signature
      ? {
          dm: applySignatureFilter(rawScripts.dm, signature),
          email: applySignatureFilter(rawScripts.email, signature),
          n1: applySignatureFilter(rawScripts.n1, signature),
          rh: applySignatureFilter(rawScripts.rh, signature),
        }
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
  var rawSalaryComp = salaryNum
    ? generateSalaryComparison(salaryNum, targetRoleId, bricks, getActiveCauchemars(), acvTarget, REPLACEMENT_DATA_BY_ROLE[targetRoleId])
    : null;
  var salaryCompText = rawSalaryComp && signature ? applySignatureFilter(rawSalaryComp, signature) : rawSalaryComp;
  var rawPlan90j = generatePlan90jN1(bricks, targetRoleId, internalSignals);
  var plan90jText = signature ? applySignatureFilter(rawPlan90j, signature) : rawPlan90j;

  // Chantier 17 — Compute audits for static deliverables
  var auditCauchemars = getActiveCauchemars();
  // Chantier 20 — dm/email audits now computed dynamically in 4-tab script block
  var auditCv = auditDeliverable("cv", cvText, bricks, auditCauchemars, "external");
  var auditBio = bioText ? auditDeliverable("bio", bioText, bricks, auditCauchemars, "external") : null;
  var auditPlan30j = auditDeliverable("plan30j", plan30jText, bricks, auditCauchemars, "external");
  var auditReplacement = auditDeliverable("report", replacementText, bricks, auditCauchemars, "internal");
  var auditRaise = auditDeliverable("argument", raiseText, bricks, auditCauchemars, "internal");
  var auditSalaryComp = salaryCompText
    ? auditDeliverable("salary_comparison", salaryCompText, bricks, auditCauchemars, "internal")
    : null;
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
    setCorrCounters(function (prev) {
      var next = Object.assign({}, prev);
      next[key] = (prev[key] || 0) + 1;
      return next;
    });
    regenerateFn();
    setToastMsg("Correction " + (current + 1) + "/2 appliquée.");
    setTimeout(function () {
      setToastMsg(null);
    }, 3000);
  }

  var qualityLevel = blindedCount >= 3 ? "blinde" : blindedCount >= 1 ? "partiel" : "nu";
  var qualityColor = qualityLevel === "blinde" ? "#4ecca3" : qualityLevel === "partiel" ? "#ff9800" : "#e94560";
  var qualityLabel =
    qualityLevel === "blinde"
      ? "PREUVE BLINDÉE"
      : qualityLevel === "partiel"
        ? "PARTIELLEMENT BLINDÉ"
        : "SANS PREUVE CHIFFRÉE";

  function handleCopy(text, id) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(function () {
      setCopiedId(null);
    }, 2000);
  }

  var externeCount =
    1 + // one-pager
    (scripts ? 1 : 0) +
    (cvText && validated.length > 0 ? 1 : 0) +
    (bioText ? 1 : 0) +
    1 +
    (linkedInPosts && linkedInPosts.length > 0 ? 1 : 0) +
    1 + // +1 script contact (4 variantes), +1 plan 30j, +1 posts piliers, +1 questions entretien
    1 + // +1 discovery call
    1; // +1 fiche de combat
  var interneCount = salaryCompText ? 4 : 3; // replacement, raise, salary comparison (if salary set), plan 90j

  return (
    <div style={{ background: "#0d1b2a", borderRadius: 12, overflow: "hidden" }}>
      {/* HEADER — with close button */}
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 16px 12px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{"\u26A1"}</span>
          <span style={{ color: "#ccd6f6", fontWeight: 700, fontSize: 15 }}>L'ÉTABLI</span>
          <span
            style={{
              fontSize: 10,
              color: qualityColor,
              background: qualityColor + "22",
              padding: "2px 8px",
              borderRadius: 8,
              fontWeight: 700,
            }}
          >
            {externeCount + interneCount} armes
          </span>
          <span
            style={{
              fontSize: 9,
              color: qualityColor,
              background: qualityColor + "15",
              padding: "1px 6px",
              borderRadius: 6,
            }}
          >
            {qualityLabel}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid #495670",
              borderRadius: 8,
              color: "#8892b0",
              cursor: "pointer",
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {"\u2190"} Retour
          </button>
        )}
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        {/* Chantier 17 — Toast correction */}
        {toastMsg && (
          <div
            style={{
              background: "#0f3460",
              fontSize: 11,
              color: "#ccd6f6",
              padding: "8px 16px",
              borderRadius: 8,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            {toastMsg}
          </div>
        )}

        {/* Chantier 14 — Alerte à 2 pièces */}
        {!isSubscribed && pieces != null && pieces <= 2 && pieces > 0 && (
          <div
            style={{
              background: "#1a1a2e",
              fontSize: 12,
              color: "#ff6b6b",
              padding: "10px 16px",
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            🪙 {pieces} pièce{pieces > 1 ? "s" : ""} restante{pieces > 1 ? "s" : ""}. Chaque régénération en consomme 1.
          </div>
        )}

        {/* ONGLETS — 3 tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 12 }}>
          <button
            onClick={function () {
              setActiveTab("externe");
            }}
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              cursor: "pointer",
              background: activeTab === "externe" ? "#e94560" + "22" : "#1a1a2e",
              color: activeTab === "externe" ? "#e94560" : "#495670",
              border: "1px solid " + (activeTab === "externe" ? "#e94560" : "#16213e"),
              borderRadius: "8px 0 0 8px",
            }}
          >
            EXTERNE
          </button>
          <button
            onClick={function () {
              setActiveTab("interne");
            }}
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              cursor: "pointer",
              background: activeTab === "interne" ? "#3498db" + "22" : "#1a1a2e",
              color: activeTab === "interne" ? "#3498db" : "#495670",
              border: "1px solid " + (activeTab === "interne" ? "#3498db" : "#16213e"),
              borderRadius: "0 0 0 0",
            }}
          >
            INTERNE
          </button>
          <button
            onClick={function () {
              setActiveTab("preparation");
            }}
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              cursor: duelPassed ? "pointer" : "default",
              background: activeTab === "preparation" ? "#ff9800" + "22" : "#1a1a2e",
              color: activeTab === "preparation" ? "#ff9800" : duelPassed ? "#495670" : "#495670",
              border: "1px solid " + (activeTab === "preparation" ? "#ff9800" : "#16213e"),
              borderRadius: "0 8px 8px 0",
              opacity: duelPassed ? 1 : 0.4,
            }}
          >
            PRÉPARATION
          </button>
        </div>

        {/* Avertissement qualité */}
        {qualityLevel !== "blinde" && (
          <div
            style={{
              background: "#e94560" + "15",
              borderRadius: 8,
              padding: 10,
              marginBottom: 12,
              borderLeft: "3px solid #e94560",
            }}
          >
            <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, marginBottom: 4 }}>AVERTISSEMENT</div>
            <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
              {qualityLevel === "nu"
                ? 'Tes scripts n\'ont aucune preuve chiffrée. Le hiring manager sera intrigué, pas convaincu. Blinde tes briques pour passer de "intéressant" à "évident."'
                : "Certaines briques ne sont pas blindées (" +
                  blindedCount +
                  "/" +
                  validated.length +
                  " blindées). Le script utilise la meilleure preuve disponible. Blinde le reste pour renforcer l'arsenal."}
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
                <div style={{ fontSize: 10, color: "#495670", fontWeight: 600, marginBottom: 4, letterSpacing: 1 }}>
                  CALIBRER SUR :
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {offersArray.map(function (o, i) {
                    var isSelected = i === selectedOfferIdx;
                    return (
                      <button
                        key={o.id}
                        onClick={function () {
                          setSelectedOfferIdx(i);
                        }}
                        style={{
                          padding: "4px 10px",
                          fontSize: 10,
                          borderRadius: 6,
                          cursor: "pointer",
                          fontWeight: 600,
                          background: isSelected ? qualityColor + "22" : "#1a1a2e",
                          border: "1px solid " + (isSelected ? qualityColor : "#16213e"),
                          color: isSelected ? qualityColor : "#8892b0",
                        }}
                      >
                        {"\uD83C\uDFAF"} Offre {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ONE-PAGER */}
            <div
              style={{
                background: "#16213e",
                borderRadius: 10,
                padding: 12,
                marginBottom: 10,
                border: recommendedDeliverable === "one_pager" ? "2px solid #ff9800" : "none",
              }}
            >
              {recommendedDeliverable === "one_pager" && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#ff9800",
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Recommandé
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1 }}>
                    {"\uD83D\uDCCB"} ONE-PAGER
                  </div>
                  <div style={{ fontSize: 9, color: "#495670", marginTop: 2 }}>
                    Document de preuve — 30 secondes de lecture
                  </div>
                </div>
                {!isVitrine && !onePagerText && (
                  <button
                    onClick={function () {
                      handleGenerate("one_pager", function () {
                        var cauchs = getActiveCauchemars();
                        var targetOff =
                          offersArray && offersArray.length > 0
                            ? offersArray[selectedOfferIdx] || offersArray[0]
                            : null;
                        var offerSigs = targetOff ? targetOff.parsedSignals : null;
                        var name =
                          user && user.user_metadata && user.user_metadata.full_name
                            ? user.user_metadata.full_name
                            : null;
                        var email = user && user.email ? user.email : null;
                        var raw = generateOnePager(
                          bricks,
                          targetRoleId,
                          cauchs,
                          signature,
                          offerSigs,
                          name,
                          email
                        );
                        var text = signature ? applySignatureFilter(raw, signature) : raw;
                        setOnePagerText(text);
                        setOnePagerAudit(
                          auditDeliverable("one_pager", text, bricks, cauchs, "external")
                        );
                      });
                    }}
                    style={{
                      padding: "6px 16px",
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 8,
                      cursor: "pointer",
                      border: "none",
                      background: "linear-gradient(135deg, #e94560, #c81d4e)",
                      color: "#fff",
                    }}
                  >
                    {generatedOnce["one_pager"] ? "Régénérer (1 \uD83E\uDE99)" : "Générer"}
                  </button>
                )}
              </div>
              {onePagerText ? (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#8892b0",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      maxHeight: 300,
                      overflow: "auto",
                    }}
                  >
                    {onePagerText}
                  </div>
                  {!isVitrine && (
                    <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                      <button
                        onClick={function () {
                          handleGenerate("one_pager", function () {
                            var cauchs = getActiveCauchemars();
                            var targetOff =
                              offersArray && offersArray.length > 0
                                ? offersArray[selectedOfferIdx] || offersArray[0]
                                : null;
                            var offerSigs = targetOff ? targetOff.parsedSignals : null;
                            var name =
                              user && user.user_metadata && user.user_metadata.full_name
                                ? user.user_metadata.full_name
                                : null;
                            var email = user && user.email ? user.email : null;
                            var raw = generateOnePager(
                              bricks,
                              targetRoleId,
                              cauchs,
                              signature,
                              offerSigs,
                              name,
                              email
                            );
                            var text = signature ? applySignatureFilter(raw, signature) : raw;
                            setOnePagerText(text);
                            setOnePagerAudit(
                              auditDeliverable("one_pager", text, bricks, cauchs, "external")
                            );
                          });
                        }}
                        style={{
                          padding: "3px 10px",
                          fontSize: 10,
                          background: "transparent",
                          color: "#8892b0",
                          border: "1px solid #495670",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Régénérer
                      </button>
                    </div>
                  )}
                  {renderObsoleteIndicator("one_pager")}
                  <AuditBlock
                    auditResult={onePagerAudit}
                    text={onePagerText}
                    copyId="one_pager"
                    copiedId={copiedId}
                    onCopy={handleCopy}
                    type="one_pager"
                    isVitrine={isVitrine}
                    corrections={corrCounters["one_pager"] || 0}
                    onGoForge={onGoForge}
                    onCorrect={function () {
                      handleCorrect("one_pager", function () {
                        var hints = onePagerAudit ? onePagerAudit.correctionHints : [];
                        var cauchs = getActiveCauchemars();
                        var targetOff =
                          offersArray && offersArray.length > 0
                            ? offersArray[selectedOfferIdx] || offersArray[0]
                            : null;
                        var offerSigs = targetOff ? targetOff.parsedSignals : null;
                        var name =
                          user && user.user_metadata && user.user_metadata.full_name
                            ? user.user_metadata.full_name
                            : null;
                        var email = user && user.email ? user.email : null;
                        var raw = generateOnePager(
                          bricks,
                          targetRoleId,
                          cauchs,
                          signature,
                          offerSigs,
                          name,
                          email
                        );
                        var text = signature ? applySignatureFilter(raw, signature) : raw;
                        setOnePagerText(text);
                        setOnePagerAudit(
                          auditDeliverable("one_pager", text, bricks, cauchs, "external")
                        );
                      });
                    }}
                  />
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "#495670", lineHeight: 1.4 }}>
                  {isVitrine
                    ? "Livrable figé en mode vitrine."
                    : "Génère un document de preuve organisé par problème résolu, calibré pour le recruteur."}
                </div>
              )}
            </div>

            {/* SCRIPT DE CONTACT — 4 variantes (chantier 20) */}
            {scripts &&
              (function () {
                var SCRIPT_TABS = [
                  {
                    id: "dm",
                    label: "DM LinkedIn",
                    icon: "\uD83D\uDCE8",
                    micro: "300 caractères max. Ouvre sur la douleur du recruteur.",
                  },
                  {
                    id: "email",
                    label: "Email",
                    icon: "\u2709\uFE0F",
                    micro: "Ouvre sur le coût chiffré. Pas de question directe (réservée au DM).",
                  },
                  {
                    id: "n1",
                    label: "N+1",
                    icon: "\uD83C\uDFAF",
                    micro: "Parle terrain. Le N+1 veut un opérationnel, pas un CV.",
                  },
                  {
                    id: "rh",
                    label: "RH",
                    icon: "\uD83D\uDC64",
                    micro: "Parcours + culture fit. Le RH valide la cohérence, pas la technique.",
                  },
                ];
                var currentTab =
                  SCRIPT_TABS.find(function (t) {
                    return t.id === activeScriptTab;
                  }) || SCRIPT_TABS[0];
                var currentText = scriptEdits[activeScriptTab] || scripts[activeScriptTab] || "";
                var isEdited = !!scriptEdits[activeScriptTab];
                var auditCauchs = getActiveCauchemars();
                var contactScore = scoreContactScript(currentText, bricks, auditCauchs);
                var auditResult = auditDeliverable(
                  activeScriptTab === "n1" ? "dm" : activeScriptTab === "rh" ? "email" : activeScriptTab,
                  currentText,
                  bricks,
                  auditCauchs,
                  "external"
                );

                return (
                  <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                    <div
                      style={{ fontSize: 11, color: qualityColor, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}
                    >
                      {"\uD83D\uDCDD"} SCRIPT DE CONTACT — 4 variantes
                    </div>

                    {/* Tab bar */}
                    <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                      {SCRIPT_TABS.map(function (tab) {
                        var isActive = tab.id === activeScriptTab;
                        var tabText = scriptEdits[tab.id] || scripts[tab.id] || "";
                        var tabScore = scoreContactScript(tabText, bricks, auditCauchs);
                        var scoreColor =
                          tabScore.passedCount >= 5 ? "#4ecca3" : tabScore.passedCount >= 3 ? "#ff9800" : "#e94560";
                        return (
                          <button
                            key={tab.id}
                            onClick={function () {
                              setActiveScriptTab(tab.id);
                            }}
                            style={{
                              padding: "5px 10px",
                              fontSize: 10,
                              fontWeight: 600,
                              borderRadius: 6,
                              cursor: "pointer",
                              background: isActive ? "#0f3460" : "transparent",
                              border: "1px solid " + (isActive ? qualityColor : "#495670"),
                              color: isActive ? "#e6e6e6" : "#8892b0",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {tab.icon} {tab.label}
                            <span style={{ fontSize: 9, color: scoreColor, fontWeight: 700, marginLeft: 2 }}>
                              {tabScore.passedCount}/6
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Micro-instruction */}
                    <div style={{ fontSize: 10, color: "#495670", marginBottom: 8, fontStyle: "italic" }}>
                      {currentTab.micro}
                    </div>

                    {/* Editable textarea */}
                    <textarea
                      value={currentText}
                      onChange={function (e) {
                        setScriptEdits(function (prev) {
                          var next = Object.assign({}, prev);
                          next[activeScriptTab] = e.target.value;
                          return next;
                        });
                      }}
                      style={{
                        width: "100%",
                        minHeight: 120,
                        maxHeight: 250,
                        fontSize: 12,
                        color: "#ccd6f6",
                        lineHeight: 1.6,
                        background: "#0a0a1a",
                        border: "1px solid #495670",
                        borderRadius: 8,
                        padding: 10,
                        fontFamily: "inherit",
                        resize: "vertical",
                      }}
                    />

                    {/* Score grid */}
                    <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                      {contactScore.tests.map(function (test) {
                        return (
                          <div key={test.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                            <span style={{ color: test.passed ? "#4ecca3" : "#e94560", fontWeight: 700 }}>
                              {test.passed ? "\u2713" : "✗"}
                            </span>
                            <span style={{ color: test.passed ? "#4ecca3" : "#8892b0" }}>{test.label}</span>
                            {!test.passed && (
                              <span style={{ color: "#495670", fontSize: 9, marginLeft: 2 }}>{test.fix}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Score + actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color:
                            contactScore.passedCount >= 5
                              ? "#4ecca3"
                              : contactScore.passedCount >= 3
                                ? "#ff9800"
                                : "#e94560",
                        }}
                      >
                        {contactScore.passedCount}/6 tests
                      </span>
                      {isEdited && (
                        <button
                          onClick={function () {
                            setScriptEdits(function (prev) {
                              var next = Object.assign({}, prev);
                              next[activeScriptTab] = currentText;
                              return next;
                            });
                          }}
                          style={{
                            padding: "3px 10px",
                            fontSize: 10,
                            fontWeight: 600,
                            borderRadius: 6,
                            cursor: "pointer",
                            background: "#0f3460",
                            color: "#4ecca3",
                            border: "1px solid #4ecca3",
                          }}
                        >
                          Rescorer
                        </button>
                      )}
                      {isEdited && (
                        <button
                          onClick={function () {
                            setScriptEdits(function (prev) {
                              var next = Object.assign({}, prev);
                              delete next[activeScriptTab];
                              return next;
                            });
                          }}
                          style={{
                            padding: "3px 10px",
                            fontSize: 10,
                            fontWeight: 600,
                            borderRadius: 6,
                            cursor: "pointer",
                            background: "transparent",
                            color: "#8892b0",
                            border: "1px solid #495670",
                          }}
                        >
                          Réinitialiser
                        </button>
                      )}
                      <CopyBtn
                        text={currentText}
                        copiedId={copiedId}
                        copyId={"script-" + activeScriptTab}
                        onCopy={handleCopy}
                      />
                    </div>

                    {/* Dilts progression (dm and email only) */}
                    {rawScripts &&
                      rawScripts.diltsProgression &&
                      rawScripts.diltsProgression[activeScriptTab] &&
                      (function () {
                        var dp = rawScripts.diltsProgression[activeScriptTab];
                        var deltaColor = dp.delta >= 2 ? "#4ecca3" : dp.delta === 1 ? "#ff9800" : "#e94560";
                        return (
                          <div style={{ fontSize: 11, color: deltaColor, fontWeight: 600, marginTop: 6 }}>
                            Dilts : Niveau {dp.opening} → Niveau {dp.closing} (progression {dp.delta >= 0 ? "+" : ""}
                            {dp.delta})
                            {dp.delta <= 0 && (
                              <span style={{ fontWeight: 400, fontSize: 10, marginLeft: 6 }}>
                                Ton script ne monte pas. Monte la fermeture d{"'"}un cran.
                              </span>
                            )}
                          </div>
                        );
                      })()}

                    {renderObsoleteIndicator("dm")}
                    <AuditBlock
                      auditResult={auditResult}
                      text={currentText}
                      copyId={"script-audit-" + activeScriptTab}
                      copiedId={copiedId}
                      onCopy={handleCopy}
                      type={activeScriptTab === "n1" ? "dm" : activeScriptTab === "rh" ? "email" : activeScriptTab}
                      isVitrine={isVitrine}
                      corrections={corrCounters[activeScriptTab] || 0}
                      onGoForge={onGoForge}
                      onCorrect={function () {
                        handleCorrect(activeScriptTab, function () {
                          var hints = auditResult ? auditResult.correctionHints : [];
                          var raw = generateContactScripts(bricks, targetRoleId, targetOffer, hints);
                          if (raw && raw[activeScriptTab]) {
                            var corrected = signature
                              ? applySignatureFilter(raw[activeScriptTab], signature)
                              : raw[activeScriptTab];
                            setScriptEdits(function (prev) {
                              var next = Object.assign({}, prev);
                              next[activeScriptTab] = corrected;
                              return next;
                            });
                          }
                        });
                      }}
                    />
                  </div>
                );
              })()}

            {/* CV */}
            <div
              style={{
                background: "#16213e",
                borderRadius: 10,
                padding: 12,
                marginBottom: 10,
                border: recommendedDeliverable === "cv" ? "2px solid #ff9800" : "none",
              }}
            >
              {recommendedDeliverable === "cv" && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#ff9800",
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Recommandé
                </div>
              )}
              <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
                {"\uD83D\uDCC4"} CV ({validated.length} brique{validated.length > 1 ? "s" : ""})
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#8892b0",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  maxHeight: 100,
                  overflow: "auto",
                }}
              >
                {cvText}
              </div>
              {renderObsoleteIndicator("cv")}
              <AuditBlock
                auditResult={auditCv}
                text={cvText}
                copyId="cv"
                copiedId={copiedId}
                onCopy={handleCopy}
                type="cv"
                isVitrine={isVitrine}
                corrections={corrCounters["cv"] || 0}
                onGoForge={onGoForge}
                onCorrect={function () {
                  handleCorrect("cv", function () {
                    var hints = auditCv ? auditCv.correctionHints : [];
                    var raw = generateCV(bricks, targetRoleId, trajectoryToggle, hints);
                    cvText = signature ? applySignatureFilter(raw, signature) : raw;
                  });
                }}
              />
            </div>

            {/* PRÉPARATION ENTRETIEN — chantier 16 */}
            <div
              style={{
                background: "#16213e",
                borderRadius: 10,
                padding: 12,
                marginBottom: 10,
                border: recommendedDeliverable === "interview_prep" ? "2px solid #ff9800" : "none",
              }}
            >
              {recommendedDeliverable === "interview_prep" && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#ff9800",
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Recommandé
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1 }}>
                    {"\uD83C\uDFA4"} PRÉPARATION ENTRETIEN
                  </div>
                  <div style={{ fontSize: 9, color: "#495670", marginTop: 2 }}>
                    {validated.length} brique{validated.length > 1 ? "s" : ""} × 3 versions
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {!isVitrine && (
                    <button
                      onClick={function () {
                        handleGenerate("interview_prep", function () {
                          var cauchs = getActiveCauchemars();
                          var data = validated.map(function (b) {
                            var cvLine = generateCVLine(b, targetRoleId);
                            var versions = generateInterviewVersions(b, targetRoleId, cauchs);
                            if (signature) {
                              cvLine = applySignatureFilter(cvLine, signature);
                              versions = {
                                rh: applySignatureFilter(versions.rh, signature),
                                n1: applySignatureFilter(versions.n1, signature),
                                direction: applySignatureFilter(versions.direction, signature),
                              };
                            }
                            return {
                              summary: extractBrickSummary(b.text),
                              cvLine: cvLine,
                              versions: versions,
                              brickType: b.brickType,
                            };
                          });
                          setInterviewPrepData(data);
                          // Build full text for audit
                          var fullText = data
                            .map(function (item) {
                              return (
                                "Version CV : " +
                                item.cvLine +
                                "\nVersion RH :\n" +
                                item.versions.rh +
                                "\nVersion N+1 :\n" +
                                item.versions.n1 +
                                "\nVersion Direction :\n" +
                                item.versions.direction
                              );
                            })
                            .join("\n\n");
                          setInterviewPrepAudit(
                            auditDeliverable("interview_prep", fullText, bricks, cauchs, "external")
                          );
                        });
                      }}
                      style={{
                        padding: "3px 10px",
                        fontSize: 10,
                        background: "#0f3460",
                        color: "#ccd6f6",
                        border: "1px solid #16213e",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {generatedOnce["interview_prep"] ? "Régénérer (1 \uD83E\uDE99)" : "Générer"}
                    </button>
                  )}
                </div>
              </div>
              {interviewPrepData ? (
                <div>
                  {interviewPrepData.map(function (item, idx) {
                    var activeTab = interviewTabs[idx] || "rh";
                    return (
                      <div
                        key={idx}
                        style={{
                          borderTop: idx > 0 ? "1px solid #1a1a3e" : "none",
                          paddingTop: idx > 0 ? 10 : 0,
                          marginTop: idx > 0 ? 10 : 0,
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>
                          Brique {idx + 1} : {item.summary}
                        </div>
                        <div style={{ background: "#0d0d1a", borderRadius: 6, padding: 8, marginBottom: 8 }}>
                          <div
                            style={{
                              fontSize: 9,
                              color: "#495670",
                              fontWeight: 600,
                              letterSpacing: 1,
                              marginBottom: 3,
                            }}
                          >
                            VERSION CV (6 sec)
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#8892b0",
                              fontFamily: "JetBrains Mono, monospace",
                              lineHeight: 1.5,
                            }}
                          >
                            {item.cvLine}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                          {["rh", "n1", "direction"].map(function (tab) {
                            var labels = { rh: "RH", n1: "N+1", direction: "Direction" };
                            var isActiveTab = activeTab === tab;
                            return (
                              <button
                                key={tab}
                                onClick={function () {
                                  setInterviewTabs(function (prev) {
                                    var next = Object.assign({}, prev);
                                    next[idx] = tab;
                                    return next;
                                  });
                                }}
                                style={{
                                  padding: "3px 10px",
                                  fontSize: 10,
                                  fontWeight: 600,
                                  background: isActiveTab ? "#e94560" : "transparent",
                                  color: isActiveTab ? "#fff" : "#8892b0",
                                  border: "1px solid " + (isActiveTab ? "#e94560" : "#1a1a3e"),
                                  borderRadius: 6,
                                  cursor: "pointer",
                                }}
                              >
                                {labels[tab]}
                              </button>
                            );
                          })}
                        </div>
                        <div style={{ background: "#111125", borderRadius: 6, padding: 10 }}>
                          <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                            {item.versions[activeTab]}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {renderObsoleteIndicator("interview_prep")}
                  <AuditBlock
                    auditResult={interviewPrepAudit}
                    text={(function () {
                      var roleData = targetRoleId && KPI_REFERENCE[targetRoleId] ? KPI_REFERENCE[targetRoleId] : null;
                      var roleName = roleData ? roleData.role : "ce poste";
                      var copyText = "# Préparation entretien — " + roleName + "\n\n";
                      interviewPrepData.forEach(function (item, i) {
                        copyText += "## Brique " + (i + 1) + " : " + item.summary + "\n";
                        copyText += "Version CV : " + item.cvLine + "\n\n";
                        copyText += "Version RH :\n" + item.versions.rh + "\n\n";
                        copyText += "Version N+1 :\n" + item.versions.n1 + "\n\n";
                        copyText += "Version Direction :\n" + item.versions.direction + "\n\n";
                      });
                      return copyText.trim();
                    })()}
                    copyId="interview_prep"
                    copiedId={copiedId}
                    onCopy={handleCopy}
                    type="interview_prep"
                    isVitrine={isVitrine}
                    corrections={corrCounters["interview_prep"] || 0}
                    onGoForge={onGoForge}
                    onCorrect={function () {
                      handleCorrect("interview_prep", function () {
                        var cauchs = getActiveCauchemars();
                        var hints = interviewPrepAudit ? interviewPrepAudit.correctionHints : [];
                        var data = validated.map(function (b) {
                          var cvLine = generateCVLine(b, targetRoleId, hints);
                          var versions = generateInterviewVersions(b, targetRoleId, cauchs, hints);
                          if (signature) {
                            cvLine = applySignatureFilter(cvLine, signature);
                            versions = {
                              rh: applySignatureFilter(versions.rh, signature),
                              n1: applySignatureFilter(versions.n1, signature),
                              direction: applySignatureFilter(versions.direction, signature),
                            };
                          }
                          return {
                            summary: extractBrickSummary(b.text),
                            cvLine: cvLine,
                            versions: versions,
                            brickType: b.brickType,
                          };
                        });
                        setInterviewPrepData(data);
                        var fullText = data
                          .map(function (item) {
                            return (
                              "Version CV : " +
                              item.cvLine +
                              "\nVersion RH :\n" +
                              item.versions.rh +
                              "\nVersion N+1 :\n" +
                              item.versions.n1 +
                              "\nVersion Direction :\n" +
                              item.versions.direction
                            );
                          })
                          .join("\n\n");
                        setInterviewPrepAudit(auditDeliverable("interview_prep", fullText, bricks, cauchs, "external"));
                      });
                    }}
                  />
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "#495670", lineHeight: 1.5 }}>
                  {isVitrine
                    ? "Livrable figé en mode vitrine."
                    : "Génère la version CV + 3 versions entretien (RH, N+1, Direction) pour chaque brique."}
                </div>
              )}
            </div>

            {/* BIO LINKEDIN */}
            {bioText ? (
              <div
                style={{
                  background: "#16213e",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                  border: recommendedDeliverable === "bio" ? "2px solid #ff9800" : "none",
                }}
              >
                {recommendedDeliverable === "bio" && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "#ff9800",
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Recommandé
                  </div>
                )}
                <div style={{ fontSize: 11, color: "#8892b0", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
                  {"\uD83D\uDC64"} BIO LINKEDIN
                </div>
                <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{bioText}</div>
                {renderObsoleteIndicator("bio")}
                <AuditBlock
                  auditResult={auditBio}
                  text={bioText}
                  copyId="bio"
                  copiedId={copiedId}
                  onCopy={handleCopy}
                  type="bio"
                  isVitrine={isVitrine}
                  corrections={corrCounters["bio"] || 0}
                  onGoForge={onGoForge}
                  onCorrect={function () {
                    handleCorrect("bio", function () {
                      var hints = auditBio ? auditBio.correctionHints : [];
                      var raw = generateBio(bricks, vault, trajectoryToggle, hints);
                      bioText = signature ? applySignatureFilter(raw, signature) : raw;
                    });
                  }}
                />
              </div>
            ) : (
              <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10, opacity: 0.4 }}>
                <div style={{ fontSize: 11, color: "#495670", fontWeight: 700 }}>
                  {"\uD83D\uDD12"} BIO LINKEDIN — 2 briques minimum
                </div>
              </div>
            )}

            {/* PLAN 30 JOURS RH */}
            <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
                {"\uD83D\uDCC5"} PLAN 30 JOURS RH
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#8892b0",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                {plan30jText}
              </div>
              {renderObsoleteIndicator("plan30j")}
              <AuditBlock
                auditResult={auditPlan30j}
                text={plan30jText}
                copyId="plan30j"
                copiedId={copiedId}
                onCopy={handleCopy}
                type="plan30j"
                isVitrine={isVitrine}
                corrections={corrCounters["plan30j"] || 0}
                onGoForge={onGoForge}
                onCorrect={function () {
                  handleCorrect("plan30j", function () {
                    var hints = auditPlan30j ? auditPlan30j.correctionHints : [];
                    var raw = generatePlan30jRH(
                      bricks,
                      targetRoleId,
                      targetOffer ? targetOffer.parsedSignals : null,
                      hints
                    );
                    plan30jText = signature ? applySignatureFilter(raw, signature) : raw;
                  });
                }}
              />
            </div>

            {/* POSTS LINKEDIN (PILIERS) — chantier 21 */}
            {linkedInPosts && linkedInPosts.length > 0 ? (
              <div style={{ background: "#16213e", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, color: "#3498db", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
                  {"\uD83D\uDCDD"} POSTS (PILIERS)
                </div>
                {linkedInPosts.map(function (p, idx) {
                  var postText = signature ? applySignatureFilter(p.text, signature) : p.text;
                  var editedText = postEdits[idx] !== undefined ? postEdits[idx] : postText;
                  var postCopyId = "post_" + idx;
                  var postAudit = auditDeliverable("posts", editedText, bricks, auditCauchemars, "external");

                  // Chantier 21 — scoring on edited (or original) text
                  var hookLine =
                    editedText.split("\n").filter(function (l) {
                      return l.trim().length > 5;
                    })[0] || "";
                  var hookResult = scoreHookPost(hookLine, editedText);
                  var hookColor = hookResult.score >= 8 ? "#4ecca3" : hookResult.score >= 5 ? "#ff9800" : "#e94560";
                  var marieHook = marieHookFullPost(editedText, hookLine);
                  var bodyResult = analyzeBodyPost(editedText);
                  var meroe = meroeAudit(editedText, hookLine);
                  var failedNames = hookResult.tests
                    .filter(function (t) {
                      return !t.passed;
                    })
                    .map(function (t) {
                      return t.name;
                    });
                  var variants = hookResult.score < 7 ? generateHookVariants(hookLine, failedNames, p) : [];

                  return (
                    <div
                      key={idx}
                      style={{
                        background: "#0d1b2a",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: idx < linkedInPosts.length - 1 ? 10 : 0,
                      }}
                    >
                      <div style={{ fontSize: 10, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>
                        Pilier {idx + 1} — {p.pillar}
                      </div>
                      {p.diltsLevel && (
                        <div style={{ fontSize: 10, color: "#8892b0", fontWeight: 600, marginBottom: 8 }}>
                          Dilts : Niveau {p.diltsLevel} — {p.diltsName || getDiltsLabel(p.diltsLevel).name}
                          {p.diltsTarget && p.diltsLevel < p.diltsTarget && (
                            <span style={{ fontSize: 10, color: "#ff9800", marginLeft: 8 }}>
                              (cible : niveau {p.diltsTarget})
                            </span>
                          )}
                        </div>
                      )}

                      {/* 1. Textarea éditable */}
                      <textarea
                        value={editedText}
                        onChange={function (e) {
                          setPostEdits(function (prev) {
                            var next = Object.assign({}, prev);
                            next[idx] = e.target.value;
                            return next;
                          });
                        }}
                        style={{
                          width: "100%",
                          minHeight: 140,
                          maxHeight: 300,
                          fontSize: 12,
                          color: "#ccd6f6",
                          lineHeight: 1.6,
                          background: "#0a0a1a",
                          border: "1px solid #495670",
                          borderRadius: 8,
                          padding: 10,
                          fontFamily: "inherit",
                          resize: "vertical",
                          marginBottom: 10,
                        }}
                      />

                      {/* 2. Accroche (4 tests) — Marie Hook */}
                      <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: 8, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#8892b0", fontWeight: 600, marginBottom: 6 }}>
                          ── Accroche (4 tests) ──
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: hookColor }}>
                            Score accroche : {hookResult.score}/10
                          </span>
                          <span style={{ fontSize: 14 }}>
                            {hookResult.score >= 8
                              ? "\uD83D\uDFE2"
                              : hookResult.score >= 5
                                ? "\uD83D\uDFE0"
                                : "\uD83D\uDD34"}
                          </span>
                        </div>
                        {hookResult.tests.map(function (t) {
                          return (
                            <div
                              key={t.name}
                              style={{ fontSize: 10, marginBottom: 3, display: "flex", gap: 4, lineHeight: 1.4 }}
                            >
                              <span style={{ color: t.passed ? "#4ecca3" : "#e94560", fontWeight: 700, flexShrink: 0 }}>
                                {t.passed ? "\u2713" : "✗"}
                              </span>
                              <span style={{ color: t.passed ? "#4ecca3" : "#8892b0" }}>
                                {t.label} — {t.message}
                              </span>
                            </div>
                          );
                        })}
                        {variants.length > 0 && (
                          <div style={{ background: "#1a1a2e", borderRadius: 6, padding: 8, marginTop: 6 }}>
                            {variants.map(function (v, vi) {
                              return (
                                <div
                                  key={vi}
                                  style={{
                                    fontSize: 10,
                                    color: "#ccd6f6",
                                    lineHeight: 1.5,
                                    marginBottom: vi < variants.length - 1 ? 4 : 0,
                                  }}
                                >
                                  Variante {vi + 1} : "{v}"
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* 3. Post entier — Marie Hook (2 auto + 2 quali) */}
                      <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: 8, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#8892b0", fontWeight: 600, marginBottom: 6 }}>
                          ── Post entier ──
                        </div>
                        {marieHook.autoTests.map(function (t) {
                          return (
                            <div
                              key={t.name}
                              style={{ fontSize: 10, marginBottom: 3, display: "flex", gap: 4, lineHeight: 1.4 }}
                            >
                              <span style={{ color: t.passed ? "#4ecca3" : "#e94560", fontWeight: 700, flexShrink: 0 }}>
                                {t.passed ? "\u2713" : "✗"}
                              </span>
                              <span style={{ color: t.passed ? "#4ecca3" : "#8892b0" }}>
                                {t.label} — {t.message}
                              </span>
                            </div>
                          );
                        })}
                        {marieHook.qualitative.map(function (q) {
                          return (
                            <div
                              key={q.id}
                              style={{ fontSize: 10, color: "#8892b0", marginTop: 4, lineHeight: 1.4, paddingLeft: 4 }}
                            >
                              <span style={{ color: "#495670", marginRight: 4 }}>{"\u25A1"}</span> {q.question}
                            </div>
                          );
                        })}
                      </div>

                      {/* 4. Corps — rétention */}
                      <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: 8, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#8892b0", fontWeight: 600, marginBottom: 6 }}>
                          ── Corps ──
                        </div>
                        {bodyResult.clean ? (
                          <div style={{ fontSize: 10, color: "#4ecca3" }}>{"\u2713"} Rétention OK</div>
                        ) : (
                          bodyResult.issues.map(function (issue, ii) {
                            return (
                              <div
                                key={ii}
                                style={{
                                  fontSize: 10,
                                  color: "#ff9800",
                                  marginBottom: 3,
                                  display: "flex",
                                  gap: 4,
                                  lineHeight: 1.4,
                                }}
                              >
                                <span style={{ flexShrink: 0 }}>{"\u26A0\uFE0F"}</span> {issue.message}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* 5. Structure et angle — Méroé Miroir */}
                      <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: 8, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#8892b0", fontWeight: 600, marginBottom: 6 }}>
                          ── Structure et angle ──
                        </div>
                        {meroe.miroir.autoTests.map(function (t) {
                          return (
                            <div
                              key={t.name}
                              style={{ fontSize: 10, marginBottom: 3, display: "flex", gap: 4, lineHeight: 1.4 }}
                            >
                              <span style={{ color: t.passed ? "#4ecca3" : "#e94560", fontWeight: 700, flexShrink: 0 }}>
                                {t.passed ? "\u2713" : "✗"}
                              </span>
                              <span style={{ color: t.passed ? "#4ecca3" : "#8892b0" }}>
                                {t.label} — {t.message}
                              </span>
                            </div>
                          );
                        })}
                        {meroe.miroir.qualitative.map(function (q) {
                          return (
                            <div
                              key={q.id}
                              style={{ fontSize: 10, color: "#8892b0", marginTop: 4, lineHeight: 1.4, paddingLeft: 4 }}
                            >
                              <span style={{ color: "#495670", marginRight: 4 }}>{"\u25A1"}</span> {q.question}
                            </div>
                          );
                        })}
                      </div>

                      {/* 6. Confrontation — Méroé Luis Enrique */}
                      <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: 8, marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "#8892b0", fontWeight: 600, marginBottom: 4 }}>
                          ── Confrontation ──
                        </div>
                        <div style={{ fontSize: 10, color: "#495670", marginBottom: 6, fontStyle: "italic" }}>
                          Réponds mentalement. Si une question te fait douter, le post a un problème.
                        </div>
                        {meroe.luisEnrique.map(function (q) {
                          return (
                            <div
                              key={q.id}
                              style={{
                                fontSize: 10,
                                color: "#e94560",
                                marginBottom: 4,
                                lineHeight: 1.4,
                                paddingLeft: 4,
                              }}
                            >
                              <span style={{ color: "#495670", marginRight: 4 }}>{"\u25A1"}</span> {q.question}
                            </div>
                          );
                        })}
                      </div>

                      {/* 7. Premier commentaire + micro-instruction */}
                      {p.firstComment && (
                        <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: 8, marginBottom: 8 }}>
                          <div style={{ fontSize: 10, color: "#8892b0", fontWeight: 600, marginBottom: 6 }}>
                            ── Premier commentaire ──
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#ccd6f6",
                              lineHeight: 1.5,
                              background: "#1a1a2e",
                              borderRadius: 6,
                              padding: 8,
                            }}
                          >
                            {p.firstComment}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#8892b0",
                              background: "#0f3460",
                              borderRadius: 6,
                              padding: 8,
                              marginTop: 6,
                              lineHeight: 1.4,
                            }}
                          >
                            {"\uD83D\uDCA1"} Publie entre 7h30 et 8h30 en semaine. Réponds à tous les commentaires dans
                            les 2 premières heures.
                          </div>
                        </div>
                      )}

                      {/* 8. Boutons Copier + Rescorer */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        <CopyBtn text={editedText} label="Copier le post" />
                        {p.firstComment && <CopyBtn text={p.firstComment} label="Copier le commentaire" />}
                        {postEdits[idx] !== undefined && (
                          <button
                            onClick={function () {
                              setPostEdits(function (prev) {
                                var next = Object.assign({}, prev);
                                next[idx] = editedText;
                                return next;
                              });
                            }}
                            style={{
                              padding: "3px 8px",
                              fontSize: 10,
                              color: "#8892b0",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                          >
                            Rescorer
                          </button>
                        )}
                        {postEdits[idx] !== undefined && (
                          <button
                            onClick={function () {
                              setPostEdits(function (prev) {
                                var next = Object.assign({}, prev);
                                delete next[idx];
                                return next;
                              });
                            }}
                            style={{
                              padding: "3px 8px",
                              fontSize: 10,
                              color: "#495670",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                            }}
                          >
                            Réinitialiser
                          </button>
                        )}
                      </div>

                      {/* 9. Obsolete + Audit ch17 */}
                      {renderObsoleteIndicator("posts")}
                      <AuditBlock
                        auditResult={postAudit}
                        text={editedText}
                        copyId={postCopyId + "_audit"}
                        copiedId={copiedId}
                        onCopy={handleCopy}
                        type="posts"
                        isVitrine={isVitrine}
                        corrections={corrCounters[postCopyId] || 0}
                        onGoForge={onGoForge}
                      />
                    </div>
                  );
                })}
                {(function () {
                  var stagnation = detectDiltsStagnation(linkedInPosts);
                  if (!stagnation || !stagnation.stagnating) return null;
                  return (
                    <div
                      style={{
                        background: "#1a1a2e",
                        borderRadius: 8,
                        padding: 10,
                        marginTop: 10,
                        borderLeft: "3px solid #ff9800",
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#ff9800", lineHeight: 1.5 }}>
                        {"\u26A0\uFE0F"} {stagnation.message}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div style={{ background: "#16213e", borderRadius: 10, padding: 12, opacity: 0.4 }}>
                <div style={{ fontSize: 11, color: "#495670", fontWeight: 700 }}>
                  {"\uD83D\uDD12"} POSTS (PILIERS) — 2 briques + piliers requis
                </div>
              </div>
            )}

            {/* QUESTIONS ENTRETIEN */}
            <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1 }}>
                  {"\uD83C\uDFAF"} QUESTIONS ENTRETIEN
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {!isVitrine && (
                    <button
                      onClick={function () {
                        handleGenerate("questions", function () {
                          var targetOff =
                            offersArray && offersArray.length > 0
                              ? offersArray[selectedOfferIdx] || offersArray[0]
                              : null;
                          var signals = targetOff ? targetOff.parsedSignals : null;
                          var raw = generateInterviewQuestions(
                            bricks.filter(function (b) {
                              return b.status === "validated";
                            }),
                            targetRoleId,
                            getActiveCauchemars(),
                            signals,
                            signature
                          );
                          var text = signature ? applySignatureFilter(raw, signature) : raw;
                          setQuestionsText(text);
                          setQuestionsAudit(auditDeliverable("questions", text, bricks, auditCauchemars, "external"));
                        });
                      }}
                      style={{
                        padding: "3px 10px",
                        fontSize: 10,
                        background: "#0f3460",
                        color: "#ccd6f6",
                        border: "1px solid #16213e",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {generatedOnce["questions"] ? "Régénérer (1 \uD83E\uDE99)" : "Générer"}
                    </button>
                  )}
                </div>
              </div>
              {questionsText ? (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#8892b0",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      maxHeight: 300,
                      overflow: "auto",
                    }}
                  >
                    {questionsText}
                  </div>
                  {renderObsoleteIndicator("questions")}
                  <AuditBlock
                    auditResult={questionsAudit}
                    text={questionsText}
                    copyId="questions"
                    copiedId={copiedId}
                    onCopy={handleCopy}
                    type="questions"
                    isVitrine={isVitrine}
                    corrections={corrCounters["questions"] || 0}
                    onGoForge={onGoForge}
                    onCorrect={function () {
                      handleCorrect("questions", function () {
                        var hints = questionsAudit ? questionsAudit.correctionHints : [];
                        var targetOff =
                          offersArray && offersArray.length > 0
                            ? offersArray[selectedOfferIdx] || offersArray[0]
                            : null;
                        var signals = targetOff ? targetOff.parsedSignals : null;
                        var raw = generateInterviewQuestions(
                          bricks.filter(function (b) {
                            return b.status === "validated";
                          }),
                          targetRoleId,
                          getActiveCauchemars(),
                          signals,
                          signature,
                          hints
                        );
                        var text = signature ? applySignatureFilter(raw, signature) : raw;
                        setQuestionsText(text);
                        setQuestionsAudit(auditDeliverable("questions", text, bricks, auditCauchemars, "external"));
                      });
                    }}
                  />
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "#495670", lineHeight: 1.5 }}>
                  {isVitrine
                    ? "Livrable figé en mode vitrine."
                    : "Croise tes briques × cauchemars × signaux d'offre pour générer des questions de niveau 3 à 6."}
                </div>
              )}
            </div>

            {/* APPEL DÉCOUVERTE */}
            <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1 }}>
                  {"\uD83D\uDCDE"} APPEL DÉCOUVERTE
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {!isVitrine && (
                    <button
                      onClick={function () {
                        handleGenerate("discovery_call", function () {
                          var targetOff =
                            offersArray && offersArray.length > 0
                              ? offersArray[selectedOfferIdx] || offersArray[0]
                              : null;
                          var signals = targetOff ? targetOff.parsedSignals : null;
                          var raw = generateDiscoveryCall(
                            bricks.filter(function (b) {
                              return b.status === "validated";
                            }),
                            targetRoleId,
                            getActiveCauchemars(),
                            signals,
                            seniorityLevel,
                            signature
                          );
                          var text = signature ? applySignatureFilter(raw, signature) : raw;
                          setDiscoveryCallText(text);
                          setDiscoveryCallAudit(auditDeliverable("discovery_call", text, bricks, auditCauchemars, "external"));
                        });
                      }}
                      style={{
                        padding: "3px 10px",
                        fontSize: 10,
                        background: "#0f3460",
                        color: "#ccd6f6",
                        border: "1px solid #16213e",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {generatedOnce["discovery_call"] ? "Régénérer (1 \uD83E\uDE99)" : "Générer"}
                    </button>
                  )}
                </div>
              </div>
              {discoveryCallText ? (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#8892b0",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      maxHeight: 300,
                      overflow: "auto",
                    }}
                  >
                    {discoveryCallText}
                  </div>
                  {renderObsoleteIndicator("discovery_call")}
                  <AuditBlock
                    auditResult={discoveryCallAudit}
                    text={discoveryCallText}
                    copyId="discovery_call"
                    copiedId={copiedId}
                    onCopy={handleCopy}
                    type="discovery_call"
                    isVitrine={isVitrine}
                    corrections={corrCounters["discovery_call"] || 0}
                    onGoForge={onGoForge}
                    onCorrect={function () {
                      handleCorrect("discovery_call", function () {
                        var hints = discoveryCallAudit ? discoveryCallAudit.correctionHints : [];
                        var targetOff =
                          offersArray && offersArray.length > 0
                            ? offersArray[selectedOfferIdx] || offersArray[0]
                            : null;
                        var signals = targetOff ? targetOff.parsedSignals : null;
                        var raw = generateDiscoveryCall(
                          bricks.filter(function (b) {
                            return b.status === "validated";
                          }),
                          targetRoleId,
                          getActiveCauchemars(),
                          signals,
                          seniorityLevel,
                          signature,
                          hints
                        );
                        var text = signature ? applySignatureFilter(raw, signature) : raw;
                        setDiscoveryCallText(text);
                        setDiscoveryCallAudit(auditDeliverable("discovery_call", text, bricks, auditCauchemars, "external"));
                      });
                    }}
                  />
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "#495670", lineHeight: 1.5 }}>
                  {isVitrine
                    ? "Livrable figé en mode vitrine."
                    : "5 questions calibrées pour ton premier appel. Chaque question démontre ta compétence sans rien affirmer."}
                </div>
              )}
            </div>

            {/* FICHE DE COMBAT */}
            <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1 }}>
                  {"\uD83D\uDEE1\uFE0F"} FICHE DE COMBAT
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {!isVitrine && (
                    <button
                      onClick={function () {
                        handleGenerate("fiche_combat", function () {
                          var targetOff =
                            offersArray && offersArray.length > 0
                              ? offersArray[selectedOfferIdx] || offersArray[0]
                              : null;
                          var signals = targetOff ? targetOff.parsedSignals : null;
                          var salNum = currentSalary ? parseInt(currentSalary) : null;
                          if (salNum && isNaN(salNum)) salNum = null;
                          var raw = generateFicheCombat(
                            bricks.filter(function (b) {
                              return b.status === "validated";
                            }),
                            targetRoleId,
                            getActiveCauchemars(),
                            signature,
                            seniorityLevel,
                            salNum,
                            duelResults,
                            signals
                          );
                          var text = signature ? applySignatureFilter(raw, signature) : raw;
                          setFicheCombatText(text);
                          setFicheCombatAudit(auditDeliverable("fiche_combat", text, bricks, auditCauchemars, "external"));
                        });
                      }}
                      style={{
                        padding: "3px 10px",
                        fontSize: 10,
                        background: "#0f3460",
                        color: "#ccd6f6",
                        border: "1px solid #16213e",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {generatedOnce["fiche_combat"] ? "Régénérer (1 \uD83E\uDE99)" : "Générer"}
                    </button>
                  )}
                </div>
              </div>
              {ficheCombatText ? (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#8892b0",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      maxHeight: 300,
                      overflow: "auto",
                    }}
                  >
                    {ficheCombatText}
                  </div>
                  {renderObsoleteIndicator("fiche_combat")}
                  <AuditBlock
                    auditResult={ficheCombatAudit}
                    text={ficheCombatText}
                    copyId="fiche_combat"
                    copiedId={copiedId}
                    onCopy={handleCopy}
                    type="fiche_combat"
                    isVitrine={isVitrine}
                    corrections={corrCounters["fiche_combat"] || 0}
                    onGoForge={onGoForge}
                    onCorrect={function () {
                      handleCorrect("fiche_combat", function () {
                        var hints = ficheCombatAudit ? ficheCombatAudit.correctionHints : [];
                        var targetOff =
                          offersArray && offersArray.length > 0
                            ? offersArray[selectedOfferIdx] || offersArray[0]
                            : null;
                        var signals = targetOff ? targetOff.parsedSignals : null;
                        var salNum = currentSalary ? parseInt(currentSalary) : null;
                        if (salNum && isNaN(salNum)) salNum = null;
                        var raw = generateFicheCombat(
                          bricks.filter(function (b) {
                            return b.status === "validated";
                          }),
                          targetRoleId,
                          getActiveCauchemars(),
                          signature,
                          seniorityLevel,
                          salNum,
                          duelResults,
                          signals,
                          hints
                        );
                        var text = signature ? applySignatureFilter(raw, signature) : raw;
                        setFicheCombatText(text);
                        setFicheCombatAudit(auditDeliverable("fiche_combat", text, bricks, auditCauchemars, "external"));
                      });
                    }}
                  />
                </div>
              ) : (
                <div style={{ fontSize: 11, color: "#495670", lineHeight: 1.5 }}>
                  {isVitrine
                    ? "Livrable figé en mode vitrine."
                    : "1 page à imprimer avant l'entretien. 6 blocs, 8 sources, lu en 2 minutes."}
                </div>
              )}
            </div>

            {/* SIGNATURE EMAIL */}
            <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#3498db", fontWeight: 700, letterSpacing: 1 }}>
                  {"\u2709\uFE0F"} SIGNATURE EMAIL
                </div>
              </div>

              {emailSigText ? (
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#ccd6f6",
                      fontWeight: 600,
                      lineHeight: 1.6,
                      padding: "8px 10px",
                      background: "#0d0d1a",
                      borderRadius: 8,
                    }}
                  >
                    {emailSigText}
                  </div>
                  <div style={{ fontSize: 10, color: "#495670", marginTop: 6, lineHeight: 1.4 }}>
                    {"\uD83D\uDCA1"} Colle cette ligne sous ton nom dans ta signature Gmail/Outlook. Chaque email envoyé
                    devient une preuve.
                  </div>
                  <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                    <CopyBtn text={emailSigText} id="email_signature" copiedId={copiedId} onCopy={handleCopy} />
                    {!isVitrine && (
                      <button
                        onClick={function () {
                          handleGenerate("email_signature", function () {
                            var raw = generateEmailSignature(bricks, targetRoleId);
                            setEmailSigText(raw);
                            setEmailSigAudit(
                              auditDeliverable("email_signature", raw, bricks, auditCauchemars, "external")
                            );
                          });
                        }}
                        style={{
                          padding: "3px 10px",
                          fontSize: 10,
                          background: "transparent",
                          color: "#8892b0",
                          border: "1px solid #495670",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Régénérer
                      </button>
                    )}
                  </div>
                  {renderObsoleteIndicator("email_signature")}
                  <AuditBlock
                    auditResult={emailSigAudit}
                    text={emailSigText}
                    copyId="email_signature_audit"
                    copiedId={copiedId}
                    onCopy={handleCopy}
                    type="email_signature"
                    isVitrine={isVitrine}
                    corrections={corrCounters["email_signature"] || 0}
                    onGoForge={onGoForge}
                    onCorrect={function () {
                      handleCorrect("email_signature", function () {
                        var raw = generateEmailSignature(bricks, targetRoleId);
                        setEmailSigText(raw);
                        setEmailSigAudit(auditDeliverable("email_signature", raw, bricks, auditCauchemars, "external"));
                      });
                    }}
                  />
                </div>
              ) : (
                <div>
                  {!isVitrine && (
                    <button
                      onClick={function () {
                        handleGenerate("email_signature", function () {
                          var raw = generateEmailSignature(bricks, targetRoleId);
                          setEmailSigText(raw);
                          setEmailSigAudit(
                            auditDeliverable("email_signature", raw, bricks, auditCauchemars, "external")
                          );
                        });
                      }}
                      style={{
                        padding: "6px 16px",
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 8,
                        cursor: "pointer",
                        border: "none",
                        background: "linear-gradient(135deg, #e94560, #c81d4e)",
                        color: "#fff",
                      }}
                    >
                      Générer ma signature
                    </button>
                  )}
                  <div style={{ fontSize: 11, color: "#495670", marginTop: 6, lineHeight: 1.4 }}>
                    {isVitrine
                      ? "Livrable figé en mode vitrine."
                      : "Génère une ligne de signature ≤ 80 car. à partir de ta meilleure brique blindée."}
                  </div>
                </div>
              )}
            </div>

            {/* MESSAGE POST-ENTRETIEN */}
            <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#3498db", fontWeight: 700, letterSpacing: 1 }}>
                  {"\uD83D\uDCE8"} MESSAGE POST-ENTRETIEN
                </div>
              </div>

              {/* Formulaire d'input */}
              {!followUpText && (
                <div style={{ background: "#0d0d1a", borderRadius: 8, padding: 10 }}>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 600, marginBottom: 4 }}>
                      Ce que le recruteur a partagé :
                    </div>
                    <textarea
                      value={followUpInput.shared}
                      onChange={function (e) {
                        setFollowUpInput(function (prev) {
                          return Object.assign({}, prev, { shared: e.target.value });
                        });
                      }}
                      placeholder="La tension entre croissance et rétention, le besoin de structurer..."
                      style={{
                        width: "100%",
                        minHeight: 50,
                        background: "#1a1a2e",
                        border: "1px solid #495670",
                        borderRadius: 6,
                        color: "#ccd6f6",
                        fontSize: 12,
                        padding: 8,
                        resize: "vertical",
                        fontFamily: "Inter, sans-serif",
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 600, marginBottom: 4 }}>
                      L'ambition de l'équipe :
                    </div>
                    <textarea
                      value={followUpInput.ambition}
                      onChange={function (e) {
                        setFollowUpInput(function (prev) {
                          return Object.assign({}, prev, { ambition: e.target.value });
                        });
                      }}
                      placeholder="Doubler le pipeline mid-market en 12 mois..."
                      style={{
                        width: "100%",
                        minHeight: 36,
                        background: "#1a1a2e",
                        border: "1px solid #495670",
                        borderRadius: 6,
                        color: "#ccd6f6",
                        fontSize: 12,
                        padding: 8,
                        resize: "vertical",
                        fontFamily: "Inter, sans-serif",
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 600, marginBottom: 4 }}>
                      3 défis identifiés pendant l'entretien :
                    </div>
                    {[0, 1, 2].map(function (idx) {
                      return (
                        <input
                          key={idx}
                          type="text"
                          value={followUpInput.challenges[idx] || ""}
                          onChange={function (e) {
                            setFollowUpInput(function (prev) {
                              var newCh = prev.challenges.slice();
                              newCh[idx] = e.target.value;
                              return Object.assign({}, prev, { challenges: newCh });
                            });
                          }}
                          placeholder={idx + 1 + ". " + (idx < 2 ? "Défi identifié (min 10 car.)" : "Défi (optionnel)")}
                          style={{
                            width: "100%",
                            background: "#1a1a2e",
                            border: "1px solid #495670",
                            borderRadius: 6,
                            color: "#ccd6f6",
                            fontSize: 12,
                            padding: "6px 8px",
                            marginBottom: 4,
                            fontFamily: "Inter, sans-serif",
                          }}
                        />
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 600, marginBottom: 4 }}>
                        Prénom de l'interlocuteur :
                      </div>
                      <input
                        type="text"
                        value={followUpInput.interviewerName}
                        onChange={function (e) {
                          setFollowUpInput(function (prev) {
                            return Object.assign({}, prev, { interviewerName: e.target.value });
                          });
                        }}
                        placeholder="(optionnel)"
                        style={{
                          width: "100%",
                          background: "#1a1a2e",
                          border: "1px solid #495670",
                          borderRadius: 6,
                          color: "#ccd6f6",
                          fontSize: 12,
                          padding: "6px 8px",
                          fontFamily: "Inter, sans-serif",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 600, marginBottom: 4 }}>Quand :</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {["ce matin", "hier", "cette semaine"].map(function (t) {
                          return (
                            <button
                              key={t}
                              onClick={function () {
                                setFollowUpInput(function (prev) {
                                  return Object.assign({}, prev, { timing: prev.timing === t ? "" : t });
                                });
                              }}
                              style={{
                                padding: "4px 8px",
                                fontSize: 10,
                                borderRadius: 6,
                                cursor: "pointer",
                                fontWeight: 600,
                                border: "none",
                                background: followUpInput.timing === t ? "#e94560" : "#1a1a3e",
                                color: followUpInput.timing === t ? "#fff" : "#8892b0",
                              }}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {!isVitrine && (
                      <button
                        onClick={function () {
                          handleGenerate("followup", function () {
                            var raw = generateFollowUp(
                              followUpInput,
                              bricks,
                              targetRoleId,
                              getActiveCauchemars(),
                              vault
                            );
                            var text = signature ? applySignatureFilter(raw, signature) : raw;
                            setFollowUpText(text);
                            setFollowUpAudit(auditDeliverable("followup", text, bricks, auditCauchemars, "external"));
                          });
                        }}
                        disabled={
                          followUpInput.shared.trim().length < 30 ||
                          followUpInput.ambition.trim().length < 10 ||
                          (followUpInput.challenges[0] || "").trim().length < 10 ||
                          (followUpInput.challenges[1] || "").trim().length < 10
                        }
                        style={{
                          padding: "6px 16px",
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 8,
                          cursor: "pointer",
                          border: "none",
                          background:
                            followUpInput.shared.trim().length >= 30 &&
                            followUpInput.ambition.trim().length >= 10 &&
                            (followUpInput.challenges[0] || "").trim().length >= 10 &&
                            (followUpInput.challenges[1] || "").trim().length >= 10
                              ? "linear-gradient(135deg, #e94560, #c81d4e)"
                              : "#1a1a3e",
                          color:
                            followUpInput.shared.trim().length >= 30 &&
                            followUpInput.ambition.trim().length >= 10 &&
                            (followUpInput.challenges[0] || "").trim().length >= 10 &&
                            (followUpInput.challenges[1] || "").trim().length >= 10
                              ? "#fff"
                              : "#495670",
                        }}
                      >
                        Générer le message
                      </button>
                    )}
                    <div style={{ fontSize: 11, color: "#8892b0" }}>Remplis au moins le premier champ et 2 défis.</div>
                  </div>
                </div>
              )}

              {/* Résultat généré */}
              {followUpText && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#8892b0",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      maxHeight: 400,
                      overflow: "auto",
                    }}
                  >
                    {followUpText}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <button
                      onClick={function () {
                        setFollowUpText(null);
                      }}
                      style={{
                        padding: "3px 10px",
                        fontSize: 10,
                        background: "transparent",
                        color: "#8892b0",
                        border: "1px solid #495670",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: 600,
                        marginRight: 6,
                      }}
                    >
                      Modifier l'input
                    </button>
                  </div>
                  {renderObsoleteIndicator("followup")}
                  <AuditBlock
                    auditResult={followUpAudit}
                    text={followUpText}
                    copyId="followup"
                    copiedId={copiedId}
                    onCopy={handleCopy}
                    type="followup"
                    isVitrine={isVitrine}
                    corrections={corrCounters["followup"] || 0}
                    onGoForge={onGoForge}
                    onCorrect={function () {
                      handleCorrect("followup", function () {
                        var hints = followUpAudit ? followUpAudit.correctionHints : [];
                        var raw = generateFollowUp(
                          followUpInput,
                          bricks,
                          targetRoleId,
                          getActiveCauchemars(),
                          vault,
                          hints
                        );
                        var text = signature ? applySignatureFilter(raw, signature) : raw;
                        setFollowUpText(text);
                        setFollowUpAudit(auditDeliverable("followup", text, bricks, auditCauchemars, "external"));
                      });
                    }}
                  />
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
                onChange={function (e) {
                  onSalaryChange(e.target.value ? parseInt(e.target.value) : null);
                }}
                style={{
                  width: "100%",
                  background: "#0a0a1a",
                  border: "1px solid #16213e",
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: "#ccd6f6",
                  fontSize: 12,
                  outline: "none",
                  fontFamily: "inherit",
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
                onChange={function (e) {
                  setInternalDesc(e.target.value);
                }}
                rows={3}
                style={{
                  width: "100%",
                  background: "#0a0a1a",
                  border: "1px solid #16213e",
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: "#ccd6f6",
                  fontSize: 11,
                  outline: "none",
                  fontFamily: "inherit",
                  resize: "vertical",
                  lineHeight: 1.5,
                  boxSizing: "border-box",
                }}
              />
              {internalSignals && internalSignals.detected && (
                <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {internalSignals.signals.map(function (s) {
                    var strengthColor =
                      s.strength === "fort" ? "#e94560" : s.strength === "moyen" ? "#ff9800" : "#495670";
                    return (
                      <span
                        key={s.id}
                        style={{
                          fontSize: 9,
                          color: strengthColor,
                          background: strengthColor + "22",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontWeight: 600,
                        }}
                      >
                        {s.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RAPPORT DE REMPLACEMENT */}
            <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
                {"\uD83D\uDCCA"} RAPPORT DE REMPLACEMENT
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#8892b0",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                {replacementText}
              </div>
              {renderObsoleteIndicator("report")}
              <AuditBlock
                auditResult={auditReplacement}
                text={replacementText}
                copyId="replacement"
                copiedId={copiedId}
                onCopy={handleCopy}
                type="report"
                isVitrine={isVitrine}
                corrections={corrCounters["replacement"] || 0}
                onGoForge={onGoForge}
                onCorrect={function () {
                  handleCorrect("replacement", function () {
                    var hints = auditReplacement ? auditReplacement.correctionHints : [];
                    var raw = generateReplacementReport(bricks, targetRoleId, salaryNum, internalSignals, hints);
                    replacementText = signature ? applySignatureFilter(raw, signature) : raw;
                  });
                }}
              />
            </div>

            {/* ARGUMENTAIRE D'AUGMENTATION */}
            <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
                {"\uD83D\uDCB0"} ARGUMENTAIRE D'AUGMENTATION
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#8892b0",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                {raiseText}
              </div>
              {renderObsoleteIndicator("argument")}
              <AuditBlock
                auditResult={auditRaise}
                text={raiseText}
                copyId="raise"
                copiedId={copiedId}
                onCopy={handleCopy}
                type="argument"
                isVitrine={isVitrine}
                corrections={corrCounters["raise"] || 0}
                onGoForge={onGoForge}
                onCorrect={function () {
                  handleCorrect("raise", function () {
                    var hints = auditRaise ? auditRaise.correctionHints : [];
                    var raw = generateRaiseArgument(bricks, targetRoleId, salaryNum, hints);
                    raiseText = signature ? applySignatureFilter(raw, signature) : raw;
                  });
                }}
              />
            </div>

            {/* COMPARATIF SALARIAL */}
            {salaryCompText ? (
              <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
                  {"\uD83D\uDCCA"} COMPARATIF SALARIAL
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#8892b0",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    maxHeight: 200,
                    overflow: "auto",
                  }}
                >
                  {salaryCompText}
                </div>
                {renderObsoleteIndicator("salary_comparison")}
                <AuditBlock
                  auditResult={auditSalaryComp}
                  text={salaryCompText}
                  copyId="salary_comparison"
                  copiedId={copiedId}
                  onCopy={handleCopy}
                  type="salary_comparison"
                  isVitrine={isVitrine}
                  corrections={corrCounters["salary_comparison"] || 0}
                  onGoForge={onGoForge}
                  onCorrect={function () {
                    handleCorrect("salary_comparison", function () {
                      var hints = auditSalaryComp ? auditSalaryComp.correctionHints : [];
                      var cauchs = getActiveCauchemars();
                      var raw = generateSalaryComparison(
                        salaryNum,
                        targetRoleId,
                        bricks,
                        cauchs,
                        acvTarget,
                        REPLACEMENT_DATA_BY_ROLE[targetRoleId],
                        hints
                      );
                      salaryCompText = signature ? applySignatureFilter(raw, signature) : raw;
                    });
                  }}
                />
              </div>
            ) : (
              <div style={{ background: "#16213e", borderRadius: 10, padding: 12, marginBottom: 10, opacity: 0.4 }}>
                <div style={{ fontSize: 11, color: "#495670", fontWeight: 700 }}>
                  {"\uD83D\uDCCA"} COMPARATIF SALARIAL — Renseigne ton salaire ci-dessus
                </div>
              </div>
            )}

            {/* PLAN 90 JOURS N+1 */}
            <div style={{ background: "#16213e", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#3498db", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
                {"\uD83D\uDCC5"} PLAN 90 JOURS N+1
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#8892b0",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                {plan90jText}
              </div>
              {renderObsoleteIndicator("plan90j")}
              <AuditBlock
                auditResult={auditPlan90j}
                text={plan90jText}
                copyId="plan90j"
                copiedId={copiedId}
                onCopy={handleCopy}
                type="plan90j"
                isVitrine={isVitrine}
                corrections={corrCounters["plan90j"] || 0}
                onGoForge={onGoForge}
                onCorrect={function () {
                  handleCorrect("plan90j", function () {
                    var hints = auditPlan90j ? auditPlan90j.correctionHints : [];
                    var raw = generatePlan90jN1(bricks, targetRoleId, internalSignals, hints);
                    plan90jText = signature ? applySignatureFilter(raw, signature) : raw;
                  });
                }}
              />
            </div>
          </div>
        )}

        {/* ======== ONGLET PRÉPARATION ======== */}
        {activeTab === "preparation" && (
          <div>
            {duelPassed ? (
              <div>
                <div style={{ fontSize: 10, color: "#ff9800", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
                  FICHES DE PRÉPARATION
                </div>
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
            <button
              onClick={function () {
                var userId = user && user.id ? user.id : "";
                var email = user && user.email ? user.email : "";
                fetch("/api/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: userId, email: email, type: "subscription" }),
                })
                  .then(function (r) {
                    return r.json();
                  })
                  .then(function (data) {
                    if (data.url) window.location.href = data.url;
                  });
              }}
              style={{
                width: "100%",
                padding: 14,
                marginBottom: 10,
                background: "linear-gradient(135deg, #e94560, #c81d4e)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Continuer à forger — 10€/mois
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
