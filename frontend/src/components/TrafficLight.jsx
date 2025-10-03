// File: src/components/TrafficLight.jsx
import React from "react";

const circle = (active, color) => ({
  width: 14,
  height: 14,
  borderRadius: "50%",
  background: active ? color : "#e5e7eb",
  boxShadow: active ? `0 0 8px ${color}` : "none",
});

export default function TrafficLight({ status }) {
  const isGreen = (status || "").toLowerCase() === "green";
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <div style={circle(!isGreen, "#ef4444")} /> {/* Red */}
      <div style={circle(false, "#f59e0b")} />    {/* Yellow (off) */}
      <div style={circle(isGreen, "#22c55e")} />  {/* Green */}
    </div>
  );
}