import { useState, useEffect, useRef } from 'react';
import { SIZES, GOV_TYPES, TECH_LEVELS } from '../constants/world.js';
import ShipSprite from './ShipSprite.jsx';

function MenuModal({ game, onClose, onSave, onNewGame, onTitle }) {
  const [confirmNew, setConfirmNew] = useState(false);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ borderColor: "#4fc3f7" }}>
        <div className="modal-title">☰ MENU</div>

        <div className="stat-row"><span className="stat-label">Commander</span><span className="stat-val">{game.commander}</span></div>
        <div className="stat-row"><span className="stat-label">Day</span><span className="stat-val">{game.days}</span></div>
        <div className="stat-row"><span className="stat-label">Credits</span><span className="stat-val-green">{game.credits.toLocaleString()} cr</span></div>
        <div className="stat-row"><span className="stat-label">Ship</span><span className="stat-val" style={{display:"flex",alignItems:"center",gap:6}}><ShipSprite shipId={game.ship.id} size={18}/>{game.ship.name}</span></div>
        <div className="stat-row" style={{ marginBottom: 14 }}><span className="stat-label">Kills</span><span className="stat-val">{game.killed || 0}</span></div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <button className="btn btn-green" style={{ width: "100%", textAlign: "left" }} onClick={() => { onSave(); onClose(); }}>
            💾 SAVE GAME
          </button>
          <button className="btn btn-blue" style={{ width: "100%", textAlign: "left" }} onClick={onTitle}>
            ← TITLE SCREEN
          </button>
          {!confirmNew ? (
            <button className="btn btn-red" style={{ width: "100%", textAlign: "left" }} onClick={() => setConfirmNew(true)}>
              ✕ NEW GAME
            </button>
          ) : (
            <div style={{ border: "1px solid #ff6b35", borderRadius: 2, padding: 10 }}>
              <div style={{ fontSize: 15, color: "#ff6b35", marginBottom: 8 }}>Current save will be lost. Sure?</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-red" style={{ flex: 1 }} onClick={onNewGame}>YES, NEW GAME</button>
                <button className="btn btn-gray" style={{ flex: 1 }} onClick={() => setConfirmNew(false)}>CANCEL</button>
              </div>
            </div>
          )}
          <button className="btn btn-gray" style={{ width: "100%", textAlign: "left" }} onClick={onClose}>
            ▶ CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
}


export default MenuModal;
