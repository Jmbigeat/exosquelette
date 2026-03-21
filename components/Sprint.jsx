"use client";
import { useState, useEffect, useRef } from "react";

// Lib modules
import { createBrowserClient } from "@/lib/supabase";
import { KPI_REFERENCE, STEPS, DUEL_QUESTIONS } from "@/lib/sprint/references";
import {
  computeDensityScore,
  getActiveCauchemars,
  computeCauchemarCoverage,
  assessBrickArmor,
} from "@/lib/sprint/scoring";
import { parseOfferSignals } from "@/lib/sprint/offers";
import { generateAdaptiveSeeds, getAdaptivePillars } from "@/lib/sprint/bricks";
import { generateInterviewQuestions } from "@/lib/sprint/generators";
import { getMaturityLevel } from "@/lib/sprint/analysis";
import { migrateState } from "@/lib/sprint/migrations";
import { hasReachedSignatureThreshold } from "@/lib/sprint/signature";

// Component modules
import { Bar, Nav, Pillars, OffersManager } from "@/components/sprint/ui";
import { CVPreview, InvestmentIndex, WorkBench, CrossRoleInsight, Arsenal } from "@/components/sprint/panels";
import { FeedbackToast, Interrogation, BrickStressTest } from "@/components/sprint/Interrogation";
import { Duel } from "@/components/sprint/Duel";
import { Onboarding } from "@/components/sprint/Onboarding";
import { Toast } from "@/components/sprint/Toast";
import { markInstructionDone } from "@/lib/brew-db";
import Tooltip from "@/components/ui/Tooltip";
import VOCABULARY from "@/lib/vocabulary";

// Custom hooks
import { usePersistence } from "@/components/sprint/hooks/usePersistence";
import { useBrewNotif } from "@/components/sprint/hooks/useBrewNotif";
import { useBricks } from "@/components/sprint/hooks/useBricks";
import { useOffers } from "@/components/sprint/hooks/useOffers";
import { useDuel } from "@/components/sprint/hooks/useDuel";
import { useSignature } from "@/components/sprint/hooks/useSignature";

export default function Sprint({ initialState, onStateChange, onScan, user, saveStatus }) {
  if (initialState) initialState = migrateState(initialState);
  // ── UI state ──
  var scrState = useState(initialState && initialState.screen ? initialState.screen : "onboarding");
  var screen = scrState[0];
  var setScreen = scrState[1];
  var stepState = useState(initialState && initialState.activeStep != null ? initialState.activeStep : 0);
  var activeStep = stepState[0];
  var setActiveStep = stepState[1];
  var doneState = useState(initialState && initialState.sprintDone ? initialState.sprintDone : false);
  var sprintDone = doneState[0];
  var setSprintDone = doneState[1];
  var paranoState = useState(true);
  var paranoMode = paranoState[0];
  var roleState = useState(initialState && initialState.targetRoleId ? initialState.targetRoleId : null);
  var targetRoleId = roleState[0];
  var setTargetRoleId = roleState[1];
  var previousRoleState = useState(initialState && initialState.previousRole ? initialState.previousRole : "");
  var previousRole = previousRoleState[0];
  var costState = useState(initialState && initialState.nightmareCosts ? initialState.nightmareCosts : {});
  var nightmareCosts = costState[0];
  var setNightmareCosts = costState[1];
  var seedsState = useState(function () {
    return initialState && initialState.targetRoleId
      ? generateAdaptiveSeeds(initialState.targetRoleId)
      : generateAdaptiveSeeds(null);
  });
  var seeds = seedsState[0];
  var setSeeds = seedsState[1];
  var etabliState = useState(false);
  var etabliOpen = etabliState[0];
  var setEtabliOpen = etabliState[1];
  // Chantier 14 — Pièces : state, consommation, mode vitrine
  var piecesState = useState(initialState && initialState.pieces != null ? initialState.pieces : 7);
  var pieces = piecesState[0];
  var setPieces = piecesState[1];
  var isSubscribedState = useState(false);
  var isSubscribed = isSubscribedState[0];
  var setIsSubscribed = isSubscribedState[1];
  var piecesToastState = useState(null);
  var piecesToast = piecesToastState[0];
  var setPiecesToast = piecesToastState[1];
  var fvtState = useState(initialState && initialState.firstVisitToastShown ? true : false);
  var firstVisitToastShown = fvtState[0];
  var setFirstVisitToastShown = fvtState[1];
  var autosaveToastState = useState(null);
  var autosaveToast = autosaveToastState[0];
  var setAutosaveToast = autosaveToastState[1];

  // ── useOffers hook — offers lifecycle ──
  var offersHook = useOffers(initialState, targetRoleId);
  var parsedOffers = offersHook.parsedOffers;
  var setParsedOffers = offersHook.setParsedOffers;
  var offersArray = offersHook.offersArray;
  var setOffersArray = offersHook.setOffersArray;
  var offerNextId = offersHook.offerNextId;
  var setOfferNextId = offersHook.setOfferNextId;
  var obsoleteDeliverables = offersHook.obsoleteDeliverables;
  var setObsoleteDeliverables = offersHook.setObsoleteDeliverables;
  var offerCoherence = offersHook.offerCoherence;
  var handleAddOffer = offersHook.handleAddOffer;
  var handleRemoveOffer = offersHook.handleRemoveOffer;

  // ── useBricks hook — brick lifecycle ──
  var brickHook = useBricks(initialState, targetRoleId, offersArray);
  var bricks = brickHook.bricks;
  var setBricks = brickHook.setBricks;
  var vault = brickHook.vault;
  var setVault = brickHook.setVault;
  var takes = brickHook.takes;
  var setTakes = brickHook.setTakes;
  var nextId = brickHook.nextId;
  var setNextId = brickHook.setNextId;
  var toastBrick = brickHook.toastBrick;
  var setToastBrick = brickHook.setToastBrick;
  var navigateToBrick = brickHook.navigateToBrick;
  var setNavigateToBrick = brickHook.setNavigateToBrick;
  var handleForge = brickHook.handleForge;
  var handleCorrect = brickHook.handleCorrect;
  var handleMission = brickHook.handleMission;
  var handleSkip = brickHook.handleSkip;
  var handleAddBrick = brickHook.handleAddBrick;
  var handleBrickUpdate = brickHook.handleBrickUpdate;

  // ── useDuel hook — duel lifecycle ──
  var duelHook = useDuel(bricks, setBricks, targetRoleId);
  var duelResults = duelHook.duelResults;
  var duelQRef = duelHook.duelQRef;
  var buildDuelQuestions = duelHook.buildDuelQuestions;
  var handleDuelComplete = duelHook.handleDuelComplete;
  var handleDuelRedo = duelHook.handleDuelRedo;

  // ── useSignature hook — signature lifecycle ──
  var sigHook = useSignature(initialState, bricks);
  var signature = sigHook.signature;
  var sigThresholdReached = sigHook.sigThresholdReached;
  var renderSignatureOverlay = sigHook.renderSignatureOverlay;

  // ── useBrewNotif hook — Brew notification state ──
  var brewHook = useBrewNotif(user, {
    bricks: bricks,
    vault: vault,
    signature: signature,
    duelResults: duelResults,
    isSubscribed: isSubscribed,
  });
  var brewNotif = brewHook.brewNotif;
  var setBrewNotif = brewHook.setBrewNotif;

  var displayMode = isSubscribed ? "action" : pieces > 0 ? "action" : "vitrine";

  function consumePiece(livrableType) {
    // DEAD
    if (isSubscribed) return true;
    if (pieces <= 0) {
      setPiecesToast({ type: "empty", message: "Plus de pièces." });
      setTimeout(function () {
        setPiecesToast(null);
      }, 3000);
      return false;
    }
    var remaining = pieces - 1;
    setPieces(remaining);
    setPiecesToast({
      type: "consumed",
      message: "1 pièce utilisée. Il t'en reste " + remaining + ".",
    });
    setTimeout(function () {
      setPiecesToast(null);
    }, 3000);
    return true;
  }

  var arsenalOpenState = useState(false);
  var arsenalOpen = arsenalOpenState[0];
  var setArsenalOpen = arsenalOpenState[1];
  var offersDrawerState = useState(false);
  var offersDrawerOpen = offersDrawerState[0];
  var setOffersDrawerOpen = offersDrawerState[1];
  var aiPillarRecsState = useState(
    initialState && initialState.aiPillarRecs != null ? initialState.aiPillarRecs : null
  );
  var aiPillarRecs = aiPillarRecsState[0];
  var setAiPillarRecs = aiPillarRecsState[1];
  var currentSalaryState = useState(
    initialState && initialState.currentSalary != null ? initialState.currentSalary : null
  );
  var currentSalary = currentSalaryState[0];
  var setCurrentSalary = currentSalaryState[1];

  // CV text for Arsenal audit
  var cvTextState = useState(initialState && initialState.cvText ? initialState.cvText : "");
  var cvText = cvTextState[0];
  var setCvText = cvTextState[1];

  // ACV target for OTE diagnostic (sales roles)
  var acvTargetState = useState(initialState && initialState.acvTarget ? initialState.acvTarget : null);
  var acvTarget = acvTargetState[0];
  var setAcvTarget = acvTargetState[1];

  // Seniority level (IC / Manager / Leader)
  var seniorityLevelState = useState(initialState && initialState.seniorityLevel ? initialState.seniorityLevel : null);
  var seniorityLevel = seniorityLevelState[0];
  var setSeniorityLevel = seniorityLevelState[1];

  // Email confirmation banner
  var emailBannerState = useState("hidden"); // hidden | show | sent
  var emailBanner = emailBannerState[0];
  var setEmailBanner = emailBannerState[1];

  useEffect(
    function () {
      if (!user || !user.email) return;
      if (user.email_confirmed_at) return;
      try {
        var dismissed = localStorage.getItem("email_confirm_dismissed");
        if (dismissed && Date.now() - parseInt(dismissed, 10) < 48 * 60 * 60 * 1000) return;
      } catch (e) {}
      var accountAge = user.created_at ? Date.now() - new Date(user.created_at).getTime() : 0;
      if (bricks.length >= 3 || accountAge > 24 * 60 * 60 * 1000) {
        setEmailBanner("show");
      }
    },
    [user, bricks.length]
  );

  function handleResendConfirmation() {
    var sb = createBrowserClient();
    sb.auth.resend({ type: "signup", email: user.email }).then(function () {
      setEmailBanner("sent");
      setTimeout(function () {
        setEmailBanner("hidden");
      }, 5000);
    });
  }

  function handleDismissEmailBanner() {
    try {
      localStorage.setItem("email_confirm_dismissed", String(Date.now()));
    } catch (e) {}
    setEmailBanner("hidden");
  }

  // ── usePersistence hook — localStorage + Supabase save ──
  usePersistence(
    {
      screen: screen,
      activeStep: activeStep,
      bricks: bricks,
      vault: vault,
      sprintDone: sprintDone,
      nextId: nextId,
      duelResults: duelResults,
      targetRoleId: targetRoleId,
      previousRole: previousRole,
      nightmareCosts: nightmareCosts,
      takes: takes,
      parsedOffers: parsedOffers,
      offersArray: offersArray,
      offerNextId: offerNextId,
      aiPillarRecs: aiPillarRecs,
      currentSalary: currentSalary,
      signature: signature,
      pieces: pieces,
      firstVisitToastShown: firstVisitToastShown,
      cvText: cvText,
      acvTarget: acvTarget,
      seniorityLevel: seniorityLevel,
    },
    onStateChange
  );

  // ── Autosave reassurance toast — first Forge visit only ──
  useEffect(
    function () {
      if (screen !== "sprint" || firstVisitToastShown) return;
      var timer = setTimeout(function () {
        setAutosaveToast({ type: "info", message: "Tes briques sont sauvegardées automatiquement." });
        setFirstVisitToastShown(true);
        setTimeout(function () {
          setAutosaveToast(null);
        }, 5000);
      }, 2000);
      return function () {
        clearTimeout(timer);
      };
    },
    [screen, firstVisitToastShown]
  );

  // Fetch AI pillar recommendations ONCE, persist result
  useEffect(
    function () {
      if (aiPillarRecs !== null || !targetRoleId) return;
      var pillars = getAdaptivePillars(targetRoleId);
      var takePillars = takes.filter(function (t) {
        return t.status === "validated" && t.pillar;
      });
      if (pillars.length === 0) return;
      var cancelled = false;
      fetch("/api/recommend-pillars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pillars: pillars.map(function (p) {
            return { id: p.id, title: p.title, desc: p.desc };
          }),
          takes: takePillars.map(function (t) {
            return { title: t.pillar.title, desc: t.pillar.desc, text: t.text };
          }),
        }),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          if (!cancelled && Array.isArray(data)) setAiPillarRecs(data);
        })
        .catch(function () {
          if (!cancelled) setAiPillarRecs([]);
        });
      return function () {
        cancelled = true;
      };
    },
    [aiPillarRecs, targetRoleId]
  );

  function handleRefreshPillarRecs() {
    setAiPillarRecs(null);
  }

  var maturity = getMaturityLevel(bricks);

  function handleValPillars(count, selectedIds, takePillars, aiPillars) {
    var selectedPillars = selectedIds.map(function (id) {
      var tp = takePillars.find(function (p) {
        return p.id === id;
      });
      if (tp) return { id: id, title: tp.title, desc: tp.desc, source: "take", depth: tp.depth };
      var ap = aiPillars.find(function (p) {
        return p.id === id;
      });
      if (ap) return { id: id, title: ap.title, desc: ap.desc, source: "ai" };
      return { id: id, source: "unknown" };
    });
    setVault(function (prev) {
      return Object.assign({}, prev, { pillars: count, selectedPillars: selectedPillars });
    });
    setActiveStep(2);
  }

  // Chantier 10B — "Aller à la brique" callback from Arsenal
  function handleGoToBrick(nightmareId, angle) {
    setArsenalOpen(false);
    setEtabliOpen(false);
    setActiveStep(1);
    var targetBrick = null;
    var cauchemars = getActiveCauchemars();
    var nightmare = cauchemars.find(function (c) {
      return c.id === nightmareId;
    });
    if (nightmare) {
      var validatedBricks = bricks.filter(function (b) {
        return b.status === "validated" && b.type === "brick";
      });
      validatedBricks.forEach(function (b) {
        if (
          !targetBrick &&
          b.kpi &&
          nightmare.kpis &&
          nightmare.kpis.some(function (k) {
            return b.kpi.indexOf(k) !== -1 || k.indexOf(b.kpi) !== -1;
          })
        ) {
          targetBrick = b;
        }
      });
    }
    setNavigateToBrick({ brickId: targetBrick ? targetBrick.id : null, angle: angle });
  }

  var allSeedsDone = seeds.every(function (s) {
    return bricks.some(function (b) {
      return b.id === s.id;
    });
  });

  var density = computeDensityScore({
    bricks: bricks,
    nightmares: getActiveCauchemars(),
    pillars: vault,
    signature: signature,
    duelResults: duelResults,
    cvBricks: [],
  });

  // Chantier 14 — Query params: Abonnement
  useEffect(function () {
    var params = new URLSearchParams(window.location.search);
    var subscribed = params.get("subscribed");
    if (subscribed === "true") {
      setIsSubscribed(true);
      window.history.replaceState({}, "", "/sprint");
    }
  }, []);

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
        <Onboarding
          onStart={function (role, offerSignals, rawOfferText, seniority) {
            setTargetRoleId(role);
            setParsedOffers(offerSignals);
            if (seniority) setSeniorityLevel(seniority);
            setSeeds(generateAdaptiveSeeds(role));
            if (rawOfferText && rawOfferText.trim().length > 20) {
              var firstOffer = {
                id: 1,
                text: rawOfferText.trim(),
                parsedSignals: parseOfferSignals(rawOfferText, role),
              };
              setOffersArray([firstOffer]);
              setOfferNextId(2);
            }
            setScreen("sprint");
          }}
          onScan={onScan}
        />
      </div>
    );
  }

  function renderContent() {
    if (sprintDone)
      return (
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{"\u23F8\uFE0F"}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>Forge en veille</div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6, marginBottom: 20 }}>
            Tes briques sont sauvegardées. Reprends quand tu veux.
          </div>
          <button
            onClick={function () {
              setSprintDone(false);
            }}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #e94560, #c81d4e)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Reprendre la Forge
          </button>
        </div>
      );
    if (activeStep === 0) {
      return (
        <div>
          <Interrogation
            seeds={seeds}
            bricks={bricks}
            onForge={handleForge}
            onCorrect={handleCorrect}
            onMission={handleMission}
            onSkip={handleSkip}
            onAddBrick={handleAddBrick}
            paranoMode={paranoMode}
            targetRoleId={targetRoleId}
          />
          {allSeedsDone && density.unlocks.forge && (
            <button
              onClick={function () {
                setActiveStep(1);
              }}
              style={{
                width: "100%",
                marginTop: 16,
                padding: 14,
                background: "#0f3460",
                color: "#ccd6f6",
                border: "2px solid #e94560",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Passer à l'Assemblage {"→"}
            </button>
          )}
          {allSeedsDone &&
            !density.unlocks.forge &&
            (function () {
              var cov = computeCauchemarCoverage(bricks);
              var covOk = cov.every(function (c) {
                return c.covered;
              });
              var brickOk = density.details.brickCount >= 3;
              return (
                <div
                  style={{
                    background: "#e94560" + "22",
                    borderRadius: 10,
                    padding: 14,
                    marginTop: 16,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 13, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>
                    {"🔒"} Verrou de Blindage
                  </div>
                  <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>
                    {!brickOk &&
                      "Il faut au moins 3 briques validées pour passer à l'Assemblage. Tu en as " +
                        density.details.brickCount +
                        ". "}
                    {!covOk &&
                      "Couverture cauchemars incomplète : " +
                        cov.filter(function (c) {
                          return c.covered;
                        }).length +
                        "/" +
                        cov.length +
                        ". Couvre tous les cauchemars actifs."}
                    {brickOk && covOk && "Verrou en cours de calcul…"}
                  </div>
                </div>
              );
            })()}
        </div>
      );
    }
    if (activeStep === 1)
      return (
        <div>
          <BrickStressTest
            bricks={bricks}
            onBrickUpdate={handleBrickUpdate}
            nightmareCosts={nightmareCosts}
            offersArray={offersArray}
            navigateToBrick={navigateToBrick}
            onNavigateDone={function () {
              setNavigateToBrick(null);
            }}
            targetRoleId={targetRoleId}
          />
          <Pillars
            pillars={getAdaptivePillars(targetRoleId)}
            takes={takes}
            onVal={handleValPillars}
            recommendations={aiPillarRecs}
            onRefresh={handleRefreshPillarRecs}
          />
        </div>
      );
    if (activeStep === 2) {
      if (duelResults.length > 0) {
        var answeredCount = duelResults.filter(function (r) {
          return r.answer;
        }).length;
        var testedBricks = bricks.filter(function (b) {
          return b.duelTested;
        });
        return (
          <div style={{ textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{"\uD83D\uDEE1\uFE0F"}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>
              Duel terminé — {answeredCount} réponse{answeredCount > 1 ? "s" : ""} forgée{answeredCount > 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6, marginBottom: 6 }}>
              {testedBricks.length} brique{testedBricks.length > 1 ? "s" : ""} mobilisée
              {testedBricks.length > 1 ? "s" : ""} pendant le Duel.
            </div>
            <div style={{ fontSize: 12, color: "#495670", lineHeight: 1.5, marginBottom: 20 }}>
              Score de densité mis à jour. Tu peux refaire le Duel avec de nouvelles questions ou terminer la Forge.
            </div>
            <button
              onClick={handleDuelRedo}
              style={{
                width: "100%",
                padding: 14,
                background: "#0f3460",
                color: "#ccd6f6",
                border: "2px solid #e94560",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Refaire le Duel
            </button>
          </div>
        );
      }
      if (!duelQRef.current) {
        duelQRef.current = buildDuelQuestions(DUEL_QUESTIONS, bricks, targetRoleId);
      }
      var duelCoaching = generateInterviewQuestions(
        bricks.filter(function (b) {
          return b.status === "validated";
        }),
        targetRoleId,
        getActiveCauchemars(),
        offersArray && offersArray.length > 0 ? offersArray[0].parsedSignals || null : null,
        signature
      );
      return (
        <Duel
          questions={duelQRef.current}
          bricks={bricks}
          onComplete={handleDuelComplete}
          targetRoleId={targetRoleId}
          interviewCoaching={duelCoaching}
        />
      );
    }
    return null;
  }

  var hasValidatedBricks = bricks.some(function (b) {
    return b.status === "validated";
  });
  var densityColor = density.score >= 70 ? "#4ecca3" : density.score >= 50 ? "#3498db" : "#e94560";
  var etabliEnabled = hasValidatedBricks;

  return (
    <div style={wrap}>
      <style>
        {
          "\
        @keyframes arsenalSlideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }\
        @keyframes arsenalSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }\
        @keyframes piecesPulse { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }\
      "
        }
      </style>
      {renderSignatureOverlay()}

      {/* ===== EMAIL CONFIRMATION BANNER ===== */}
      {emailBanner === "show" && (
        <div
          style={{
            position: "relative",
            background: "#1a1a3e",
            borderBottom: "1px solid #e94560",
            padding: "10px 40px 10px 16px",
            marginBottom: 8,
            borderRadius: 8,
            fontSize: 13,
            color: "#ccd6f6",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span>Confirme ton email pour ne pas perdre ton travail.</span>
          <button
            onClick={handleResendConfirmation}
            style={{
              background: "transparent",
              border: "1px solid #e94560",
              color: "#e94560",
              borderRadius: 6,
              padding: "6px 16px",
              fontSize: 12,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Envoyer le lien de confirmation
          </button>
          <button
            onClick={handleDismissEmailBanner}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "#495670",
              fontSize: 16,
              cursor: "pointer",
              padding: 0,
            }}
          >
            &times;
          </button>
        </div>
      )}
      {emailBanner === "sent" && (
        <div
          style={{
            background: "#1a1a3e",
            borderBottom: "1px solid #4ecca3",
            padding: "10px 16px",
            marginBottom: 8,
            borderRadius: 8,
            fontSize: 13,
            color: "#4ecca3",
          }}
        >
          Lien envoyé ✓
        </div>
      )}

      {/* ===== HEADER — Région 2 (MESURER) : score cliquable + compteur pièces ===== */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          padding: "12px 16px",
          background: "#16213e",
          borderRadius: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 2 }}>
            ABNEG@TION
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#ccd6f6" }}>
            La Forge
            <Tooltip term="Forge" text={VOCABULARY.forge} />
          </div>
          {targetRoleId && KPI_REFERENCE[targetRoleId] && (
            <div style={{ fontSize: 10, color: "#495670", marginTop: 2 }}>{KPI_REFERENCE[targetRoleId].role}</div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={function () {
              setArsenalOpen(false);
              setOffersDrawerOpen(!offersDrawerOpen);
            }}
            title="Gérer les offres"
            style={{
              background: "none",
              border: "1px solid #0f3460",
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", whiteSpace: "nowrap" }}>
              {offersArray.length > 0
                ? "\uD83D\uDCCB " + offersArray.length + " offre" + (offersArray.length > 1 ? "s" : "")
                : "\uD83D\uDCCB Ajouter une offre"}
            </div>
          </button>
          <button
            onClick={function () {
              setOffersDrawerOpen(false);
              if (activeStep >= 1) setArsenalOpen(true);
            }}
            title={activeStep < 1 ? "Disponible dès l'Assemblage" : "Ouvrir l'Arsenal"}
            style={{
              background: "none",
              border: "1px solid " + densityColor + "60",
              borderRadius: 8,
              padding: "6px 14px",
              cursor: activeStep >= 1 ? "pointer" : "default",
              opacity: activeStep >= 1 ? 1 : 0.4,
              transition: "all 0.3s",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: densityColor, whiteSpace: "nowrap" }}>
              {hasValidatedBricks ? "Densité : " + density.score + "%" : "Densité : —"}
              <Tooltip term="Densité" text={VOCABULARY.densite} />
            </div>
          </button>
          {/* TODO: remplacer par badge abonnement */}
        </div>
      </div>

      {/* Density bar */}
      {!sprintDone && (
        <div style={{ marginBottom: 12 }}>
          <Bar pct={density.score} />
        </div>
      )}

      {/* Signature display */}
      {!sprintDone && signature && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            background: "#4ecca3" + "10",
            border: "1px solid #4ecca3" + "30",
            borderRadius: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 700, marginBottom: 2 }}>
                TA SIGNATURE {signature.armored ? "— BLINDÉE" : ""}
              </div>
              <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.4 }}>{signature.formulation}</div>
              {signature.metaPatterns && (
                <div style={{ fontSize: 10, color: "#495670", marginTop: 4 }}>
                  Archétype : {signature.metaPatterns.archetype} | Tempo : {signature.metaPatterns.tempo} | Modificateur
                  : {signature.metaPatterns.modifier}
                  {signature.assistedFormulation ? " | Assistée" : ""}
                </div>
              )}
            </div>
            <div style={{ fontSize: 20 }}>{signature.armored ? "\uD83D\uDEE1\uFE0F" : "\u2728"}</div>
          </div>
        </div>
      )}

      {/* ===== BREW NOTIFICATIONS ===== */}
      {brewNotif.weekMissing && (
        <div
          style={{
            background: "#111125",
            borderRadius: 8,
            padding: "8px 14px",
            marginBottom: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderLeft: "3px solid #4ecca3",
          }}
        >
          <div style={{ fontSize: 11, color: "#ccd6f6" }}>Ta semaine Brew n'est pas déclarée.</div>
          <a href="/brew" style={{ fontSize: 11, color: "#4ecca3", fontWeight: 700, textDecoration: "none" }}>
            Déclarer →
          </a>
        </div>
      )}
      {brewNotif.instructions.length > 0 &&
        brewNotif.instructions.map(function (inst) {
          return (
            <div
              key={inst.id}
              style={{
                background: "#111125",
                borderRadius: 8,
                padding: "8px 14px",
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderLeft: "3px solid #ff9800",
              }}
            >
              <div style={{ fontSize: 11, color: "#ccd6f6" }}>
                Le Brew recommande de régénérer ton post pilier {inst.pillar_id} au niveau {inst.target_dilts_level}.
              </div>
              <button
                onClick={function () {
                  markInstructionDone(inst.id).then(function () {
                    setBrewNotif(function (prev) {
                      return {
                        weekMissing: prev.weekMissing,
                        instructions: prev.instructions.filter(function (i) {
                          return i.id !== inst.id;
                        }),
                      };
                    });
                  });
                }}
                style={{
                  fontSize: 11,
                  color: "#ff9800",
                  fontWeight: 700,
                  background: "none",
                  border: "1px solid #ff9800",
                  borderRadius: 6,
                  padding: "3px 10px",
                  cursor: "pointer",
                }}
              >
                Régénérer maintenant
              </button>
            </div>
          );
        })}

      {/* ===== NAV — with Établi button ===== */}
      {!sprintDone && (
        <Nav
          steps={STEPS}
          active={activeStep}
          onSelect={function (i) {
            setEtabliOpen(false);
            setActiveStep(i);
          }}
          density={density}
          etabliOpen={etabliOpen}
          onEtabliToggle={function () {
            if (etabliEnabled) setEtabliOpen(!etabliOpen);
          }}
          etabliEnabled={etabliEnabled}
        />
      )}

      {/* Secondary panels */}
      {!sprintDone && !etabliOpen && <CVPreview bricks={bricks} />}
      {!sprintDone && !etabliOpen && <InvestmentIndex bricks={bricks} />}
      {!sprintDone && !etabliOpen && <CrossRoleInsight bricks={bricks} targetRoleId={targetRoleId} />}

      {/* ===== ÉTABLI OVERLAY — Interruption 2 (PRODUIRE) ===== */}
      {etabliOpen && (
        <div style={{ background: "#16213e", borderRadius: 12, padding: 20, minHeight: "60vh" }}>
          <WorkBench
            bricks={bricks}
            targetRoleId={targetRoleId}
            vault={vault}
            offersArray={offersArray}
            isActive={true}
            currentSalary={currentSalary}
            onSalaryChange={setCurrentSalary}
            signature={signature}
            duelResults={duelResults}
            onClose={function () {
              setEtabliOpen(false);
            }}
            pieces={pieces}
            displayMode={displayMode}
            consumePiece={consumePiece} /* DEAD */
            isSubscribed={isSubscribed}
            user={user}
            onGoForge={function () {
              setEtabliOpen(false);
              setActiveStep(1);
            }}
            obsoleteDeliverables={obsoleteDeliverables}
            setObsoleteDeliverables={setObsoleteDeliverables}
            acvTarget={acvTarget}
            seniorityLevel={seniorityLevel}
          />
        </div>
      )}

      {/* ===== CONTENT ZONE — Région 1 (flux principal) ===== */}
      {!etabliOpen && <div style={{ background: "#16213e", borderRadius: 12, padding: 20 }}>{renderContent()}</div>}

      {/* ===== ARSENAL DRAWER — Région 3 (ORIENTER) ===== */}
      {arsenalOpen && (
        <div>
          <div
            onClick={function () {
              setArsenalOpen(false);
            }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(10,10,26,0.6)",
              zIndex: 900,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(400px, 85vw)",
              background: "#0d1b2a",
              zIndex: 901,
              overflowY: "auto",
              borderLeft: "1px solid #e94560" + "44",
              animation: "arsenalSlideRight 0.3s ease",
            }}
          >
            <div
              style={{
                padding: "16px 16px 8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #16213e",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{"\uD83E\uDDED"}</span>
                <span style={{ color: "#ccd6f6", fontWeight: 700, fontSize: 14 }}>
                  ARSENAL
                  <Tooltip term="Arsenal" text={VOCABULARY.arsenal} />
                </span>
              </div>
              <button
                onClick={function () {
                  setArsenalOpen(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8892b0",
                  cursor: "pointer",
                  fontSize: 20,
                  padding: "4px 8px",
                }}
              >
                {"\u2715"}
              </button>
            </div>
            <div style={{ padding: 16 }}>
              <Arsenal
                density={density}
                bricks={bricks}
                nightmares={getActiveCauchemars()}
                signatureThreshold={sigThresholdReached}
                signature={signature}
                vault={vault}
                duelResults={duelResults}
                pieces={pieces}
                displayMode={displayMode}
                onGoToBrick={handleGoToBrick}
                onClose={function () {
                  setArsenalOpen(false);
                }}
                previousRole={previousRole}
                targetRoleId={targetRoleId}
                cvText={cvText}
                setCvText={setCvText}
                currentSalary={currentSalary}
                acvTarget={acvTarget}
                setAcvTarget={setAcvTarget}
                seniorityLevel={seniorityLevel}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===== OFFERS DRAWER — Chantier 18 ===== */}
      {offersDrawerOpen && (
        <div>
          <div
            onClick={function () {
              setOffersDrawerOpen(false);
            }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(10,10,26,0.6)",
              zIndex: 900,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(400px, 85vw)",
              background: "#0d1b2a",
              zIndex: 901,
              overflowY: "auto",
              borderLeft: "1px solid #e94560" + "44",
              animation: "arsenalSlideRight 0.3s ease",
            }}
          >
            <div
              style={{
                padding: "16px 16px 8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #16213e",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{"\uD83D\uDCCB"}</span>
                <span style={{ color: "#ccd6f6", fontWeight: 700, fontSize: 14 }}>MES OFFRES</span>
              </div>
              <button
                onClick={function () {
                  setOffersDrawerOpen(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8892b0",
                  cursor: "pointer",
                  fontSize: 20,
                  padding: "4px 8px",
                }}
              >
                {"\u2715"}
              </button>
            </div>
            <div style={{ padding: 16 }}>
              <OffersManager
                offersArray={offersArray}
                onAdd={handleAddOffer}
                onRemove={handleRemoveOffer}
                coherence={offerCoherence}
                targetRoleId={targetRoleId}
              />
            </div>
          </div>
        </div>
      )}

      {toastBrick && (
        <FeedbackToast
          brick={toastBrick}
          onDone={function () {
            setToastBrick(null);
          }}
        />
      )}
      <Toast toast={piecesToast} />
      {autosaveToast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            animation: "toastSlideIn 0.3s ease-out",
          }}
        >
          <div
            style={{
              background: "#1a1a2e",
              border: "1px solid #1a1a3e",
              borderRadius: 10,
              padding: "12px 20px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              maxWidth: 360,
            }}
          >
            <span style={{ fontSize: 13, color: "#ccd6f6", fontWeight: 600, lineHeight: 1.4 }}>
              {autosaveToast.message}
            </span>
          </div>
        </div>
      )}

      {/* ===== SAVE STATUS INDICATORS ===== */}
      {saveStatus === "retrying" && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#1a1a3e",
            padding: "8px 16px",
            fontSize: 11,
            color: "#e94560",
            textAlign: "center",
            zIndex: 1000,
          }}
        >
          Sauvegarde échouée. Nouvelle tentative...
        </div>
      )}
      {saveStatus === "offline" && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#1a1a3e",
            padding: "8px 16px",
            fontSize: 11,
            color: "#e94560",
            textAlign: "center",
            zIndex: 1000,
          }}
        >
          Connexion perdue. Tes briques sont sauvegardées localement.
        </div>
      )}
      {saveStatus === "saved" && (
        <div style={{ position: "fixed", bottom: 12, right: 12, fontSize: 10, color: "#4ecca3", zIndex: 1000 }}>
          ✓ Sauvegardé
        </div>
      )}
      {saveStatus === "synced" && (
        <div style={{ position: "fixed", bottom: 12, right: 12, fontSize: 10, color: "#4ecca3", zIndex: 1000 }}>
          Briques synchronisées ✓
        </div>
      )}
    </div>
  );
}
