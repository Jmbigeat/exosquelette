"use client";
import { useState } from "react";

// ── Local constants (originally in Sprint.jsx, not yet extracted to a shared module) ──

var DUEL_CRISES = [
  {
    id: 1,
    trigger: "Le recruteur regarde son téléphone. Il revient vers toi.",
    scenario: "On vient de m'informer que votre ancien employeur annonce un plan de restructuration. 15% des effectifs. Votre équipe est impactée. Qu'est-ce que ça change à ce que vous venez de me dire ?",
    diagnostic: {
      externalize: ["c'etait previsible", "je le savais", "rien a voir avec moi", "la direction"],
      recadre: ["mon impact reste", "mes résultats", "la méthode fonctionne", "independamment", "reproductible"],
    },
  },
  {
    id: 2,
    trigger: "Le recruteur s'arrête au milieu de sa prise de notes.",
    scenario: "J'ai un autre candidat en face cet après-midi. Plus senior que vous, 12 ans d'expérience. Dites-moi en une phrase pourquoi je devrais continuer cet entretien au lieu de le raccourcir.",
    diagnostic: {
      externalize: ["je suis mieux", "il ne peut pas", "plus motive", "plus jeune"],
      recadre: ["mes résultats parlent", "voici ce que je resous", "la question n'est pas l'expérience", "le problème que vous avez"],
    },
  },
  {
    id: 3,
    trigger: "Le recruteur pose son stylo et croise les bras.",
    scenario: "Soyons honnêtes. Votre CV est bon mais pas exceptionnel. J'en vois dix comme ça par semaine. Qu'est-ce qui fait que je vais me souvenir de vous demain ?",
    diagnostic: {
      externalize: ["je suis unique", "je travaille dur", "je suis passionne", "j'aime"],
      recadre: ["trois cauchemars", "voici le problème que je resous", "la preuve", "mesurable", "reproductible", "mon arbitrage"],
    },
  },
];

var DUEL_CONTRADICTIONS = [
  "Votre ancien manager m'a donné une version différente. Que répondez-vous ?",
  "J'ai parlé à quelqu'un dans votre ancienne équipe. Il dit que c'était un effort collectif, pas individuel. Votre réaction ?",
  "Un de vos ex-collègues m'a dit que le contexte était favorable et que n'importe qui aurait obtenu ces résultats. Comment répondez-vous ?",
  "Les chiffres que vous annoncez ne correspondent pas à ce que j'ai vu dans le marché. Vous êtes sûr de vos données ?",
];

function hashCode(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

// ── Duel component ──

export function Duel({ questions, bricks, onComplete, targetRoleId, interviewCoaching }) {
  var idxState = useState(0);
  var idx = idxState[0];
  var setIdx = idxState[1];
  var ansState = useState("");
  var answer = ansState[0];
  var setAnswer = ansState[1];
  var phState = useState("setup");
  var phase = phState[0];
  var setPhase = phState[1];
  var resultsState = useState([]);
  var results = resultsState[0];
  var setResults = resultsState[1];
  var ctxState = useState({ role: "", company: "" });
  var ctx = ctxState[0];
  var setCtx = ctxState[1];

  // Entropy states
  var crisisUsedState = useState(false);
  var crisisUsed = crisisUsedState[0];
  var setCrisisUsed = crisisUsedState[1];
  var contradictUsedState = useState(false);
  var contradictUsed = contradictUsedState[0];
  var setContradictUsed = contradictUsedState[1];
  var silenceUsedState = useState(false);
  var silenceUsed = silenceUsedState[0];
  var setSilenceUsed = silenceUsedState[1];
  var crisisAnswerState = useState("");
  var crisisAnswer = crisisAnswerState[0];
  var setCrisisAnswer = crisisAnswerState[1];
  var contradictAnswerState = useState("");
  var contradictAnswer = contradictAnswerState[0];
  var setContradictAnswer = contradictAnswerState[1];
  var silenceAnswerState = useState("");
  var silenceAnswer = silenceAnswerState[0];
  var setSilenceAnswer = silenceAnswerState[1];
  var activeCrisisState = useState(null);
  var activeCrisis = activeCrisisState[0];
  var setActiveCrisis = activeCrisisState[1];
  var activeContradictState = useState("");
  var activeContradict = activeContradictState[0];
  var setActiveContradict = activeContradictState[1];
  var entropyLogState = useState([]);
  var entropyLog = entropyLogState[0];
  var setEntropyLog = entropyLogState[1];

  // Determine which entropy event fires after a given question index
  function shouldFireCrisis() { return !crisisUsed && idx >= 1 && idx <= 3 && Math.random() < 0.5; }
  function shouldFireContradict() { return !contradictUsed && idx >= 0 && idx <= 3 && Math.random() < 0.4; }
  function shouldFireSilence() { return !silenceUsed && idx >= 1 && idx <= 3 && Math.random() < 0.35; }

  function analyzeCrisisResponse(text, crisis) {
    var lower = text.toLowerCase();
    var extCount = 0; var recCount = 0;
    crisis.diagnostic.externalize.forEach(function(m) { if (lower.indexOf(m) !== -1) extCount++; });
    crisis.diagnostic.recadre.forEach(function(m) { if (lower.indexOf(m) !== -1) recCount++; });
    if (recCount > extCount) return { verdict: "recadrage", color: "#4ecca3", msg: "Tu as recadré sur ta valeur. Réflexe de positionnement." };
    if (extCount > recCount) return { verdict: "externalisation", color: "#ff9800", msg: "Tu as externalisé. Le recruteur lit : cette personne subit les événements au lieu de les cadrer." };
    return { verdict: "neutre", color: "#8892b0", msg: "Réponse neutre. Ni externalisation ni recadrage clair. En entretien, l'absence de positionnement est un positionnement : celui du suiveur." };
  }

  if (phase === "setup") {
    var canBegin = ctx.role.trim().length > 2 && ctx.company.trim().length > 2;
    return (
      <div>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{"\u2694\uFE0F"}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>Simulateur de Duel</div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6 }}>
            Les questions qui te feront tomber si tu n'es pas préparé. Avec des surprises.
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>Ton interlocuteur</div>
          <input value={ctx.role} onChange={function(e) { setCtx(Object.assign({}, ctx, { role: e.target.value })); }}
            placeholder="Ex : VP Sales, Head of Revenue, DRH..."
            style={{ width: "100%", padding: 12, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 8, color: "#ccd6f6", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 8 }}
          />
          <input value={ctx.company} onChange={function(e) { setCtx(Object.assign({}, ctx, { company: e.target.value })); }}
            placeholder="Ex : Pennylane, Payfit, Qonto..."
            style={{ width: "100%", padding: 12, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 8, color: "#ccd6f6", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>
        <button onClick={function() { if (canBegin) setPhase("discovery"); }} disabled={!canBegin} style={{
          width: "100%", padding: 14,
          background: canBegin ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
          color: canBegin ? "#fff" : "#495670",
          border: canBegin ? "none" : "2px solid #16213e",
          borderRadius: 10, cursor: canBegin ? "pointer" : "default", fontWeight: 700, fontSize: 14,
        }}>Lancer le Duel</button>
      </div>
    );
  }

  // DISCOVERY PHASE — Item 3: teach the client to ask before answering
  if (phase === "discovery") {
    var discoveryQs = {
      enterprise_ae: "Quels sont les enjeux de croissance principaux de votre équipe cette année ?",
      head_of_growth: "Quel canal d'acquisition vous préoccupe le plus en ce moment ?",
      strategic_csm: "Quel est le segment de clients qui produit le plus de friction aujourd'hui ?",
      senior_pm: "Quel est l'arbitrage produit le plus difficile que l'équipe n'a pas encore tranché ?",
      ai_architect: "Quel cas d'usage IA est bloqué depuis le plus longtemps ?",
      engineering_manager: "Quel est le frein technique que l'équipe n'arrive pas à débloquer ?",
      management_consultant: "Quel est le problème qui a déclenché ce recrutement ?",
      strategy_associate: "Quelle décision stratégique attend des données que personne ne produit ?",
      operations_manager: "Quelle friction inter-équipes consomme le plus de temps ?",
      fractional_coo: "Qu'est-ce que le CEO ne devrait plus faire lui-même dans 6 mois ?",
    };
    var roleDiscovery = discoveryQs[targetRoleId] || "Avant que je déroule mon parcours, quels sont vos enjeux clés sur ce poste ?";
    var altDiscovery = "Quelle partie de mon parcours voulez-vous que je développe en priorité ?";
    var triggerDiscovery = "Qu'est-ce qui a déclenché ce recrutement ?";
    var antiProfileDiscovery = "Quel profil ne voulez-vous surtout pas reproduire ?";
    return (
      <div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid #3498db" }}>
          <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>COACHING PRE-DUEL</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#ccd6f6", marginBottom: 12 }}>Avant de répondre, pose une question.</div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.7, marginBottom: 16 }}>
            Le piège le plus courant des profils seniors : le monologue. Tu racontes pendant 6 minutes. Le recruteur décroche après 90 secondes. Pas parce que tu es mauvais. Parce que tu n'as pas calibré.
          </div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.7, marginBottom: 16 }}>
            Avant chaque réponse, pose une de ces questions au recruteur. Il te donnera la cible. Tu réponds avec la brique qui matche. Chaque mot que tu prononces est pertinent parce qu'il l'a demandé.
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>QUESTION DISCOVERY (adaptée à ton rôle)</div>
            <div style={{ fontSize: 14, color: "#ccd6f6", fontStyle: "italic", lineHeight: 1.5 }}>"{roleDiscovery}"</div>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>DÉCLENCHEUR (révèle l'urgence du décideur)</div>
            <div style={{ fontSize: 14, color: "#ccd6f6", fontStyle: "italic", lineHeight: 1.5 }}>"{triggerDiscovery}"</div>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>CICATRICE RECRUTEUR (révèle le profil à éviter)</div>
            <div style={{ fontSize: 14, color: "#ccd6f6", fontStyle: "italic", lineHeight: 1.5 }}>"{antiProfileDiscovery}"</div>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>CADRAGE D'ATTENTION</div>
            <div style={{ fontSize: 14, color: "#ccd6f6", fontStyle: "italic", lineHeight: 1.5 }}>"{altDiscovery}"</div>
          </div>
          <div style={{ fontSize: 12, color: "#495670", lineHeight: 1.5, marginTop: 12 }}>
            Un vrai senior n'est pas celui qui en dit le plus. C'est celui qui écoute et cible. Il articule son vécu autour du problème de l'autre.
          </div>
          <div style={{ background: "#9b59b6" + "15", borderRadius: 8, padding: 12, marginTop: 12, border: "1px solid #9b59b6" + "33" }}>
            <div style={{ fontSize: 11, color: "#9b59b6", fontWeight: 600, marginBottom: 4 }}>IN MEDIA RES</div>
            <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7 }}>
              Quand le recruteur te pose une question, ta première phrase est un chiffre ou un résultat. Le contexte vient après. Pas avant. "J'ai réduit le cycle de 14 à 9 jours" puis le comment. Jamais l'inverse.
            </div>
          </div>
          <div style={{ background: "#e94560" + "15", borderRadius: 8, padding: 12, marginTop: 12, border: "1px solid #e94560" + "33" }}>
            <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>LE SILENCE</div>
            <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7 }}>
              Le recruteur va se taire après ta réponse. Ne remplis pas le silence. Laisse-le revenir vers toi. Celui qui parle en premier après un silence perd le cadre de la négociation.
            </div>
          </div>
          {interviewCoaching && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginTop: 12, border: "1px solid #3498db33" }}>
              <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>QUESTIONS À POSER EN ENTRETIEN</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6, marginBottom: 10 }}>
                Ces questions prouvent ta maîtrise sans rien affirmer. Pose-les quand le recruteur demande "Avez-vous des questions ?"
              </div>
              <div style={{ fontSize: 11, color: "#ccd6f6", lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto" }}>{interviewCoaching}</div>
            </div>
          )}
        </div>
        <button onClick={function() { setPhase("pitch_chrono"); }} style={{
          width: "100%", padding: 14, background: "linear-gradient(135deg, #e94560, #c81d4e)",
          color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>J'ai compris. Lancer le Duel {"\u2192"}</button>
      </div>
    );
  }

  if (phase === "pitch_chrono") {
    var pitchTake = bricks.find(function(b) { return b.brickType === "take" && b.status === "validated"; });
    var pitchBricks = bricks.filter(function(b) { return b.status === "validated" && b.brickType !== "take"; }).slice(0, 3);
    var pitchDiscoveryQ = pitchBricks.length > 0 && pitchBricks[0].discoveryQuestions && pitchBricks[0].discoveryQuestions.length > 0 ? pitchBricks[0].discoveryQuestions[0] : "Quel est le problème que ce poste résout en priorité ?";

    var chronoBlocs = [
      { label: "CAUCHEMAR", time: "0-15s", color: "#e94560", content: pitchTake ? pitchTake.text : "Définis ton Take dans les Piliers.", hint: "Ouvre sur le problème du décideur. Pas sur toi." },
      { label: "PREUVE 1", time: "15-30s", color: "#4ecca3", content: pitchBricks[0] ? pitchBricks[0].text : "Brique manquante.", hint: "Un chiffre. Un contexte. Un résultat." },
      { label: "PREUVE 2", time: "30-45s", color: "#4ecca3", content: pitchBricks[1] ? pitchBricks[1].text : "Brique manquante.", hint: "Preuve complémentaire. Autre angle." },
      { label: "MÉTHODE", time: "45-70s", color: "#3498db", content: pitchBricks[2] ? pitchBricks[2].text : "Comment tu transfères ici.", hint: "Ce que tu feras chez eux. Pas ce que tu as fait ailleurs." },
      { label: "QUESTION", time: "70-90s", color: "#ff9800", content: pitchDiscoveryQ, hint: "Tu reprends le cadre. Le recruteur parle." },
    ];

    // Pitch interruption state
    var pitchAnswerState = useState("");
    var pitchAnswer = pitchAnswerState[0];
    var setPitchAnswer = pitchAnswerState[1];
    var pitchInterruptedState = useState(false);
    var pitchInterrupted = pitchInterruptedState[0];
    var setPitchInterrupted = pitchInterruptedState[1];
    var pitchInterruptResponseState = useState("");
    var pitchInterruptResponse = pitchInterruptResponseState[0];
    var setPitchInterruptResponse = pitchInterruptResponseState[1];

    var pitchInterruptions = [
      "Stop. Le recruteur vous coupe : 'C'était un effort d'équipe, non ? Quelle était votre contribution individuelle ?'",
      "Stop. Le recruteur vous coupe : 'Ce chiffre est impressionnant. Mais c'est aussi le contexte qui aidait, non ?'",
      "Stop. Le recruteur vous coupe : 'Attendez. Comment vous savez que c'est reproductible ici ?'",
      "Stop. Le recruteur vous coupe : 'Votre prédécesseur avait lancé le chantier. Quel est votre mérite personnel ?'",
      "Stop. Le recruteur vous coupe : 'On a eu 200 candidatures. En une phrase : pourquoi vous ?'",
    ];
    var selectedInterruption = pitchInterruptions[Math.abs(hashCode(ctx.company + ctx.role + "pitchint")) % pitchInterruptions.length];

    return (
      <div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid #9b59b6" }}>
          <div style={{ fontSize: 11, color: "#9b59b6", fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>PITCH 90 SECONDES — CHRONO</div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.7, marginBottom: 16 }}>
            Pas de texte à réciter. Une structure à suivre. 5 blocs. 90 secondes. Le chrono donne le rythme. Tes mots viennent de toi.
          </div>

          {chronoBlocs.map(function(bloc, bi) {
            return (
              <div key={bi} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "stretch" }}>
                <div style={{ width: 60, flexShrink: 0, background: bloc.color + "22", borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 6 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: bloc.color }}>{bloc.time}</div>
                </div>
                <div style={{ flex: 1, background: "#1a1a2e", borderRadius: 6, padding: 10, borderLeft: "3px solid " + bloc.color }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: bloc.color, marginBottom: 4 }}>{bloc.label}</div>
                  <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 4 }}>
                    {bloc.content.length > 100 ? bloc.content.slice(0, 100) + "..." : bloc.content}
                  </div>
                  <div style={{ fontSize: 10, color: "#495670", fontStyle: "italic" }}>{bloc.hint}</div>
                </div>
              </div>
            );
          })}

          {!pitchInterrupted && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 8 }}>ENTRAÎNEMENT : prononce ton pitch à voix haute. Puis clique.</div>
              <button onClick={function() { setPitchInterrupted(true); }} style={{
                width: "100%", padding: 14, background: "#e94560" + "22", color: "#e94560",
                border: "2px solid #e94560", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
              }}>J'ai fait mon pitch {"\u2192"} Interruption</button>
            </div>
          )}

          {pitchInterrupted && !pitchInterruptResponse && (
            <div style={{ marginTop: 16, background: "#e94560" + "15", borderRadius: 10, padding: 16, border: "1px solid #e94560" + "33" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e94560", marginBottom: 10 }}>{selectedInterruption}</div>
              <div style={{ fontSize: 11, color: "#8892b0", marginBottom: 8 }}>Le recruteur ne te laisse pas finir. C'est fait exprès. Reprends le cadre.</div>
              <textarea value={pitchAnswer} onChange={function(e) { setPitchAnswer(e.target.value); }}
                placeholder="Ta réponse à l'interruption..."
                style={{ width: "100%", minHeight: 70, padding: 12, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 8, color: "#ccd6f6", fontSize: 13, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 8 }}
              />
              <button onClick={function() {
                if (pitchAnswer.trim().length >= 10) {
                  setPitchInterruptResponse(pitchAnswer.trim());
                  setEntropyLog(function(prev) { return prev.concat([{
                    type: "pitch_interrupt", scenario: selectedInterruption,
                    answer: pitchAnswer.trim(), color: "#9b59b6",
                    diagnostic: "Le recruteur teste ta capacité à tenir ta ligne quand il te coupe. Ta réponse montre si tu reprends le cadre ou si tu le perds."
                  }]); });
                }
              }} disabled={pitchAnswer.trim().length < 10} style={{
                width: "100%", padding: 12,
                background: pitchAnswer.trim().length >= 10 ? "#e94560" : "#1a1a2e",
                color: pitchAnswer.trim().length >= 10 ? "#fff" : "#495670",
                border: "none", borderRadius: 8, cursor: pitchAnswer.trim().length >= 10 ? "pointer" : "default", fontWeight: 700, fontSize: 13,
              }}>Soumettre {"\u2192"}</button>
            </div>
          )}

          {pitchInterruptResponse && (
            <div style={{ marginTop: 16, background: "#4ecca3" + "15", borderRadius: 10, padding: 16, border: "1px solid #4ecca3" + "33" }}>
              <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 600, marginBottom: 6 }}>INTERRUPTION ENCAISSÉE</div>
              <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.5, marginBottom: 8 }}>Ta réponse : "{pitchInterruptResponse}"</div>
              <div style={{ fontSize: 11, color: "#8892b0", lineHeight: 1.5 }}>
                En entretien réel, le recruteur coupe pour tester ta résistance. Le candidat qui panique reformule tout depuis le début. Le candidat préparé répond à l'objection en une phrase et reprend son fil. Tu viens de t'entraîner à reprendre le fil.
              </div>
            </div>
          )}
        </div>

        {pitchInterruptResponse && (
          <button onClick={function() { setPhase("question"); }} style={{
            width: "100%", padding: 14, background: "linear-gradient(135deg, #e94560, #c81d4e)",
            color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
          }}>Passer aux questions du Duel {"\u2192"}</button>
        )}
      </div>
    );
  }

  if (phase === "done") {
    var answered = results.filter(function(r) { return r.answer; });
    var crisisEvents = entropyLog.filter(function(e) { return e.type === "crisis"; });
    var contradictEvents = entropyLog.filter(function(e) { return e.type === "contradiction"; });
    var silenceEvents = entropyLog.filter(function(e) { return e.type === "silence"; });
    return (
      <div>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{"\uD83D\uDEE1\uFE0F"}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>Duel terminé.</div>
          <div style={{ fontSize: 13, color: "#8892b0" }}>{answered.length} réponse{answered.length > 1 ? "s" : ""} forgée{answered.length > 1 ? "s" : ""}. {entropyLog.length} événement{entropyLog.length > 1 ? "s" : ""} imprévu{entropyLog.length > 1 ? "s" : ""}.</div>
        </div>
        {results.map(function(r, i) {
          return (
            <div key={i} style={{ background: "#0f3460", borderRadius: 10, padding: 14, marginBottom: 8, borderLeft: r.answer ? "3px solid #e94560" : "3px solid #495670" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>{r.answer ? "\uD83D\uDEE1\uFE0F" : "\u26A0\uFE0F"} {r.question}</div>
              {r.answer && <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{r.answer}</div>}
              {!r.answer && <div style={{ fontSize: 12, color: "#e94560" }}>Faille ouverte.</div>}
              {r.wordWarning && <div style={{ fontSize: 11, color: "#ff9800", marginTop: 4 }}>{r.wordWarning}</div>}
            </div>
          );
        })}
        {/* ENTROPY EVENTS RECAP */}
        {entropyLog.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>{"\u26A1"} ÉVÉNEMENTS IMPRÉVUS ({entropyLog.length})</div>
            {entropyLog.map(function(ev, i) {
              var typeLabel = ev.type === "crisis" ? "\uD83D\uDEA8 Crise" : ev.type === "contradiction" ? "\u2694\uFE0F Contradiction" : ev.type === "pitch_interrupt" ? "\uD83C\uDFA4 Interruption Pitch" : "\uD83E\uDD10 Silence";
              return (
                <div key={i} style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 6, borderLeft: "3px solid " + ev.color }}>
                  <div style={{ fontSize: 11, color: ev.color, fontWeight: 600, marginBottom: 4 }}>{typeLabel}</div>
                  <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.4, marginBottom: 4 }}>{ev.scenario}</div>
                  <div style={{ fontSize: 12, color: "#ccd6f6", lineHeight: 1.4, marginBottom: 4 }}>Ta réponse : "{ev.answer}"</div>
                  <div style={{ fontSize: 11, color: ev.color, lineHeight: 1.4 }}>{ev.diagnostic}</div>
                </div>
              );
            })}
          </div>
        )}
        <button onClick={function() { onComplete(results); }} style={{
          width: "100%", marginTop: 16, padding: 14, background: "linear-gradient(135deg, #e94560, #c81d4e)",
          color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>Terminer la Forge</button>
      </div>
    );
  }

  var q = questions[idx];

  if (phase === "analyzing") {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>{"\uD83E\uDDE0"}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>Confrontation brique vs réponse...</div>
      </div>
    );
  }

  // === CRISIS INTERRUPTION ===
  if (phase === "crisis_intro") {
    return (
      <div style={{ textAlign: "center", padding: "30px 10px" }}>
        <div style={{ fontSize: 40, marginBottom: 16, animation: "pulse 1s infinite" }}>{"\uD83D\uDEA8"}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e94560", marginBottom: 8 }}>INTERRUPTION</div>
        <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.6, marginBottom: 16 }}>{activeCrisis.trigger}</div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, borderLeft: "3px solid #e94560" }}>
          <div style={{ fontSize: 15, color: "#ccd6f6", lineHeight: 1.6, fontStyle: "italic" }}>"{activeCrisis.scenario}"</div>
        </div>
        <textarea value={crisisAnswer} onChange={function(e) { setCrisisAnswer(e.target.value); }}
          placeholder="Tu n'as pas préparé ça. Réponds."
          style={{ width: "100%", minHeight: 80, padding: 14, background: "#1a1a2e", border: "2px solid #e94560", borderRadius: 10, color: "#ccd6f6", fontSize: 14, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginTop: 16, marginBottom: 4 }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={function() {
            if (crisisAnswer.trim().length < 10) return;
            var diag = analyzeCrisisResponse(crisisAnswer, activeCrisis);
            setEntropyLog(function(prev) { return prev.concat([{ type: "crisis", scenario: activeCrisis.scenario, answer: crisisAnswer.trim(), diagnostic: diag.msg, color: diag.color }]); });
            setPhase("crisis_debrief");
          }} disabled={crisisAnswer.trim().length < 10} style={{
            flex: 1, padding: 14,
            background: crisisAnswer.trim().length >= 10 ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
            color: crisisAnswer.trim().length >= 10 ? "#fff" : "#495670",
            border: "none", borderRadius: 10, cursor: crisisAnswer.trim().length >= 10 ? "pointer" : "default", fontWeight: 700, fontSize: 14,
          }}>Soumettre</button>
        </div>
      </div>
    );
  }

  if (phase === "crisis_debrief") {
    var lastCrisisLog = entropyLog[entropyLog.length - 1];
    return (
      <div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid " + (lastCrisisLog ? lastCrisisLog.color : "#8892b0") }}>
          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>{"\uD83D\uDEA8"} DIAGNOSTIC DE CRISE</div>
          <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.6, marginBottom: 10 }}>{lastCrisisLog ? lastCrisisLog.diagnostic : ""}</div>
          <div style={{ fontSize: 12, color: "#495670", lineHeight: 1.5 }}>En entretien, les crises arrivent. Le recruteur pose une mine pour voir comment tu réagis sous pression. Ce n'était pas prévu. C'est le point.</div>
        </div>
        <button onClick={function() { setCrisisAnswer(""); setPhase("feedback"); }} style={{
          width: "100%", padding: 14, background: "#0f3460", color: "#ccd6f6",
          border: "2px solid #e94560", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>Retour à la question {"\u2192"}</button>
      </div>
    );
  }

  // === CONTRADICTORY FOLLOW-UP ===
  if (phase === "contradiction") {
    return (
      <div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid #9b59b6" }}>
          <div style={{ fontSize: 11, color: "#9b59b6", fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>{"\u2694\uFE0F"} RELANCE CONTRADICTOIRE</div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.5, marginBottom: 12 }}>Le recruteur ne passe pas à la question suivante. Il te regarde et dit :</div>
          <div style={{ fontSize: 15, color: "#ccd6f6", lineHeight: 1.6, fontStyle: "italic" }}>"{activeContradict}"</div>
        </div>
        <textarea value={contradictAnswer} onChange={function(e) { setContradictAnswer(e.target.value); }}
          placeholder="Défends ta position ou nuance-la."
          style={{ width: "100%", minHeight: 80, padding: 14, background: "#1a1a2e", border: "2px solid #9b59b6", borderRadius: 10, color: "#ccd6f6", fontSize: 14, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 4 }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={function() {
            if (contradictAnswer.trim().length < 10) return;
            var lower = contradictAnswer.trim().toLowerCase();
            var defends = lower.indexOf("je maintiens") !== -1 || lower.indexOf("les chiffres") !== -1 || lower.indexOf("la preuve") !== -1 || lower.indexOf("je confirme") !== -1 || lower.indexOf("mesurable") !== -1;
            var nuances = lower.indexOf("c'est vrai que") !== -1 || lower.indexOf("effectivement") !== -1 || lower.indexOf("je reconnais") !== -1 || lower.indexOf("en partie") !== -1;
            var folds = lower.indexOf("vous avez raison") !== -1 || lower.indexOf("je comprends") !== -1 || lower.indexOf("peut-etre") !== -1;
            var diagMsg = defends ? "Tu as tenu ta position avec des faits. Le recruteur respecte la solidité." : nuances ? "Tu as nuancé intelligemment. Le recruteur voit de la maturité." : folds ? "Tu as plié. Le recruteur lit : cette personne doute de ses propres résultats." : "Réponse lue. En entretien, la contradiction teste si tu crois à tes propres chiffres.";
            var diagColor = defends ? "#4ecca3" : nuances ? "#3498db" : folds ? "#e94560" : "#8892b0";
            setEntropyLog(function(prev) { return prev.concat([{ type: "contradiction", scenario: activeContradict, answer: contradictAnswer.trim(), diagnostic: diagMsg, color: diagColor }]); });
            setContradictAnswer("");
            setPhase("feedback");
          }} disabled={contradictAnswer.trim().length < 10} style={{
            flex: 1, padding: 14,
            background: contradictAnswer.trim().length >= 10 ? "linear-gradient(135deg, #9b59b6, #8e44ad)" : "#1a1a2e",
            color: contradictAnswer.trim().length >= 10 ? "#fff" : "#495670",
            border: "none", borderRadius: 10, cursor: contradictAnswer.trim().length >= 10 ? "pointer" : "default", fontWeight: 700, fontSize: 14,
          }}>Répondre</button>
        </div>
      </div>
    );
  }

  // === TACTICAL SILENCE ===
  if (phase === "silence_wait") {
    setTimeout(function() { setPhase("silence_challenge"); }, 4000);
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 40, marginBottom: 24 }}>{"\uD83E\uDD10"}</div>
        <div style={{ fontSize: 24, color: "#495670", letterSpacing: 4 }}>...</div>
      </div>
    );
  }

  if (phase === "silence_challenge") {
    return (
      <div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16, borderLeft: "3px solid #ff9800" }}>
          <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>{"\uD83E\uDD10"} SILENCE TACTIQUE</div>
          <div style={{ fontSize: 13, color: "#8892b0", lineHeight: 1.5, marginBottom: 12 }}>Le recruteur te regarde. Pause de 4 secondes. Puis :</div>
          <div style={{ fontSize: 16, color: "#ccd6f6", fontWeight: 600 }}>"C'est tout ?"</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={function() {
            setEntropyLog(function(prev) { return prev.concat([{ type: "silence", scenario: "C'est tout ?", answer: "J'ai tenu ma position.", diagnostic: "Tu as tenu ta réponse. Conviction affichée. Le recruteur note : cette personne ne doute pas de ce qu'elle dit.", color: "#4ecca3" }]); });
            setSilenceUsed(true);
            setPhase("feedback");
          }} style={{
            flex: 1, padding: 14, background: "#0f3460", color: "#4ecca3",
            border: "2px solid #4ecca3", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Oui. C'est ma réponse.</button>
          <button onClick={function() { setPhase("silence_complete"); }} style={{
            flex: 1, padding: 14, background: "#0f3460", color: "#ff9800",
            border: "2px solid #ff9800", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>Non, je complète...</button>
        </div>
      </div>
    );
  }

  if (phase === "silence_complete") {
    return (
      <div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 16, marginBottom: 16, borderLeft: "3px solid #ff9800" }}>
          <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>TU COMPLÈTES</div>
          <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>Tu as choisi de compléter. Le recruteur écoute. Mais il a noté que tu as douté de ta première réponse.</div>
        </div>
        <textarea value={silenceAnswer} onChange={function(e) { setSilenceAnswer(e.target.value); }}
          placeholder="Ce que tu ajoutes..."
          style={{ width: "100%", minHeight: 70, padding: 14, background: "#1a1a2e", border: "2px solid #ff9800", borderRadius: 10, color: "#ccd6f6", fontSize: 14, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 8 }}
        />
        <button onClick={function() {
          if (silenceAnswer.trim().length < 5) return;
          var hasNewInfo = silenceAnswer.trim().split(/\s+/).length > 10;
          var diagMsg = hasNewInfo ? "Tu as ajouté du contenu substantiel. Le recruteur lit : cette personne approfondit sous pression. Positif." : "Tu as ajouté peu. Le recruteur lit : doute sur la première réponse, mais rien de neuf. Négatif.";
          var diagColor = hasNewInfo ? "#3498db" : "#ff9800";
          setEntropyLog(function(prev) { return prev.concat([{ type: "silence", scenario: "C'est tout ? (complété)", answer: silenceAnswer.trim(), diagnostic: diagMsg, color: diagColor }]); });
          setSilenceUsed(true);
          setSilenceAnswer("");
          setPhase("feedback");
        }} disabled={silenceAnswer.trim().length < 5} style={{
          width: "100%", padding: 14,
          background: silenceAnswer.trim().length >= 5 ? "#0f3460" : "#1a1a2e",
          color: silenceAnswer.trim().length >= 5 ? "#ccd6f6" : "#495670",
          border: "2px solid #ff9800", borderRadius: 10, cursor: silenceAnswer.trim().length >= 5 ? "pointer" : "default", fontWeight: 700, fontSize: 14,
        }}>Soumettre le complément</button>
      </div>
    );
  }

  if (phase === "feedback") {
    var lastResult = results[results.length - 1];
    return (
      <div>
        <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, letterSpacing: 1, marginBottom: 10 }}>ANALYSE DE TA RÉPONSE</div>
          {lastResult && lastResult.wordWarning && (
            <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 10, marginBottom: 10, borderLeft: "3px solid #ff9800" }}>
              <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 600, marginBottom: 4 }}>LONGUEUR</div>
              <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{lastResult.wordWarning}</div>
            </div>
          )}
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginBottom: 12, borderLeft: "3px solid #e94560" }}>
            <div style={{ fontSize: 11, color: "#e94560", fontWeight: 600, marginBottom: 4 }}>LE PIÈGE</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{q.danger}</div>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, borderLeft: "3px solid #4ecca3" }}>
            <div style={{ fontSize: 11, color: "#4ecca3", fontWeight: 600, marginBottom: 4 }}>L'ANGLE RECOMMANDÉ</div>
            <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{q.idealAngle}</div>
          </div>

          {/* ROLE MIRROR FEEDBACK — Item 3 */}
          {lastResult && lastResult.wordWarning && (function() {
            var roleMirrors = {
              enterprise_ae: "En poste, tu laisserais le client driver le deal. Le prospect décroche après 90 secondes.",
              head_of_growth: "En poste, tu noierais le board dans les métriques au lieu de montrer le levier.",
              strategic_csm: "En poste, ton QBR durerait 45 minutes au lieu de 15. Le client décroche.",
              senior_pm: "En poste, tu présenterais une roadmap sans hiérarchie. L'équipe ne sait pas par où commencer.",
              ai_architect: "En poste, tu expliquerais le modèle pendant 20 minutes. Le CPO veut le cas d'usage en 2.",
              engineering_manager: "En poste, ton équipe attendrait 3 minutes de contexte avant chaque décision.",
              management_consultant: "En poste, ton slide deck ferait 80 pages au lieu de 3.",
              strategy_associate: "En poste, ton mémo serait un rapport. Le Comex veut une recommandation en 1 page.",
              operations_manager: "En poste, tes meetings dureraient le double. L'équipe perdrait confiance.",
              fractional_coo: "En poste, le CEO te demanderait de synthétiser et tu donnerais un audit.",
            };
            var mirror = roleMirrors[targetRoleId] || "En poste, tu prendrais trop de temps à arriver au point. Le décideur décroche.";
            return (
              <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, marginTop: 10, borderLeft: "3px solid #9b59b6" }}>
                <div style={{ fontSize: 11, color: "#9b59b6", fontWeight: 600, marginBottom: 4 }}>MIROIR DE POSTE</div>
                <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>{mirror}</div>
              </div>
            );
          })()}
        </div>
        <button onClick={function() {
          var next = idx + 1;
          if (next >= questions.length) { setPhase("done"); }
          else { setIdx(next); setPhase("question"); setAnswer(""); }
        }} style={{
          width: "100%", padding: 14, background: "#0f3460", color: "#ccd6f6",
          border: "2px solid #e94560", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>{idx + 1 >= questions.length ? "Voir le bilan" : "Question suivante"} {"\u2192"}</button>
      </div>
    );
  }

  var canAnswer = answer.trim().length >= 10;
  var wordCount = answer.trim().split(/\s+/).filter(function(w) { return w.length > 0; }).length;

  function handleDuelSubmit() {
    if (!canAnswer) return;
    var warning = null;
    if (wordCount > 80) warning = "Ta réponse fait " + wordCount + " mots. En entretien, tu perds ton interlocuteur après 60. Condense.";
    setResults(function(prev) { return prev.concat([{ question: q.question, answer: answer.trim(), brickRef: q.brickRef, wordWarning: warning }]); });

    // Entropy roll — only one event per submission, priority: crisis > silence > contradiction
    if (shouldFireCrisis()) {
      var crisis = DUEL_CRISES[Math.floor(Math.random() * DUEL_CRISES.length)];
      setActiveCrisis(crisis);
      setCrisisUsed(true);
      setPhase("crisis_intro");
      return;
    }
    if (shouldFireSilence()) {
      setSilenceUsed(true);
      setPhase("silence_wait");
      return;
    }
    if (shouldFireContradict()) {
      var contradict = DUEL_CONTRADICTIONS[Math.floor(Math.random() * DUEL_CONTRADICTIONS.length)];
      setActiveContradict(contradict);
      setContradictUsed(true);
      setPhase("contradiction");
      return;
    }

    setPhase("analyzing");
    setTimeout(function() { setPhase("feedback"); }, 1200);
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#495670", marginBottom: 4 }}>
          <span>Duel : {ctx.role} @ {ctx.company}</span>
          <span>Question {idx + 1}/{questions.length}</span>
        </div>
        <div style={{ width: "100%", background: "#1a1a2e", borderRadius: 6, height: 4, overflow: "hidden" }}>
          <div style={{ width: ((idx / questions.length) * 100) + "%", height: "100%", background: "#e94560", borderRadius: 6, transition: "width 0.4s ease" }} />
        </div>
      </div>
      <div style={{ background: "#0f3460", borderRadius: 10, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "#e94560", background: "#1a1a2e", padding: "3px 8px", borderRadius: 10, fontWeight: 600, display: "inline-block", marginBottom: 10 }}>{q.intent}</div>
        <div style={{ fontSize: 16, color: "#ccd6f6", lineHeight: 1.6, fontWeight: 600, marginBottom: 10 }}>&quot;{q.question}&quot;</div>
        <div style={{ fontSize: 11, color: "#495670" }}>Brique visée : {q.brickRef}</div>
      </div>
      <textarea value={answer} onChange={function(e) { setAnswer(e.target.value); }}
        placeholder="Réponds comme en entretien."
        style={{ width: "100%", minHeight: 90, padding: 14, background: "#1a1a2e", border: "2px solid #16213e", borderRadius: 10, color: "#ccd6f6", fontSize: 14, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 4 }}
      />
      <div style={{ fontSize: 11, color: wordCount > 80 ? "#ff9800" : "#495670", marginBottom: 12, textAlign: "right" }}>
        {wordCount} mot{wordCount > 1 ? "s" : ""}{wordCount > 80 ? " — trop long pour un entretien" : ""}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleDuelSubmit} disabled={!canAnswer} style={{
          flex: 2, padding: 14,
          background: canAnswer ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
          color: canAnswer ? "#fff" : "#495670",
          border: "none", borderRadius: 10, cursor: canAnswer ? "pointer" : "default", fontWeight: 700, fontSize: 14,
        }}>Soumettre</button>
        <button onClick={function() {
          setResults(function(prev) { return prev.concat([{ question: q.question, answer: null, brickRef: q.brickRef, wordWarning: null }]); });
          var next = idx + 1;
          if (next >= questions.length) { setPhase("done"); }
          else { setIdx(next); setAnswer(""); }
        }} style={{
          flex: 1, padding: 14, background: "#1a1a2e", color: "#495670",
          border: "2px solid #1a1a2e", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12,
        }}>Passer</button>
      </div>
    </div>
  );
}
