"use client";
import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

export default function AuthPage() {
  var supabase = createBrowserClient();
  var emailSt = useState("");
  var email = emailSt[0];
  var setEmail = emailSt[1];
  var passSt = useState("");
  var pass = passSt[0];
  var setPass = passSt[1];
  var modeSt = useState("login");
  var mode = modeSt[0];
  var setMode = modeSt[1];
  var errSt = useState(null);
  var error = errSt[0];
  var setError = errSt[1];
  var loadSt = useState(false);
  var loading = loadSt[0];
  var setLoading = loadSt[1];

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "signup") {
      var res = await supabase.auth.signUp({ email: email, password: pass });
      if (res.error) { setError(res.error.message); setLoading(false); return; }
      // Auto-login after signup
      var login = await supabase.auth.signInWithPassword({ email: email, password: pass });
      if (login.error) { setError("Compte créé. Connecte-toi."); setMode("login"); setLoading(false); return; }
    } else {
      var res = await supabase.auth.signInWithPassword({ email: email, password: pass });
      if (res.error) { setError(res.error.message); setLoading(false); return; }
    }

    window.location.href = "/sprint";
  }

  var wrap = {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    padding: 24, fontFamily: "'Inter', -apple-system, sans-serif",
  };

  var card = {
    background: "#16213e", borderRadius: 16, padding: 32, width: "100%", maxWidth: 380,
  };

  var inputStyle = {
    width: "100%", padding: 14, background: "#1a1a2e", border: "2px solid #16213e",
    borderRadius: 10, color: "#ccd6f6", fontSize: 14, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box", marginBottom: 12,
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>ABNEG@TION</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#ccd6f6" }}>{mode === "login" ? "Connexion" : "Créer un compte"}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email" value={email} onChange={function(e) { setEmail(e.target.value); }}
            placeholder="Email" required style={inputStyle}
          />
          <input
            type="password" value={pass} onChange={function(e) { setPass(e.target.value); }}
            placeholder="Mot de passe (6 caractères min)" required minLength={6} style={inputStyle}
          />

          {error && (
            <div style={{ fontSize: 12, color: "#e94560", marginBottom: 12, textAlign: "center" }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: 16, background: "linear-gradient(135deg, #e94560, #c81d4e)",
            color: "#fff", border: "none", borderRadius: 12, cursor: loading ? "wait" : "pointer",
            fontWeight: 700, fontSize: 15, opacity: loading ? 0.6 : 1, marginBottom: 12,
          }}>{loading ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}</button>
        </form>

        <div style={{ textAlign: "center" }}>
          <button onClick={function() { setMode(mode === "login" ? "signup" : "login"); setError(null); }} style={{
            background: "none", border: "none", color: "#8892b0", fontSize: 13, cursor: "pointer",
          }}>{mode === "login" ? "Pas de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}</button>
        </div>
      </div>
    </div>
  );
}
