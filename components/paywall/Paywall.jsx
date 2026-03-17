"use client";
import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

export function Paywall({ cancelled }) {
  var supabase = createBrowserClient();
  var emailSt = useState("");
  var email = emailSt[0];
  var setEmail = emailSt[1];
  var passSt = useState("");
  var pass = passSt[0];
  var setPass = passSt[1];
  var errorSt = useState(cancelled ? "Paiement annulé. Tu peux réessayer." : null);
  var error = errorSt[0];
  var setError = errorSt[1];
  var loadingSt = useState(false);
  var loading = loadingSt[0];
  var setLoading = loadingSt[1];

  var canSubmit = email.trim().length > 0 && pass.length >= 8 && !loading;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    var userId = null;

    // 1. Créer le compte
    try {
      var regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: pass }),
      });
      var regData = await regRes.json();

      if (regData.error === "exists") {
        // Compte existant — tenter le login
        var loginRes = await supabase.auth.signInWithPassword({ email: email, password: pass });
        if (loginRes.error) {
          setError("Ce compte existe déjà. Mot de passe incorrect.");
          setLoading(false);
          return;
        }
        userId = loginRes.data.user.id;
      } else if (regData.error) {
        setError(regData.error);
        setLoading(false);
        return;
      } else {
        userId = regData.userId;
        // Auto-login après création
        var loginRes = await supabase.auth.signInWithPassword({ email: email, password: pass });
        if (loginRes.error) {
          setError("Compte créé mais connexion échouée. Réessaie.");
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      setError("Erreur réseau. Vérifie ta connexion.");
      setLoading(false);
      return;
    }

    // 2. Créer la session Stripe
    try {
      var checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId, email: email, type: "sprint" }),
      });
      var checkoutData = await checkoutRes.json();
      if (checkoutData.url) {
        window.location.href = checkoutData.url;
        return;
      }
      setError("Erreur Stripe. Réessaie.");
    } catch (err) {
      setError("Erreur réseau. Vérifie ta connexion.");
    }
    setLoading(false);
  }

  var inputStyle = {
    width: "100%",
    padding: 14,
    background: "#1a1a2e",
    border: "2px solid #16213e",
    borderRadius: 10,
    color: "#ccd6f6",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    marginBottom: 12,
  };

  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>
          ABNEG@TION
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#ccd6f6", marginBottom: 8 }}>
          Forge Abneg@tion — 49{"€"}
        </div>
        <div style={{ fontSize: 14, color: "#8892b0", lineHeight: 1.7, maxWidth: 380, margin: "0 auto" }}>
          CV réécrit. Bio calibrée. Script de contact. Préparation entretien. Score de densité.
        </div>
      </div>

      {cancelled && !error && (
        <div
          style={{
            background: "#e94560" + "15",
            border: "1px solid #e94560" + "44",
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 13, color: "#e94560", fontWeight: 600 }}>Paiement annulé. Tu peux réessayer.</div>
        </div>
      )}

      <div style={{ background: "#16213e", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7, marginBottom: 12 }}>
          Le marché ne paie pas la performance. Il paie la rareté. L'outil te montre où tu es rare, où tu es
          substituable, et comment inverser le rapport de force.
        </div>
        <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>
          Interrogatoire structuré. Confrontation automatique. Livrables calibrés. Simulateur d'entretien. Détection de
          métiers alternatifs.
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={function (e) {
            setEmail(e.target.value);
          }}
          placeholder="Email"
          required
          style={inputStyle}
        />
        <input
          type="password"
          value={pass}
          onChange={function (e) {
            setPass(e.target.value);
          }}
          placeholder="Mot de passe (8 caractères minimum)"
          required
          minLength={8}
          style={inputStyle}
        />

        {error && <div style={{ fontSize: 12, color: "#e94560", marginBottom: 12, textAlign: "center" }}>{error}</div>}

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            width: "100%",
            padding: 18,
            background: canSubmit ? "linear-gradient(135deg, #e94560, #c81d4e)" : "#1a1a2e",
            color: canSubmit ? "#fff" : "#495670",
            border: canSubmit ? "none" : "2px solid #16213e",
            borderRadius: 12,
            cursor: canSubmit ? "pointer" : "not-allowed",
            fontWeight: 700,
            fontSize: 16,
            boxShadow: canSubmit ? "0 4px 20px rgba(233,69,96,0.3)" : "none",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Redirection vers Stripe..." : "Payer 49€ et commencer"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button
          onClick={function () {
            window.location.href = "/auth";
          }}
          style={{
            background: "none",
            border: "none",
            color: "#8892b0",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Déjà un compte ? Se connecter
        </button>
      </div>

      <div style={{ fontSize: 11, color: "#495670", textAlign: "center", marginTop: 12 }}>
        Paiement sécurisé Stripe. Satisfait ou remboursé 48h.
      </div>
    </div>
  );
}
