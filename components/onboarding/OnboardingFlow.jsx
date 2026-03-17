"use client";
import { useState, useEffect, useRef } from "react";
import { KPI_REFERENCE, ROLE_CLUSTERS, SCAN_STEPS_ACTIF } from "@/lib/sprint/references";
import { parseOfferSignals, buildActiveCauchemars } from "@/lib/sprint/offers";
import { setActiveCauchemarsGlobal, getActiveCauchemars, formatCost } from "@/lib/sprint/scoring";
import { generateAdaptiveSeeds } from "@/lib/sprint/bricks";
import { estimateReadiness } from "@/lib/sprint/analysis";

/* ==============================
   ONBOARDING FLOW — 5 états V2
   ONB.1 RÔLE → ONB.2 PROFIL → ONB.3 CIBLES → ONB.4 SCAN → ONB.5 PRÊT
   ============================== */

export function OnboardingFlow({ onComplete }) {
  var phaseSt = useState("role");
  var phase = phaseSt[0]; var setPhase = phaseSt[1];
  var roleSt = useState(null);
  var targetRole = roleSt[0]; var setTargetRole = roleSt[1];
  var profileSt = useState("");
  var profileText = profileSt[0]; var setProfileText = profileSt[1];
  var offersSt = useState("");
  var offersText = offersSt[0]; var setOffersText = offersSt[1];
  var previousRoleSt = useState("");
  var previousRole = previousRoleSt[0]; var setPreviousRole = previousRoleSt[1];
  var progressSt = useState(0);
  var scanProgress = progressSt[0]; var setScanProgress = progressSt[1];
  var messagesSt = useState([]);
  var scanMessages = messagesSt[0]; var setScanMessages = messagesSt[1];
  var signalsSt = useState(null);
  var offerSignals = signalsSt[0]; var setOfferSignals = signalsSt[1];
  var seedsSt = useState([]);
  var seeds = seedsSt[0]; var setSeeds = seedsSt[1];

  // Pre-fill from Eclaireur data if available
  var eclaireurSkipRef = useRef({ cv: false, offer: false });
  useEffect(function() {
    try {
      var raw = sessionStorage.getItem("eclaireur_data");
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed.detectedRoleId) setTargetRole(parsed.detectedRoleId);
        eclaireurSkipRef.current.cv = true;
        eclaireurSkipRef.current.offer = true;
        if (parsed.cvText && parsed.cvText.trim().length >= 20) {
          setProfileText(parsed.cvText);
        }
      }
    } catch (e) {}
  }, []);

  var textareaStyle = {
    width: "100%", minHeight: 120, padding: 14, background: "#1a1a2e",
    border: "2px solid #16213e", borderRadius: 10, color: "#ccd6f6",
    fontSize: 13, lineHeight: 1.6, resize: "vertical", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };

  function btnPrimary(enabled) {
    return {
      width: "100%", padding: 16,
      background: enabled ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
      color: enabled ? "#fff" : "#495670",
      border: enabled ? "none" : "2px solid #16213e",
      borderRadius: 12, cursor: enabled ? "pointer" : "not-allowed",
      fontWeight: 700, fontSize: 15,
      boxShadow: enabled ? "0 4px 20px rgba(233,69,96,0.3)" : "none",
    };
  }

  var btnBack = {
    padding: "10px 20px", background: "#1a1a2e", color: "#495670",
    border: "1px solid #16213e", borderRadius: 8, cursor: "pointer",
    fontSize: 12, fontWeight: 600,
  };

  // ===== ONB.1 — RÔLE CIBLE =====
  if (phase === "role") {
    var blocs = {};
    ROLE_CLUSTERS.forEach(function(c) {
      if (!blocs[c.bloc]) blocs[c.bloc] = [];
      blocs[c.bloc].push(c);
    });
    var blocNames = Object.keys(blocs);
    var canNext = targetRole !== null;

    return (
      <div style={{ padding: "8px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>ABNEG@TION</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ccd6f6", marginBottom: 8 }}>Quel poste tu vises ?</div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>
            Choisis la famille de métier. L'IA classe tes briques contre les 5 KPIs de ce poste.
          </div>
        </div>

        {blocNames.map(function(blocName) {
          return (
            <div key={blocName} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#495670", fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>{blocName}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                {blocs[blocName].map(function(cluster) {
                  var sel = targetRole === cluster.id;
                  return (
                    <button key={cluster.id} onClick={function() { setTargetRole(cluster.id); }} style={{
                      background: sel ? "#0f3460" : "#1a1a2e",
                      border: sel ? "2px solid #e94560" : "2px solid #16213e",
                      borderRadius: 8, padding: "10px 12px", cursor: "pointer",
                      textAlign: "left", transition: "all 0.2s",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: sel ? "#e94560" : "#ccd6f6", lineHeight: 1.3 }}>{cluster.label}</div>
                      <div style={{ fontSize: 10, color: "#8892b0", marginTop: 2 }}>{cluster.subtitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* KPI display when role selected */}
        {targetRole && KPI_REFERENCE[targetRole] && (
          <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginTop: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 6 }}>5 KPIS DE CE POSTE</div>
            {KPI_REFERENCE[targetRole].kpis.map(function(k, i) {
              var eColor = k.elasticity === "élastique" ? "#4ecca3" : k.elasticity === "stable" ? "#8892b0" : "#e94560";
              var eLabel = k.elasticity === "élastique" ? "↗\uFE0F" : k.elasticity === "stable" ? "↔\uFE0F" : "↘\uFE0F";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: eColor }}>{eLabel}</span>
                  <span style={{ fontSize: 11, color: "#ccd6f6" }}>{k.name}</span>
                  <span style={{ fontSize: 9, color: eColor, background: "#1a1a2e", padding: "1px 6px", borderRadius: 6 }}>{k.elasticity === "élastique" ? "élastique" : k.elasticity === "stable" ? "stable" : "sous pression"}</span>
                </div>
              );
            })}
            <div style={{ borderTop: "1px solid #16213e", marginTop: 8, paddingTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12 }}>{"\uD83D\uDD54"}</span>
              <span style={{ fontSize: 11, color: "#ccd6f6" }}>Rendez-vous de Souveraineté : {KPI_REFERENCE[targetRole].cadenceLabel}</span>
              <span style={{ fontSize: 9, color: "#495670" }}>({KPI_REFERENCE[targetRole].cadence}j)</span>
            </div>
            <div style={{ fontSize: 10, color: "#8892b0", marginTop: 4, lineHeight: 1.4 }}>{KPI_REFERENCE[targetRole].cadenceReason}</div>
          </div>
        )}

        <button onClick={function() {
          if (!canNext) return;
          var skipCv = eclaireurSkipRef.current.cv;
          var skipOffer = eclaireurSkipRef.current.offer;
          eclaireurSkipRef.current.cv = false;
          eclaireurSkipRef.current.offer = false;
          if (skipCv && skipOffer) { setPhase("scan"); startScan(); }
          else if (skipCv) { setPhase("offers"); }
          else { setPhase("profile"); }
        }} disabled={!canNext} style={btnPrimary(canNext)}>Suivant</button>
      </div>
    );
  }

  // ===== ONB.2 — PROFIL =====
  if (phase === "profile") {
    var canNext = profileText.trim().length >= 20;

    return (
      <div style={{ padding: "8px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>ABNEG@TION</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ccd6f6", marginBottom: 8 }}>Ton profil</div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>
            Colle ton CV, ta bio LinkedIn, ou décris ton dernier poste.
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <textarea
            value={profileText}
            onChange={function(e) { setProfileText(e.target.value); }}
            placeholder="Ex : Account Executive chez Spendesk (2 ans). Cycle de vente complet Mid-Market. Portefeuille de 45 comptes, ARR géré 1.2M€..."
            style={textareaStyle}
          />
          <div style={{ fontSize: 11, color: canNext ? "#495670" : "#e94560", marginTop: 4, textAlign: "right" }}>
            {canNext ? profileText.trim().length + " caractères" : "Minimum 20 caractères (" + profileText.trim().length + "/20)"}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "#8892b0", fontWeight: 600, marginBottom: 6 }}>Ton rôle actuel ou dernier rôle en poste <span style={{ fontSize: 10, color: "#495670" }}>(optionnel)</span></div>
          <input
            value={previousRole}
            onChange={function(e) { setPreviousRole(e.target.value); }}
            placeholder="Ex : Account Executive, Chef de projet, Maître d'hôtel..."
            style={{ width: "100%", padding: 10, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 8, color: "#ccd6f6", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>

        <button onClick={function() {
          if (!canNext) return;
          // Auto-detect previousRole from profileText if not filled
          if (!previousRole.trim()) {
            var lower = profileText.toLowerCase();
            for (var i = 0; i < ROLE_CLUSTERS.length; i++) {
              var words = ROLE_CLUSTERS[i].label.toLowerCase().split(/[\s\/]+/).filter(function(w) { return w.length > 3; });
              var found = false;
              for (var j = 0; j < words.length; j++) {
                if (lower.indexOf(words[j]) !== -1) { found = true; break; }
              }
              if (found) { setPreviousRole(ROLE_CLUSTERS[i].label.split(" / ")[0]); break; }
            }
          }
          setPhase("offers");
        }} disabled={!canNext} style={btnPrimary(canNext)}>Suivant</button>
        <div style={{ marginTop: 12 }}>
          <button onClick={function() { setPhase("role"); }} style={btnBack}>{"\u2190"} Retour</button>
        </div>
      </div>
    );
  }

  // ===== ONB.3 — CIBLES (optionnel) =====
  if (phase === "offers") {
    function goToScan() { setPhase("scan"); startScan(); }

    return (
      <div style={{ padding: "8px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>ABNEG@TION</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ccd6f6", marginBottom: 8 }}>Tes offres cibles</div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>
            Colle 1 à 3 offres qui t'intéressent. Optionnel. La Forge fonctionne aussi sans offre.
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <textarea
            value={offersText}
            onChange={function(e) { setOffersText(e.target.value); }}
            placeholder="Ex : Account Executive Mid-Market — Scale-up SaaS B2B série B. Prospection outbound, démos, closing. 3+ ans expérience SaaS..."
            style={textareaStyle}
          />
          <div style={{ fontSize: 11, color: "#495670", marginTop: 4, textAlign: "right" }}>
            {offersText.trim().length > 20 ? "Offre détectée" : "Optionnel — cauchemars génériques du rôle si vide"}
          </div>
        </div>

        <button onClick={goToScan} style={btnPrimary(true)}>Suivant</button>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={function() { setPhase("profile"); }} style={btnBack}>{"\u2190"} Retour</button>
          <button onClick={function() { setOffersText(""); goToScan(); }} style={{
            padding: "10px 20px", background: "none", color: "#8892b0",
            border: "1px solid #16213e", borderRadius: 8, cursor: "pointer",
            fontSize: 12, fontWeight: 600,
          }}>Passer cette étape</button>
        </div>
      </div>
    );
  }

  // ===== Fonction de lancement du scan =====
  function startScan() {
    setScanProgress(0);
    setScanMessages([]);

    // Parse offer signals (synchrone, keyword-based)
    if (offersText.trim().length > 20 && targetRole) {
      var signals = parseOfferSignals(offersText, targetRole);
      setOfferSignals(signals);
      if (signals && signals.cauchemars) {
        setActiveCauchemarsGlobal(signals.cauchemars);
      }
    } else if (targetRole) {
      var fallback = buildActiveCauchemars(null, targetRole);
      setActiveCauchemarsGlobal(fallback);
    }

    // Générer les seeds
    var generatedSeeds = generateAdaptiveSeeds(targetRole);
    setSeeds(generatedSeeds);

    // Animation séquentielle
    var steps = SCAN_STEPS_ACTIF;
    steps.forEach(function(msg, i) {
      setTimeout(function() {
        setScanMessages(function(prev) { return prev.concat([msg]); });
        setScanProgress(((i + 1) / steps.length) * 100);
      }, (i + 1) * 700);
    });

    // Transition vers "ready" après animation
    setTimeout(function() { setPhase("ready"); }, steps.length * 700 + 800);
  }

  // ===== ONB.4 — SCAN IA =====
  if (phase === "scan") {
    return (
      <div style={{ padding: "40px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>{"\uD83D\uDD0D"}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#ccd6f6" }}>L'IA scanne ton profil et le marché</div>
        </div>
        <div style={{ width: "100%", background: "#1a1a2e", borderRadius: 8, height: 6, overflow: "hidden", marginBottom: 24 }}>
          <div style={{
            width: scanProgress + "%", height: "100%",
            background: "linear-gradient(90deg, #e94560, #ff6b6b)",
            borderRadius: 8, transition: "width 0.4s ease",
          }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {scanMessages.map(function(msg, i) {
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: i === scanMessages.length - 1 ? 1 : 0.5, transition: "opacity 0.3s" }}>
                <span style={{ color: "#e94560", fontSize: 14 }}>{i < scanMessages.length - 1 ? "\u2714" : "\u25B8"}</span>
                <span style={{ fontSize: 13, color: "#ccd6f6" }}>{msg}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== ONB.5 — PRÊT =====
  if (phase === "ready") {
    var activeCauchemars = getActiveCauchemars();
    var readiness = estimateReadiness(profileText, offersText);
    var detectedCount = offerSignals ? offerSignals.cauchemars.filter(function(c) { return c.detected; }).length : 0;
    var scorePct = offerSignals && offerSignals.totalSignals > 0 ? Math.min(45, 20 + offerSignals.totalSignals * 3) : 32;

    function handleStart() {
      onComplete({
        targetRoleId: targetRole,
        profileText: profileText,
        offersText: offersText,
        previousRole: previousRole,
        generatedBricks: seeds,
        offerSignals: offerSignals,
      });
    }

    return (
      <div style={{ padding: "8px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>ABNEG@TION</div>

          {/* Score circle */}
          <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 16px" }}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" fill="none" stroke="#1a1a2e" strokeWidth="10" />
              <circle cx="70" cy="70" r="60" fill="none" stroke="#e94560" strokeWidth="10"
                strokeDasharray={2 * Math.PI * 60} strokeDashoffset={2 * Math.PI * 60 * (1 - scorePct / 100)}
                strokeLinecap="round" transform="rotate(-90 70 70)" style={{ transition: "stroke-dashoffset 1s ease" }} />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#e94560" }}>{scorePct}%</div>
            </div>
          </div>

          <div style={{ fontSize: 16, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>
            Tu comprends {scorePct}% des enjeux réels de tes offres cibles.
          </div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
            {detectedCount > 0
              ? detectedCount + " enjeu" + (detectedCount > 1 ? "x" : "") + " critique" + (detectedCount > 1 ? "s" : "") + " détecté" + (detectedCount > 1 ? "s" : "") + " dans tes offres."
              : "3 KPIs t'échappent. La Forge va les extraire de ton parcours."}
          </div>
        </div>

        {/* Cauchemars détectés */}
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 16, textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#e94560", fontWeight: 600, letterSpacing: 1 }}>CAUCHEMARS DÉTECTÉS</div>
            {offerSignals && offerSignals.totalSignals > 0 && (
              <span style={{ fontSize: 10, color: "#4ecca3", background: "#1a1a2e", padding: "2px 8px", borderRadius: 8 }}>{offerSignals.totalSignals} signaux</span>
            )}
          </div>
          {activeCauchemars.map(function(c, i) {
            var kpiRef = targetRole && KPI_REFERENCE[targetRole] ? KPI_REFERENCE[targetRole].kpis.find(function(k) { return c.kpis && c.kpis.indexOf(k.name) !== -1; }) : null;
            var elasticity = kpiRef ? kpiRef.elasticity : null;
            var eColor = elasticity === "élastique" ? "#4ecca3" : elasticity === "stable" ? "#8892b0" : elasticity === "sous_pression" ? "#e94560" : "#495670";
            var eText = elasticity === "élastique" ? "élastique" : elasticity === "stable" ? "stable" : elasticity === "sous_pression" ? "sous pression" : "";
            return (
              <div key={i} style={{ marginBottom: i < activeCauchemars.length - 1 ? 10 : 0 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                  <span style={{ fontSize: 13, color: "#ccd6f6", fontWeight: 600 }}>{"\uD83C\uDFAF"} Cauchemar #{i + 1} : {c.label}</span>
                  {eText && <span style={{ fontSize: 10, color: eColor, background: "#1a1a2e", padding: "1px 6px", borderRadius: 8 }}>{eText}</span>}
                  {c.detected && <span style={{ fontSize: 9, color: "#4ecca3", background: "#4ecca3" + "22", padding: "1px 6px", borderRadius: 8 }}>détecté</span>}
                </div>
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{c.nightmareShort}</div>
                {c.matchedKw && c.matchedKw.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                    {c.matchedKw.slice(0, 4).map(function(kw, ki) {
                      return <span key={ki} style={{ fontSize: 9, color: "#4ecca3", background: "#1a1a2e", padding: "1px 6px", borderRadius: 6 }}>{kw}</span>;
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {offerSignals && offerSignals.urgencyScore > 0 && (
            <div style={{ borderTop: "1px solid #16213e", marginTop: 10, paddingTop: 8, fontSize: 11, color: "#e94560", fontWeight: 600 }}>
              {"\u26A1"} Signaux d'urgence détectés ({offerSignals.urgencyScore}) : {offerSignals.urgencyHits.slice(0, 3).join(", ")}
            </div>
          )}
        </div>

        {/* Gisement détecté */}
        <div style={{
          background: readiness.readiness === "fort" ? "#4ecca3" + "15" : readiness.readiness === "moyen" ? "#ff9800" + "15" : "#e94560" + "15",
          borderRadius: 10, padding: 14, marginBottom: 16,
          border: "1px solid " + (readiness.readiness === "fort" ? "#4ecca3" : readiness.readiness === "moyen" ? "#ff9800" : "#e94560"),
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14 }}>{readiness.readiness === "fort" ? "\u26A1" : readiness.readiness === "moyen" ? "\u26A0\uFE0F" : "\uD83D\uDEA8"}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: readiness.readiness === "fort" ? "#4ecca3" : readiness.readiness === "moyen" ? "#ff9800" : "#e94560" }}>
              GISEMENT DÉTECTÉ
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#ccd6f6", fontWeight: 600, marginBottom: 6 }}>
            Estimation : {readiness.estimatedBricks} briques extractibles{readiness.estimatedCicatrices > 0 ? " + " + readiness.estimatedCicatrices + " cicatrice" : ""}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
            {readiness.details.map(function(d, i) {
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: d.ok ? "#4ecca3" : "#e94560" }}>{d.ok ? "\u2714" : "\u2718"}</span>
                  <span style={{ fontSize: 11, color: d.ok ? "#8892b0" : "#e94560" }}>{d.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
            {readiness.readiness === "fort"
              ? "Gisement dense. La Forge va extraire des briques fortes."
              : readiness.readiness === "moyen"
              ? "Gisement partiel. Certaines zones resteront floues. Prépare-toi à des missions."
              : "Gisement faible. La Forge va révéler tes trous. Si tu as accès à tes anciens outils, récupère tes chiffres."}
          </div>
        </div>

        {/* Message + CTA */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, color: "#ccd6f6", fontWeight: 600, lineHeight: 1.5 }}>
            Tes hypothèses sont prêtes. À toi de valider.
          </div>
        </div>

        <button onClick={handleStart} style={btnPrimary(true)}>Commencer la Forge</button>
        <div style={{ fontSize: 11, color: "#495670", textAlign: "center", marginTop: 10 }}>Ta première munition en 20 minutes. Ton arsenal complet à ton rythme.</div>
      </div>
    );
  }

  return null;
}
