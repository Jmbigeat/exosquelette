"use client";
import { useState, useEffect, useRef } from "react";
import { analyzeOffer } from "@/lib/eclaireur/analyze";
import { auditExternalCV } from "@/lib/eclaireur/audit-cv";
import { formatCost } from "@/lib/sprint/scoring";
import { CAUCHEMAR_TEMPLATES_BY_ROLE } from "@/lib/sprint/references";

var SCAN_MESSAGES = [
  "Lecture de l'offre...",
  "Extraction des signaux du recruteur...",
  "Identification du cauchemar principal...",
  "Calcul du KPI caché...",
  "Croisement marché terminé.",
];

var SCAN_MESSAGES_CV = [
  "Lecture de ton profil...",
  "Croisement profil × cauchemars...",
  "Diagnostic terminé.",
];

export function Eclaireur() {
  var phaseSt = useState("input");
  var phase = phaseSt[0];
  var setPhase = phaseSt[1];
  var textSt = useState("");
  var text = textSt[0];
  var setText = textSt[1];
  var cvTextSt = useState("");
  var cvText = cvTextSt[0];
  var setCvText = cvTextSt[1];
  var progressSt = useState(0);
  var progress = progressSt[0];
  var setProgress = progressSt[1];
  var messagesSt = useState([]);
  var messages = messagesSt[0];
  var setMessages = messagesSt[1];
  var resultSt = useState(null);
  var result = resultSt[0];
  var setResult = resultSt[1];
  var cvAuditSt = useState(null);
  var cvAudit = cvAuditSt[0];
  var setCvAudit = cvAuditSt[1];

  var canScan = text.trim().length >= 50;
  var hasCv = cvText.trim().length >= 100;

  function handleScan() {
    setPhase("scan");
    setProgress(0);
    setMessages([]);

    var allMessages = hasCv ? SCAN_MESSAGES.concat(SCAN_MESSAGES_CV) : SCAN_MESSAGES;
    var total = allMessages.length;

    allMessages.forEach(function(msg, i) {
      setTimeout(function() {
        setMessages(function(prev) { return prev.concat([msg]); });
        setProgress(((i + 1) / total) * 100);
      }, (i + 1) * 700);
    });

    setTimeout(function() {
      var analysis = analyzeOffer(text);
      setResult(analysis);

      if (hasCv && analysis) {
        var cauchemars = [];
        if (analysis.allCauchemars && analysis.allCauchemars.length > 0) {
          cauchemars = analysis.allCauchemars;
        } else {
          var templates = CAUCHEMAR_TEMPLATES_BY_ROLE[analysis.detectedRoleId] || [];
          cauchemars = templates.map(function(t) {
            return { label: t.label, kpis: t.kpis, kw: t.kw, nightmareShort: t.nightmare, costRange: t.cost };
          });
        }
        var audit = auditExternalCV(cvText, analysis, cauchemars);
        setCvAudit(audit);
      } else {
        setCvAudit(null);
      }

      setPhase("result");
    }, total * 700 + 500);
  }

  // ===== INPUT =====
  if (phase === "input") {
    return (
      <div style={{ padding: "8px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>ABNEG@TION</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ccd6f6", marginBottom: 8 }}>Colle une offre. Je te montre ce que le recruteur cache.</div>
          <div style={{ fontSize: 14, color: "#8892b0", lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>Gratuit. Pas de compte. 30 secondes.</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <textarea
            value={text}
            onChange={function(e) { setText(e.target.value); }}
            placeholder="Colle ici l'intégralité d'une offre d'emploi (description de poste, missions, compétences demandées...)"
            style={{
              width: "100%", minHeight: 160, padding: 14, background: "#1a1a2e",
              border: "2px solid #16213e", borderRadius: 10, color: "#ccd6f6",
              fontSize: 13, lineHeight: 1.6, resize: "vertical", outline: "none",
              fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
          <div style={{ fontSize: 11, color: canScan ? "#495670" : "#e94560", marginTop: 4, textAlign: "right" }}>
            {canScan ? text.trim().length + " caractères" : "Minimum 50 caractères (" + text.trim().length + "/50)"}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "#8892b0", fontWeight: 600, marginBottom: 6 }}>Ton profil</div>
          <textarea
            value={cvText}
            onChange={function(e) { setCvText(e.target.value); }}
            placeholder="Colle ton CV, ta bio LinkedIn, ou décris ton parcours... (optionnel)"
            style={{
              width: "100%", minHeight: 100, padding: 14, background: "#1a1a2e",
              border: "2px solid #16213e", borderRadius: 10, color: "#ccd6f6",
              fontSize: 13, lineHeight: 1.6, resize: "vertical", outline: "none",
              fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
          <div style={{ fontSize: 11, color: "#495670", marginTop: 4 }}>
            Optionnel. Sans ton CV, l'outil analyse l'offre. Avec ton CV, il mesure l'écart.
          </div>
        </div>

        <button onClick={handleScan} disabled={!canScan} style={{
          width: "100%", padding: 16,
          background: canScan ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
          color: canScan ? "#fff" : "#495670",
          border: canScan ? "none" : "2px solid #16213e",
          borderRadius: 12, cursor: canScan ? "pointer" : "not-allowed",
          fontWeight: 700, fontSize: 15,
          boxShadow: canScan ? "0 4px 20px rgba(233,69,96,0.3)" : "none",
        }}>{hasCv ? "Scanner l'offre × ton profil" : "Scanner l'offre"}</button>

        <div style={{ fontSize: 11, color: "#495670", textAlign: "center", marginTop: 10 }}>
          🔒 L'offre et le CV ne sont ni stockés ni partagés.
        </div>
      </div>
    );
  }

  // ===== SCAN =====
  if (phase === "scan") {
    return (
      <div style={{ padding: "40px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#ccd6f6" }}>{hasCv ? "Analyse de l'offre × ton profil" : "Analyse de l'offre en cours"}</div>
        </div>
        <div style={{ width: "100%", background: "#1a1a2e", borderRadius: 8, height: 6, overflow: "hidden", marginBottom: 24 }}>
          <div style={{
            width: progress + "%", height: "100%",
            background: "linear-gradient(90deg, #e94560, #ff6b6b)",
            borderRadius: 8, transition: "width 0.4s ease",
          }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {messages.map(function(msg, i) {
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: i === messages.length - 1 ? 1 : 0.5, transition: "opacity 0.3s" }}>
                <span style={{ color: "#e94560", fontSize: 14 }}>{i < messages.length - 1 ? "✔" : "▸"}</span>
                <span style={{ fontSize: 13, color: "#ccd6f6" }}>{msg}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== RÉSULTAT =====
  if (phase === "result" && result) {
    var nm = result.mainNightmare;
    var kpi = result.revealedKpi;
    var eColor = kpi && kpi.elasticity === "élastique" ? "#4ecca3" : kpi && kpi.elasticity === "sous_pression" ? "#e94560" : "#8892b0";
    var eLabel = kpi && kpi.elasticity === "élastique" ? "élastique" : kpi && kpi.elasticity === "stable" ? "stable" : kpi && kpi.elasticity === "sous_pression" ? "sous pression" : "";
    var costStr = nm.costRange ? formatCost(nm.costRange[0]) + " - " + formatCost(nm.costRange[1]) + " / an" : "";

    var cvScore = cvAudit ? cvAudit.score : 0;
    var scoreColor = cvScore >= 4 ? "#4ecca3" : cvScore >= 3 ? "#ff9800" : "#e94560";

    // CTA text
    var ctaText = "Tu as vu le problème. La Forge te donne la solution.";
    if (cvAudit) {
      if (cvScore === 5) {
        ctaText = "Ton CV couvre les cauchemars du recruteur. La Forge stress-teste tes preuves et calibre tes livrables.";
      } else if (cvScore >= 3) {
        ctaText = "Ton CV couvre une partie du problème. La Forge le calibre sur les cauchemars manquants.";
      } else {
        ctaText = "Ton CV ne répond pas à ce que le recruteur cherche. La Forge extrait tes vraies preuves et les formate.";
      }
    }

    return (
      <div style={{ padding: "8px 0" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>ABNEG@TION</div>
          <div style={{ fontSize: 10, color: "#495670", marginBottom: 4 }}>Rôle détecté : {result.detectedRoleLabel}</div>
        </div>

        {/* BLOC RÉVÉLÉ — KPI CACHÉ (V1 inchangé) */}
        <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>KPI CACHÉ DU RECRUTEUR</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>{nm.label}</div>
          <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6, marginBottom: 10 }}>{nm.nightmareShort}</div>
          {costStr && (
            <div style={{ fontSize: 12, color: "#e94560", fontWeight: 600, marginBottom: 12 }}>Coût du problème : {costStr}</div>
          )}

          {kpi && (
            <div style={{ borderTop: "1px solid #16213e", paddingTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#ccd6f6" }}>{kpi.name}</span>
                {eLabel && <span style={{ fontSize: 9, color: eColor, background: eColor + "22", padding: "1px 6px", borderRadius: 6, marginLeft: 6 }}>{eLabel}</span>}
              </div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>{kpi.why}</div>
              {kpi.elasticity === "élastique" && ["enterprise_ae", "strategic_csm"].indexOf(result.detectedRoleId) !== -1 && (
                <div style={{ fontSize: 11, color: "#4ecca3", fontStyle: "italic", marginTop: 6 }}>62,8% des tâches commerciales sont automatisables (Anthropic, 2026). Pas celle-ci.</div>
              )}
            </div>
          )}

          {nm.detected && nm.matchedKw && nm.matchedKw.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
              {nm.matchedKw.slice(0, 5).map(function(kw, ki) {
                return <span key={ki} style={{ fontSize: 9, color: "#4ecca3", background: "#1a1a2e", padding: "1px 6px", borderRadius: 6 }}>{kw}</span>;
              })}
            </div>
          )}
        </div>

        {/* MESSAGE CV ANGLAIS */}
        {cvAudit && cvAudit.isEnglish && (
          <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>LANGUE DÉTECTÉE : ANGLAIS</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6 }}>{cvAudit.message}</div>
          </div>
        )}

        {/* MESSAGE CV TROP COURT */}
        {!cvAudit && cvText.trim().length > 0 && cvText.trim().length < 100 && (
          <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6 }}>Ton texte est trop court pour un diagnostic fiable. Colle au moins 3 lignes de ton CV ou de ta bio LinkedIn.</div>
          </div>
        )}

        {/* BLOC DIAGNOSTIC CV (conditionnel) */}
        {cvAudit && cvAudit.tests.length > 0 && (
          <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1 }}>TON CV FACE À CETTE OFFRE</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: scoreColor }}>{cvScore}/5</div>
            </div>

            {cvAudit.tests.map(function(t, idx) {
              return (
                <div key={idx} style={{ marginBottom: idx < cvAudit.tests.length - 1 ? 10 : 0 }}>
                  <div style={{ fontSize: 12, color: t.passed ? "#4ecca3" : "#e94560", lineHeight: 1.5 }}>
                    {t.passed ? "✓" : "✗"} {t.label}
                  </div>
                  {!t.passed && t.message && (
                    <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5, paddingLeft: 16, marginTop: 2 }}>
                      → {t.message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* BLOC FLOUTÉ */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <div style={{ filter: "blur(6px)", userSelect: "none", pointerEvents: "none" }}>
            <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>3 AUTRES KPIS CACHÉS</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#ccd6f6", marginBottom: 2 }}>Capacité de rétention des talents clés</div>
                <div style={{ fontSize: 11, color: "#8892b0" }}>Le recruteur cherche quelqu'un qui empêche les départs en chaîne. Coût caché : 150K-400K / an.</div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#ccd6f6", marginBottom: 2 }}>Vitesse d'exécution stratégique</div>
                <div style={{ fontSize: 11, color: "#8892b0" }}>L'équipe produit des slides. Le board veut des résultats. Coût de l'inertie : 200K-600K / an.</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#ccd6f6", marginBottom: 2 }}>Alignement inter-équipes</div>
                <div style={{ fontSize: 11, color: "#8892b0" }}>Trois départements travaillent en silo. Le projet avance trois fois moins vite que prévu.</div>
              </div>
            </div>
            <div style={{ background: "#0f3460", borderRadius: 12, padding: 16, marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>BRIQUES DE PREUVE RECOMMANDÉES</div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>4 briques identifiées dans ton profil. Chaque brique couvre un cauchemar spécifique et transforme ton CV en arsenal de négociation.</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, background: "#0f3460", borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 11, color: "#e94560", fontWeight: 700, marginBottom: 4 }}>CARTE DU MARCHÉ</div>
                <div style={{ fontSize: 11, color: "#8892b0" }}>3 signaux d'urgence. Poste ouvert depuis 8 semaines.</div>
              </div>
              <div style={{ flex: 1, background: "#0f3460", borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 700, marginBottom: 4 }}>SCORE</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#4ecca3" }}>34%</div>
                <div style={{ fontSize: 10, color: "#8892b0" }}>de tes preuves sont visibles</div>
              </div>
            </div>
          </div>
          {/* Overlay texte sur le blur */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(10,10,26,0.4)", borderRadius: 12,
          }}>
            <div style={{ textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6", marginBottom: 4 }}>Analyse complète verrouillée</div>
              <div style={{ fontSize: 12, color: "#8892b0" }}>La Forge débloque les 4 KPIs, les briques de preuve et la carte du marché.</div>
            </div>
          </div>
        </div>

        {/* SÉPARATEUR */}
        <div style={{ borderTop: "1px solid #16213e", margin: "20px 0" }} />

        {/* CTA */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#ccd6f6", marginBottom: 8, lineHeight: 1.5 }}>
            {ctaText}
          </div>
        </div>

        <button onClick={function() {
          try {
            sessionStorage.setItem("eclaireur_data", JSON.stringify({
              offerText: text,
              cvText: cvText || null,
              detectedRoleId: result.detectedRoleId || null,
              detectedRoleLabel: result.detectedRoleLabel || null,
            }));
          } catch (e) {}
          window.location.href = "/onboarding";
        }} style={{
          width: "100%", padding: 18,
          background: "linear-gradient(135deg, #e94560, #c81d4e)",
          color: "#fff", border: "none", borderRadius: 12, cursor: "pointer",
          fontWeight: 700, fontSize: 16,
          boxShadow: "0 4px 20px rgba(233,69,96,0.3)",
        }}>Lancer ma Forge — Gratuit</button>

        <div style={{ fontSize: 12, color: "#8892b0", textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
          CV réécrit. Bio calibrée. Script de contact. Préparation entretien. Score de densité.
        </div>

        {/* Recommencer */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button onClick={function() { setPhase("input"); setResult(null); setCvAudit(null); setText(""); setCvText(""); }} style={{
            background: "none", border: "none", color: "#495670", fontSize: 12, cursor: "pointer",
          }}>Scanner une autre offre</button>
        </div>
      </div>
    );
  }

  return null;
}
