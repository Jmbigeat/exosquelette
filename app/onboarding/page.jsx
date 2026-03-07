"use client";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export default function OnboardingPage() {
  var supabase = createBrowserClient();
  var userSt = useState(null);
  var user = userSt[0]; var setUser = userSt[1];
  var loadingSt = useState(true);
  var loading = loadingSt[0]; var setLoading = loadingSt[1];

  useEffect(function() {
    supabase.auth.getUser().then(function(res) {
      if (!res.data || !res.data.user) {
        // TODO: Réactiver quand le paywall abonnement est en place
        // La Forge est gratuite (modèle B2C2B mars 2026)
        // window.location.href = "/paywall";
        window.location.href = "/auth";
        return;
      }
      var u = res.data.user;
      setUser(u);

      // TODO: Réactiver quand le paywall abonnement est en place
      // La Forge est gratuite (modèle B2C2B mars 2026)
      // Vérifier le paiement
      // var params = new URLSearchParams(window.location.search);
      // var sessionId = params.get("session_id");
      // if (sessionId) {
      //   fetch("/api/checkout/verify?session_id=" + sessionId)
      //     .then(function(r) { return r.json(); })
      //     .then(function(data) {
      //       if (data.paid) { setLoading(false); } else { window.location.href = "/paywall"; }
      //     })
      //     .catch(function() { window.location.href = "/paywall"; });
      // } else {
      //   supabase.from("profiles").select("paid").eq("id", u.id).single()
      //     .then(function(r) {
      //       if (r.data && r.data.paid) { setLoading(false); } else { window.location.href = "/paywall"; }
      //     });
      // }
      setLoading(false);
    });
  }, []);

  function handleComplete(data) {
    try {
      sessionStorage.setItem("onboarding_data", JSON.stringify(data));
    } catch (e) {}
    window.location.href = "/sprint";
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 14, color: "#8892b0" }}>Chargement...</div>
      </div>
    );
  }

  var wrap = {
    minHeight: "100vh", padding: "24px 16px", maxWidth: 520, margin: "0 auto",
    fontFamily: "'Inter', -apple-system, sans-serif",
  };

  return (
    <div style={wrap}>
      <OnboardingFlow onComplete={handleComplete} />
    </div>
  );
}
