"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

/* ==============================
   LANDING PAGE — ABNEG@TION
   Structure ATMT : Accroche, Tension, Méthode, Transfert
   ============================== */

function FadeIn({ children, delay }) {
  var visState = useState(false);
  var visible = visState[0]; var setVisible = visState[1];
  var ref = useRef(null);
  useEffect(function() {
    var timer = setTimeout(function() { setVisible(true); }, (delay || 0) * 1000);
    return function() { clearTimeout(timer); };
  }, [delay]);
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}>
      {children}
    </div>
  );
}

function Counter({ end, suffix, duration }) {
  var countState = useState(0);
  var count = countState[0]; var setCount = countState[1];
  useEffect(function() {
    var dur = duration || 2000;
    var steps = 30;
    var step = 0;
    var interval = setInterval(function() {
      step++;
      var progress = step / steps;
      var eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(end * eased));
      if (step >= steps) clearInterval(interval);
    }, dur / steps);
    return function() { clearInterval(interval); };
  }, [end, duration]);
  return (
    <span>{count}{suffix || ""}</span>
  );
}

export default function Home() {
  var sectionStyle = { maxWidth: 900, margin: "0 auto", padding: "60px 20px" };
  var h2Style = { fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 3, marginBottom: 16, fontFamily: "'JetBrains Mono', monospace" };
  var cardStyle = { background: "#111125", borderRadius: 12, padding: 24, border: "1px solid #1a1a3e" };

  return (
    <div style={{ background: "#06060f", minHeight: "100vh", color: "#ccd6f6", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ══════ HEADER ══════ */}
      <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#e94560", letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace" }}>ABNEG@TION</div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/eclaireur" style={{ fontSize: 12, color: "#8892b0", textDecoration: "none" }}>Éclaireur</Link>
          <Link href="/auth" style={{ fontSize: 12, color: "#8892b0", textDecoration: "none" }}>Connexion</Link>
        </div>
      </div>

      {/* ══════ ACCROCHE ══════ */}
      <div style={{ ...sectionStyle, textAlign: "center", paddingTop: 80, paddingBottom: 40 }}>
        <FadeIn>
          <div style={h2Style}>LA FORGE</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#f0f0ff", lineHeight: 1.3, marginBottom: 20, maxWidth: 700, margin: "0 auto 20px" }}>
            Ton CV dit ce que tu as fait.<br />Le recruteur veut savoir ce que tu résous.
          </h1>
          <p style={{ fontSize: 16, color: "#8892b0", lineHeight: 1.7, maxWidth: 540, margin: "0 auto 32px" }}>
            Abneg@tion extrait tes preuves de valeur, les blinde sur 4 axes, et calibre ton discours sur les cauchemars du recruteur. Gratuit.
          </p>
          <Link href="/eclaireur" style={{
            display: "inline-block", padding: "14px 32px",
            background: "linear-gradient(135deg, #e94560, #c81d4e)", color: "#fff",
            borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none",
            boxShadow: "0 4px 20px rgba(233,69,96,0.3)",
          }}>Tester gratuitement</Link>
        </FadeIn>
      </div>

      {/* ══════ CHIFFRES ══════ */}
      <div style={{ ...sectionStyle, paddingTop: 20, paddingBottom: 40 }}>
        <FadeIn delay={0.2}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            {[
              { end: 5, suffix: "", label: "cauchemars détectés", desc: "par poste. Ce que le recruteur n'écrit pas dans l'offre." },
              { end: 0, suffix: " preuves", label: "dans ton CV actuel", desc: "Les recruteurs cherchent des résultats. Ton CV liste des responsabilités." },
              { end: 3, suffix: "s", label: "détection IA", desc: "L'outil identifie ton rôle, tes KPIs cachés et ton élasticité en 3 secondes." },
              { end: 10, suffix: " rôles", label: "couverts", desc: "Vente, Produit, Tech, Stratégie. L'outil calibre tes preuves sur les KPIs de ton poste cible." },
            ].map(function(item, i) {
              return (
                <div key={i} style={cardStyle}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#e94560", marginBottom: 4 }}>
                    <Counter end={item.end} suffix={item.suffix} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "#495670", lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              );
            })}
          </div>
        </FadeIn>
      </div>

      {/* ══════ ÉCLAIREUR ══════ */}
      <div style={{ ...sectionStyle, textAlign: "center" }}>
        <FadeIn delay={0.3}>
          <div style={h2Style}>ÉCLAIREUR V2</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0ff", marginBottom: 12 }}>
            Colle une offre. Vois ce que le recruteur cache.
          </h2>
          <p style={{ fontSize: 14, color: "#8892b0", lineHeight: 1.7, marginBottom: 8 }}>
            Pas de compte. Pas de carte. 30 secondes.
          </p>
          <p style={{ fontSize: 13, color: "#4ecca3", lineHeight: 1.7, marginBottom: 28 }}>
            Nouveau : colle aussi ton CV. L'outil mesure l'écart entre ce que le recruteur cherche et ce que ton CV dit. Score /5 en 30 secondes.
          </p>
          <Link href="/eclaireur" style={{
            display: "inline-block", padding: "14px 32px",
            background: "linear-gradient(135deg, #e94560, #c81d4e)", color: "#fff",
            borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none",
            boxShadow: "0 4px 20px rgba(233,69,96,0.3)",
          }}>Tester gratuitement</Link>
        </FadeIn>
      </div>

      {/* ══════ TENSION — Avant / Après ══════ */}
      <div style={sectionStyle}>
        <FadeIn delay={0.4}>
          <div style={h2Style}>AVANT / APRÈS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ ...cardStyle, borderLeft: "3px solid #e94560" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e94560", marginBottom: 10 }}>AVANT — LE CANDIDAT CLASSIQUE</div>
              <ul style={{ paddingLeft: 16, margin: 0, fontSize: 13, color: "#8892b0", lineHeight: 1.8 }}>
                <li>CV générique envoyé partout</li>
                <li>{"\"Participé à\", \"Contribué à\""}</li>
                <li>Aucun chiffre contextualisé</li>
                <li>DM LinkedIn copié-collé</li>
                <li>Entretien improvisé</li>
              </ul>
            </div>
            <div style={{ ...cardStyle, borderLeft: "3px solid #4ecca3" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#4ecca3", marginBottom: 10 }}>APRÈS — LE CANDIDAT FORGÉ</div>
              <ul style={{ paddingLeft: 16, margin: 0, fontSize: 13, color: "#ccd6f6", lineHeight: 1.8 }}>
                <li>Briques blindées sur 4 axes</li>
                <li>Chiffres liés aux cauchemars du recruteur</li>
                <li>Signature de densité mesurée</li>
                <li>Scripts de contact calibrés par interlocuteur</li>
                <li>Questions d'entretien préparées par niveau</li>
              </ul>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ══════ MÉTHODE — Comment ça marche ══════ */}
      <div style={sectionStyle}>
        <FadeIn delay={0.5}>
          <div style={h2Style}>COMMENT ÇA MARCHE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { step: "01", title: "Extraction", desc: "Tu racontes tes faits. L'outil extrait les briques de valeur : chiffres, décisions, influence, cicatrices." },
              { step: "02", title: "Blindage", desc: "Chaque brique est stress-testée sur 4 axes. Les failles sont identifiées. Tu renforces ta défense." },
              { step: "03", title: "Calibration", desc: "L'Arsenal détecte tes cauchemars couverts, ton axe faible, et projette l'impact de chaque brique blindée." },
              { step: "04", title: "Transfert", desc: "Ta trajectoire est visible. Tes preuves sont reliées au poste visé. Ton discours est prêt." },
            ].map(function(item, i) {
              return (
                <div key={i} style={cardStyle}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#e94560", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>{item.step}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6", marginBottom: 6 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              );
            })}
          </div>
        </FadeIn>
      </div>

      {/* ══════ COMPARAISON ══════ */}
      <div style={sectionStyle}>
        <FadeIn delay={0.6}>
          <div style={h2Style}>COMPARAISON</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "#495670", borderBottom: "1px solid #1a1a3e" }}></th>
                  <th style={{ padding: "10px 12px", textAlign: "center", color: "#495670", borderBottom: "1px solid #1a1a3e" }}>ChatGPT</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", color: "#495670", borderBottom: "1px solid #1a1a3e" }}>Coach carrière</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", color: "#e94560", fontWeight: 700, borderBottom: "2px solid #e94560" }}>ABNEG@TION</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Prix", "~20$/mois", "500-2000€", "Gratuit"],
                  ["Cauchemars recruteur", "Non", "Parfois", "5 par poste"],
                  ["Stress test des preuves", "Non", "Non", "4 axes × 5 angles"],
                  ["Calibration par interlocuteur", "Non", "Manuel", "RH / N+1 / Direction"],
                  ["Élasticité mesurée", "Non", "Non", "Oui"],
                  ["Audit vocabulaire", "Non", "Non", "Verbes de process détectés"],
                  ["Score de densité", "Non", "Non", "6 axes, temps réel"],
                ].map(function(row, i) {
                  return (
                    <tr key={i}>
                      <td style={{ padding: "8px 12px", color: "#8892b0", borderBottom: "1px solid #0f0f1f" }}>{row[0]}</td>
                      <td style={{ padding: "8px 12px", textAlign: "center", color: "#495670", borderBottom: "1px solid #0f0f1f" }}>{row[1]}</td>
                      <td style={{ padding: "8px 12px", textAlign: "center", color: "#495670", borderBottom: "1px solid #0f0f1f" }}>{row[2]}</td>
                      <td style={{ padding: "8px 12px", textAlign: "center", color: "#4ecca3", fontWeight: 600, borderBottom: "1px solid #0f0f1f" }}>{row[3]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </FadeIn>
      </div>

      {/* ══════ PRICING ══════ */}
      <div style={sectionStyle}>
        <FadeIn delay={0.7}>
          <div style={h2Style}>PRICING</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Gratuit */}
            <div style={{ ...cardStyle, borderTop: "3px solid #4ecca3" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#4ecca3", marginBottom: 4 }}>GRATUIT</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ccd6f6", marginBottom: 16 }}>La Forge</div>
              <ul style={{ paddingLeft: 16, margin: "0 0 20px 0", fontSize: 12, color: "#8892b0", lineHeight: 1.8 }}>
                <li>Éclaireur : diagnostic de ton CV face à l'offre en 30 secondes</li>
                <li>Forge complète : extraction, blindage, Duel, signature, GPS, élasticité, cauchemars</li>
                <li>10 rôles couverts. 4 secteurs</li>
                <li>Ton arsenal se construit à ton rythme</li>
              </ul>
              <Link href="/eclaireur" style={{
                display: "block", textAlign: "center", padding: "12px 20px",
                background: "linear-gradient(135deg, #4ecca3, #2ecc71)", color: "#0a0a1a",
                borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none",
              }}>Commencer gratuitement</Link>
            </div>

            {/* Abonnement */}
            <div style={{ ...cardStyle, borderTop: "3px solid #495670", opacity: 0.7 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#ccd6f6" }}>~19€/mois</div>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#ff9800", background: "#ff9800" + "22", padding: "2px 8px", borderRadius: 6 }}>Bientôt</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ccd6f6", marginBottom: 16 }}>Les armes</div>
              <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, color: "#8892b0", lineHeight: 1.8 }}>
                <li>Livrables calibrés par interlocuteur (CV, DM, email, bio, scripts, posts)</li>
                <li>Brew : cockpit hebdomadaire de dépôt de preuves LinkedIn</li>
                <li>Négociation salariale : rapport de remplacement, argumentaire, comparatif</li>
                <li>Visibilité cabinets (opt-in)</li>
              </ul>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ══════ OBJECTIONS ══════ */}
      <div style={sectionStyle}>
        <FadeIn delay={0.8}>
          <div style={h2Style}>OBJECTIONS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              {
                q: "Pourquoi c'est gratuit ?",
                a: "La Forge te montre ce que tu vaux. C'est un diagnostic. L'abonnement te donne les armes pour agir : CV calibré, scripts de contact, posts LinkedIn, cockpit hebdomadaire, négociation salariale. Le diagnostic est gratuit. L'exécution est payante.",
              },
              {
                q: "ChatGPT peut faire la même chose ?",
                a: "ChatGPT génère du texte. Il ne connaît pas les cauchemars du recruteur, ne stress-teste pas tes preuves, ne mesure pas ton élasticité, et ne calibre pas ton discours par interlocuteur. L'outil n'écrit pas pour toi. Il te fait extraire ce que tu as réellement fait.",
              },
              {
                q: "Je n'ai pas de chiffres dans mon parcours.",
                a: "Tu en as. Tu ne les as pas encore formulés. L'extraction guidée te fait sortir tes résultats en 4 champs : contexte, action, résultat, contrainte. 90% des candidats trouvent au moins 3 chiffres exploitables en 20 minutes.",
              },
              {
                q: "Ça marche pour mon secteur ?",
                a: "10 rôles couverts : vente, growth, CSM, product, tech lead, data/IA, conseil, stratégie, opérations, direction. Si ton poste implique des KPIs et des décisions, l'outil fonctionne.",
              },
            ].map(function(item, i) {
              return (
                <div key={i} style={cardStyle}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e94560", marginBottom: 6 }}>{item.q}</div>
                  <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.7 }}>{item.a}</div>
                </div>
              );
            })}
          </div>
        </FadeIn>
      </div>

      {/* ══════ CTA FINAL ══════ */}
      <div style={{ ...sectionStyle, textAlign: "center", paddingBottom: 40 }}>
        <FadeIn delay={0.9}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0ff", marginBottom: 12 }}>
            Ton CV ne te défend pas. Tes preuves, oui.
          </h2>
          <p style={{ fontSize: 14, color: "#8892b0", marginBottom: 28 }}>
            Commence par l'Éclaireur. 30 secondes. Zéro engagement.
          </p>
          <Link href="/eclaireur" style={{
            display: "inline-block", padding: "16px 40px",
            background: "linear-gradient(135deg, #e94560, #c81d4e)", color: "#fff",
            borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: "none",
            boxShadow: "0 4px 20px rgba(233,69,96,0.3)",
          }}>Tester gratuitement</Link>
        </FadeIn>
      </div>

      {/* ══════ FOOTER ══════ */}
      <div style={{ borderTop: "1px solid #1a1a3e", padding: "20px 0", textAlign: "center", fontSize: 10, color: "#495670" }}>
        ABNEG@TION par Exosquelette · <Link href="/mentions-legales" style={{ color: "#495670", textDecoration: "none" }}>Mentions légales</Link> · <Link href="/confidentialite" style={{ color: "#495670", textDecoration: "none" }}>Confidentialité</Link> · © 2026
      </div>
    </div>
  );
}
