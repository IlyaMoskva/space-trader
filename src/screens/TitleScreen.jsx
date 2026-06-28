import { useState, useEffect, useCallback, useRef } from 'react';
import SkillBar from '../components/SkillBar.jsx';

function TitleScreen({ onStart, hasSave, onResume, prevName }) {
  const [name, setName] = useState(prevName || "");
  const [pts, setPts] = useState({ pilot: 4, fighter: 4, trader: 4, engineer: 4 });
  const total = pts.pilot + pts.fighter + pts.trader + pts.engineer;
  const maxPts = 16;

  useEffect(() => {
    if (prevName && !name) setName(prevName);
  }, [prevName]);

  const adj = (skill, delta) => {
    const nv = pts[skill] + delta;
    if (nv < 1 || nv > 10) return;
    if (delta > 0 && total >= maxPts) return;
    setPts(p => ({ ...p, [skill]: nv }));
  };

  return (
    <div className="title-screen">
      <div className="title-logo">SPACE<br/>TRADER</div>
      <div className="title-sub">A PALM OS CLASSIC · PWA EDITION</div>
      <div className="panel" style={{ width: "100%", maxWidth: 380 }}>
        <div className="panel-title">Commander Name</div>
        <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="Enter name..." maxLength={12} />
        <div className="panel-title" style={{ marginTop: 14 }}>Skill Points ({maxPts - total} left)</div>
        {Object.entries(pts).map(([skill, val]) => (
          <div key={skill} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 15, color: "#8888bb", width: 72, textTransform: "capitalize" }}>{skill}</div>
            <button className="qty-btn" onClick={() => adj(skill, -1)}>-</button>
            <div style={{ fontSize: 16, color: "#ffd700", width: 24, textAlign: "center" }}>{val}</div>
            <button className="qty-btn" onClick={() => adj(skill, +1)}>+</button>
            <SkillBar val={val} />
          </div>
        ))}
        <div style={{ marginTop: 12, textAlign: "center", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          {hasSave && (
            <button className="btn btn-blue" style={{ width: "100%" }} onClick={onResume}>
              ▶ CONTINUE GAME
            </button>
          )}
          <button className="btn btn-green"
            style={(!name.trim() || total !== maxPts) ? { opacity: 0.4, cursor: "not-allowed", width: "100%" } : { width: "100%" }}
            onClick={() => {
              if (!name.trim() || total !== maxPts) return;
              onStart(name.trim(), pts);
            }}>
            ✦ NEW GAME
          </button>
        </div>
      </div>
    </div>
  );
}


export default TitleScreen;
