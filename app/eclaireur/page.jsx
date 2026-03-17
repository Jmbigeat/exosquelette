"use client";
import { Eclaireur } from "@/components/eclaireur/Eclaireur";

export default function EclaireurPage() {
  var wrap = {
    minHeight: "100vh",
    padding: "24px 16px",
    maxWidth: 1200,
    margin: "0 auto",
    fontFamily: "'Inter', -apple-system, sans-serif",
  };

  return (
    <div style={wrap}>
      <Eclaireur />
    </div>
  );
}
