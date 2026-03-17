"use client";

export function Toast({ toast }) {
  if (!toast) return null;

  var isConsumed = toast.type === "consumed";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        animation: "toastSlideIn 0.3s ease-out",
      }}
    >
      <div
        style={{
          background: isConsumed ? "#0f3460" : "#1a1a2e",
          borderLeft: "3px solid " + (isConsumed ? "#e94560" : "#ff6b6b"),
          borderRadius: 10,
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          maxWidth: 360,
        }}
      >
        <span style={{ fontSize: 16, flexShrink: 0 }}>{isConsumed ? "🪙" : "⚠️"}</span>
        <span style={{ fontSize: 13, color: "#ccd6f6", fontWeight: 600, lineHeight: 1.4 }}>{toast.message}</span>
      </div>
      <style>
        {
          "\
        @keyframes toastSlideIn { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }\
      "
        }
      </style>
    </div>
  );
}
