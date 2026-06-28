import { useState, useEffect, useCallback, useRef } from 'react';
import { MERCENARY_POOL } from '../constants/mercenaries.js';
import { COMMODITIES } from '../constants/commodities.js';
import { effectiveSkills } from '../engine/combat.js';
import { rnd } from '../engine/utils.js';

function ContractsScreen({ game, onUpdate, onPlotCourse }) {
  const board = game.bulletinBoard || [];
  const active = (game.activeContracts || []).filter(c => c.status === "active" || c.status === "pending_fight");
  const done = (game.activeContracts || []).filter(c => c.status === "done" || c.status === "failed");
  const maxActive = 3;

  const takeContract = (c) => {
    if (active.length >= maxActive) return;
    let newGame = { ...game };

    // For delivery — add cargo to hold
    if (c.type === "delivery") {
      const freeSpace = game.cargoCapacity - game.cargo.reduce((s, x) => s + x.qty, 0);
      if (freeSpace < c.cargoQty) return; // not enough space
      newGame.cargo = [...game.cargo, {
        id: "contract_cargo_" + c.id,
        qty: c.cargoQty,
        buyPrice: 0,
        label: c.title,
        contractId: c.id,
      }];
    }

    newGame.activeContracts = [...(game.activeContracts || []),
      { ...c, status: "active" }];
    newGame.bulletinBoard = (game.bulletinBoard || []).filter(x => x.id !== c.id);
    newGame.log = [{ type: "info", text: "Contract taken: " + c.title }, ...newGame.log];
    onUpdate(newGame);
  };

  const abandonContract = (c) => {
    let newGame = { ...game };
    // Remove contract cargo
    if (c.type === "delivery") {
      newGame.cargo = game.cargo.map(item =>
        item.id === "contract_cargo_" + c.id
          ? { ...item, qty: item.qty - c.cargoQty }
          : item
      ).filter(item => item.qty > 0);
    }
    newGame.credits -= c.penalty;
    newGame.reputation = (newGame.reputation || 0) - 1;
    newGame.activeContracts = (game.activeContracts || []).map(x =>
      x.id === c.id ? { ...x, status: "failed" } : x
    );
    newGame.log = [{ type: "bad", text: "Contract abandoned: " + c.title + " — penalty " + c.penalty + " cr" }, ...newGame.log];
    onUpdate(newGame);
  };

  const daysLeft = (c) => Math.max(0, c.deadline - game.days);
  const urgentColor = (dl) => dl <= 2 ? "#ff6b35" : dl <= 4 ? "#ffd700" : "#8888bb";

  return (
    <div>
      {/* Mercenaries for hire */}
      {(() => {
        const hired = game.mercenaries || [];
        const maxSlots = game.ship.slots_c ?? 0;
        const sys = game.galaxy[game.currentSystem];
        const seed = sys.id * 31 + Math.floor(game.days / 3) * 17;
        const seededRng = (n) => ((seed * 1103515245 + n * 12345) >>> 0) / 0xFFFFFFFF;
        const baseChance = 0.30;
        const sizeBonus = sys.size * 0.06;
        const showBoard = seededRng(0) < (baseChance + sizeBonus);
        if (!showBoard && hired.length === 0) return null;
        const maxCount = sys.size >= 4 ? 3 : sys.size >= 2 ? 2 : 1;
        const fighterBias = (sys.pirates||0) * 2 + Math.max(0, 4 - (sys.tech||0));
        const civilianBias = (sys.tech||0) + (sys.size||0);
        const eff = effectiveSkills(game);
        const scored = MERCENARY_POOL
          .filter(m => !hired.find(x => x.id === m.id))
          .map((m, i) => {
            const isFighter = m.skills.fighter >= 7;
            const bias = isFighter ? fighterBias : civilianBias;
            return { m, score: seededRng(i + 1) * 10 + bias };
          })
          .sort((a, b) => b.score - a.score);
        const available = scored
          .filter((_, i) => i < maxCount && seededRng(i + 10) < 0.55)
          .map(x => x.m);
        if (available.length === 0 && hired.length === 0) return null;
        return (
          <div className="panel">
            <div className="panel-title">👥 Crew ({hired.length}/{maxSlots} quarters)</div>
            {hired.map(m => (
              <div key={m.id} style={{ padding:"6px 0", borderBottom:"1px solid #1a1a3a" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:15, color:"#ffd700" }}>{m.name}</span>
                  <span style={{ fontSize:13, color:"#555588" }}>{m.cost} cr/day</span>
                </div>
                <div style={{ fontSize:13, color:"#8888bb", marginTop:2 }}>
                  P:{m.skills.pilot} F:{m.skills.fighter} T:{m.skills.trader} E:{m.skills.engineer}
                </div>
                <button className="btn btn-red" style={{ fontSize:13, padding:"2px 8px", marginTop:4 }}
                  onClick={() => onUpdate({ ...game,
                    mercenaries: hired.filter(x => x.id !== m.id),
                    log: [{ type:"warn", text: m.name + " let go." }, ...game.log]
                  })}>FIRE</button>
              </div>
            ))}
            {available.length > 0 && (
              <>
                <div style={{ fontSize:13, color:"#555588", margin:"8px 0 4px" }}>Available for hire:</div>
                {available.map(m => {
                  const canHire = (maxSlots - hired.length) > 0;
                  return (
                    <div key={m.id} style={{ padding:"6px 0", borderBottom:"1px solid #1a1a3a" }}>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:15, color:"#c0c0ff" }}>{m.name}</span>
                        <span style={{ fontSize:13, color:"#555588" }}>{m.cost} cr/day</span>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:4, margin:"4px 0", fontSize:13 }}>
                        {["pilot","fighter","trader","engineer"].map(sk => {
                          const boost = m.skills[sk] > eff[sk];
                          return (
                            <div key={sk} style={{ color: boost ? "#00ff88" : "#555588" }}>
                              {sk.slice(0,3).toUpperCase()}: {m.skills[sk]}{boost && " ▲"}
                              <div style={{ fontSize:11, color:"#444466" }}>you: {eff[sk]}</div>
                            </div>
                          );
                        })}
                      </div>
                      <button className={"btn " + (canHire ? "btn-green" : "btn-disabled")}
                        style={{ fontSize:13, padding:"3px 10px" }}
                        onClick={() => {
                          if (!canHire) return;
                          onUpdate({ ...game,
                            mercenaries: [...hired, m],
                            log: [{ type:"good", text: m.name + " hired for " + m.cost + " cr/day." }, ...game.log]
                          });
                        }}>
                        {canHire ? "HIRE" : "NO QUARTERS"}
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        );
      })()}

      {/* Bulletin Board */}
      <div className="panel">
        <div className="panel-title">
          📋 Bulletin Board — {game.galaxy[game.currentSystem].name}
          <span className="badge badge-gold" style={{ marginLeft: 8 }}>{active.length}/{maxActive} active</span>
        </div>
        {board.length === 0 && (
          <div style={{ fontSize: 15, color: "#555588", padding: "8px 0" }}>No contracts available here.</div>
        )}
        {board.map(c => {
          const cargoFree = game.cargoCapacity - game.cargo.reduce((s, x) => s + x.qty, 0);
          const cantTake = active.length >= maxActive
            || (c.type === "delivery" && cargoFree < c.cargoQty);
          return (
            <div key={c.id} style={{ padding: "10px 0", borderBottom: "1px solid #1a1a3a" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 16, color: "#ffd700", marginBottom: 4 }}>
                    {c.emoji} {c.title}
                  </div>
                  <div style={{ fontSize: 14, color: "#8888bb", lineHeight: 1.6 }}>
                    {c.type === "delivery" && <>Deliver {c.cargoQty}t to <span style={{ color: "#4fc3f7" }}>{c.to}</span> · {c.daysAllowed} days</>}
                    {c.type === "extermination" && <>Kill {c.killCount} pirates in <span style={{ color: "#4fc3f7" }}>{c.targetSystemName}</span> · {c.daysAllowed} days</>}
                    {c.type === "assassination" && <>Eliminate target in <span style={{ color: "#4fc3f7" }}>{c.targetSystemName}</span> · {c.daysAllowed} days</>}
                  </div>
                  {c.type === "delivery" && cargoFree < c.cargoQty && (
                    <div style={{ fontSize: 13, color: "#ff6b35", marginTop: 2 }}>⚠ Not enough cargo space ({cargoFree}t free)</div>
                  )}
                </div>
                <div style={{ textAlign: "right", minWidth: 80 }}>
                  <div style={{ fontSize: 16, color: "#00ff88", marginBottom: 4 }}>+{c.reward.toLocaleString()} cr</div>
                  {c.penalty > 0 && <div style={{ fontSize: 13, color: "#ff6b35" }}>−{c.penalty} penalty</div>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className={"btn " + (cantTake ? "btn-disabled" : "btn-green")}
                  style={{ fontSize: 14, padding: "4px 12px" }}
                  onClick={() => !cantTake && takeContract(c)}>
                  ACCEPT
                </button>
                {(c.type === "extermination" || c.type === "assassination") && (
                  <button className="btn btn-blue" style={{ fontSize: 14, padding: "4px 10px" }}
                    onClick={() => onPlotCourse(c.targetSystemId)}>
                    PLOT COURSE →
                  </button>
                )}
                {c.type === "delivery" && (
                  <button className="btn btn-blue" style={{ fontSize: 14, padding: "4px 10px" }}
                    onClick={() => onPlotCourse(c.toId)}>
                    PLOT COURSE →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active contracts */}
      {active.length > 0 && (
        <div className="panel">
          <div className="panel-title">Active Contracts</div>
          {active.map(c => {
            const dl = daysLeft(c);
            return (
              <div key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid #1a1a3a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 15, color: "#c0c0ff" }}>{c.emoji} {c.title}</div>
                  <div style={{ fontSize: 14, color: urgentColor(dl) }}>⏱ {dl}d left</div>
                </div>
                <div style={{ fontSize: 13, color: "#8888bb", marginTop: 3, lineHeight: 1.6 }}>
                  {c.type === "delivery" && <>→ {c.to} · {c.cargoQty}t in hold</>}
                  {c.type === "extermination" && <>{c.killsCompleted}/{c.killCount} kills in {c.targetSystemName}</>}
                  {c.type === "assassination" && <>Target: {c.targetName} in {c.targetSystemName}</>}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  {(c.type === "delivery") && (
                    <button className="btn btn-blue" style={{ fontSize: 13, padding: "3px 8px" }}
                      onClick={() => onPlotCourse(c.toId)}>→ {c.to}</button>
                  )}
                  {(c.type === "extermination" || c.type === "assassination") && (
                    <button className="btn btn-blue" style={{ fontSize: 13, padding: "3px 8px" }}
                      onClick={() => onPlotCourse(c.targetSystemId)}>→ {c.targetSystemName}</button>
                  )}
                  <button className="btn btn-red" style={{ fontSize: 13, padding: "3px 8px" }}
                    onClick={() => abandonContract(c)}>ABANDON</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Special Contracts — story quests revealed through news */}
      {(() => {
        const availableQuests = (game.quests || []).filter(q => q.status === "available");
        const doneQuests = (game.quests || []).filter(q => q.status === "done" || q.status === "failed");
        if (availableQuests.length === 0 && doneQuests.length === 0) return null;
        return (
          <div className="panel">
            <div className="panel-title">✦ Special Contracts</div>
            {availableQuests.map(q => {
              const targetSys = q.targetSystem !== undefined ? game.galaxy.find(s => s.id === q.targetSystem) : null;
              const dl = q.daysLeft;
              return (
                <div key={q.id} style={{ padding:"8px 0", borderBottom:"1px solid #1a1a3a" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontSize:16, color:"#ffd700" }}>{q.emoji} {q.name}</div>
                    {dl !== undefined && (
                      <div style={{ fontSize:14, color: dl <= 3 ? "#ff6b35" : "#ffd700" }}>⏱ {dl}d</div>
                    )}
                  </div>
                  <div style={{ fontSize:14, color:"#8888bb", margin:"4px 0" }}>{q.desc}</div>
                  {q.requiresBeamLaser && (() => {
                    const hasBeam = game.weapons.some(w => w.id === "beam" || w.id === "military");
                    return (
                      <div style={{ fontSize:13, color: hasBeam ? "#00ff88" : "#ff6b35", marginBottom:4 }}>
                        {hasBeam ? "✓ Beam Laser equipped" : "✗ Requires Beam Laser or better"}
                      </div>
                    );
                  })()}
                  {targetSys && (
                    <button className="btn btn-blue" style={{ fontSize:13, padding:"3px 8px", marginTop:4 }}
                      onClick={() => onPlotCourse(targetSys.id)}>
                      PLOT COURSE → {targetSys.name}
                    </button>
                  )}
                </div>
              );
            })}
            {doneQuests.length > 0 && (
              <div style={{ marginTop:6 }}>
                {doneQuests.map(q => (
                  <div key={q.id} className="stat-row" style={{ opacity:0.6 }}>
                    <span style={{ fontSize:14, color:"#8888bb" }}>{q.emoji} {q.name}</span>
                    <span className={"badge " + (q.status === "done" ? "badge-green" : "badge-red")}>
                      {q.status === "done" ? "DONE" : "FAILED"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Completed/failed regular contracts */}
      {done.length > 0 && (
        <div className="panel">
          <div className="panel-title">History ({done.length})</div>
          {[...done].reverse().slice(0, 5).map(c => (
            <div key={c.id} style={{ padding:"4px 0", borderBottom:"1px solid #1a1a3a" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize: 15, color: "#c0c0ff" }}>{c.emoji} {c.title}</span>
                <span className={"badge " + (c.status === "done" ? "badge-green" : "badge-red")}>
                  {c.status === "done" ? "DONE" : "FAILED"}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#555588", marginTop: 2 }}>
                {c.from && <span>From: {c.from}</span>}
                {c.type === "delivery" && c.to && <span> → {c.to}</span>}
                {(c.type === "extermination" || c.type === "assassination") && c.targetSystemName && <span> · Target: {c.targetSystemName}</span>}
                {c.status === "done" && <span style={{ color:"#00ff8888", marginLeft:6 }}>+{c.reward?.toLocaleString()} cr</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export default ContractsScreen;
