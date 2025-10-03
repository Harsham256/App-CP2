// FRONTEND/src/components/BigTrafficLight.jsx
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import "./big-traffic-light.css";

const STAGES = [
  { key: "red",    label: "STOP",      ms: 4000 },
  { key: "yellow", label: "GET READY", ms: 4000 },
  { key: "green",  label: "GO",        ms: 4000 },
];


export default function BigTrafficLight({
  isPlaying = false,
  onSequenceComplete = () => {},
  finalStatus = null,
  finalLabel = "",
}) {
 const totalMs = useMemo(() => STAGES.reduce((a, s) => a + s.ms, 0), []);
  const [activeIdx, setActiveIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    setDone(false);
    setActiveIdx(0);

    let elapsed = 0;
    let idx = 0;
    const tick = () => {
      if (elapsed >= totalMs) {
        setDone(true);
        onSequenceComplete?.();
        return;
      }
      setActiveIdx(idx);
      setTimeout(() => {
        elapsed += STAGES[idx].ms;
        idx = Math.min(idx + 1, STAGES.length - 1);
        tick();
      }, STAGES[idx].ms);
    };
    tick();
  }, [isPlaying, onSequenceComplete, totalMs]);

  const activeStage = STAGES[activeIdx];
  const mode = done && finalStatus ? "final" : "intro";

  return (
    <div className="big-tl-wrapper">
      <div className="big-tl-body shadow">
        <div className={`lamp red ${mode === "intro" ? (activeStage.key === "red" ? "on" : "") : (finalStatus === "red" ? "on" : "")}`} />
        <div className={`lamp yellow ${mode === "intro" ? (activeStage.key === "yellow" ? "on" : "") : ""}`} />
        <div className={`lamp green ${mode === "intro" ? (activeStage.key === "green" ? "on" : "") : (finalStatus === "green" ? "on" : "")}`} />
      </div>
      <div className="big-tl-text">
        {mode === "intro" ? (
          <span className={`stage ${activeStage.key}`}>{activeStage.label}</span>
        ) : (
          <span className={`final ${finalStatus}`}>{finalLabel || (finalStatus === "green" ? "Verified" : "Issues Found")}</span>
        )}
      </div>
    </div>
  );
}

BigTrafficLight.propTypes = {
  isPlaying: PropTypes.bool,
  onSequenceComplete: PropTypes.func,
  finalStatus: PropTypes.oneOf(["green", "red", null]),
  finalLabel: PropTypes.string,
};
