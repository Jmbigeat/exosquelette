"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { loadSprint, saveSprint, checkPaid } from "@/lib/sprint-db";
import Sprint from "@/components/Sprint";

export default function SprintPage() {
  var supabase = createBrowserClient();

  var userSt = useState(null);
  var user = userSt[0];
  var setUser = userSt[1];

  var paidSt = useState(false);
  var paid = paidSt[0];
  var setPaid = paidSt[1];

  var sprintIdSt = useState(null);
  var sprintId = sprintIdSt[0];
  var setSprintId = sprintIdSt[1];

  var savedStateSt = useState(null);
  var savedState = savedStateSt[0];
  var setSavedState = savedStateSt[1];

  var loadingSt = useState(true);
  var loading = loadingSt[0];
  var setLoading = loadingSt[1];

  var checkoutLoadingSt = useState(false);
  var checkoutLoading = checkoutLoadingSt[0];
  var setCheckoutLoading = checkoutLoadingSt[1];

  var saveTimerRef = useRef(null);

  // Check auth on mount
  useEffect(function() {
    supabase.auth.getUser().then(function(res) {
      if (res.data && res.data.user) {
        setUser(res.data.user);
      } else {
        window.location.href = "/auth";
      }
    });
  }, []);

  // Load sprint + payment status
  useEffect(function() {
    if (!user) return;

    Promise.all([loadSprint(user.id), checkPaid(user.id)]).then(function(results) {
      var sprint = results[0];
      var isPaid = results[1];

      if (sprint) {
        setSprintId(sprint.id);
        setSavedState(sprint.state);
      }
      setPaid(isPaid);
      setLoading(false);
    });
  }, [user]);

  // Auto-save with debounce (2 seconds after last change)
  var handleStateChange = useCallback(function(state) {
    if (!user) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(function() {
      saveSprint(user.id, sprintId, state).then(function(res) {
        if (res && res.data && !sprintId) {
          setSprintId(res.data.id);
        }
      });
    }, 2000);
  }, [user, sprintId]);

  // Stripe checkout
  async function handleCheckout() {
    if (!user) return;
    setCheckoutLoading(true);
    try {
      var res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      var data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
    }
    setCheckoutLoading(false);
  }

  // Logout
  function handleLogout() {
    supabase.auth.signOut().then(function() {
      window.location.href = "/auth";
    });
  }

  // LLM scan
  async function handleScan(cv, offers, roleId) {
    try {
      var res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv: cv, offers: offers, roleId: roleId }),
      });
      var data = await res.json();
      return data;
    } catch (err) {
      console.error("Scan error:", err);
      return null;
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 14, color: "#8892b0" }}>Chargement...</div>
      </div>
    );
  }

  var wrapPaywall = {
    minHeight: "100vh", padding: "24px 16px", maxWidth: 520, margin: "0 auto",
    fontFamily: "'Inter', -apple-system, sans-serif",
  };

  var wrapSprint = {
    minHeight: "100vh", padding: "24px 16px", maxWidth: 1200, margin: "0 auto",
    fontFamily: "'Inter', -apple-system, sans-serif",
  };

  // PAYWALL : l'utilisateur n'a pas paye
  if (!paid) {
    return (
      <div style={wrapPaywall}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>ABNEG@TION</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ccd6f6", marginBottom: 8 }}>Sprint — 49 euros</div>
          <div style={{ fontSize: 14, color: "#8892b0", lineHeight: 1.7, maxWidth: 380, margin: "0 auto" }}>
            7 jours. 11 questions. Un Coffre-Fort plein. CV, bio, script, positions, rapport d'impact. Tu valides. L'IA fait le reste.
          </div>
        </div>

        <div style={{ background: "#16213e", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: "#ccd6f6", lineHeight: 1.7, marginBottom: 16 }}>
            Le marché ne paie pas la performance. Il paie la rareté. L'outil te montre où tu es rare, où tu es substituable, et comment inverser le rapport de force.
          </div>
          <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.5 }}>
            Interrogatoire structuré (4 champs par brique). Confrontation automatique. Générateurs de livrables. Simulateur d'entretien avec crises imprévues. Rapport d'impact avec zones d'excellence et de rupture. Détection de métiers alternatifs.
          </div>
        </div>

        <button onClick={handleCheckout} disabled={checkoutLoading} style={{
          width: "100%", padding: 18, background: "linear-gradient(135deg, #e94560, #c81d4e)",
          color: "#fff", border: "none", borderRadius: 12, cursor: checkoutLoading ? "wait" : "pointer",
          fontWeight: 700, fontSize: 16, opacity: checkoutLoading ? 0.6 : 1,
          boxShadow: "0 4px 20px rgba(233,69,96,0.3)",
        }}>
          {checkoutLoading ? "Redirection vers Stripe..." : "Commencer le Sprint — 49\u20AC"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#495670", fontSize: 12, cursor: "pointer" }}>Se déconnecter</button>
        </div>
      </div>
    );
  }

  // SPRINT : l'utilisateur a paye
  return (
    <div style={wrapSprint}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "#495670" }}>{user.email}</div>
        <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#495670", fontSize: 11, cursor: "pointer" }}>Déconnexion</button>
      </div>
      <Sprint
        initialState={savedState}
        onStateChange={handleStateChange}
        onScan={handleScan}
      />
    </div>
  );
}
