import { useState, useEffect, useRef } from 'react';
import { distParsecs } from '../engine/utils.js';
import { canReach, jumpRangeCoords } from '../engine/utils.js';

function GalaxyMap({ galaxy, current, selected, onSelect, jumpRange }) {
  const [zoom, setZoom] = useState(false);
  const currentSys = galaxy[current];
  const jrCoords = jumpRangeCoords(jumpRange);
  const ZOOM_R_PCT = 42;
  const PAD = 0.05; // 5% padding around bounding box

  // Dynamic bounding box from actual system positions
  const xs = galaxy.map(s => s.x);
  const ys = galaxy.map(s => s.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  // Use the larger span for both axes to keep square proportions
  const span = Math.max(spanX, spanY);
  const padAbs = span * PAD;
  const bbMinX = minX - padAbs;
  const bbMinY = minY - padAbs;
  const bbSpan = span + padAbs * 2;

  // Map coord → % position on screen
  const toVx = (x) => zoom
    ? 50 + ((x - currentSys.x) / jrCoords) * ZOOM_R_PCT
    : ((x - bbMinX) / bbSpan) * 100;
  const toVy = (y) => zoom
    ? 50 + ((y - currentSys.y) / jrCoords) * ZOOM_R_PCT
    : ((y - bbMinY) / bbSpan) * 100;

  // Circle radius as % of map square
  const circleRPct = zoom
    ? ZOOM_R_PCT
    : (jrCoords / bbSpan) * 100;

  const visibleSystems = galaxy.filter(s => {
    const vx = toVx(s.x), vy = toVy(s.y);
    return vx >= -4 && vx <= 104 && vy >= -4 && vy <= 104;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 16, color: "#555588" }}>
          {zoom
            ? "LOCAL — " + jumpRange + " pc range shown"
            : "FULL GALAXY — " + galaxy.length + " systems"}
        </div>
        <button className="btn btn-gray" style={{ fontSize: 16, padding: "3px 8px" }}
          onClick={() => setZoom(z => !z)}>
          {zoom ? "⊞ FULL MAP" : "⊕ LOCAL VIEW"}
        </button>
      </div>

      <div style={{
        position: "relative", width: "100%", paddingTop: "100%",
        background: "#050510", border: "1px solid #1a1a4a",
        borderRadius: 4, marginBottom: 6, overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>

          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <circle
              cx={toVx(currentSys.x) + "%"}
              cy={toVy(currentSys.y) + "%"}
              r={circleRPct + "%"}
              fill="none" stroke="#00ff8840" strokeWidth="1" strokeDasharray="4 3"
            />
          </svg>

          {visibleSystems.map(sys => {
            const vx = toVx(sys.x);
            const vy = toVy(sys.y);
            const inRange = canReach(currentSys, sys, jumpRange);
            const isCurrent = sys.id === current;
            const isSelected = sys.id === selected;
            const dpc = Math.round(distParsecs(currentSys, sys) * 10) / 10;

            const color = isCurrent ? "#00ff88"
              : isSelected ? "#ffd700"
              : sys.visited ? "#4fc3f7"
              : "#6666aa";
            const opacity = isCurrent || isSelected ? 1 : 0.75;
            const size = isCurrent ? 9 : isSelected ? 8 : 6;
            const showLabel = true;

            return (
              <div key={sys.id}>
                <div style={{
                  position: "absolute",
                  left: vx + "%", top: vy + "%",
                  width: size, height: size, borderRadius: "50%",
                  background: color, opacity,
                  transform: "translate(-50%,-50%)",
                  cursor: sys.id !== current ? "pointer" : "default",
                  boxShadow: isCurrent ? "0 0 0 2px #00ff8866"
                    : isSelected ? "0 0 0 2px #ffd70066" : "none",
                  zIndex: isCurrent || isSelected ? 2 : 1,
                }}
                  onClick={() => sys.id !== current && onSelect(sys.id)}
                  title={sys.name + " — " + dpc + " pc" + (inRange ? " ✓" : "")}
                />
                {showLabel && (
                  <div style={{
                    position: "absolute",
                    left: vx + "%", top: "calc(" + vy + "% + 5px)",
                    transform: "translateX(-50%)",
                    fontSize: isCurrent ? 13 : 11,
                    lineHeight: 1,
                    color: isCurrent ? "#00ff88"
                      : isSelected ? "#ffd700"
                      : sys.visited ? "#4fc3f7"
                      : "#9999cc",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 3,
                    textShadow: "0 0 3px #000, 0 0 5px #000",
                    fontFamily: "'VT323', monospace",
                  }}>
                    {sys.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, fontSize: 16, color: "#555588", flexWrap: "wrap" }}>
        <span style={{ color: "#00ff88" }}>● Current</span>
        <span style={{ color: "#ffd700" }}>● Selected</span>
        <span style={{ color: "#4fc3f7" }}>● Visited</span>
        <span style={{ color: "#6666aa" }}>● Unvisited</span>
      </div>
    </div>
  );
}


export default GalaxyMap;
