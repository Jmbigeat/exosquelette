"use client";
import { useState } from "react";
import { KPI_REFERENCE, ROLE_CLUSTERS, SCAN_STEPS_ACTIF, SCAN_STEPS_PASSIF, MARKET_DATA, CAUCHEMARS_CIBLES } from "@/lib/sprint/references";
import { estimateReadiness } from "@/lib/sprint/analysis";
import { formatCost } from "@/lib/sprint/scoring";
import { parseOfferSignals, buildActiveCauchemars } from "@/lib/sprint/offers";
import { generateDiagnostic } from "@/lib/sprint/generators";

/* Global active cauchemars — set by Sprint component, used by all utility functions */
var _activeCauchemars = null;
export function getActiveCauchemars() { return _activeCauchemars || CAUCHEMARS_CIBLES; }
export function setActiveCauchemarsGlobal(c) { _activeCauchemars = c; }

export function DiagnosticScreen({ diagnostic, cvText, offerText, roleId, readiness, onStartSprint }) {
  if (!diagnostic) return null;
  var b1 = diagnostic.bloc1;
  var b2 = diagnostic.bloc2;
  var b3 = diagnostic.bloc3;
  var b4 = diagnostic.bloc4;
  var roleData = roleId && KPI_REFERENCE[roleId] ? KPI_REFERENCE[roleId] : null;

  return (
    <div style={{ padding: "20px 0" }}>

      {/* BLOC 1 — Ce que l'offre demande VRAIMENT */}
      <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>CE QUE L'OFFRE DEMANDE VRAIMENT</div>
        <div style={{ fontSize: 11, color: "#495670", marginBottom: 12 }}>Pas les compétences listées. Les cauchemars cachés derrière les mots.</div>
        {b1.cauchemars.map(function(c, i) {
          var kpiRef = roleData ? roleData.kpis.find(function(k) { return c.kpis && c.kpis.indexOf(k.name) !== -1; }) : null;
          var eColor = kpiRef && kpiRef.elasticity === "élastique" ? "#4ecca3" : kpiRef && kpiRef.elasticity === "sous_pression" ? "#e94560" : "#8892b0";
          var costStr = formatCost(c.costRange[0]) + " - " + formatCost(c.costRange[1]);
          return (
            <div key={i} style={{ borderBottom: i < 2 ? "1px solid #16213e" : "none", paddingBottom: i < 2 ? 10 : 0, marginBottom: i < 2 ? 10 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 700 }}>{c.label}</span>
                {kpiRef && <span style={{ fontSize: 9, color: eColor, background: eColor + "22", padding: "1px 6px", borderRadius: 6 }}>{kpiRef.elasticity}</span>}
                {c.detected && <span style={{ fontSize: 9, color: "#4ecca3", background: "#4ecca3" + "22", padding: "1px 6px", borderRadius: 6 }}>signal detect{"\u00e9"}</span>}
              </div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5, marginBottom: 4 }}>{c.nightmareShort}</div>
              <div style={{ fontSize: 10, color: "#e94560", fontWeight: 600 }}>Co{"\u00fb"}t : {costStr} / an</div>
            </div>
          );
        })}
        {b1.urgency > 0 && (
          <div style={{ marginTop: 8, fontSize: 10, color: "#e94560", fontWeight: 600 }}>{"\u26A1"} {b1.urgency} signaux d'urgence : {b1.urgencyHits.slice(0, 3).join(", ")}</div>
        )}
      </div>

      {/* BLOC 2 — Ce que ton CV dit au recruteur */}
      <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#ff9800", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>CE QUE TON CV DIT AU RECRUTEUR</div>
        {b2.perceptions.map(function(p, i) {
          var statusColor = p.status === "activite_chiffree" ? "#4ecca3" : p.status === "activite_sans_preuve" ? "#ff9800" : "#e94560";
          var statusIcon = p.status === "activite_chiffree" ? "\u26A0\uFE0F" : p.status === "activite_sans_preuve" ? "\u26A0\uFE0F" : "\u274C";
          return (
            <div key={i} style={{ borderBottom: i < b2.perceptions.length - 1 ? "1px solid #16213e" : "none", paddingBottom: 8, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 11 }}>{statusIcon}</span>
                <span style={{ fontSize: 11, color: statusColor, fontWeight: 700 }}>{p.cauchemar}</span>
              </div>
              <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.5 }}>{p.perception}</div>
            </div>
          );
        })}
      </div>

      {/* BLOC 3 — Le fossé */}
      <div style={{ background: "#e94560" + "15", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid #e94560" + "44" }}>
        <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>LE FOSSÉ</div>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: "#e94560" }}>{b3.fossePct}%</div>
          <div style={{ fontSize: 13, color: "#ccd6f6", fontWeight: 600 }}>de tes preuves sont invisibles</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#e94560" }}>{b3.totalCauchemars}</div>
            <div style={{ fontSize: 10, color: "#8892b0" }}>cauchemars</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#ff9800" }}>{b3.coveredCount}</div>
            <div style={{ fontSize: 10, color: "#8892b0" }}>mentionnés</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#4ecca3" }}>{b3.proofCount}</div>
            <div style={{ fontSize: 10, color: "#8892b0" }}>prouvés</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6, textAlign: "center" }}>
          Tu tires à blanc. Tu as l'expérience. Tu ne la formules pas en preuve. Le recruteur ne voit pas le remède. Il te jette.
        </div>
      </div>

      {/* DONNÉES MARCHÉ — 4 tuiles les plus percutantes pour le diagnostic */}
      <div style={{ background: "#0a192f", borderRadius: 10, padding: 12, marginBottom: 16, border: "1px solid #e94560" + "22" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 45%", background: "#1a1a2e", borderRadius: 6, padding: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#e94560" }}>{MARKET_DATA.fosse.part_augmentes_changement}%</div>
            <div style={{ fontSize: 9, color: "#8892b0", lineHeight: 1.4 }}>des cadres qui changent sont augmentés</div>
          </div>
          <div style={{ flex: "1 1 45%", background: "#1a1a2e", borderRadius: 6, padding: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#495670" }}>{MARKET_DATA.fosse.part_augmentes_meme_poste}%</div>
            <div style={{ fontSize: 9, color: "#8892b0", lineHeight: 1.4 }}>sont augmentés en restant au même poste</div>
          </div>
          <div style={{ flex: "1 1 45%", background: "#1a1a2e", borderRadius: 6, padding: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#ff9800" }}>+{MARKET_DATA.friction.hausse_candidatures_ia}%</div>
            <div style={{ fontSize: 9, color: "#8892b0", lineHeight: 1.4 }}>de candidatures depuis l'IA générative</div>
          </div>
          <div style={{ flex: "1 1 45%", background: "#1a1a2e", borderRadius: 6, padding: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#ff9800" }}>{MARKET_DATA.reconversion.projet_reconversion}% → {MARKET_DATA.reconversion.demarches_entamees}%</div>
            <div style={{ fontSize: 9, color: "#8892b0", lineHeight: 1.4 }}>veulent bouger → bougent vraiment</div>
          </div>
        </div>
        <div style={{ fontSize: 8, color: "#495670", marginTop: 8, textAlign: "center" }}>
          Données : APEC 2022-2023, Baromètre Unédic 2025, LinkedIn Economic Graph 2026.
        </div>
      </div>

      {/* BLOC 4 — Ce que la Forge débloque */}
      {b4.transformation && (
        <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#4ecca3", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>CE QUE LE SPRINT DÉBLOQUE</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "#e94560", fontWeight: 700, marginBottom: 4 }}>AVANT — Ton CV aujourd'hui</div>
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, fontSize: 12, color: "#8892b0", lineHeight: 1.5, borderLeft: "3px solid #e94560" }}>
              {b4.transformation.before}
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 18, color: "#495670", margin: "4px 0" }}>{"\u2193"}</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "#4ecca3", fontWeight: 700, marginBottom: 4 }}>APRÈS — Après extraction Forge</div>
            <div style={{ background: "#4ecca3" + "15", borderRadius: 8, padding: 10, fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, fontWeight: 600, borderLeft: "3px solid #4ecca3" }}>
              {b4.transformation.after}
            </div>
          </div>
          {b4.transformation.isSimulated && (
            <div style={{ fontSize: 10, color: "#495670", fontStyle: "italic", textAlign: "center" }}>
              Transformation simulée. La Forge extrait TES vrais chiffres.
            </div>
          )}
        </div>
      )}

      {/* Readiness indicator */}
      {readiness && (
        <div style={{ background: readiness.readiness === "fort" ? "#4ecca3" + "15" : readiness.readiness === "moyen" ? "#ff9800" + "15" : "#e94560" + "15", borderRadius: 10, padding: 12, marginBottom: 16, border: "1px solid " + (readiness.readiness === "fort" ? "#4ecca3" : readiness.readiness === "moyen" ? "#ff9800" : "#e94560") }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: readiness.readiness === "fort" ? "#4ecca3" : readiness.readiness === "moyen" ? "#ff9800" : "#e94560", marginBottom: 6 }}>
            {readiness.readiness === "fort" ? "\u26A1" : readiness.readiness === "moyen" ? "\u26A0\uFE0F" : "\uD83D\uDEA8"} GISEMENT : {readiness.estimatedBricks} briques extractibles
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {readiness.details.map(function(d, i) {
              return <span key={i} style={{ fontSize: 10, color: d.ok ? "#4ecca3" : "#e94560" }}>{d.ok ? "\u2714" : "\u2718"} {d.label}</span>;
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <button onClick={function() { onStartSprint(); }} style={{
        width: "100%", padding: 16, background: "linear-gradient(135deg, #e94560, #c81d4e)",
        color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 16,
        boxShadow: "0 4px 20px rgba(233,69,96,0.3)", marginBottom: 8,
      }}>Lancer la Forge</button>
      <button onClick={function() {
        var lines = [];
        lines.push("=== DIAGNOSTIC ABNEG@TION ===\n");
        lines.push("CE QUE L'OFFRE DEMANDE VRAIMENT :");
        b1.cauchemars.forEach(function(c) {
          lines.push("- " + c.label + " : " + c.nightmareShort + " (cout : " + formatCost(c.costRange[0]) + " - " + formatCost(c.costRange[1]) + " / an)");
        });
        lines.push("\nCE QUE TON CV DIT AU RECRUTEUR :");
        b2.perceptions.forEach(function(p) {
          var icon = p.status === "silence" ? "[X]" : "[!]";
          lines.push(icon + " " + p.cauchemar + " : " + p.perception);
        });
        lines.push("\nLE FOSSÉ :");
        lines.push(b3.fossePct + "% de tes preuves sont invisibles. " + b3.totalCauchemars + " enjeux critiques, " + b3.coveredCount + " mentionnés, " + b3.proofCount + " prouvés.");
        if (b4.transformation) {
          lines.push("\nAVANT (ton CV) : " + b4.transformation.before);
          lines.push("APRÈS (après Forge) : " + b4.transformation.after);
          if (b4.transformation.isSimulated) lines.push("(Transformation simulée. La Forge extrait TES vrais chiffres.)");
        }
        lines.push("\n---\nDiagnostic produit par ABNEG@TION");
        var text = lines.join("\n");
        if (navigator.clipboard) { navigator.clipboard.writeText(text); }
        if (typeof onCopied === "function") onCopied();
      }} style={{
        width: "100%", padding: 12, background: "#16213e",
        color: "#8892b0", border: "1px solid #16213e", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13,
        marginBottom: 8,
      }}>Copier le diagnostic</button>
      <div style={{ fontSize: 11, color: "#495670", textAlign: "center" }}>Ta première munition en 20 minutes. Ton arsenal complet à ton rythme.</div>
    </div>
  );
}

/* ==============================
   ONBOARDING — Jevons reframe + elasticity in ready screen
   ============================== */

export function Onboarding({ onStart, onScan }) {
  var modeState = useState(null);
  var mode = modeState[0];
  var setMode = modeState[1];
  var roleState = useState(null);
  var targetRole = roleState[0];
  var setTargetRole = roleState[1];
  var cvState = useState("");
  var cv = cvState[0];
  var setCv = cvState[1];
  var offState = useState("");
  var offers = offState[0];
  var setOffers = offState[1];
  var phState = useState("input");
  var phase = phState[0];
  var setPhase = phState[1];
  var progState = useState(0);
  var scanProgress = progState[0];
  var setScanProgress = progState[1];
  var msgState = useState([]);
  var scanMessages = msgState[0];
  var setScanMessages = msgState[1];
  var scanDataState = useState(null);
  var scanData = scanDataState[0];
  var setScanData = scanDataState[1];
  var offerSignalsState = useState(null);
  var offerSignals = offerSignalsState[0];
  var setOfferSignals = offerSignalsState[1];

  var isPassif = mode === "passif";
  var canStart = isPassif ? cv.trim().length > 20 : (cv.trim().length > 20 && targetRole !== null);

  function handleScan() {
    setPhase("scanning");
    setScanProgress(0);
    setScanMessages([]);
    var steps = isPassif ? SCAN_STEPS_PASSIF : SCAN_STEPS_ACTIF;

    // Parse offer signals immediately (synchronous, keyword-based)
    if (!isPassif && offers.trim().length > 20 && targetRole) {
      var signals = parseOfferSignals(offers, targetRole);
      setOfferSignals(signals);
      // Set global cauchemars for immediate use in ready screen
      if (signals && signals.cauchemars) {
        setActiveCauchemarsGlobal(signals.cauchemars);
      }
    } else if (!isPassif && targetRole) {
      // No offer — use generic cauchemars from role templates
      setActiveCauchemarsGlobal(buildActiveCauchemars(null, targetRole));
    }

    // Show progress messages
    steps.forEach(function(msg, i) {
      setTimeout(function() {
        setScanMessages(function(prev) { return prev.concat([msg]); });
        setScanProgress(((i + 1) / steps.length) * 100);
      }, (i + 1) * 600);
    });

    // Call real LLM scan if available
    if (onScan) {
      onScan(cv, offers, targetRole).then(function(data) {
        if (data && !data.error) {
          setScanData(data);
        }
        setTimeout(function() { setPhase("ready"); }, Math.max(0, steps.length * 600 + 800 - Date.now()));
        setPhase("ready");
      }).catch(function() {
        setPhase("ready");
      });
    } else {
      // Fallback: just show progress then ready
      setTimeout(function() { setPhase("ready"); }, steps.length * 600 + 800);
    }
  }

  if (!mode) {
    return (
      <div style={{ padding: "8px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>ABNEG@TION</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ccd6f6", marginBottom: 8 }}>Le marché ne paie pas la performance.</div>
          <div style={{ fontSize: 14, color: "#8892b0", lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>Il paie la rareté. L'outil te montre où tu es rare, où tu es substituable, et comment inverser le rapport de force.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          <button onClick={function() { setMode("actif"); }} style={{
            background: "#0f3460", border: "2px solid #16213e", borderRadius: 12, padding: 20, cursor: "pointer", textAlign: "left", transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{"\uD83C\uDFAF"}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#ccd6f6", marginBottom: 4 }}>Je vise un poste précis</div>
            <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.5 }}>L'IA extrait les KPIs cachés, mesure l'élasticité du marché, et te dit où investir ton énergie.</div>
          </button>
          <button onClick={function() { setMode("passif"); }} style={{
            background: "#0f3460", border: "2px solid #16213e", borderRadius: 12, padding: 20, cursor: "pointer", textAlign: "left", transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{"\uD83D\uDC41\uFE0F"}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#ccd6f6", marginBottom: 4 }}>Je veux un diagnostic rapide</div>
            <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.5 }}>L'IA scanne ton profil en 30 secondes. Tu vois ce que les recruteurs voient. Si ça te convainc, tu passes à la Forge.</div>
          </button>
        </div>
      </div>
    );
  }

  if (phase === "ready") {
    var scoreLabel = "LE FOSSÉ";
    // Dynamic score based on offer signal analysis
    var detectedCount = offerSignals ? offerSignals.cauchemars.filter(function(c) { return c.detected; }).length : 0;
    var scorePct = isPassif ? 28 : (offerSignals && offerSignals.totalSignals > 0 ? Math.min(45, 20 + offerSignals.totalSignals * 3) : 32);
    var elasticCount = 0;
    if (targetRole && KPI_REFERENCE[targetRole]) {
      getActiveCauchemars().forEach(function(c) {
        var kpiMatch = KPI_REFERENCE[targetRole].kpis.find(function(k) { return c.kpis && c.kpis.indexOf(k.name) !== -1; });
        if (kpiMatch && kpiMatch.elasticity === "élastique") elasticCount++;
      });
    }
    var scoreMsg = isPassif
      ? "Tu es visible sur " + scorePct + "% des critères que les recruteurs utilisent pour te trouver."
      : "Tu comprends " + scorePct + "% des enjeux réels de tes offres cibles.";
    var subMsg = isPassif
      ? "3 KPIs clés de ton secteur t'échappent. Les recruteurs te cherchent. Ton profil ne répond pas."
      : (detectedCount > 0
        ? detectedCount + " enjeu" + (detectedCount > 1 ? "x" : "") + " critique" + (detectedCount > 1 ? "s" : "") + " détecté" + (detectedCount > 1 ? "s" : "") + " dans ton offre." + (elasticCount > 0 ? " " + elasticCount + " sur marché élastique. C'est là que tu dois frapper." : "")
        : "3 KPIs t'échappent. La Forge va les extraire de ton parcours.");

    // ITERATION 6 — Readiness diagnostic
    var readiness = estimateReadiness(cv, offers);

    return (
      <div style={{ padding: "32px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>{scoreLabel}</div>
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
          <div style={{ fontSize: 16, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>{scoreMsg}</div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>{subMsg}</div>
        </div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 16, textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#e94560", fontWeight: 600, letterSpacing: 1 }}>{isPassif ? "CE QUE TU RATES" : "CAUCHEMARS DÉTECTÉS DANS L'OFFRE"}</div>
            {offerSignals && offerSignals.totalSignals > 0 && (
              <span style={{ fontSize: 10, color: "#4ecca3", background: "#1a1a2e", padding: "2px 8px", borderRadius: 8 }}>{offerSignals.totalSignals} signaux</span>
            )}
          </div>
          {getActiveCauchemars().map(function(c, i) {
            var kpiRef = targetRole && KPI_REFERENCE[targetRole] ? KPI_REFERENCE[targetRole].kpis.find(function(k) { return c.kpis && c.kpis.indexOf(k.name) !== -1; }) : null;
            var elasticity = kpiRef ? kpiRef.elasticity : null;
            var eColor = elasticity === "élastique" ? "#4ecca3" : elasticity === "stable" ? "#8892b0" : elasticity === "sous_pression" ? "#e94560" : "#495670";
            var eLabel = elasticity === "élastique" ? "\u2197\uFE0F" : elasticity === "stable" ? "\u2194\uFE0F" : elasticity === "sous_pression" ? "\u2198\uFE0F" : "\u2022";
            var eText = elasticity === "élastique" ? "élastique" : elasticity === "stable" ? "stable" : elasticity === "sous_pression" ? "sous pression" : "";
            return (
              <div key={i} style={{ marginBottom: i < 2 ? 10 : 0 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                  <span style={{ fontSize: 13, color: "#ccd6f6", fontWeight: 600 }}>{"\uD83C\uDFAF"} {isPassif ? "Signal #" : "Cauchemar #"}{i + 1} : {c.label}</span>
                  {eText && <span style={{ fontSize: 10, color: eColor, background: "#1a1a2e", padding: "1px 6px", borderRadius: 8 }}>{eLabel} {eText}</span>}
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

        {/* ITERATION 6 — GISEMENT DÉTECTÉ */}
        {!isPassif && (
          <div style={{ background: readiness.readiness === "fort" ? "#4ecca3" + "15" : readiness.readiness === "moyen" ? "#ff9800" + "15" : "#e94560" + "15", borderRadius: 10, padding: 14, marginBottom: 16, border: "1px solid " + (readiness.readiness === "fort" ? "#4ecca3" : readiness.readiness === "moyen" ? "#ff9800" : "#e94560") }}>
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
                ? "Gisement dense. La Forge va extraire des briques fortes. Tu as les chiffres et les méthodes. Les signaux de leadership sont là."
                : readiness.readiness === "moyen"
                ? "Gisement partiel. La Forge va extraire des briques mais certaines zones resteront floues. Prépare-toi à des missions de récupération de données."
                : "Gisement faible. La Forge va révéler tes trous. Beaucoup de missions. C'est honnête, pas agréable. Si tu as accès à tes anciens outils (CRM, reporting), récupère tes chiffres avant de commencer."
              }
            </div>
          </div>
        )}

        {/* LIGHT CROSS-ROLE HINT — pre-Forge signal based on CV keywords */}
        {!isPassif && targetRole && (function() {
          var cvLower = cv.toLowerCase();
          var roleIds = Object.keys(KPI_REFERENCE);
          var hints = [];
          roleIds.forEach(function(rId) {
            if (rId === targetRole) return;
            var rd = KPI_REFERENCE[rId];
            var matchCount = 0;
            rd.kpis.forEach(function(kpi) {
              var words = kpi.name.toLowerCase().split(/[\s\/\(\)]+/).filter(function(w) { return w.length > 3; });
              words.forEach(function(w) { if (cvLower.indexOf(w) !== -1) matchCount++; });
            });
            if (matchCount >= 3) hints.push({ role: rd.role, matches: matchCount, roleId: rId });
          });
          hints.sort(function(a, b) { return b.matches - a.matches; });
          if (hints.length === 0) return null;
          var best = hints[0];
          return (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 16, borderLeft: "3px solid #3498db" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 12 }}>{"\uD83D\uDDFA\uFE0F"}</span>
                <span style={{ fontSize: 11, color: "#3498db", fontWeight: 700 }}>SIGNAL : TERRAIN ADJACENT</span>
              </div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
                Ton profil contient des signaux compatibles avec {best.role}. La Forge précisera si tes preuves couvrent ce terrain mieux que {KPI_REFERENCE[targetRole] ? KPI_REFERENCE[targetRole].role : "ton choix"}.
              </div>
            </div>
          );
        })()}

        {isPassif ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#8892b0", marginBottom: 16, lineHeight: 1.6 }}>
              Voilà ce que les recruteurs voient. Si tu veux changer ça, la Forge extrait tes preuves cachées, construit ton arsenal et te positionne sur les terrains élastiques.
            </div>
            <button onClick={function() { setMode("actif"); setPhase("input"); }} style={{
              width: "100%", padding: 16, background: "linear-gradient(135deg, #e94560, #c81d4e)",
              color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 16,
              boxShadow: "0 4px 20px rgba(233,69,96,0.3)",
            }}>Passer à l'Assemblage</button>
            <div style={{ fontSize: 11, color: "#495670", marginTop: 10 }}>Le profil que tu as collé est déjà chargé. Ajoute tes offres cibles et choisis ton poste.</div>
          </div>
        ) : (
          <DiagnosticScreen
            diagnostic={generateDiagnostic(cv, offers, targetRole)}
            cvText={cv}
            offerText={offers}
            roleId={targetRole}
            readiness={readiness}
            onStartSprint={function() { onStart(targetRole, offerSignals, offers); }}
          />
        )}
      </div>
    );
  }

  if (phase === "scanning") {
    var steps = isPassif ? SCAN_STEPS_PASSIF : SCAN_STEPS_ACTIF;
    return (
      <div style={{ padding: "40px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>{"\uD83D\uDD0D"}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#ccd6f6" }}>
            {isPassif ? "L'IA scanne ta visibilité" : "L'IA scanne ton profil et le marché"}
          </div>
        </div>
        <div style={{ width: "100%", background: "#1a1a2e", borderRadius: 8, height: 6, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ width: scanProgress + "%", height: "100%", background: "linear-gradient(90deg, #e94560, #ff6b6b)", borderRadius: 8, transition: "width 0.4s ease" }} />
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

  // Group clusters by bloc
  var blocs = {};
  ROLE_CLUSTERS.forEach(function(c) {
    if (!blocs[c.bloc]) blocs[c.bloc] = [];
    blocs[c.bloc].push(c);
  });
  var blocNames = Object.keys(blocs);

  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>ABNEG@TION</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#ccd6f6", marginBottom: 8 }}>{isPassif ? "Ton profil est-il visible là où ça compte ?" : "Identifie où ta compétence rencontre la demande."}</div>
        <div style={{ color: "#495670", fontSize: 12, marginTop: 4 }}>Temps estimé : 2 minutes.</div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>{"\uD83D\uDC64"}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>Ton profil</span>
        </div>
        <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 8 }}>Colle ton CV, ta bio LinkedIn, ou décris ton dernier poste en quelques lignes.</div>
        <textarea value={cv} onChange={function(e) { setCv(e.target.value); }}
          placeholder="Ex : Account Executive chez Spendesk (2 ans). Cycle de vente complet Mid-Market. Portefeuille de 45 comptes, ARR géré 1.2M€..."
          style={{ width: "100%", minHeight: 120, padding: 14, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 10, color: "#ccd6f6", fontSize: 13, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
        />
        <div style={{ fontSize: 11, color: cv.trim().length > 20 ? "#495670" : "#e94560", marginTop: 4, textAlign: "right" }}>
          {cv.trim().length > 20 ? "Suffisant" : "Minimum 20 caractères"}
        </div>
      </div>
      {!isPassif && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>{"\uD83C\uDFAF"}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>Une offre qui t'intéresse (optionnel)</span>
          </div>
          <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 8 }}>Colle 1 à 3 offres d'emploi, ou décris le poste que tu vises.</div>
          <textarea value={offers} onChange={function(e) { setOffers(e.target.value); }}
            placeholder="Ex : Account Executive Mid-Market — Scale-up SaaS B2B série B. Prospection outbound, démos, closing. 3+ ans expérience SaaS..."
            style={{ width: "100%", minHeight: 120, padding: 14, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 10, color: "#ccd6f6", fontSize: 13, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 11, color: "#495670", marginTop: 4, textAlign: "right" }}>
            {offers.trim().length > 20 ? "Offre détectée" : "Optionnel — cauchemars génériques du rôle"}
          </div>
        </div>
      )}
      {/* ITERATION 1 — ROLE SELECTOR with clusters + toggle */}
      {!isPassif && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>{"\uD83D\uDCBC"}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6" }}>Quel poste tu vises ?</span>
          </div>
          <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 12 }}>Choisis la famille de métier. L'IA classe tes briques contre les 5 KPIs de ce poste.</div>

          {blocNames.map(function(blocName) {
            return (
              <div key={blocName} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#495670", fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>{blocName}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {blocs[blocName].map(function(cluster) {
                    var sel = targetRole === cluster.id;
                    return (
                      <button key={cluster.id} onClick={function() { setTargetRole(cluster.id); }} style={{
                        background: sel ? "#0f3460" : "#1a1a2e",
                        border: sel ? "2px solid #e94560" : "2px solid #16213e",
                        borderRadius: 8, padding: "10px 12px", cursor: "pointer", textAlign: "left", transition: "all 0.2s",
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
          {targetRole && (
            <div style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginTop: 8 }}>
              <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 6 }}>5 KPIS DE CE POSTE</div>
              {KPI_REFERENCE[targetRole].kpis.map(function(k, i) {
                var eColor = k.elasticity === "élastique" ? "#4ecca3" : k.elasticity === "stable" ? "#8892b0" : "#e94560";
                var eLabel = k.elasticity === "élastique" ? "\u2197\uFE0F" : k.elasticity === "stable" ? "\u2194\uFE0F" : "\u2198\uFE0F";
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

        </div>
      )}
      {/* Contexte IA — juste avant La Forge */}
      {canStart && (
        <div style={{ background: "#3498db" + "12", borderRadius: 8, padding: 10, marginBottom: 12, border: "1px solid #3498db" + "33" }}>
          <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700, color: "#3498db" }}>{MARKET_DATA.ia_recrutement.tri_cv_par_ia}% des recruteurs</span> trient par algorithme. Un CV sans chiffre ancré ne passe plus le filtre. La Forge blinde tes preuves pour qu'elles résistent au tri IA.
          </div>
          <div style={{ fontSize: 8, color: "#495670", marginTop: 4 }}>Baromètre recrutement IA 2025-2026</div>
        </div>
      )}
      <button onClick={handleScan} disabled={!canStart} style={{
        width: "100%", padding: 16,
        background: canStart ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
        color: canStart ? "#fff" : "#495670", border: canStart ? "none" : "2px solid #16213e",
        borderRadius: 12, cursor: canStart ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 15,
        boxShadow: canStart ? "0 4px 20px rgba(233,69,96,0.3)" : "none",
      }}>{canStart ? (isPassif ? "Scanner ma visibilité" : "Lancer l'extraction") : "Remplis les champs pour commencer"}</button>
      <div style={{ fontSize: 11, color: "#495670", textAlign: "center", marginTop: 8 }}>Gratuit. Sans compte. Tes données ne sont pas stockées.</div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={function() { setMode(null); setCv(""); setOffers(""); setTargetRole(null); }} style={{
          flex: 1, padding: 10, background: "#1a1a2e", color: "#495670", border: "1px solid #16213e",
          borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
        }}>{"\u2190"} Changer de mode</button>
      </div>
    </div>
  );
}
