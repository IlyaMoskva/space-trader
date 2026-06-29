import { useState, useEffect } from 'react';
import { canReach } from '../engine/utils.js';
import { TECH_LEVELS, GOV_TYPES, SIZES } from '../constants/world.js';
import GalaxyMap from '../components/GalaxyMap.jsx';
import QuestPopup from '../components/QuestPopup.jsx';
import { getTravelState, applyTravel, applyPatrol } from '../engine/travel.js';

function TravelScreen({ game, onUpdate, onEncounter, onQuestPopup, initialSelected }) {
  const [selected, setSelected] = useState(initialSelected ?? null);

  useEffect(() => {
    if (initialSelected !== undefined && initialSelected !== null) setSelected(initialSelected);
  }, [initialSelected]);

  const { currentSys, effectiveSelected, selectedSys, jumpRange, fuel, inRange, canTravel } =
    getTravelState(game, selected);

  const travel = () => {
    if (!canTravel) return;
    const { newGame, enc, bossEnc, popups } = applyTravel(game, effectiveSelected, fuel);
    setSelected(null);
    if (bossEnc) { onEncounter(newGame, bossEnc); return; }
    if (popups.length > 0) { onUpdate(newGame); onQuestPopup(popups[0]); return; }
    if (enc) { onEncounter(newGame, enc); }
    else { onUpdate(newGame); }
  };

  return (
    <div>
      <GalaxyMap
        galaxy={game.galaxy}
        current={game.currentSystem}
        selected={effectiveSelected}
        onSelect={setSelected}
        jumpRange={jumpRange}
      />

      {/* Current system info */}
      <div className="panel" style={{ marginTop: 8 }}>
        <div className="stat-row">
          <span className="stat-label">Location</span>
          <span className="stat-val-blue">{currentSys.name}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Tech Level</span>
          <span className="stat-val">{TECH_LEVELS[currentSys.tech]}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Government</span>
          <span className="stat-val">{GOV_TYPES[currentSys.gov]}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Population</span>
          <span className="stat-val">{SIZES[currentSys.size]}</span>
        </div>
      </div>

      {/* Destination info */}
      {selectedSys && (
        <div className="panel" style={{ marginTop: 8 }}>
          <div className="stat-row"><span className="stat-label">Destination</span><span className="stat-val-blue">{selectedSys.name}</span></div>
          <div className="stat-row"><span className="stat-label">Tech Level</span><span className="stat-val">{TECH_LEVELS[selectedSys.tech]}</span></div>
          <div className="stat-row"><span className="stat-label">Government</span><span className="stat-val">{GOV_TYPES[selectedSys.gov]}</span></div>
          <div className="stat-row"><span className="stat-label">Population</span><span className="stat-val">{SIZES[selectedSys.size]}</span></div>
          <div className="stat-row">
            <span className="stat-label">Distance</span>
            <span className="stat-val">{canReach(currentSys, selectedSys, jumpRange)
              ? Math.round(Math.hypot(selectedSys.x - currentSys.x, selectedSys.y - currentSys.y) / 10) + ' pc ✓'
              : '⛔ out of range'}</span>
          </div>
          {inRange && (
            <div className="stat-row">
              <span className="stat-label">Fuel Cost</span>
              <span className="stat-val">{fuel} cr</span>
            </div>
          )}
          {inRange && (
            <button
              className={"btn " + (canTravel ? "btn-blue" : "btn-disabled")}
              style={{ width: "100%", marginTop: 8, fontSize: 17 }}
              onClick={travel}>
              {canTravel ? "WARP → " + selectedSys.name : (game.credits < fuel ? "NOT ENOUGH CREDITS" : "OUT OF RANGE")}
            </button>
          )}
        </div>
      )}

      {/* Patrol section */}
      {(() => {
        const sys = game.galaxy[game.currentSystem];
        const patrolContracts = (game.activeContracts || []).filter(c =>
          (c.status === 'active' || c.status === 'pending_fight') &&
          (c.type === 'extermination' || c.type === 'assassination') &&
          c.targetSystemId === game.currentSystem
        );
        if (patrolContracts.length === 0) return null;

        const hasActiveContract = patrolContracts.some(c => c.type === 'extermination');
        const hasPirates = sys.pirates >= 1 || hasActiveContract;

        const patrol = () => {
          const { newGame, enc, bossEnc } = applyPatrol(game, patrolContracts);
          if (bossEnc) { onEncounter(newGame, bossEnc); return; }
          if (enc)     { onEncounter(newGame, enc); return; }
          onUpdate(newGame);
        };

        return (
          <div style={{ marginTop: 10, border: '1px solid #ff6b3566', borderRadius: 4, padding: 10 }}>
            <div style={{ fontSize: 15, color: '#ff6b35', marginBottom: 6 }}>
              ⚔️ Active contract in this system
            </div>
            {patrolContracts.map(c => {
              const dLeft = Math.max(0, c.deadline - game.days);
              return (
                <div key={c.id} style={{ fontSize: 14, marginBottom: 4 }}>
                  <span style={{ color: '#c0c0ff' }}>{c.title}</span>
                  {c.type === 'extermination' && (
                    <span style={{ color: '#00ff88', marginLeft: 6 }}>{c.killsCompleted}/{c.killCount} kills</span>
                  )}
                  <span style={{ color: dLeft <= 2 ? '#ff4444' : '#ffd700', marginLeft: 6 }}>⏱ {dLeft}d</span>
                </div>
              );
            })}
            <button
              className="btn btn-red"
              style={{ width: '100%', marginTop: 6 }}
              onClick={patrol}>
              🔍 PATROL (+1 day, guaranteed encounter)
            </button>
          </div>
        );
      })()}
    </div>
  );
}

export default TravelScreen;
