"use client";
import Link from "next/link";

export default function MentionsLegalesPage() {
  var sectionStyle = { marginBottom: 32 };
  var h2Style = {
    fontSize: 16,
    fontWeight: 700,
    color: "#e94560",
    fontFamily: "'JetBrains Mono', monospace",
    marginBottom: 12,
    letterSpacing: 1,
  };
  var pStyle = {
    fontSize: 14,
    color: "#ccd6f6",
    lineHeight: 1.8,
    fontFamily: "'DM Sans', 'Inter', sans-serif",
    margin: "0 0 8px 0",
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", minHeight: "100vh", background: "#06060f" }}>
      <Link
        href="/"
        style={{ fontSize: 12, color: "#4ecca3", textDecoration: "none", display: "inline-block", marginBottom: 32 }}
      >
        ← Retour à l'accueil
      </Link>

      <h1
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: "#e94560",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: 2,
          marginBottom: 40,
        }}
      >
        MENTIONS LÉGALES
      </h1>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Éditeur du site</h2>
        <p style={pStyle}>Nom : Jean-Mikaël Bigeat</p>
        <p style={pStyle}>Statut : Entrepreneur individuel (en cours d'immatriculation)</p>
        <p style={pStyle}>Nom commercial : Exosquelette</p>
        <p style={pStyle}>Produit : Abneg@tion</p>
        <p style={pStyle}>Adresse : Montreuil, France</p>
        <p style={pStyle}>Email : contact@abnegation.eu</p>
        <p style={pStyle}>Responsable de publication : Jean-Mikaël Bigeat</p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Hébergement</h2>
        <p style={pStyle}>Vercel Inc.</p>
        <p style={pStyle}>440 N Barranca Ave #4133</p>
        <p style={pStyle}>Covina, CA 91723</p>
        <p style={pStyle}>United States</p>
        <p style={pStyle}>
          <a href="https://vercel.com" style={{ color: "#4ecca3" }}>
            https://vercel.com
          </a>
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Base de données et authentification</h2>
        <p style={pStyle}>Supabase Inc.</p>
        <p style={pStyle}>970 Toa Payoh North #07-04</p>
        <p style={pStyle}>Singapore 318992</p>
        <p style={pStyle}>
          <a href="https://supabase.com" style={{ color: "#4ecca3" }}>
            https://supabase.com
          </a>
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Paiements</h2>
        <p style={pStyle}>Stripe Inc.</p>
        <p style={pStyle}>354 Oyster Point Blvd</p>
        <p style={pStyle}>South San Francisco, CA 94080</p>
        <p style={pStyle}>United States</p>
        <p style={pStyle}>
          <a href="https://stripe.com" style={{ color: "#4ecca3" }}>
            https://stripe.com
          </a>
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Propriété intellectuelle</h2>
        <p style={pStyle}>
          L'ensemble du contenu du site abnegation.eu (textes, code, design, méthodologie) est la propriété de
          Jean-Mikaël Bigeat. Toute reproduction sans autorisation est interdite.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Données personnelles</h2>
        <p style={pStyle}>
          Voir la{" "}
          <Link href="/confidentialite" style={{ color: "#4ecca3", textDecoration: "underline" }}>
            Politique de confidentialité
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
