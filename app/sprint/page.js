"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { loadSprint, saveSprint, checkPaid } from "@/lib/sprint-db";
import { parseOfferSignals } from "@/lib/sprint/offers";
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

  var savedStateSt = useState(function() {
    if (typeof window === "undefined") return null;
    try {
      var cached = localStorage.getItem("sprint_state");
      return cached ? JSON.parse(cached) : null;
    } catch (e) { return null; }
  });
  var savedState = savedStateSt[0];
  var setSavedState = savedStateSt[1];

  var loadingSt = useState(true);
  var loading = loadingSt[0];
  var setLoading = loadingSt[1];

  var saveTimerRef = useRef(null);
  var onboardingConsumedRef = useRef(false);

  var saveStatusSt = useState(null); // null | "saving" | "saved" | "retrying" | "offline"
  var saveStatus = saveStatusSt[0];
  var setSaveStatus = saveStatusSt[1];
  var saveStatusTimerRef = useRef(null);

  // Check auth on mount
  useEffect(function() {
    // Dev bypass : skip toutes les gates
    if (process.env.NODE_ENV === "development") {
      setUser({ id: "dev", email: "dev@localhost" });
      setPaid(true);
      // savedState is already initialized synchronously from localStorage.
      // Only set mock if no cached state exists.
      if (!savedState) {
        setSavedState({
          screen: "sprint",
          targetRoleId: "enterprise_ae",
          pieces: 7,
          activeStep: 0,
          bricks: [],
        });
      }
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(function(res) {
      if (res.data && res.data.user) {
        setUser(res.data.user);
      } else {
        window.location.href = "/eclaireur";
      }
    });
  }, []);

  // Load sprint + payment status
  useEffect(function() {
    if (!user || user.id === "dev") return;

    // Restore from localStorage immediately while Supabase loads
    try {
      var cached = localStorage.getItem("sprint_state");
      if (cached) {
        var localState = JSON.parse(cached);
        setSavedState(localState);
      }
    } catch (e) {}

    // Vérifier session_id si présent
    var params = new URLSearchParams(window.location.search);
    var sessionId = params.get("session_id");
    var verifyPromise = sessionId
      ? fetch("/api/checkout/verify?session_id=" + sessionId).then(function(r) { return r.json(); }).then(function(d) { return d.paid; }).catch(function() { return false; })
      : Promise.resolve(null);

    Promise.all([loadSprint(user.id), checkPaid(user.id), verifyPromise]).then(function(results) {
      var sprint = results[0];
      var isPaidDb = results[1];
      var isPaidSession = results[2];

      var isPaid = isPaidDb || isPaidSession === true;

      if (sprint) {
        setSprintId(sprint.id);
        try {
          var cached = localStorage.getItem("sprint_state");
          if (cached) {
            var localState = JSON.parse(cached);
            if (localState._savedAt && sprint.state._savedAt && localState._savedAt > sprint.state._savedAt) {
              setSavedState(localState);
            } else {
              setSavedState(sprint.state);
            }
          } else {
            setSavedState(sprint.state);
          }
        } catch (e) {
          setSavedState(sprint.state);
        }
      }

      setPaid(isPaid);
      setLoading(false);
    });
  }, [user]);

  // Consommer les données d'onboarding depuis sessionStorage
  useEffect(function() {
    // TODO: Réactiver !paid quand le paywall abonnement est en place
    if (loading || onboardingConsumedRef.current) return;

    // Si un state existant est déjà chargé (sprint en cours), ne pas écraser
    if (savedState && savedState.screen === "sprint" && savedState.targetRoleId) return;

    try {
      var raw = sessionStorage.getItem("onboarding_data");
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!data.targetRoleId) return;

      onboardingConsumedRef.current = true;

      // Construire l'initialState pour Sprint à partir de l'onboarding
      var offersArray = [];
      var parsedOffers = null;
      if (data.offersText && data.offersText.trim().length > 20) {
        parsedOffers = data.offerSignals || parseOfferSignals(data.offersText, data.targetRoleId);
        offersArray = [{ id: 1, text: data.offersText.trim(), parsedSignals: parsedOffers }];
      }

      setSavedState({
        screen: "sprint",
        targetRoleId: data.targetRoleId,
        previousRole: data.previousRole || "",
        pieces: 7,
        activeStep: 0,
        bricks: [],
        vault: { bricks: 0, missions: 0, pillars: 0, corrections: 0, diltsHistory: [] },
        parsedOffers: parsedOffers,
        offersArray: offersArray,
        offerNextId: offersArray.length > 0 ? 2 : 1,
        takes: [],
        duelResults: [],
        sprintDone: false,
        nextId: 100,
      });

      // Effacer sessionStorage après consommation
      sessionStorage.removeItem("onboarding_data");
    } catch (e) {}
  }, [loading, paid, savedState]);

  // Auto-save with debounce (2 seconds after last change) + retry on failure
  var handleStateChange = useCallback(function(state) {
    if (!user || user.id === "dev") return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(function() {
      var delays = [2000, 5000, 10000];
      var attempt = 0;

      function trySave() {
        saveSprint(user.id, sprintId, state).then(function(res) {
          if (res && res.error) throw new Error(res.error.message || "save error");
          if (res && res.data && !sprintId) {
            setSprintId(res.data.id);
          }
          setSaveStatus("saved");
          if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
          saveStatusTimerRef.current = setTimeout(function() { setSaveStatus(null); }, 2000);
        }).catch(function() {
          attempt++;
          if (attempt <= 3) {
            setSaveStatus("retrying");
            setTimeout(trySave, delays[attempt - 1]);
          } else {
            setSaveStatus("offline");
            try { localStorage.setItem("offline_bricks_backup", JSON.stringify(state)); } catch (e) {}
          }
        });
      }

      trySave();
    }, 2000);
  }, [user, sprintId]);

  // On mount: sync offline backup if present
  useEffect(function() {
    if (!user || user.id === "dev" || !sprintId) return;
    try {
      var backup = localStorage.getItem("offline_bricks_backup");
      if (!backup) return;
      var state = JSON.parse(backup);
      saveSprint(user.id, sprintId, state).then(function(res) {
        if (res && res.error) return;
        localStorage.removeItem("offline_bricks_backup");
        setSaveStatus("synced");
        setTimeout(function() { setSaveStatus(null); }, 3000);
      });
    } catch (e) {}
  }, [user, sprintId]);

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

  // TODO: Réactiver quand le paywall abonnement est en place
  // La Forge est gratuite (modèle B2C2B mars 2026)
  // if (!paid) {
  //   window.location.href = "/eclaireur";
  //   return (
  //     <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
  //       <div style={{ fontSize: 14, color: "#8892b0" }}>Redirection...</div>
  //     </div>
  //   );
  // }

  // GATE : pas de données onboarding ni de sprint existant → redirect onboarding
  if (!savedState || (!savedState.targetRoleId && savedState.screen !== "onboarding")) {
    // Permettre le fallback vers l'onboarding interne si screen === "onboarding"
    // Sinon rediriger vers le nouvel onboarding
    if (!savedState) {
      window.location.href = "/onboarding";
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 14, color: "#8892b0" }}>Redirection...</div>
        </div>
      );
    }
  }

  var wrapSprint = {
    minHeight: "100vh", padding: "24px 16px", maxWidth: 1200, margin: "0 auto",
    fontFamily: "'Inter', -apple-system, sans-serif",
  };

  // SPRINT : l'utilisateur a payé et a les données
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
        user={user}
        saveStatus={saveStatus}
      />
    </div>
  );
}
