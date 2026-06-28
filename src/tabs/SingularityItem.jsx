import { useState, useEffect, useCallback, useRef } from 'react';

function SingularityItem({ game, onUpdate }) {
  const [picking, setPicking] = useState(false);
  const [filter, setFilter] = useState("");

  const use = (targetId) => {
    const targetSys = game.galaxy.find(s => s.id === targetId);
    if (!targetSys) return;
    const newItems = (game.specialItems || []).filter(x => x !== "singularity");
    let newGalaxy = game.galaxy.map(s =>
      s.id === targetId
        ? { ...s, visited: true, market: s.market ? refreshMarket(s.market) : initMarket(s) }
        : s
    );
    onUpdate({
      ...game,
      currentSystem: targetId,
      galaxy: newGalaxy,
      specialItems: newItems,
      days: game.days + 1,
      log: [{ type: "good", text: "Singularity used! Jumped to " + targetSys.name + " instantly." }, ...game.log],
    });
    setPicking(false);
  };

  const filtered = game.galaxy.filter(s =>
    s.id !== game.currentSystem &&
    s.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
        <span style={{ fontSize: 15, color: "#ffd700" }}>🌀 Portable Singularity</span>
        <button className="btn btn-gold" style={{ fontSize: 14, padding: "3px 10px" }}
          onClick={() => setPicking(p => !p)}>
          {picking ? "CANCEL" : "USE"}
        </button>
      </div>
      <div style={{ fontSize: 14, color: "#555588", marginBottom: picking ? 8 : 0 }}>
        One-time instant jump to any system
      </div>
      {picking && (
        <div style={{ border: "1px solid #ffd70055", borderRadius: 4, padding: 10, background: "#0a0a1a" }}>
          <div style={{ fontSize: 14, color: "#ffd700", marginBottom: 8 }}>Select destination:</div>
          <input
            className="input-field"
            placeholder="Filter systems..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ marginBottom: 8, fontSize: 14 }}
          />
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.map(s => (
              <div key={s.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "4px 0", borderBottom: "1px solid #1a1a3a",
              }}>
                <span style={{ fontSize: 14, color: s.visited ? "#4fc3f7" : "#8888bb" }}>
                  {s.name}
                  {s.visited && <span style={{ color: "#555588", fontSize: 12 }}> · {TECH_LEVELS[s.tech]}</span>}
                </span>
                <button className="btn btn-gold" style={{ fontSize: 13, padding: "2px 8px" }}
                  onClick={() => use(s.id)}>
                  JUMP →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


export default SingularityItem;
