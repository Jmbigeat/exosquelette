"use client";
import Link from "next/link";

export default function ConfidentialitePage() {
  var sectionStyle = { marginBottom: 32 };
  var h2Style = { fontSize: 16, fontWeight: 700, color: "#e94560", fontFamily: "'JetBrains Mono', monospace", marginBottom: 12, letterSpacing: 1 };
  var pStyle = { fontSize: 14, color: "#ccd6f6", lineHeight: 1.8, fontFamily: "'DM Sans', 'Inter', sans-serif", margin: "0 0 8px 0" };
  var liStyle = { fontSize: 14, color: "#ccd6f6", lineHeight: 1.8, fontFamily: "'DM Sans', 'Inter', sans-serif", marginBottom: 4 };
  var h3Style = { fontSize: 14, fontWeight: 700, color: "#ccd6f6", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8, marginTop: 20 };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", minHeight: "100vh", background: "#06060f" }}>
      <Link href="/" style={{ fontSize: 12, color: "#4ecca3", textDecoration: "none", display: "inline-block", marginBottom: 32 }}>← Retour à l'accueil</Link>

      <h1 style={{ fontSize: 24, fontWeight: 800, color: "#e94560", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, marginBottom: 12 }}>POLITIQUE DE CONFIDENTIALITÉ</h1>
      <p style={{ fontSize: 12, color: "#495670", marginBottom: 40 }}>Dernière mise à jour : mars 2026</p>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Responsable du traitement</h2>
        <p style={pStyle}>Jean-Mikaël Bigeat — contact@abnegation.eu</p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Données collectées</h2>

        <h3 style={h3Style}>1. Données de compte</h3>
        <p style={pStyle}>Email et mot de passe (hashé par Supabase). Collectées à la création du compte. Nécessaires au fonctionnement du service.</p>

        <h3 style={h3Style}>2. Données de la Forge</h3>
        <p style={pStyle}>Briques (textes saisis par le candidat), cauchemars couverts, score de densité, signature, livrables générés. Stockées dans Supabase. Liées au compte utilisateur.</p>

        <h3 style={h3Style}>3. Données du Brew</h3>
        <p style={pStyle}>Déclarations hebdomadaires (piliers publiés, réactions déclarées). Stockées dans Supabase.</p>

        <h3 style={h3Style}>4. Données de l'Éclaireur</h3>
        <p style={pStyle}>Offre d'emploi collée et CV collé. <strong style={{ color: "#4ecca3" }}>NON STOCKÉES</strong>. Traitées en mémoire côté client. Supprimées à la fermeture de l'onglet. Aucune persistance serveur.</p>

        <h3 style={h3Style}>5. Données de paiement</h3>
        <p style={pStyle}>Traitées par Stripe. Abneg@tion ne stocke pas de numéro de carte. Seul l'identifiant client Stripe est conservé.</p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Finalité du traitement</h2>
        <p style={pStyle}>Les données sont collectées uniquement pour faire fonctionner le service : extraire les preuves de valeur du candidat, générer des livrables calibrés, et piloter la stratégie LinkedIn (Brew).</p>
        <p style={pStyle}>Aucune donnée n'est utilisée à des fins publicitaires. Aucune donnée n'est vendue à des tiers. Aucun profilage marketing.</p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Durée de conservation</h2>
        <p style={pStyle}>Les données sont conservées tant que le compte est actif. À la suppression du compte, toutes les données sont supprimées sous 30 jours.</p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Sous-traitants</h2>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li style={liStyle}>Supabase (hébergement, auth, base de données) — Singapour et UE</li>
          <li style={liStyle}>Vercel (hébergement web) — États-Unis</li>
          <li style={liStyle}>Stripe (paiements) — États-Unis</li>
        </ul>
        <p style={{ ...pStyle, marginTop: 12 }}>Les transferts hors UE sont encadrés par les clauses contractuelles types (SCCs) de chaque sous-traitant.</p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Tes droits (RGPD articles 15 à 21)</h2>
        <p style={pStyle}>Tu as le droit de :</p>
        <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
          <li style={liStyle}>accéder à tes données</li>
          <li style={liStyle}>les rectifier</li>
          <li style={liStyle}>les supprimer</li>
          <li style={liStyle}>les exporter (portabilité)</li>
          <li style={liStyle}>t'opposer au traitement</li>
          <li style={liStyle}>retirer ton consentement</li>
        </ul>
        <p style={pStyle}>Pour exercer ces droits : contact@abnegation.eu. Réponse sous 30 jours.</p>
        <p style={pStyle}>Si tu estimes que tes droits ne sont pas respectés, tu peux saisir la <a href="https://www.cnil.fr" style={{ color: "#4ecca3" }}>CNIL</a>.</p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Cookies</h2>
        <p style={pStyle}>Le site utilise un cookie technique d'authentification (Supabase auth token). Ce cookie est nécessaire au fonctionnement du service. Il n'est pas utilisé pour le tracking.</p>
        <p style={pStyle}>Aucun cookie publicitaire. Aucun cookie analytics. Aucun pixel de tracking. Aucun outil tiers de mesure d'audience.</p>
      </div>
    </div>
  );
}
