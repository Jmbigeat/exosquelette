"use client";
import { useState, useEffect } from "react";
import { Paywall } from "@/components/paywall/Paywall";

export default function PaywallPage() {
  var cancelledSt = useState(false);
  var cancelled = cancelledSt[0];
  var setCancelled = cancelledSt[1];

  useEffect(function() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("cancelled") === "true") setCancelled(true);
  }, []);

  var wrap = {
    minHeight: "100vh", padding: "24px 16px", maxWidth: 520, margin: "0 auto",
    fontFamily: "'Inter', -apple-system, sans-serif",
  };

  return (
    <div style={wrap}>
      <Paywall cancelled={cancelled} />
    </div>
  );
}
