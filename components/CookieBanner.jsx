"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Minimal cookie banner. Technical auth cookie only, no tracking.
 * Shows once, dismissed with OK button, state in localStorage.
 */
export default function CookieBanner() {
  var state = useState(false);
  var show = state[0];
  var setShow = state[1];

  useEffect(function () {
    if (!localStorage.getItem("cookie_consent")) setShow(true);
  }, []);

  function accept() {
    localStorage.setItem("cookie_consent", "ok");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        zIndex: 9999,
        background: "#111125",
        borderTop: "1px solid #1a1a3e",
        padding: "12px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxSizing: "border-box",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.6 }}>
        Ce site utilise un cookie technique pour ta connexion. Pas de tracking. Pas de pub.{" "}
        <Link href="/confidentialite" style={{ color: "#4ecca3", textDecoration: "underline", fontSize: 12 }}>
          En savoir plus
        </Link>
      </div>
      <button
        onClick={accept}
        style={{
          background: "#e94560",
          color: "#f0f0ff",
          border: "none",
          padding: "6px 20px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
          fontFamily: "inherit",
        }}
      >
        OK
      </button>
    </div>
  );
}
