"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Eclaireur } from "@/components/eclaireur/Eclaireur";

/* ==============================
   LANDING PAGE — ABNEG@TION
   Hero = Éclaireur intégré. Le candidat colle et scanne au-dessus du fold.
   ============================== */

function FadeIn({ children, delay }) {
  var visState = useState(false);
  var visible = visState[0];
  var setVisible = visState[1];
  var ref = useRef(null);
  useEffect(
    function () {
      var timer = setTimeout(
        function () {
          setVisible(true);
        },
        (delay || 0) * 1000
      );
      return function () {
        clearTimeout(timer);
      };
    },
    [delay]
  );
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  var sectionStyle = { maxWidth: 900, margin: "0 auto", padding: "60px 20px" };
  var h2Style = {
    fontSize: 12,
    color: "#e94560",
    fontWeight: 700,
    letterSpacing: 3,
    marginBottom: 16,
    fontFamily: "'JetBrains Mono', monospace",
  };
  var cardStyle = { background: "#111125", borderRadius: 12, padding: 24, border: "1px solid #1a1a3e" };

  return (
    <div
      style={{
        background: "#06060f",
        minHeight: "100vh",
        color: "#ccd6f6",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* ══════ NAV ══════ */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: "#e94560",
            letterSpacing: 2,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          ABNEG@TION
        </div>
        <Link href="/auth" style={{ fontSize: 12, color: "#8892b0", textDecoration: "none" }}>
          Se connecter
        </Link>
      </div>

      {/* ══════ 1. HERO — ÉCLAIREUR INTÉGRÉ ══════ */}
      <div id="hero" style={{ maxWidth: 640, margin: "0 auto", padding: "20px 20px 40px" }}>
        <Eclaireur />
      </div>

      {/* ══════ 2. COMMENT ÇA MARCHE ══════ */}
      <div id="comment" style={sectionStyle}>
        <FadeIn delay={0.1}>
          <div style={h2Style}>COMMENT ÇA MARCHE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              {
                step: "1",
                badge: "30 sec",
                title: "Colle ton offre",
                desc: "Le recruteur cache 5 critères. Tu en vois 1 gratuitement.",
              },
              {
                step: "2",
                badge: "20 min",
                title: "Crée ton compte",
                desc: "L'outil extrait tes preuves et les blinde.",
              },
              {
                step: "3",
                badge: "12+ livrables",
                title: "Récupère tes armes",
                desc: "One-Pager, CV calibré, préparation entretien, script de contact.",
              },
            ].map(function (item, i) {
              var isLast = i === 2;
              return (
                <div key={i} style={{ display: "flex", gap: 20 }}>
                  {/* Timeline */}
                  <div
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 32 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "#4ecca322",
                        border: "2px solid #4ecca3",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#4ecca3",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {item.step}
                    </div>
                    {!isLast && <div style={{ width: 2, flex: 1, background: "#1a1a3e", minHeight: 40 }} />}
                  </div>
                  {/* Content */}
                  <div style={{ paddingBottom: isLast ? 0 : 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#ccd6f6" }}>{item.title}</div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#4ecca3",
                          background: "#4ecca322",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.7 }}>{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </FadeIn>
      </div>

      {/* ══════ 3. BÉNÉFICES ══════ */}
      <div style={sectionStyle}>
        <FadeIn delay={0.2}>
          <div style={h2Style}>CE QUE ÇA CHANGE POUR TOI</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            {[
              {
                icon: "🎯",
                accent: "#e94560",
                title: "Tu sais ce que le recruteur cache",
                desc: "Colle une offre. L'outil révèle le KPI caché, les 5 critères cachés du poste, et le coût du silence. En 30 secondes.",
              },
              {
                icon: "🧱",
                accent: "#4ecca3",
                title: "Tu prouves ta rareté",
                desc: "L'outil extrait tes chiffres, tes décisions sous pression, tes échecs analysés. Chaque fait est stress-testé sur 4 axes. Ton CV dit ce qui disparaît sans toi.",
              },
              {
                icon: "⚡",
                accent: "#ff9800",
                title: "Tu agis par interlocuteur",
                desc: "CV calibré en 6 secondes. 4 scripts de contact (email, DM, N+1, RH). Questions d'entretien à 4 niveaux. Message post-entretien. Bio LinkedIn. Tout calibré sur les critères de ton recruteur.",
              },
            ].map(function (item, i) {
              return (
                <div key={i} style={{ ...cardStyle, borderTop: "3px solid " + item.accent }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#ccd6f6", marginBottom: 8 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.7 }}>{item.desc}</div>
                </div>
              );
            })}
          </div>
        </FadeIn>
      </div>

      {/* ══════ 4. AVANT / APRÈS ══════ */}
      <div style={sectionStyle}>
        <FadeIn delay={0.3}>
          <div style={h2Style}>CE QUI CHANGE VRAIMENT</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ ...cardStyle, borderLeft: "3px solid #e94560" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e94560", marginBottom: 10 }}>
                AVANT — LE CANDIDAT CLASSIQUE
              </div>
              <ul style={{ paddingLeft: 16, margin: 0, fontSize: 13, color: "#8892b0", lineHeight: 1.8 }}>
                <li>CV générique envoyé partout</li>
                <li>{'"Participé à", "Contribué à"'}</li>
                <li>Aucun chiffre contextualisé</li>
                <li>DM LinkedIn copié-collé</li>
                <li>Entretien improvisé</li>
              </ul>
            </div>
            <div style={{ ...cardStyle, borderLeft: "3px solid #4ecca3" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#4ecca3", marginBottom: 10 }}>
                APRÈS — LE CANDIDAT PRÉPARÉ
              </div>
              <ul style={{ paddingLeft: 16, margin: 0, fontSize: 13, color: "#ccd6f6", lineHeight: 1.8 }}>
                <li>Preuves vérifiées sur 4 axes</li>
                <li>Chiffres liés aux critères cachés du recruteur</li>
                <li>Différence mesurée et formulée</li>
                <li>Scripts de contact calibrés par interlocuteur</li>
                <li>Questions d'entretien préparées par niveau</li>
              </ul>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ══════ 5. COMPARAISON ══════ */}
      <div style={sectionStyle}>
        <FadeIn delay={0.4}>
          <div style={h2Style}>COMPARAISON</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      color: "#495670",
                      borderBottom: "1px solid #1a1a3e",
                    }}
                  ></th>
                  <th
                    style={{
                      padding: "10px 12px",
                      textAlign: "center",
                      color: "#495670",
                      borderBottom: "1px solid #1a1a3e",
                    }}
                  >
                    ChatGPT
                  </th>
                  <th
                    style={{
                      padding: "10px 12px",
                      textAlign: "center",
                      color: "#495670",
                      borderBottom: "1px solid #1a1a3e",
                    }}
                  >
                    Coach carrière
                  </th>
                  <th
                    style={{
                      padding: "10px 12px",
                      textAlign: "center",
                      color: "#e94560",
                      fontWeight: 700,
                      borderBottom: "2px solid #e94560",
                    }}
                  >
                    ABNEG@TION
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Prix", "~20$/mois", "500-2000€", "Gratuit"],
                  ["Critères cachés du recruteur", "Non", "Parfois", "5 par poste"],
                  ["Stress test des preuves", "Non", "Non", "4 axes × 5 angles"],
                  ["Calibration par interlocuteur", "Non", "Manuel", "RH / N+1 / Direction"],
                  ["Résistance à l'automatisation", "Non", "Non", "Oui"],
                  ["Audit vocabulaire", "Non", "Non", "Verbes de process détectés"],
                  ["Score de valeur", "Non", "Non", "6 axes, temps réel"],
                ].map(function (row, i) {
                  return (
                    <tr key={i}>
                      <td style={{ padding: "8px 12px", color: "#8892b0", borderBottom: "1px solid #0f0f1f" }}>
                        {row[0]}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          textAlign: "center",
                          color: "#495670",
                          borderBottom: "1px solid #0f0f1f",
                        }}
                      >
                        {row[1]}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          textAlign: "center",
                          color: "#495670",
                          borderBottom: "1px solid #0f0f1f",
                        }}
                      >
                        {row[2]}
                      </td>
                      <td
                        style={{
                          padding: "8px 12px",
                          textAlign: "center",
                          color: "#4ecca3",
                          fontWeight: 600,
                          borderBottom: "1px solid #0f0f1f",
                        }}
                      >
                        {row[3]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </FadeIn>
      </div>

      {/* ══════ 6. FAQ ══════ */}
      <div id="prix" style={sectionStyle}>
        <FadeIn delay={0.5}>
          <div style={h2Style}>FAQ</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              {
                q: "Est-ce que c'est vraiment gratuit ?",
                a: "L'analyse de ton offre est gratuite. La construction de tes preuves est gratuite. Les livrables calibrés seront en abonnement (~19€/mois).",
              },
              {
                q: "ChatGPT peut faire la même chose ?",
                a: "ChatGPT génère du texte. Il ne connaît pas les critères cachés du recruteur, ne stress-teste pas tes preuves, ne mesure pas ton élasticité, et ne calibre pas ton discours par interlocuteur. L'outil n'écrit pas pour toi. Il te fait extraire ce que tu as réellement fait.",
              },
              {
                q: "Je n'ai pas de chiffres dans mon parcours.",
                a: "Tu en as. Tu ne les as pas encore formulés. L'extraction guidée te fait sortir tes résultats en 4 champs : contexte, action, résultat, contrainte. 90% des candidats trouvent au moins 3 chiffres exploitables en 20 minutes.",
              },
              {
                q: "Ça marche pour mon secteur ?",
                a: "10 rôles couverts : vente, growth, CSM, product, tech lead, data/IA, conseil, stratégie, opérations, direction. Si ton poste implique des KPIs et des décisions, l'outil fonctionne.",
              },
            ].map(function (item, i) {
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

      {/* ══════ 7. CTA FINAL ══════ */}
      <div style={{ ...sectionStyle, textAlign: "center", paddingBottom: 40 }}>
        <FadeIn delay={0.6}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0ff", marginBottom: 12 }}>
            Tu as vu le problème. L'outil te donne les armes.
          </h2>
          <button
            onClick={function () {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            style={{
              display: "inline-block",
              padding: "16px 40px",
              background: "linear-gradient(135deg, #e94560, #c81d4e)",
              color: "#fff",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 16,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(233,69,96,0.3)",
            }}
          >
            Scanner une offre →
          </button>
        </FadeIn>
      </div>

      {/* ══════ 8. FOOTER ══════ */}
      <div
        style={{
          borderTop: "1px solid #1a1a3e",
          padding: "20px 0",
          textAlign: "center",
          fontSize: 10,
          color: "#495670",
        }}
      >
        ABNEG@TION par Exosquelette ·{" "}
        <a href="#comment" style={{ color: "#495670", textDecoration: "none" }}>
          Comment ça marche
        </a>{" "}
        ·{" "}
        <a href="#prix" style={{ color: "#495670", textDecoration: "none" }}>
          Prix
        </a>{" "}
        ·{" "}
        <Link href="/mentions-legales" style={{ color: "#495670", textDecoration: "none" }}>
          Mentions légales
        </Link>{" "}
        ·{" "}
        <Link href="/confidentialite" style={{ color: "#495670", textDecoration: "none" }}>
          Confidentialité
        </Link>{" "}
        · © 2026
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTIONS COMMENTÉES — à réintroduire plus tard
          ══════════════════════════════════════════════════════════════════ */}

      {/* ── ANCIEN HERO (remplacé par Éclaireur intégré) ──
      <div style={{ ...sectionStyle, textAlign: "center", paddingTop: 80, paddingBottom: 40 }}>
        <FadeIn>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#f0f0ff", lineHeight: 1.3, marginBottom: 20, maxWidth: 700, margin: "0 auto 20px" }}>
            Ta signature professionnelle existe déjà.<br />Tu ne sais pas la formuler.
          </h1>
          <p style={{ fontSize: 16, color: "#8892b0", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 32px" }}>
            L'outil extrait tes preuves, nomme tes différences, et produit les livrables qui te positionnent. Gratuit.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <Link href="/eclaireur" style={{ display: "inline-block", padding: "14px 32px", background: "linear-gradient(135deg, #e94560, #c81d4e)", color: "#fff", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none", boxShadow: "0 4px 20px rgba(233,69,96,0.3)" }}>
              Tester gratuitement
            </Link>
            <a href="#comment" style={{ display: "inline-block", padding: "14px 32px", background: "transparent", color: "#8892b0", borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: "none", border: "1px solid #1a1a3e" }}>
              Voir comment ça marche
            </a>
          </div>
          <p style={{ fontSize: 11, color: "#495670" }}>Pas de compte pour l'essai. 30 secondes. Tu gardes tout.</p>
        </FadeIn>
      </div>
      */}

      {/* ── VIDÉO placeholder — réintroduire quand la vidéo existe ──
      <div style={sectionStyle}>
        <FadeIn delay={0.1}>
          <div style={{ background: "#0d0d1a", border: "1px solid #1a1a3e", borderRadius: 12, height: 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 48, color: "#e94560", marginBottom: 12 }}>▶</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#ccd6f6", marginBottom: 4 }}>Voir l'outil en action</div>
            <div style={{ fontSize: 13, color: "#8892b0" }}>90 secondes. Pas de blabla.</div>
          </div>
        </FadeIn>
      </div>
      */}

      {/* ── PREUVE SOCIALE placeholder — réintroduire avec de vrais chiffres ──
      <div style={sectionStyle}>
        <FadeIn delay={0.2}>
          <div style={{ background: "#111125", borderRadius: 12, padding: "28px 24px", textAlign: "center", border: "1px solid #1a1a3e" }}>
            <p style={{ fontSize: 13, color: "#495670", fontStyle: "italic", marginBottom: 20 }}>
              Les premiers témoignages arrivent.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
              {[
                { value: "10", label: "rôles couverts" },
                { value: "4", label: "secteurs" },
                { value: "170", label: "tests automatisés" },
              ].map(function (item, i) {
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#e94560", fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</span>
                    <span style={{ fontSize: 11, color: "#8892b0" }}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>
      </div>
      */}

      {/* ── AVIS CLIENTS placeholder — réintroduire avec de vrais avis ──
      <div id="avis" style={sectionStyle}>
        <FadeIn delay={0.65}>
          <div style={h2Style}>AVIS CANDIDATS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
            {[0, 1, 2].map(function (i) {
              return (
                <div key={i} style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
                  <span style={{ fontSize: 13, color: "#495670" }}>Bientôt</span>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 12, color: "#495670", fontStyle: "italic", textAlign: "center" }}>
            Les 10 premiers candidats testent l'outil. Leurs retours apparaîtront ici.
          </p>
        </FadeIn>
      </div>
      */}

      {/* ── PRICING — vit dans la FAQ, réintroduire quand le modèle est stabilisé ──
      <div id="pricing-old" style={sectionStyle}>
        <FadeIn delay={0.7}>
          <div style={h2Style}>PRICING</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ ...cardStyle, borderTop: "3px solid #4ecca3" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#4ecca3", marginBottom: 4 }}>GRATUIT</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ccd6f6", marginBottom: 16 }}>La Forge</div>
              <ul style={{ paddingLeft: 16, margin: "0 0 20px 0", fontSize: 12, color: "#8892b0", lineHeight: 1.8 }}>
                <li>Éclaireur : diagnostic de ton CV face à l'offre en 30 secondes</li>
                <li>Forge complète : extraction, blindage, Duel, signature, GPS, élasticité, cauchemars</li>
                <li>10 rôles couverts. 4 secteurs</li>
                <li>Ton arsenal se construit à ton rythme</li>
              </ul>
              <Link href="/eclaireur" style={{ display: "block", textAlign: "center", padding: "12px 20px", background: "linear-gradient(135deg, #4ecca3, #2ecc71)", color: "#0a0a1a", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                Commencer gratuitement
              </Link>
            </div>
            <div style={{ ...cardStyle, borderTop: "3px solid #495670", opacity: 0.7 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#ccd6f6" }}>~19€/mois</div>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#ff9800", background: "#ff980022", padding: "2px 8px", borderRadius: 6 }}>Bientôt</span>
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
      */}
    </div>
  );
}
