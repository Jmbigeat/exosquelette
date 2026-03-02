"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(function() {
    window.location.href = "/eclaireur";
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 14, color: "#8892b0" }}>Redirection...</div>
    </div>
  );
}
