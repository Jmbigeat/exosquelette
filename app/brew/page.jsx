"use client";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { loadSprint, checkPaid } from "@/lib/sprint-db";
import { computeDensityScore } from "@/lib/sprint/scoring";
import { setActiveCauchemarsGlobal, buildActiveCauchemars } from "@/lib/sprint/scoring";
import Brew from "@/components/brew/Brew";

export default function BrewPage() {
  var supabase = createBrowserClient();

  var userSt = useState(null);
  var user = userSt[0];
  var setUser = userSt[1];

  var paidSt = useState(false);
  var paid = paidSt[0];
  var setPaid = paidSt[1];

  var forgeDataSt = useState(null);
  var forgeData = forgeDataSt[0];
  var setForgeData = forgeDataSt[1];

  var loadingSt = useState(true);
  var loading = loadingSt[0];
  var setLoading = loadingSt[1];

  // Check auth on mount
  useEffect(function () {
    if (process.env.NODE_ENV === "development") {
      setUser({ id: "dev", email: "dev@localhost" });
      setPaid(true);
      // Dev mock
      try {
        var cached = localStorage.getItem("sprint_state");
        if (cached) {
          var state = JSON.parse(cached);
          setForgeData(state);
        }
      } catch (e) {}
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(function (res) {
      if (res.data && res.data.user) {
        setUser(res.data.user);
      } else {
        window.location.href = "/auth";
      }
    });
  }, []);

  // Load Forge data + payment
  useEffect(
    function () {
      if (!user || user.id === "dev") return;

      Promise.all([loadSprint(user.id), checkPaid(user.id)]).then(function (results) {
        var sprint = results[0];
        var isPaid = results[1];

        if (sprint && sprint.state) {
          setForgeData(sprint.state);
        }
        setPaid(isPaid);
        setLoading(false);
      });
    },
    [user]
  );

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#06060f",
        }}
      >
        <div style={{ fontSize: 14, color: "#8892b0" }}>Chargement...</div>
      </div>
    );
  }

  var wrapBrew = {
    minHeight: "100vh",
    padding: "24px 16px",
    maxWidth: 900,
    margin: "0 auto",
    fontFamily: "'Inter', -apple-system, sans-serif",
    background: "#06060f",
    color: "#ccd6f6",
  };

  return (
    <div style={wrapBrew}>
      <Brew user={user} paid={paid} forgeData={forgeData} />
    </div>
  );
}
