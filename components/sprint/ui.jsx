"use client";
import { useState } from "react";
import { detectSectoralDispersion } from "@/lib/sprint/offers";
import Tooltip from "@/components/ui/Tooltip";
import VOCABULARY from "@/lib/vocabulary";

export function Bar({ pct }) {
  return (
    <div style={{ width: "100%", background: "#1a1a2e", borderRadius: 8, height: 8, overflow: "hidden" }}>
      <div
        style={{
          width: pct + "%",
          height: "100%",
          background: "linear-gradient(90deg, #e94560, #ff6b6b)",
          borderRadius: 8,
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}

export function Nav({ steps, active, onSelect, density, etabliOpen, onEtabliToggle, etabliEnabled }) {
  var unlockStates = density ? [true, density.unlocks.forge, density.unlocks.armement] : [true, false, false];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
      {steps.map(function (s, i) {
        var isAct = i === active && !etabliOpen;
        var isDone = i < active;
        var isLocked = !unlockStates[i] && !isDone;
        return (
          <button
            key={i}
            onClick={function () {
              if (unlockStates[i] && i <= active) onSelect(i);
            }}
            style={{
              flex: 1,
              background: isAct ? "#e94560" : isDone ? "#0f3460" : "#1a1a2e",
              border: isAct ? "2px solid #e94560" : isLocked ? "2px solid #e94560" + "33" : "2px solid #16213e",
              borderRadius: 10,
              padding: "12px 6px",
              cursor: unlockStates[i] && i <= active ? "pointer" : "default",
              transition: "all 0.3s",
              opacity: isLocked ? 0.3 : !isAct && !isDone ? 0.5 : 1,
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 2 }}>
              {isDone ? "\u2705" : isLocked ? "\uD83D\uDD12" : s.icon}
            </div>
            <div style={{ fontSize: 9, color: isLocked ? "#e94560" : "#8892b0", fontWeight: 600 }}>{s.gate}</div>
            <div style={{ fontSize: 12, color: isAct ? "#fff" : "#ccd6f6", fontWeight: 700 }}>
              {s.title}
              <Tooltip
                term={s.title}
                text={
                  s.title === "Extraction"
                    ? VOCABULARY.extraction
                    : s.title === "Assemblage"
                      ? VOCABULARY.assemblage
                      : VOCABULARY.calibration
                }
              />
            </div>
          </button>
        );
      })}
      <button
        onClick={function () {
          if (etabliEnabled && onEtabliToggle) onEtabliToggle();
        }}
        style={{
          padding: "12px 12px",
          cursor: etabliEnabled ? "pointer" : "default",
          background: etabliOpen ? "#e94560" + "22" : "#1a1a2e",
          border: etabliOpen ? "2px solid #e94560" : "2px solid " + (etabliEnabled ? "#e94560" + "60" : "#16213e"),
          borderRadius: 10,
          opacity: etabliEnabled ? 1 : 0.3,
          transition: "all 0.3s",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ fontSize: 18, marginBottom: 2 }}>{"\u26A1"}</div>
        <div style={{ fontSize: 9, color: etabliEnabled ? "#e94560" : "#495670", fontWeight: 600 }}>GARDE: 1+</div>
        <div style={{ fontSize: 12, color: etabliOpen ? "#e94560" : "#ccd6f6", fontWeight: 700 }}>
          {"Établi"}
          <Tooltip term="Établi" text={VOCABULARY.etabli} />
        </div>
      </button>
    </div>
  );
}

export function CopyBtn({ text, label }) {
  var st = useState(false);
  var copied = st[0];
  var setCopied = st[1];
  function go() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setCopied(true);
        setTimeout(function () {
          setCopied(false);
        }, 1500);
      });
    } else {
      setCopied(true);
      setTimeout(function () {
        setCopied(false);
      }, 1500);
    }
  }
  return (
    <button
      onClick={go}
      style={{
        padding: "5px 12px",
        background: copied ? "#0f3460" : "#1a1a2e",
        color: copied ? "#e94560" : "#8892b0",
        border: copied ? "1px solid #e94560" : "1px solid #495670",
        borderRadius: 6,
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 11,
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
    >
      {copied ? "\u2713 Copie" : label || "Copier"}
    </button>
  );
}

export function Pillars({ pillars, takes, onVal, recommendations, onRefresh }) {
  var sel = useState([]);
  var selected = sel[0];
  var setSelected = sel[1];

  // Takes become primary pillars, AI pillars are complement
  var takePillars = takes
    .filter(function (t) {
      return t.status === "validated" && t.pillar;
    })
    .map(function (t, i) {
      return {
        id: "take_" + t.id,
        title: t.pillar.title,
        desc: t.pillar.desc,
        source: "take",
        depth: t.analysis ? t.analysis.level : "partial",
        text: t.text,
      };
    });
  var aiPillars = pillars.map(function (p) {
    var rec = recommendations
      ? recommendations.find(function (r) {
          return r.id === p.id;
        })
      : null;
    return {
      id: "ai_" + p.id,
      title: p.title,
      desc: p.desc,
      source: "ai",
      recommended: rec ? rec.recommended : false,
      reason: rec ? rec.reason : "",
    };
  });

  var hasAllFour = takePillars.length >= 4;

  function toggle(id) {
    setSelected(function (prev) {
      if (prev.includes(id))
        return prev.filter(function (x) {
          return x !== id;
        });
      if (prev.length < 4) return prev.concat([id]);
      return prev;
    });
  }

  var hasTakes = takePillars.length > 0;
  var takeCount = takePillars.length;
  var remaining = 4 - takeCount;

  return (
    <div>
      <style>{`@keyframes pillarPulse { 0%, 100% { background: #1a1a2e; } 50% { background: #16213e; } }`}</style>
      {/* HEADER */}
      <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>
        TES PRISES DE POSITION
      </div>
      <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 16, lineHeight: 1.5 }}>
        Ce sont les convictions que le recruteur ne trouvera pas sur un autre CV. Elles alimentent tes posts LinkedIn et
        ton pitch en entretien.
      </div>

      {/* DYNAMIC INSTRUCTION */}
      {hasAllFour ? (
        <div
          style={{
            background: "#4ecca3" + "22",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            borderLeft: "3px solid #4ecca3",
          }}
        >
          <div style={{ fontSize: 13, color: "#4ecca3", fontWeight: 600, lineHeight: 1.6 }}>
            Tes 4 positions sont prêtes. Elles alimentent tes posts LinkedIn et ton pitch en entretien.
          </div>
        </div>
      ) : (
        <div style={{ background: "#0f3460", borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.6 }}>
            {takeCount > 0
              ? "Tes " +
                takeCount +
                " position" +
                (takeCount > 1 ? "s" : "") +
                " " +
                (takeCount > 1 ? "sont acquises" : "est acquise") +
                ". Sélectionne " +
                remaining +
                " pilier" +
                (remaining > 1 ? "s" : "") +
                " complémentaire" +
                (remaining > 1 ? "s" : "") +
                " pour compléter tes 4 territoires. Un candidat avec 4 positions défendables se distingue de 94% des profils silencieux."
              : "Tu as 0 position sur 4. Choisis 4 piliers parmi les suggestions ci-dessous. Un candidat avec 4 positions défendables se distingue de 94% des profils silencieux."}
          </div>
        </div>
      )}

      {/* AI PILLARS — suggestions to validate (shown first) */}
      {!hasAllFour && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>
            {hasTakes ? "PILIERS COMPLÉMENTAIRES — DÉTECTÉS PAR L'IA" : "PILIERS DÉTECTÉS PAR L'IA"}
          </div>
          <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 12, lineHeight: 1.5 }}>
            {hasTakes
              ? "L'IA a croisé tes briques et ton secteur pour proposer des angles complémentaires. Sélectionne ceux qui reflètent ta vision."
              : "J'ai croisé tes briques et ton secteur. Tu n'as pas formulé de prise de position pendant l'interrogatoire. Ces piliers sont extraits de tes données. Ils servent de base, mais ils ne viennent pas de toi. La Forge suivante te posera la question."}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {aiPillars.map(function (p) {
              var isSel = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={function () {
                    toggle(p.id);
                  }}
                  style={{
                    background: isSel ? "#0f3460" : "#1a1a2e",
                    border: isSel ? "2px solid #e94560" : "2px solid #16213e",
                    borderRadius: 10,
                    padding: 14,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: isSel ? "#e94560" : "#ccd6f6" }}>
                      {isSel ? "\u2713 " : ""}
                      {p.title}
                    </div>
                    {recommendations === null && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 60,
                          height: 14,
                          borderRadius: 4,
                          background: "#1a1a2e",
                          animation: "pillarPulse 1.5s ease-in-out infinite",
                        }}
                      />
                    )}
                    {p.recommended && (
                      <span
                        style={{
                          fontSize: 9,
                          color: "#4ecca3",
                          background: "#1a1a2e",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        complémentaire
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#8892b0" }}>{p.desc}</div>
                  {p.recommended && p.reason && (
                    <div style={{ fontSize: 12, color: "#4ecca3", marginTop: 4 }}>{p.reason}</div>
                  )}
                </button>
              );
            })}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{
                background: "#1a1a2e",
                border: "1px solid #495670",
                color: "#8892b0",
                fontSize: 11,
                padding: "6px 12px",
                borderRadius: 6,
                marginTop: 8,
                cursor: "pointer",
              }}
            >
              Recharger les suggestions
            </button>
          )}
        </div>
      )}

      {/* NO TAKES WARNING */}
      {!hasTakes && (
        <div
          style={{
            background: "#e94560" + "15",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            borderLeft: "3px solid #e94560",
          }}
        >
          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>
            DIAGNOSTIC : AUCUNE PRISE DE POSITION FORMULÉE
          </div>
          <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>
            Tu n'as formulé aucune thèse contrariante sur ton secteur. Les piliers ci-dessus sont extraits de tes
            données. Ils fonctionnent, mais ils ne te séparent pas des autres candidats qui utilisent l'IA pour écrire.
            Au prochain Rendez-vous, le système te reposera la question.
          </div>
        </div>
      )}

      {/* TAKES — validated positions (shown second, as final result) */}
      {hasTakes && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>
            POSITIONS VALIDÉES
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {takePillars.map(function (p) {
              var hasNumber =
                /(\d[\d.,]*\s*[KkMm]?\s*[%€$£])|([\+\-]\s*\d[\d.,]*\s*[KkMm]?\s*[%€$£])|([x×]\s*\d[\d.,]*)/.test(
                  p.text || ""
                );
              return (
                <div
                  key={p.id}
                  style={{
                    background: "#0f3460",
                    border: "2px solid #3498db",
                    borderRadius: 10,
                    padding: 14,
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#3498db" }}>
                      {"\u2713 "}
                      {p.title}
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        color: hasNumber ? "#4ecca3" : "#ff9800",
                        background: "#1a1a2e",
                        padding: "2px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {hasNumber ? "prête" : "à armer"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#8892b0" }}>{p.desc}</div>
                  {!hasNumber && (
                    <div style={{ fontSize: 12, color: "#ff9800", marginTop: 6 }}>
                      Ajoute un chiffre de résultat (%, €, x...) pour armer cette position.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selected.length >= 2 && (
        <button
          onClick={function () {
            onVal(selected.length, selected, takePillars, aiPillars);
          }}
          style={{
            width: "100%",
            padding: 14,
            background: "linear-gradient(135deg, #e94560, #c81d4e)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          Valider {selected.length} pilier{selected.length > 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

export function Locked({ title, desc }) {
  return (
    <div style={{ textAlign: "center", padding: 36, opacity: 0.5 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{"\uD83D\uDD12"}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#8892b0" }}>{desc}</div>
    </div>
  );
}

export function OffersManager({ offersArray, onAdd, onRemove, coherence, targetRoleId }) {
  var inputState = useState("");
  var inputText = inputState[0];
  var setInputText = inputState[1];
  var typeState = useState("external");
  var offerType = typeState[0];
  var setOfferType = typeState[1];

  var minChars = 50;

  function handleAdd() {
    if (inputText.trim().length < minChars) return;
    onAdd(inputText.trim(), offerType);
    setInputText("");
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    var dd = String(d.getDate()).padStart(2, "0");
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var yyyy = d.getFullYear();
    return "Ajoutée le " + dd + "/" + mm + "/" + yyyy;
  }

  function offerSummary(offer) {
    var signals = offer.parsedSignals;
    if (signals && signals.cauchemars && signals.cauchemars.length > 0) {
      var first = signals.cauchemars.find(function (c) {
        return c.detected;
      });
      if (first) return first.label;
    }
    return offer.text.length > 50 ? offer.text.slice(0, 50) + "..." : offer.text;
  }

  var dispersion = detectSectoralDispersion(offersArray);

  return (
    <div>
      {/* Dispersion alert */}
      {dispersion && (
        <div
          style={{
            background: "#1a1a2e",
            borderRadius: 8,
            padding: 10,
            marginBottom: 12,
            borderLeft: "3px solid #ff9800",
          }}
        >
          <div style={{ fontSize: 11, color: "#ff9800", lineHeight: 1.5 }}>
            {"\u26A0\uFE0F"} {dispersion.message}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
            {dispersion.sectors.map(function (s, i) {
              return (
                <span
                  key={i}
                  style={{ fontSize: 9, color: "#ff9800", background: "#0a0a1a", padding: "1px 6px", borderRadius: 6 }}
                >
                  {s}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Existing offers */}
      {offersArray.map(function (offer, i) {
        var signals = offer.parsedSignals;
        var signalCount = 0;
        var cauchemarCount = 0;
        if (signals) {
          if (signals.totalSignals != null) signalCount = signals.totalSignals;
          if (signals.cauchemars)
            cauchemarCount = signals.cauchemars.filter(function (c) {
              return c.detected;
            }).length;
          if (signals.signals) signalCount = signals.signals.length;
        }
        var isInternal = offer.type === "internal";
        return (
          <div
            key={offer.id}
            style={{
              background: isInternal ? "#1a1a3e" : "#0f3460",
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
              borderLeft: "3px solid " + (signalCount > 0 || cauchemarCount > 0 ? "#4ecca3" : "#495670"),
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: isInternal ? "#1a1a3e" : "#0f3460",
                      color: isInternal ? "#4ecca3" : "#ccd6f6",
                      border: "1px solid " + (isInternal ? "#4ecca3" + "40" : "#16213e"),
                    }}
                  >
                    {isInternal ? "interne" : "externe"}
                  </span>
                  {offer.addedAt && <span style={{ fontSize: 9, color: "#495670" }}>{formatDate(offer.addedAt)}</span>}
                </div>
                <div style={{ fontSize: 12, color: "#ccd6f6", fontWeight: 600, marginBottom: 2 }}>
                  {offerSummary(offer)}
                </div>
                <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
                  {offer.text.length > 120 ? offer.text.slice(0, 120) + "..." : offer.text}
                </div>
                {(signalCount > 0 || cauchemarCount > 0) && (
                  <div style={{ fontSize: 9, color: "#4ecca3", marginTop: 4 }}>
                    {signalCount} signaux détectés{" "}
                    {cauchemarCount > 0
                      ? " · " +
                        cauchemarCount +
                        " cauchemar" +
                        (cauchemarCount > 1 ? "s" : "") +
                        " affiné" +
                        (cauchemarCount > 1 ? "s" : "")
                      : ""}
                  </div>
                )}
              </div>
              <button
                onClick={function () {
                  onRemove(offer.id);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#e94560",
                  cursor: "pointer",
                  fontSize: 14,
                  padding: "0 4px",
                  flexShrink: 0,
                }}
              >
                {"\u2715"}
              </button>
            </div>
          </div>
        );
      })}

      {/* Add offer form */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <button
            onClick={function () {
              setOfferType("external");
            }}
            style={{
              flex: 1,
              padding: "6px 10px",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 6,
              cursor: "pointer",
              background: offerType === "external" ? "#e94560" : "transparent",
              color: offerType === "external" ? "#fff" : "#8892b0",
              border: "1px solid " + (offerType === "external" ? "#e94560" : "#16213e"),
            }}
          >
            Externe
          </button>
          <button
            onClick={function () {
              setOfferType("internal");
            }}
            style={{
              flex: 1,
              padding: "6px 10px",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 6,
              cursor: "pointer",
              background: offerType === "internal" ? "#4ecca3" : "transparent",
              color: offerType === "internal" ? "#0a0a1a" : "#8892b0",
              border: "1px solid " + (offerType === "internal" ? "#4ecca3" : "#16213e"),
            }}
          >
            Interne
          </button>
        </div>
        <textarea
          value={inputText}
          onChange={function (e) {
            setInputText(e.target.value);
          }}
          placeholder={
            offerType === "internal"
              ? "Décris le contexte interne (poste, objectifs, équipe)..."
              : "Colle une nouvelle offre d'emploi ici..."
          }
          style={{
            width: "100%",
            minHeight: 80,
            padding: 10,
            background: "#1a1a2e",
            border: "2px solid #16213e",
            borderRadius: 8,
            color: "#ccd6f6",
            fontSize: 12,
            lineHeight: 1.5,
            resize: "vertical",
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        {inputText.trim().length > 0 && inputText.trim().length < minChars && (
          <div style={{ fontSize: 10, color: "#e94560", marginTop: 4 }}>
            {minChars - inputText.trim().length} caractères restants (minimum {minChars})
          </div>
        )}
        <button
          onClick={handleAdd}
          disabled={inputText.trim().length < minChars}
          style={{
            width: "100%",
            marginTop: 6,
            padding: 10,
            background: inputText.trim().length >= minChars ? "#e94560" : "#1a1a2e",
            color: inputText.trim().length >= minChars ? "#fff" : "#495670",
            border: "none",
            borderRadius: 8,
            cursor: inputText.trim().length >= minChars ? "pointer" : "not-allowed",
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          Ajouter cette offre
        </button>
      </div>
    </div>
  );
}
