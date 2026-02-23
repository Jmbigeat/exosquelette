"use client";
import { useState, useEffect } from "react";

export function Bar({ pct }) {
  return (
    <div style={{ width: "100%", background: "#1a1a2e", borderRadius: 8, height: 8, overflow: "hidden" }}>
      <div style={{ width: pct + "%", height: "100%", background: "linear-gradient(90deg, #e94560, #ff6b6b)", borderRadius: 8, transition: "width 0.5s ease" }} />
    </div>
  );
}

export function Nav({ steps, active, onSelect, density }) {
  var unlockStates = density ? [true, density.unlocks.forge, density.unlocks.affutage, density.unlocks.armement] : [true, false, false, false];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
      {steps.map(function(s, i) {
        var isAct = i === active;
        var isDone = i < active;
        var isLocked = !unlockStates[i] && !isDone;
        return (
          <button key={i} onClick={function() { if (unlockStates[i] && i <= active) onSelect(i); }} style={{
            flex: 1, background: isAct ? "#e94560" : isDone ? "#0f3460" : "#1a1a2e",
            border: isAct ? "2px solid #e94560" : isLocked ? "2px solid #e94560" + "33" : "2px solid #16213e",
            borderRadius: 10, padding: "12px 6px", cursor: unlockStates[i] && i <= active ? "pointer" : "default",
            transition: "all 0.3s", opacity: isLocked ? 0.3 : !isAct && !isDone ? 0.5 : 1,
          }}>
            <div style={{ fontSize: 18, marginBottom: 2 }}>{isDone ? "\u2705" : isLocked ? "\uD83D\uDD12" : s.icon}</div>
            <div style={{ fontSize: 9, color: isLocked ? "#e94560" : "#8892b0", fontWeight: 600 }}>{s.gate}</div>
            <div style={{ fontSize: 12, color: isAct ? "#fff" : "#ccd6f6", fontWeight: 700 }}>{s.title}</div>
          </button>
        );
      })}
    </div>
  );
}

export function CopyBtn({ text, label }) {
  var st = useState(false);
  var copied = st[0];
  var setCopied = st[1];
  function go() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() { setCopied(true); setTimeout(function() { setCopied(false); }, 1500); });
    } else { setCopied(true); setTimeout(function() { setCopied(false); }, 1500); }
  }
  return (
    <button onClick={go} style={{
      padding: "5px 12px", background: copied ? "#0f3460" : "#1a1a2e",
      color: copied ? "#e94560" : "#8892b0", border: copied ? "1px solid #e94560" : "1px solid #495670",
      borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 11, transition: "all 0.2s", whiteSpace: "nowrap",
    }}>{copied ? "\u2713 Copie" : label || "Copier"}</button>
  );
}

export function Pillars({ pillars, takes, onVal }) {
  var sel = useState([]);
  var selected = sel[0];
  var setSelected = sel[1];
  var recState = useState(null);
  var recommendations = recState[0];
  var setRecommendations = recState[1];

  // Takes become primary pillars, AI pillars are complement
  var takePillars = takes.filter(function(t) { return t.status === "validated" && t.pillar; }).map(function(t, i) {
    return { id: "take_" + t.id, title: t.pillar.title, desc: t.pillar.desc, source: "take", depth: t.analysis ? t.analysis.level : "partial", text: t.text };
  });
  var aiPillars = pillars.map(function(p) {
    return { id: "ai_" + p.id, title: p.title, desc: p.desc, source: "ai" };
  });

  var hasAllFour = takePillars.length >= 4;

  useEffect(function() {
    if (hasAllFour || aiPillars.length === 0) return;
    var cancelled = false;
    fetch("/api/recommend-pillars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pillars: pillars.map(function(p) { return { id: p.id, title: p.title, desc: p.desc }; }),
        takes: takePillars.map(function(t) { return { title: t.title, desc: t.desc, text: t.text }; }),
      }),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!cancelled && Array.isArray(data)) setRecommendations(data);
      })
      .catch(function() {
        if (!cancelled) setRecommendations([]);
      });
    return function() { cancelled = true; };
  }, []);

  function toggle(id) {
    setSelected(function(prev) {
      if (prev.includes(id)) return prev.filter(function(x) { return x !== id; });
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
      <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>TES PRISES DE POSITION</div>
      <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 16, lineHeight: 1.5 }}>
        Ce sont les convictions que le recruteur ne trouvera pas sur un autre CV. Elles alimentent tes posts LinkedIn et ton pitch en entretien.
      </div>

      {/* DYNAMIC INSTRUCTION */}
      {hasAllFour ? (
        <div style={{ background: "#4ecca3" + "22", borderRadius: 8, padding: 12, marginBottom: 16, borderLeft: "3px solid #4ecca3" }}>
          <div style={{ fontSize: 13, color: "#4ecca3", fontWeight: 600, lineHeight: 1.6 }}>
            Tes 4 positions sont prêtes. Elles alimentent tes posts LinkedIn et ton pitch en entretien.
          </div>
        </div>
      ) : (
        <div style={{ background: "#0f3460", borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.6 }}>
            {takeCount > 0
              ? "Tes " + takeCount + " position" + (takeCount > 1 ? "s" : "") + " " + (takeCount > 1 ? "sont acquises" : "est acquise") + ". Sélectionne " + remaining + " pilier" + (remaining > 1 ? "s" : "") + " complémentaire" + (remaining > 1 ? "s" : "") + " pour compléter tes 4 territoires. Un candidat avec 4 positions défendables se distingue de 94% des profils silencieux."
              : "Tu as 0 position sur 4. Choisis 4 piliers parmi les suggestions ci-dessous. Un candidat avec 4 positions défendables se distingue de 94% des profils silencieux."
            }
          </div>
        </div>
      )}

      {/* AI PILLARS — suggestions to validate (shown first) */}
      {!hasAllFour && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>
            {hasTakes ? "PILIERS COMPLÉMENTAIRES — GÉNÉRÉS PAR L'IA" : "PILIERS DÉTECTÉS PAR L'IA"}
          </div>
          <div style={{ fontSize: 12, color: "#8892b0", marginBottom: 12, lineHeight: 1.5 }}>
            {hasTakes
              ? "L'IA a croisé tes briques et ton secteur pour proposer des angles complémentaires. Sélectionne ceux qui reflètent ta vision."
              : "J'ai croisé tes briques et ton secteur. Tu n'as pas formulé de prise de position pendant l'interrogatoire. Ces piliers sont générés. Ils servent de base, mais ils ne viennent pas de toi. La Forge suivante te posera la question."
            }
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {aiPillars.map(function(p) {
              var isSel = selected.includes(p.id);
              var numId = parseInt(p.id.replace("ai_", ""), 10);
              var rec = recommendations ? recommendations.find(function(r) { return r.id === numId; }) : null;
              var isRec = rec && rec.recommended;
              return (
                <button key={p.id} onClick={function() { toggle(p.id); }} style={{
                  background: isSel ? "#0f3460" : "#1a1a2e", border: isSel ? "2px solid #e94560" : isRec ? "2px solid #4ecca3" : "2px solid #16213e",
                  borderRadius: 10, padding: 14, cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isSel ? "#e94560" : "#ccd6f6" }}>{isSel ? "\u2713 " : ""}{p.title}</div>
                    {recommendations === null && (
                      <span style={{ display: "inline-block", width: 60, height: 14, borderRadius: 4, background: "#1a1a2e", animation: "pillarPulse 1.5s ease-in-out infinite" }} />
                    )}
                    {isRec && (
                      <span style={{ fontSize: 9, color: "#4ecca3", background: "#4ecca3" + "22", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>recommandé</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#8892b0" }}>{p.desc}</div>
                  {isRec && rec.reason && (
                    <div style={{ fontSize: 12, color: "#4ecca3", marginTop: 4 }}>{rec.reason}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* NO TAKES WARNING */}
      {!hasTakes && (
        <div style={{ background: "#e94560" + "15", borderRadius: 8, padding: 12, marginBottom: 16, borderLeft: "3px solid #e94560" }}>
          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>DIAGNOSTIC : AUCUNE PRISE DE POSITION FORMULÉE</div>
          <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>
            Tu n'as formulé aucune thèse contrariante sur ton secteur. Les piliers ci-dessus sont générés. Ils fonctionnent, mais ils ne te séparent pas des autres candidats qui utilisent l'IA pour écrire. Au prochain Rendez-vous, le système te reposera la question.
          </div>
        </div>
      )}

      {/* TAKES — validated positions (shown second, as final result) */}
      {hasTakes && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>POSITIONS VALIDÉES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {takePillars.map(function(p) {
              var hasNumber = /(\d[\d.,]*\s*[KkMm]?\s*[%€$£])|([\+\-]\s*\d[\d.,]*\s*[KkMm]?\s*[%€$£])|([x×]\s*\d[\d.,]*)/.test(p.text || "");
              return (
                <div key={p.id} style={{
                  background: "#0f3460", border: "2px solid #3498db",
                  borderRadius: 10, padding: 14, textAlign: "left",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#3498db" }}>{"\u2713 "}{p.title}</div>
                    <span style={{ fontSize: 9, color: hasNumber ? "#4ecca3" : "#ff9800", background: "#1a1a2e", padding: "2px 8px", borderRadius: 6 }}>
                      {hasNumber ? "prête" : "à armer"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#8892b0" }}>{p.desc}</div>
                  {!hasNumber && <div style={{ fontSize: 12, color: "#ff9800", marginTop: 6 }}>Ajoute un chiffre de résultat (%, €, x...) pour armer cette position.</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selected.length >= 2 && (
        <button onClick={function() { onVal(selected.length, selected, takePillars, aiPillars); }} style={{
          width: "100%", padding: 14, background: "linear-gradient(135deg, #e94560, #c81d4e)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>Valider {selected.length} pilier{selected.length > 1 ? "s" : ""}</button>
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
  var expandedState = useState(false);
  var expanded = expandedState[0];
  var setExpanded = expandedState[1];

  function handleAdd() {
    if (inputText.trim().length < 20) return;
    onAdd(inputText.trim());
    setInputText("");
  }

  return (
    <div style={{ background: "#16213e", borderRadius: 10, padding: 14, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={function() { setExpanded(!expanded); }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>{"\uD83C\uDFAF"}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6" }}>Offres cibles ({offersArray.length})</span>
        </div>
        <span style={{ fontSize: 10, color: "#495670" }}>{expanded ? "\u25B2" : "\u25BC"}</span>
      </div>

      {coherence && !coherence.coherent && (
        <div style={{ background: "#e94560" + "22", borderRadius: 8, padding: 8, marginTop: 8 }}>
          <div style={{ fontSize: 11, color: "#e94560", lineHeight: 1.5 }}>{"\u26A0\uFE0F"} {coherence.message}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
            {coherence.sectors.map(function(s, i) { return <span key={i} style={{ fontSize: 9, color: "#e94560", background: "#1a1a2e", padding: "1px 6px", borderRadius: 6 }}>{s}</span>; })}
          </div>
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: 12 }}>
          {offersArray.map(function(offer, i) {
            var signals = offer.parsedSignals;
            var detected = signals ? signals.cauchemars.filter(function(c) { return c.detected; }).length : 0;
            return (
              <div key={offer.id} style={{ background: "#0f3460", borderRadius: 8, padding: 10, marginBottom: 8, borderLeft: "3px solid " + (detected > 0 ? "#4ecca3" : "#495670") }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.5 }}>{offer.text.length > 150 ? offer.text.slice(0, 150) + "..." : offer.text}</div>
                    {signals && signals.totalSignals > 0 && (
                      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                        <span style={{ fontSize: 9, color: "#4ecca3" }}>{signals.totalSignals} signaux</span>
                        <span style={{ fontSize: 9, color: "#8892b0" }}>{detected} cauchemar{detected > 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </div>
                  <button onClick={function() { onRemove(offer.id); }} style={{ background: "none", border: "none", color: "#e94560", cursor: "pointer", fontSize: 14, padding: "0 4px", flexShrink: 0 }}>{"\u2715"}</button>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 8 }}>
            <textarea value={inputText} onChange={function(e) { setInputText(e.target.value); }}
              placeholder="Colle une nouvelle offre d'emploi ici..."
              style={{ width: "100%", minHeight: 80, padding: 10, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 8, color: "#ccd6f6", fontSize: 12, lineHeight: 1.5, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
            <button onClick={handleAdd} disabled={inputText.trim().length < 20} style={{
              width: "100%", marginTop: 6, padding: 10,
              background: inputText.trim().length >= 20 ? "#e94560" : "#1a1a2e",
              color: inputText.trim().length >= 20 ? "#fff" : "#495670",
              border: "none", borderRadius: 8, cursor: inputText.trim().length >= 20 ? "pointer" : "not-allowed",
              fontWeight: 600, fontSize: 12,
            }}>Ajouter cette offre</button>
          </div>
        </div>
      )}
    </div>
  );
}
