"use client";
import { useState } from "react";

/**
 * Reusable tooltip component. Shows a "?" icon next to a term.
 * On hover, displays a short explanation.
 * @param {string} term - the product term (for accessibility)
 * @param {string} text - the explanation text (1 sentence)
 */
export default function Tooltip({ term, text }) {
  var hoverSt = useState(false);
  var hovered = hoverSt[0];
  var setHovered = hoverSt[1];

  return (
    <span
      style={{ position: "relative", display: "inline-block", verticalAlign: "middle", marginLeft: 4 }}
      onMouseEnter={function () {
        setHovered(true);
      }}
      onMouseLeave={function () {
        setHovered(false);
      }}
    >
      <span
        role="img"
        aria-label={"Explication : " + term}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
          color: "#495670",
          cursor: "help",
          border: "1px solid #495670",
          borderRadius: "50%",
          width: 14,
          height: 14,
          textAlign: "center",
          lineHeight: "14px",
          userSelect: "none",
        }}
      >
        ?
      </span>
      <span
        style={{
          position: "absolute",
          bottom: "calc(100% + 6px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#0d0d1a",
          border: "1px solid #1a1a3e",
          color: "#ccd6f6",
          fontSize: 11,
          padding: "8px 12px",
          borderRadius: 6,
          maxWidth: 260,
          lineHeight: 1.5,
          zIndex: 100,
          whiteSpace: "normal",
          opacity: hovered ? 1 : 0,
          pointerEvents: hovered ? "auto" : "none",
          transition: "opacity 150ms",
        }}
      >
        {text}
      </span>
    </span>
  );
}
