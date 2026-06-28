import { useState, useEffect, useRef } from 'react';
import { SHIPS } from '../constants/ships.js';
import { effectiveSkills } from '../engine/combat.js';
import ShipSprite from './ShipSprite.jsx';
import SkillBar from './SkillBar.jsx';
import { SHIELDS } from '../constants/ships.js';

function StatusBar({ game, onMenu }) {
  const sys = game.galaxy[game.currentSystem];
  return (
    <div className="panel" style={{ marginBottom: 8 }}>
      <div className="hdr">
        <div>
          <div className="credit-display">⬡ {game.credits.toLocaleString()} cr</div>
          <div style={{ fontSize: 15, color: "#555588", marginTop: 3 }}>CMDR {game.commander}</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div className="day-display">Day {game.days}</div>
            <div style={{ fontSize: 15, color: "#4fc3f7", marginTop: 3 }}>{sys.name}</div>
          </div>
          <button className="btn btn-gray" onClick={onMenu}
            style={{ fontSize: 15, padding: "5px 8px", lineHeight: 1 }}>☰ MENU</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
        <div>
          <div style={{ fontSize: 16, color: "#555588", marginBottom: 2 }}>HULL</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: (game.hull / game.hullMax * 100) + "%", background: game.hull > 50 ? "#00ff88" : game.hull > 25 ? "#ffd700" : "#ff6b35" }} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 16, color: "#555588", marginBottom: 2 }}>SHIELDS</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: (game.shields.length > 0 ? (game.shields.reduce((s,sh)=>s+sh.current,0) / game.shields.reduce((s,sh)=>s+sh.max,0) * 100) : 0) + "%", background: "#4fc3f7" }} />
          </div>
        </div>
      </div>
      {(() => {
        const rep = game.reputation || 0;
        const repLabel = rep >= 7 ? "LEGEND" : rep >= 4 ? "RESPECTED" : rep >= 1 ? "NEUTRAL+" :
          rep === 0 ? "NEUTRAL" : rep >= -3 ? "SUSPECT" : rep >= -6 ? "WANTED" : "PIRATE";
        const repColor = rep >= 4 ? "#00ff88" : rep >= 0 ? "#8888bb" : rep >= -3 ? "#ffd700" : rep >= -6 ? "#ff6b35" : "#ff4444";
        const bars = Math.round((rep + 10) / 2); // 0-10 bars out of 10
        return (
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 13, color: "#555588", width: 56 }}>REP</div>
            <div style={{ display: "flex", gap: 2 }}>
              {Array.from({length: 10}).map((_, i) => (
                <div key={i} style={{ width: 12, height: 8, borderRadius: 1,
                  background: i < bars ? repColor : "#1a1a3a", border: "1px solid #2a2a4a" }}/>
              ))}
            </div>
            <div style={{ fontSize: 13, color: repColor }}>{repLabel}</div>
            {rep <= -5 && <div style={{ fontSize: 12, color: "#ff4444" }}>⚠ HUNTED</div>}
          </div>
        );
      })()}
    </div>
  );
}


export default StatusBar;
