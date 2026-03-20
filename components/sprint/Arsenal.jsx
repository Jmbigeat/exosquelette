"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { ROLE_CLUSTERS, SALARY_RANGES_BY_ROLE, OTE_SPLIT_BY_ROLE } from "@/lib/sprint/references";
import { computeCauchemarCoverage, computeDensityScore, assessBrickArmor } from "@/lib/sprint/scoring";
import { hasReachedSignatureThreshold } from "@/lib/sprint/signature";
import { auditCVForge } from "@/lib/forge/audit-cv-forge";

/* ==============================
   ARSENAL — GPS DES MANQUES (Chantier 8)
   5 blocs : radar 6 axes, prochaine action, simulation delta, audit CV, position marché
   Zéro donnée nouvelle : affichage des calculs existants
   ============================== */

export function Arsenal({
  density,
  bricks,
  nightmares,
  signatureThreshold,
  signature,
  vault,
  duelResults,
  pieces,
  onGoToBrick,
  onClose,
  previousRole,
  targetRoleId,
  cvText,
  setCvText,
  currentSalary,
  acvTarget,
  setAcvTarget,
}) {
  if (!density || !density.axes || density.axes.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#495670", lineHeight: 1.6 }}>
          Pas encore de données. Forge tes premières briques.
        </div>
      </div>
    );
  }
  var validated = (bricks || []).filter(function (b) {
    return b.status === "validated";
  });
  if (validated.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#495670", lineHeight: 1.6 }}>
          Aucune brique validée. Forge ta première brique pour activer l{"'"}Arsenal.
        </div>
      </div>
    );
  }

  // Debounced CV text for textarea — 500ms delay before persisting
  var localCvState = useState(cvText || "");
  var localCv = localCvState[0];
  var setLocalCv = localCvState[1];
  var debounceRef = useRef(null);

  function handleCvChange(e) {
    var val = e.target.value;
    setLocalCv(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(function () {
      setCvText(val);
    }, 500);
  }

  // Sync localCv if cvText changes externally (e.g. state restore)
  useEffect(
    function () {
      setLocalCv(cvText || "");
    },
    [cvText]
  );

  // Audit CV × Forge — reactive via useMemo
  var auditResult = useMemo(
    function () {
      if (!cvText || cvText.length < 100) return null;
      return auditCVForge(cvText, bricks, nightmares, density, signature);
    },
    [cvText, bricks, nightmares, density, signature]
  );

  // Salary diagnostic — bloc 5
  var salaryDiag = useMemo(
    function () {
      if (!currentSalary || currentSalary <= 0) return null;
      var ranges = SALARY_RANGES_BY_ROLE[targetRoleId];
      if (!ranges) return null;

      var percentile;
      if (currentSalary <= ranges.p25) percentile = "< P25";
      else if (currentSalary <= ranges.p50) percentile = "P25-P50";
      else if (currentSalary <= ranges.p75) percentile = "P50-P75";
      else percentile = "> P75";

      var deltaP50 = currentSalary - ranges.p50;
      var deltaPercent = Math.round((deltaP50 / ranges.p50) * 100);

      var oteSplit = OTE_SPLIT_BY_ROLE[targetRoleId] || null;
      var oteAlert = null;
      if (oteSplit && acvTarget && acvTarget > 0) {
        var ratio = Math.round((currentSalary / acvTarget) * 100);
        if (ratio > 35) {
          oteAlert = "OTE/ACV = " + ratio + "% (seuil : 35%). Variable structurellement inatteignable.";
        }
      }

      return {
        ranges: ranges,
        percentile: percentile,
        deltaP50: deltaP50,
        deltaPercent: deltaPercent,
        oteSplit: oteSplit,
        oteAlert: oteAlert,
      };
    },
    [currentSalary, targetRoleId, acvTarget]
  );

  var axes = density.axes;
  var isVitrine = pieces != null && pieces <= 0;

  // Weakest axis
  var weakest = axes.reduce(function (min, ax) {
    return ax.pct < min.pct ? ax : min;
  }, axes[0]);

  // Cauchemar coverage
  var coverage = computeCauchemarCoverage(bricks || []);
  var uncovered = coverage.filter(function (c) {
    return !c.covered;
  });
  var uncoveredLabels = uncovered.map(function (c) {
    return c.label;
  });

  // Recommendation: best nightmare to cover next
  var recommendation = null;
  if (uncovered.length > 0 && nightmares) {
    var scored = uncovered.map(function (unc) {
      var nightmareObj = nightmares.find(function (n) {
        return n.id === unc.id;
      });
      var fakeKpi = nightmareObj && nightmareObj.kpis ? nightmareObj.kpis[0] : "";
      var fakeBrick = {
        id: 99999,
        text: "Résultat de 100K€ via méthode structurée déployée auprès de l'équipe de 12 personnes en 3 mois, décision validée par le comité",
        kpi: fakeKpi,
        skills: [],
        usedIn: [],
        status: "validated",
        type: "brick",
        brickType: "preuve",
        brickCategory: "chiffre",
        stressTestAngle3Validated: true,
        owned: true,
        corrected: false,
      };
      var simBricks = (bricks || []).concat([fakeBrick]);
      var simDensity = computeDensityScore({
        bricks: simBricks,
        nightmares: nightmares,
        pillars: vault || null,
        signature: signature || null,
        duelResults: duelResults || [],
        cvBricks: [],
      });
      var axesImproved = [];
      simDensity.axes.forEach(function (simAx, i) {
        if (simAx.pct > axes[i].pct) axesImproved.push(axes[i].name);
      });
      var wouldTriggerSig = !signatureThreshold && !signature && hasReachedSignatureThreshold(simBricks);
      return {
        nightmare: unc,
        nightmareObj: nightmareObj,
        axesImproved: axesImproved,
        axesCount: axesImproved.length,
        scoreDelta: simDensity.score - density.score,
        simScore: simDensity.score,
        wouldTriggerSig: wouldTriggerSig,
      };
    });
    scored.sort(function (a, b) {
      if (b.axesCount !== a.axesCount) return b.axesCount - a.axesCount;
      return b.scoreDelta - a.scoreDelta;
    });
    recommendation = scored[0];
  }

  function axeColor(pct) {
    if (pct >= 70) return "#4ecca3";
    if (pct >= 40) return "#3498db";
    return "#e94560";
  }

  function formatSalary(n) {
    if (n >= 1000) return Math.round(n / 1000) + " 000";
    return String(n);
  }

  // Determine recommended angle for "Aller à la brique"
  var recommendedAngle =
    recommendation && recommendation.axesImproved.length > 0 ? recommendation.axesImproved[0] : null;

  // Trajectory computation
  var armoredBricks = validated.filter(function (b) {
    return assessBrickArmor(b).status === "armored";
  });
  var armoredCoveringCount = 0;
  var coveredCauchCount = 0;
  armoredBricks.forEach(function (b) {
    var covers = coverage.some(function (c) {
      return (
        c.covered &&
        c.kpi &&
        b.kpi &&
        (b.kpi.toLowerCase().indexOf(c.kpi.toLowerCase().slice(0, 6)) !== -1 ||
          c.kpi.toLowerCase().indexOf(b.kpi.toLowerCase().slice(0, 6)) !== -1)
      );
    });
    if (covers) armoredCoveringCount++;
  });
  coverage.forEach(function (c) {
    if (c.covered) coveredCauchCount++;
  });

  var trajectory = null;
  var targetCluster = ROLE_CLUSTERS.find(function (rc) {
    return rc.id === targetRoleId;
  });
  var targetLabel = targetCluster ? targetCluster.label.split(" / ")[0] : "ce poste";
  if (previousRole) {
    var prevLower = previousRole.toLowerCase();
    var prevCluster = null;
    ROLE_CLUSTERS.forEach(function (rc) {
      if (prevCluster) return;
      var words = rc.label
        .toLowerCase()
        .split(/[\s\/]+/)
        .filter(function (w) {
          return w.length > 3;
        });
      for (var wi = 0; wi < words.length; wi++) {
        if (prevLower.indexOf(words[wi]) !== -1) {
          prevCluster = rc;
          break;
        }
      }
    });
    if (!prevCluster) {
      trajectory = { type: "atypique", color: "#e94560", label: "trajectoire atypique" };
    } else if (!targetCluster) {
      trajectory = { type: "atypique", color: "#e94560", label: "trajectoire atypique" };
    } else if (prevCluster.bloc === targetCluster.bloc) {
      trajectory = { type: "lineaire", color: "#4ecca3", label: "trajectoire linéaire" };
    } else {
      trajectory = { type: "transverse", color: "#ff9800", label: "trajectoire transverse" };
    }
  }

  return (
    <div>
      {/* BLOC 0 — TRAJECTOIRE */}
      {previousRole && trajectory && armoredCoveringCount > 0 ? (
        <div
          style={{
            marginBottom: 16,
            padding: 14,
            background: "#111125",
            borderRadius: 10,
            borderLeft: "3px solid " + trajectory.color,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#e94560",
              fontWeight: 700,
              letterSpacing: 2,
              marginBottom: 10,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            TA TRAJECTOIRE
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0ff", marginBottom: 10 }}>
            {previousRole} {"→"} {targetLabel}
          </div>
          <div style={{ marginBottom: 8 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: trajectory.color,
                background: trajectory.color + "22",
                padding: "2px 8px",
                borderRadius: 6,
              }}
            >
              {"Distance : " + trajectory.label}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 8 }}>
            {armoredCoveringCount +
              " brique" +
              (armoredCoveringCount > 1 ? "s" : "") +
              " blindée" +
              (armoredCoveringCount > 1 ? "s" : "") +
              " couvr" +
              (armoredCoveringCount > 1 ? "ent" : "e") +
              " " +
              coveredCauchCount +
              " cauchemar" +
              (coveredCauchCount > 1 ? "s" : "") +
              " du rôle cible."}
          </div>
          <div style={{ fontSize: 12, color: "#8892b0", fontStyle: "italic", lineHeight: 1.6 }}>
            {trajectory.type === "lineaire"
              ? "Tu approfondis. " + coveredCauchCount + " cauchemars couverts prouvent ta maîtrise du domaine."
              : trajectory.type === "transverse"
                ? "Tu élargis. Tes compétences de " + previousRole + " enrichissent le rôle " + targetLabel + "."
                : "Tu réinventes. Le chemin de " +
                  previousRole +
                  " à " +
                  targetLabel +
                  " est ta preuve d'apprentissage."}
          </div>
        </div>
      ) : previousRole ? (
        <div style={{ marginBottom: 16, padding: 12, background: "#1a1a2e", borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: "#495670", lineHeight: 1.5 }}>
            Blinde tes briques pour débloquer ta trajectoire.
          </div>
        </div>
      ) : null}

      {/* Chantier 14 — Bandeau Mode Vitrine */}
      {displayMode === "vitrine" && (
        <div
          style={{
            background: "#1a1a2e",
            border: "1px solid #495670",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 12,
            color: "#8892b0",
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: "#ff6b6b", fontWeight: 700 }}>Mode Vitrine</span>
          {" — Tes livrables sont figés. La forge reste ouverte."}
        </div>
      )}

      {/* BLOC 1 — LE RADAR */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
          RADAR 6 AXES
        </div>
        {axes.map(function (ax, i) {
          var isWeakest = ax.name === weakest.name;
          var color = axeColor(ax.pct);
          return (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <span
                  style={{ fontSize: 11, color: isWeakest ? "#e94560" : "#8892b0", fontWeight: isWeakest ? 700 : 400 }}
                >
                  {isWeakest ? "\u25CF " : ""}
                  {ax.name} <span style={{ fontSize: 9, color: "#495670" }}>({ax.weight}%)</span>
                </span>
                <span style={{ fontSize: 11, color: color, fontWeight: 700 }}>{ax.pct}%</span>
              </div>
              <div style={{ width: "100%", background: "#1a1a2e", borderRadius: 4, height: 6, overflow: "hidden" }}>
                <div
                  style={{
                    width: Math.min(ax.pct, 100) + "%",
                    height: "100%",
                    background: isWeakest ? "#e94560" : color,
                    borderRadius: 4,
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
        <div
          style={{
            marginTop: 10,
            padding: 10,
            background: "#1a1a2e",
            borderRadius: 8,
            borderLeft: "3px solid #e94560",
          }}
        >
          <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>
            {"Axe faible : "}
            <span style={{ color: "#e94560", fontWeight: 700 }}>{weakest.name}</span>
            {" (" + weakest.pct + "%)."}
            {uncovered.length > 0
              ? " Cauchemar" +
                (uncovered.length > 1 ? "s" : "") +
                " non couvert" +
                (uncovered.length > 1 ? "s" : "") +
                " : " +
                uncoveredLabels.join(", ") +
                "."
              : " Tous les cauchemars sont couverts."}
          </div>
        </div>
      </div>

      {/* BLOC 2 — LA PROCHAINE ACTION */}
      {recommendation && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "#3498db", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
            PROCHAINE ACTION
          </div>
          <div style={{ padding: 12, background: "#0f3460", borderRadius: 10, borderLeft: "3px solid #3498db" }}>
            <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7 }}>
              {"Prochaine action : blinde ta brique « "}
              <span style={{ color: "#e94560", fontWeight: 700 }}>{recommendation.nightmare.label}</span>
              {" »"}
              {recommendation.axesImproved.length > 0
                ? " sur l'angle " + recommendation.axesImproved.join(" et ") + "."
                : "."}
            </div>
            {recommendation.nightmare.nightmareShort && (
              <div style={{ fontSize: 11, color: "#8892b0", marginTop: 6, fontStyle: "italic", lineHeight: 1.5 }}>
                {recommendation.nightmare.nightmareShort}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BLOC 3 — LA SIMULATION */}
      {recommendation && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "#4ecca3", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>
            SIMULATION
          </div>
          <div style={{ padding: 12, background: "#1a1a2e", borderRadius: 10, borderLeft: "3px solid #4ecca3" }}>
            <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7 }}>
              {"Si tu blindes cette brique, ton score passe de "}
              <span style={{ color: "#e94560", fontWeight: 700 }}>{density.score}%</span>
              {" à "}
              <span style={{ color: "#4ecca3", fontWeight: 700 }}>{recommendation.simScore}%</span>
              {"."}
              {recommendation.scoreDelta > 0 ? " (+" + recommendation.scoreDelta + " points)" : ""}
            </div>
            {recommendation.wouldTriggerSig && (
              <div
                style={{
                  marginTop: 8,
                  padding: 8,
                  background: "#4ecca3" + "15",
                  borderRadius: 6,
                  border: "1px solid #4ecca3" + "40",
                }}
              >
                <div style={{ fontSize: 11, color: "#4ecca3", lineHeight: 1.5, fontWeight: 600 }}>
                  {"Tu déclenches l'écran signature. Tes livrables Établi gagnent le filtre pattern."}
                </div>
              </div>
            )}
            {signatureThreshold && !signature && (
              <div
                style={{
                  marginTop: 8,
                  padding: 8,
                  background: "#4ecca3" + "15",
                  borderRadius: 6,
                  border: "1px solid #4ecca3" + "40",
                }}
              >
                <div style={{ fontSize: 11, color: "#4ecca3", lineHeight: 1.5, fontWeight: 600 }}>
                  {"Seuil signature atteint. Blinde cette brique pour armer ta signature."}
                </div>
              </div>
            )}

            {/* BOUTON — Aller à la brique / Vitrine CTA */}
            {!isVitrine && onGoToBrick && (
              <button
                onClick={function () {
                  var nightmareId = recommendation.nightmare ? recommendation.nightmare.id : null;
                  onGoToBrick(nightmareId, recommendedAngle);
                }}
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: 12,
                  background: "linear-gradient(135deg, #e94560, #c81d4e)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                Aller {"à"} la brique
              </button>
            )}
            {isVitrine && (
              <div style={{ marginTop: 12 }}>
                <button
                  style={{
                    width: "100%",
                    padding: 14,
                    background: "linear-gradient(135deg, #4ecca3, #2ecc71)",
                    color: "#0a0a1a",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  Continuer {"à"} forger {"—"} 10{"€"}/mois
                </button>
                <div style={{ fontSize: 11, color: "#8892b0", textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>
                  {"Ton score est à " +
                    density.score +
                    "%. " +
                    uncovered.length +
                    " cauchemar" +
                    (uncovered.length > 1 ? "s" : "") +
                    " non couvert" +
                    (uncovered.length > 1 ? "s" : "") +
                    ". La Forge reste ouverte."}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All covered */}
      {uncovered.length === 0 && (
        <div
          style={{
            padding: 12,
            background: "#4ecca3" + "15",
            borderRadius: 10,
            border: "1px solid #4ecca3" + "40",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 12, color: "#4ecca3", lineHeight: 1.6 }}>
            {
              "Tous les cauchemars sont couverts. Concentre-toi sur le blindage de tes briques les plus faibles pour monter en densité."
            }
          </div>
          {/* Vitrine CTA when all covered but pieces = 0 */}
          {isVitrine && (
            <div style={{ marginTop: 12 }}>
              <button
                style={{
                  width: "100%",
                  padding: 14,
                  background: "linear-gradient(135deg, #4ecca3, #2ecc71)",
                  color: "#0a0a1a",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Continuer {"à"} forger {"—"} 10{"€"}/mois
              </button>
              <div style={{ fontSize: 11, color: "#8892b0", textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>
                {"Ton score est à " + density.score + "%. La Forge reste ouverte."}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warnings from density */}
      {density.warnings && density.warnings.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {density.warnings.map(function (w, i) {
            return (
              <div
                key={i}
                style={{
                  fontSize: 11,
                  color: "#ff9800",
                  lineHeight: 1.5,
                  marginBottom: 4,
                  paddingLeft: 8,
                  borderLeft: "2px solid #ff9800" + "44",
                }}
              >
                {w}
              </div>
            );
          })}
        </div>
      )}

      {/* BLOC 5 — POSITION MARCHÉ */}
      {salaryDiag && (
        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <div
            style={{ fontSize: 10, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}
          >
            POSITION MARCHÉ
          </div>
          <div
            style={{
              padding: 12,
              background: "#111125",
              borderRadius: 10,
              borderLeft:
                "3px solid " +
                (salaryDiag.percentile === "> P75" || salaryDiag.percentile === "P50-P75"
                  ? "#4ecca3"
                  : salaryDiag.percentile === "P25-P50"
                    ? "#ff9800"
                    : "#e94560"),
            }}
          >
            <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7, marginBottom: 6 }}>
              {"Ton salaire : " +
                formatSalary(currentSalary) +
                "€ — " +
                salaryDiag.percentile +
                " (" +
                (salaryDiag.deltaPercent >= 0
                  ? salaryDiag.deltaPercent + "% au-dessus de"
                  : Math.abs(salaryDiag.deltaPercent) + "% sous") +
                " la médiane)"}
            </div>
            <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
              {"Médiane : " +
                formatSalary(salaryDiag.ranges.p50) +
                "€ | P75 : " +
                formatSalary(salaryDiag.ranges.p75) +
                "€"}
            </div>
            {salaryDiag.oteAlert && (
              <div
                style={{
                  marginTop: 8,
                  padding: 8,
                  background: "#e94560" + "15",
                  borderRadius: 6,
                  border: "1px solid #e94560" + "40",
                }}
              >
                <div style={{ fontSize: 11, color: "#e94560", lineHeight: 1.5, fontWeight: 600 }}>
                  {salaryDiag.oteAlert}
                </div>
              </div>
            )}
          </div>

          {/* ACV input — sales roles only */}
          {salaryDiag.oteSplit && !acvTarget && (
            <div style={{ fontSize: 11, color: "#ff9800", marginTop: 8, lineHeight: 1.5 }}>
              Renseigne ton ACV cible pour un diagnostic OTE complet.
            </div>
          )}
          {salaryDiag.oteSplit && (
            <div style={{ marginTop: 8 }}>
              <label
                style={{ fontSize: 10, color: "#495670", fontWeight: 700, letterSpacing: 1, display: "block", marginBottom: 4 }}
              >
                ACV CIBLE (€/AN)
              </label>
              <input
                type="number"
                placeholder={"Valeur contractuelle annuelle visée..."}
                value={acvTarget || ""}
                onChange={function (e) {
                  setAcvTarget(e.target.value ? Number(e.target.value) : null);
                }}
                style={{
                  width: "100%",
                  background: "#111125",
                  border: "1px solid #16213e",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#ccd6f6",
                  fontSize: 12,
                  outline: "none",
                  fontFamily: "Inter, sans-serif",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* BLOC 4 — AUDIT CV × FORGE */}
      {auditResult && auditResult.findings.length > 0 && (
        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <div
            style={{ fontSize: 10, color: "#e94560", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}
          >
            {"AUDIT CV × FORGE — " +
              auditResult.findings.filter(function (f) {
                return f.severity === "high";
              }).length +
              " point(s) critique(s)"}
          </div>
          {auditResult.findings.map(function (f, i) {
            var color = f.severity === "high" ? "#e94560" : "#ff9800";
            return (
              <div
                key={i}
                style={{
                  padding: 10,
                  marginBottom: 6,
                  borderLeft: "3px solid " + color,
                  background: "#111125",
                  borderRadius: 6,
                }}
              >
                <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.6 }}>{f.message}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* TEXTAREA CV — toujours visible */}
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <div
          style={{ fontSize: 10, color: "#495670", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}
        >
          TON CV
        </div>
        <textarea
          value={localCv}
          onChange={handleCvChange}
          maxLength={10000}
          placeholder={"Colle ton CV ici pour un diagnostic croisé avec tes briques forgées."}
          style={{
            width: "100%",
            minHeight: 120,
            padding: 12,
            background: "#111125",
            border: "1px solid #16213e",
            borderRadius: 8,
            color: "#ccd6f6",
            fontSize: 12,
            lineHeight: 1.6,
            resize: "vertical",
            fontFamily: "Inter, sans-serif",
          }}
        />
        {localCv && localCv.length > 0 && localCv.length < 100 && (
          <div style={{ fontSize: 10, color: "#495670", marginTop: 4 }}>
            {100 - localCv.length + " caractères restants avant diagnostic."}
          </div>
        )}
      </div>
    </div>
  );
}
