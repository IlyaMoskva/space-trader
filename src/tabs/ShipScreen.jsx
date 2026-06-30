import { useState, useEffect, useCallback, useRef } from 'react';
import { SHIPS, WEAPONS, SHIELDS, GADGETS } from '../constants/ships.js';
import { effectiveSkills } from '../engine/combat.js';
import { distParsecs } from '../engine/utils.js';
import { isServiceBanned } from '../engine/utils.js';
import { getOccupiedServices } from '../engine/aliens.js';
import { TECH_LEVELS, GOV_TYPES, SIZES } from '../constants/world.js';
import ShipSprite from '../components/ShipSprite.jsx';
import SkillBar from '../components/SkillBar.jsx';
import SingularityItem from './SingularityItem.jsx';

function ShipScreen({ game, onUpdate }) {
  const sys = game.galaxy[game.currentSystem];
  const [tab, setTab] = useState("status");

  const buyWeapon = (w) => {
    if (game.credits < w.price) return;
    if (game.weapons.length >= game.ship.slots_w) return;
    onUpdate({ ...game, credits: game.credits - w.price, weapons: [...game.weapons, { ...w }],
      log: [{ type: "good", text: "Installed " + w.name }, ...game.log] });
  };
  const buyShield = (s) => {
    if (game.credits < s.price) return;
    if (game.shields.length >= game.ship.slots_s) return;
    onUpdate({ ...game, credits: game.credits - s.price, shields: [...game.shields, { ...s, current: s.strength, max: s.strength }],
      log: [{ type: "good", text: "Installed " + s.name }, ...game.log] });
  };
  const buyGadget = (g) => {
    if (game.credits < g.price) return;
    if (game.gadgets.some(x => x.id === g.id)) return;
    let extra = {};
    if (g.id === "cargo5") extra = { cargoCapacity: game.cargoCapacity + 5 };
    if (g.id === "nav_comp") extra = { skills: { ...game.skills, pilot: Math.min(10, game.skills.pilot + 1) } };
    if (g.id === "tgt_comp") extra = { skills: { ...game.skills, fighter: Math.min(10, game.skills.fighter + 1) } };
    if (g.id === "dmg_ctrl") extra = { skills: { ...game.skills, engineer: Math.min(10, game.skills.engineer + 1) } };
    onUpdate({ ...game, credits: game.credits - g.price, gadgets: [...game.gadgets, { ...g }], ...extra,
      log: [{ type: "good", text: "Installed " + g.name }, ...game.log] });
  };
  const repairHull = (mult = 1) => {
    const needed = game.hullMax - game.hull;
    const engineerDiscount = banned ? 1 : 1 - (game.skills.engineer || 0) * 0.05;
    const costPerHp = Math.max(1, Math.round(2 * engineerDiscount * mult));
    const cost = needed * costPerHp;
    if (game.credits < cost || needed === 0) return;
    onUpdate({ ...game, hull: game.hullMax, credits: game.credits - cost,
      log: [{ type: "good", text: "Hull repaired for " + cost + " cr" + (game.skills.engineer > 0 && !banned ? " (Eng discount)" : "") + (banned ? " (hostile port ×3)" : "") }, ...game.log] });
  };

  const repairShields = (mult = 1) => {
    const damaged = game.shields.filter(s => s.current < s.max);
    if (!damaged.length) return;
    const engineerDiscount = banned ? 1 : 1 - (game.skills.engineer || 0) * 0.05;
    const totalNeeded = damaged.reduce((sum, s) => sum + (s.max - s.current), 0);
    const cost = Math.max(1, Math.round(totalNeeded * engineerDiscount * mult));
    if (game.credits < cost) return;
    onUpdate({ ...game,
      shields: game.shields.map(s => ({ ...s, current: s.max })),
      credits: game.credits - cost,
      log: [{ type: "good", text: "Shields recharged for " + cost + " cr" + (banned ? " (hostile port ×3)" : "") }, ...game.log],
    });
  };
  const buyShip = (s) => {
    const val = Math.floor(SHIPS.find(x => x.id === game.ship.id)?.price * 0.7 || 0);
    const cost = s.price - val;
    if (game.credits < cost) return;

    const keptMercs = (game.mercenaries || []).slice(0, s.slots_c ?? 0);
    const keptWeapons = [...game.weapons].sort((a,b) => b.price - a.price).slice(0, s.slots_w);
    const keptShields = [...game.shields].sort((a,b) => b.price - a.price).slice(0, s.slots_s);
    const keptGadgets = [...game.gadgets].sort((a,b) => (b.price||0) - (a.price||0)).slice(0, s.slots_g);
    const soldWeapons = [...game.weapons].sort((a,b) => b.price - a.price).slice(s.slots_w);
    const soldShields = [...game.shields].sort((a,b) => b.price - a.price).slice(s.slots_s);
    const soldGadgets = [...game.gadgets].sort((a,b) => (b.price||0) - (a.price||0)).slice(s.slots_g);

    const traderBonus = (game.skills.trader || 0) * 0.02;
    const sellRate = 0.7 + traderBonus;

    // Sell excess equipment automatically
    let sellCredits = 0;
    const logEntries = [{ type: "good", text: "Traded up to " + s.name + "!" }];

    soldWeapons.forEach(w => {
      const sp = Math.floor(w.price * sellRate);
      sellCredits += sp;
      logEntries.push({ type: "info", text: w.name + " auto-sold for " + sp + " cr" });
    });
    soldShields.forEach(sh => {
      const sp = Math.floor(sh.price * sellRate);
      sellCredits += sp;
      logEntries.push({ type: "info", text: sh.name + " auto-sold for " + sp + " cr" });
    });
    soldGadgets.forEach(g => {
      const sp = Math.floor((g.price || 0) * sellRate);
      if (sp > 0) { sellCredits += sp; logEntries.push({ type: "info", text: g.name + " auto-sold for " + sp + " cr" }); }
    });
    const firedCount = (game.mercenaries || []).length - keptMercs.length;
    if (firedCount > 0) logEntries.push({ type: "warn", text: firedCount + " crew let go — no quarters on new ship" });
    if (sellCredits > 0) logEntries.push({ type: "good", text: "Equipment sold: +" + sellCredits + " cr" });

    onUpdate({ ...game,
      credits: game.credits - cost + sellCredits,
      ship: { ...s },
      hull: s.hull, hullMax: s.hull,
      weapons: keptWeapons,
      shields: keptShields,
      gadgets: keptGadgets,
      cargoCapacity: s.cargo,
      mercenaries: keptMercs,
      log: [...logEntries, ...game.log],
    });
  };

  const canRepair = game.hull < game.hullMax && sys.tech >= 2;
  const canRepairShields = game.shields.some(s => s.current < s.max) && sys.tech >= 2;
  const occupied   = getOccupiedServices(sys);
  const repBanned  = isServiceBanned(sys, game.reputation || 0);
  // Occupied: market/equipment banned per occupation rules; repair always available (with multiplier)
  const banned = repBanned || !occupied.market; // equipment tab blocked if no market
  const bannedMsg = (
    <div style={{ padding: 12, color: "#ff6b35", fontSize: 15 }}>
      {!occupied.market && (sys.alienCount || 0) >= 5
        ? <span>👾 Planet under alien occupation — no commerce available.<br/><span style={{fontSize:13,color:"#555566"}}>Hull/shield repair still possible if tech ≥ 2.</span></span>
        : <span>⛔ Services denied — {GOV_TYPES[sys.gov]} government refuses to serve criminals.<br/><span style={{fontSize:13,color:"#555566"}}>Improve your reputation or find a less principled port.</span></span>
      }
    </div>
  );

  return (
    <div>
      <div className="nav-tabs">
        {["status","weapons","shields","gadgets","ships"].map(t => (
          <button key={t} className={"tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>{t.toUpperCase()}</button>
        ))}
      </div>
      {tab === "status" && (
        <div className="panel">
          <div className="panel-title" style={{ display:"flex", alignItems:"center", gap:8 }}>
            <ShipSprite shipId={game.ship.id} size={32}/>
            {game.ship.name}
          </div>
          <div className="stat-row"><span className="stat-label">Hull</span><span className="stat-val-green">{game.hull}/{game.hullMax}</span></div>
          <div className="stat-row"><span className="stat-label">Cargo</span><span className="stat-val">{game.cargo.reduce((s,c)=>s+c.qty,0)}/{game.cargoCapacity}</span></div>
          <div className="stat-row"><span className="stat-label">Jump Range</span><span className="stat-val-blue">{game.ship.jump} pc</span></div>
          <div className="stat-row"><span className="stat-label">Weapon Slots</span><span className="stat-val">{game.weapons.length}/{game.ship.slots_w}</span></div>
          <div className="stat-row"><span className="stat-label">Shield Slots</span><span className="stat-val">{game.shields.length}/{game.ship.slots_s}</span></div>
          <div className="stat-row"><span className="stat-label">Gadget Slots</span><span className="stat-val">{game.gadgets.length}/{game.ship.slots_g}</span></div>
          <div className="stat-row"><span className="stat-label">Crew Quarters</span><span className={(game.mercenaries||[]).length > 0 ? "stat-val-blue" : "stat-val"}>{(game.mercenaries||[]).length}/{game.ship.slots_c ?? 0}</span></div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {game.weapons.map((w, i) => <span key={i} className="badge badge-red">{w.name}</span>)}
            {game.shields.map((s, i) => <span key={i} className="badge badge-green">{s.name} {s.current}/{s.max}</span>)}
            {game.gadgets.map((g, i) => <span key={i} className="badge badge-gold">{g.name}</span>)}
          </div>

          {(game.specialItems || []).length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="panel-title">Special Items</div>
              {(game.specialItems || []).includes("fuel_compressor") && (
                <div className="stat-row">
                  <span className="stat-label">⛽ Fuel Compressor</span>
                  <span className="stat-val" style={{ color: "#00ff88" }}>Jump range +3 pc</span>
                </div>
              )}
              {(game.specialItems || []).includes("singularity") && (
                <SingularityItem game={game} onUpdate={onUpdate} />
              )}
              {(game.specialItems || []).includes("lightning_shield") && (() => {
                const hasSlot = game.shields.length < game.ship.slots_s;
                const installShield = () => {
                  const ls = { id: "lightning", name: "Lightning Shield", strength: 350, max: 350, current: 350, price: 80000 };
                  onUpdate({ ...game,
                    shields: [...game.shields, ls],
                    specialItems: (game.specialItems || []).filter(x => x !== "lightning_shield"),
                    log: [{ type: "good", text: "Lightning Shield installed!" }, ...game.log],
                  });
                };
                return (
                  <div className="stat-row">
                    <span className="stat-label">⚡ Lightning Shield</span>
                    {hasSlot
                      ? <button className="btn btn-blue" style={{ fontSize: 13, padding: "3px 8px" }} onClick={installShield}>INSTALL</button>
                      : <span className="stat-val" style={{ color: "#ff6b35" }}>No shield slot free</span>
                    }
                  </div>
                );
              })()}
            </div>
          )}
          {(() => {
            const needed = game.hullMax - game.hull;
            const discount = 1 - (game.skills.engineer || 0) * 0.05;
            const costPerHp = Math.max(1, Math.round(2 * discount));
            const hullCost = needed * costPerHp;
            const shieldNeeded = game.shields.reduce((sum, s) => sum + (s.max - s.current), 0);
            const shieldCost = Math.max(1, Math.round(shieldNeeded * discount));
            const noShipyard = sys.tech < 2;
            const hullFull = game.hull >= game.hullMax;
            const shieldsFull = !game.shields.some(s => s.current < s.max);
            const canRepairNow = !noShipyard;
            // Occupied anarchy: no shields; rep-banned: 3× price; occupation: 3× price
            const bannedMultiplier = (repBanned || (!occupied.shields && !noShipyard)) ? 3 : 1;
            const shieldsAllowed = occupied.shields || !(sys.alienCount >= 5);
            const hullCostFinal = hullCost * bannedMultiplier;
            const shieldCostFinal = shieldCost * bannedMultiplier;
            const hint = noShipyard ? "Requires tech level 2+ shipyard"
              : !shieldsAllowed ? "⚠ No shield service under alien anarchy"
              : repBanned ? GOV_TYPES[sys.gov] + " charges 3× — they won't let you die, but won't make it easy"
              : bannedMultiplier > 1 ? "Occupation surcharge ×3"
              : null;
            return (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className={"btn " + (canRepairNow && !hullFull ? "btn-green" : "btn-disabled")}
                    style={{ fontSize: 15, flex: 1 }}
                    onClick={canRepairNow && !hullFull ? () => repairHull(bannedMultiplier) : undefined}>
                    {hullFull ? "HULL OK" : "REPAIR HULL" + (canRepairNow ? " (" + hullCostFinal + " cr" + (game.skills.engineer > 0 && !banned ? " · Eng" : "") + (banned ? " ×3" : "") + ")" : "")}
                  </button>
                  <button
                    className={"btn " + (canRepairNow && !shieldsFull && game.shields.length > 0 && shieldsAllowed ? "btn-blue" : "btn-disabled")}
                    style={{ fontSize: 15, flex: 1 }}
                    onClick={canRepairNow && !shieldsFull && game.shields.length > 0 && shieldsAllowed ? () => repairShields(bannedMultiplier) : undefined}>
                    {game.shields.length === 0 ? "NO SHIELDS"
                      : !shieldsAllowed ? "SHIELDS UNAVAILABLE"
                      : shieldsFull ? "SHIELDS OK"
                      : "RECHARGE SHIELDS" + (canRepairNow ? " (" + shieldCostFinal + " cr" + (bannedMultiplier > 1 ? " ×3" : "") + ")" : "")}
                  </button>
                </div>
                {hint && <div style={{ fontSize: 13, color: banned ? "#ffd700" : "#555566", marginTop: 5 }}>⚠ {hint}</div>}
              </div>
            );
          })()}
          <div className="panel-title" style={{ marginTop: 14 }}>Skills</div>
          {(() => {
            const eff = effectiveSkills(game);
            const effects = {
              pilot:    "Evasion +" + (game.skills.pilot * 4) + "% · Police notice -" + (game.skills.pilot * 4) + "%",
              fighter:  "Hit chance +" + (game.skills.fighter * 5) + "%",
              trader:   "Equipment sell +" + (game.skills.trader * 2) + "% vs base",
              engineer: "Repair -" + (game.skills.engineer * 5) + "% · Auto-repair " + (game.skills.engineer * 3) + "% /jump",
            };
            return Object.entries(game.skills).map(([sk, v]) => (
              <div key={sk} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ fontSize: 15, color: "#8888bb", width: 80, textTransform: "capitalize" }}>{sk}</div>
                  <div style={{ fontSize: 16, color: "#ffd700", width: 20 }}>{v}</div>
                  {eff[sk] > v && (
                    <div style={{ fontSize: 15, color: "#00ff88", width: 28 }}>/{eff[sk]}</div>
                  )}
                  <SkillBar val={eff[sk]} base={v} />
                </div>
                <div style={{ fontSize: 12, color: "#555588", marginLeft: 80, marginTop: 1 }}>
                  {effects[sk]}
                </div>
              </div>
            ));
          })()}
          {(game.mercenaries || []).length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div className="panel-title">Crew</div>
              {(game.mercenaries || []).map(m => (
                <div key={m.id} style={{ padding: "6px 0", borderBottom: "1px solid #1a1a3a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, color: "#c0c0ff" }}>🧑‍🚀 {m.name}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 14, color: "#ff6b35" }}>{m.cost} cr/day</span>
                      <button className="btn btn-red" style={{ fontSize: 13, padding: "2px 8px" }}
                        onClick={() => {
                          const newMercs = (game.mercenaries || []).filter(x => x.id !== m.id);
                          onUpdate({ ...game, mercenaries: newMercs,
                            log: [{ type: "warn", text: m.name + " has left the crew." }, ...game.log] });
                        }}>FIRE</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#555588", marginTop: 3 }}>
                    P:{m.skills.pilot} F:{m.skills.fighter} T:{m.skills.trader} E:{m.skills.engineer}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {tab === "weapons" && (
        <div className="panel">
          {banned ? bannedMsg : (<>
          <div className="panel-title">Weapons ({game.weapons.length}/{game.ship.slots_w} slots)</div>
          {game.weapons.length === 0 && <div style={{ fontSize: 15, color: "#555588", marginBottom: 8 }}>No weapons installed</div>}
          {game.weapons.map((w, i) => (
            <div key={i} className="stat-row">
              <span className="stat-label">{w.name} <span style={{color:"#ff6b35"}}>DMG {w.damage}</span></span>
              <button className="btn btn-red" style={{ fontSize: 13, padding: "3px 8px" }}
                onClick={() => {
                  const traderBonus = (game.skills.trader || 0) * 0.02;
                  const sellPrice = Math.floor(w.price * (0.7 + traderBonus));
                  onUpdate({ ...game,
                    weapons: game.weapons.filter((_, j) => j !== i),
                    credits: game.credits + sellPrice,
                    log: [{ type: "info", text: "Sold " + w.name + " for " + sellPrice + " cr (Trader +" + Math.round(traderBonus*100) + "%)" }, ...game.log],
                  });
                }}>
                SELL {Math.floor(w.price * (0.7 + (game.skills.trader||0)*0.02)).toLocaleString()} cr
              </button>
            </div>
          ))}
          <hr className="divider" />
          {WEAPONS.filter(w => sys.tech >= (w.minTech || 0)).map(w => {
            const slotFree = game.weapons.length < game.ship.slots_w;
            const canBuy = game.credits >= w.price && slotFree;
            const isAlien = w.id === 'alien_disruptor';
            return (
              <div key={w.id} className="stat-row">
                <span className="stat-label">
                  {isAlien && <span style={{color:'#ff6600'}}>👾 </span>}
                  {w.name}
                  <span style={{color:"#555588"}}> dmg {w.damage}{isAlien ? '×2 vs aliens' : ''}</span>
                  {isAlien && <span style={{color:'#ff8800', fontSize:12, marginLeft:6}}>alien tech only</span>}
                </span>
                <button className={"btn " + (canBuy ? "btn-gold" : "btn-disabled")}
                  style={{ fontSize: 15, padding: "4px 8px" }} onClick={() => canBuy && buyWeapon(w)}>
                  {w.price.toLocaleString()} cr
                </button>
              </div>
            );
          })}
          {game.weapons.length >= game.ship.slots_w && game.ship.slots_w > 0 && (
            <div style={{ fontSize: 13, color: "#7777aa", marginTop: 6 }}>
              Slots full — sell a weapon to replace it
            </div>
          )}
          </>)}
        </div>
      )}
      {tab === "shields" && (
        <div className="panel">
          {banned ? bannedMsg : (<>
          <div className="panel-title">Shields ({game.shields.length}/{game.ship.slots_s} slots)</div>
          {game.shields.map((s, i) => (
            <div key={i} className="stat-row">
              <span className="stat-label">
                {s.id === "lightning" && <span style={{color:"#ffd700"}}>⚡ </span>}
                {s.name}
                {s.id === "lightning" && <span style={{color:"#ffd700", fontSize:12}}> [UNIQUE]</span>}
                <span style={{color:"#4fc3f7", marginLeft:6}}>{s.current}/{s.max}</span>
              </span>
              <button className="btn btn-red" style={{ fontSize: 13, padding: "3px 8px" }}
                onClick={() => {
                  if (s.id === "lightning" && !window.confirm("Lightning Shield is a unique quest reward — sell for " + Math.floor(s.price * (0.7 + (game.skills.trader||0)*0.02)).toLocaleString() + " cr?")) return;
                  const traderBonus = (game.skills.trader || 0) * 0.02;
                  const sellPrice = Math.floor(s.price * (0.7 + traderBonus));
                  onUpdate({ ...game,
                    shields: game.shields.filter((_, j) => j !== i),
                    credits: game.credits + sellPrice,
                    log: [{ type: "info", text: "Sold " + s.name + " for " + sellPrice + " cr (Trader +" + Math.round(traderBonus*100) + "%)" }, ...game.log],
                  });
                }}>
                SELL {Math.floor(s.price * (0.7 + (game.skills.trader||0)*0.02)).toLocaleString()} cr
              </button>
            </div>
          ))}
          <hr className="divider" />
          {SHIELDS.filter(s => sys.tech >= s.minTech).map(s => {
            const canBuy = game.credits >= s.price && game.shields.length < game.ship.slots_s;
            return (
              <div key={s.id} className="stat-row">
                <span className="stat-label">{s.name} <span style={{color:"#555588"}}>+{s.strength}</span></span>
                <button className={"btn " + (canBuy ? "btn-blue" : "btn-disabled")}
                  style={{ fontSize: 15, padding: "4px 8px" }} onClick={() => buyShield(s)}>
                  {s.price.toLocaleString()} cr
                </button>
              </div>
            );
          })}
          {game.shields.length >= game.ship.slots_s && game.ship.slots_s > 0 && (
            <div style={{ fontSize: 13, color: "#7777aa", marginTop: 6 }}>
              Slots full — sell a shield to replace it
            </div>
          )}
          </>)}
        </div>
      )}
      {tab === "gadgets" && (
        <div className="panel">
          {banned ? bannedMsg : (<>
          <div className="panel-title">Gadgets ({game.gadgets.length}/{game.ship.slots_g} slots)</div>
          {GADGETS.map(g => {
            const owned = game.gadgets.some(x => x.id === g.id);
            const artifacts = game.alienArtifacts || 0;
            const needsArtifacts = g.id === 'regen_inhibitor' ? 10 : g.id === 'cloaking_device' ? 5 : 0;
            const artifactsOk = needsArtifacts === 0 || artifacts >= needsArtifacts;
            const canBuy = !owned && game.credits >= g.price && game.gadgets.length < game.ship.slots_g
              && sys.tech >= (g.minTech || 0) && artifactsOk;
            const alienGadget = needsArtifacts > 0;
            return (
              <div key={g.id} className="stat-row">
                <span className="stat-label">
                  {alienGadget && <span style={{ color: '#ff6600' }}>👾 </span>}
                  {g.name} <span style={{ color: "#555588" }}>({g.desc})</span>
                  {alienGadget && !artifactsOk && (
                    <span style={{ color: '#ff6600', fontSize: 12, marginLeft: 6 }}>
                      Requires {needsArtifacts} artifacts ({artifacts}/{needsArtifacts})
                    </span>
                  )}
                </span>
                {owned ? <span className="badge badge-green">OWNED</span>
                  : <button className={"btn " + (canBuy ? "btn-gold" : "btn-disabled")}
                      style={{ fontSize: 15, padding: "4px 8px" }} onClick={() => canBuy && buyGadget(g)}>
                      {canBuy ? g.price.toLocaleString() + " cr" : !artifactsOk ? "Need artifacts" : "—"}
                    </button>}
              </div>
            );
          })}
          </>)}
        </div>
      )}
      {tab === "ships" && (
        <div className="panel">
          {banned ? bannedMsg : (<>
          <div className="panel-title">Shipyard</div>
          {SHIPS.map(s => {
            const tradeVal = Math.floor((SHIPS.find(x => x.id === game.ship.id)?.price || 0) * 0.7);
            const cost = s.price - tradeVal;
            const canBuy = s.id !== game.ship.id && game.credits >= cost;
            return (
              <div key={s.id} style={{ padding: "8px 0", borderBottom: "1px solid #1a1a3a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <ShipSprite shipId={s.id} size={28}/>
                    <span style={{ fontSize: 16, color: s.id === game.ship.id ? "#00ff88" : "#c0c0ff" }}>{s.name}</span>
                  </div>
                  {s.id === game.ship.id ? <span className="badge badge-green">CURRENT</span>
                    : <button className={"btn " + (canBuy ? "btn-gold" : "btn-disabled")}
                        style={{ fontSize: 16, padding: "3px 6px" }} onClick={() => buyShip(s)}>
                        {cost > 0 ? "+" + cost.toLocaleString() + " cr" : Math.abs(cost).toLocaleString() + " cr back"}
                      </button>}
                </div>
                <div style={{ fontSize: 16, color: "#555588", marginTop: 3 }}>
                  Hull:{s.hull} Cargo:{s.cargo} W:{s.slots_w} S:{s.slots_s} G:{s.slots_g} Crew:{s.slots_c} Jmp:{s.jump}
                </div>
              </div>
            );
          })}
          </>)}
        </div>
      )}
    </div>
  );
}


export default ShipScreen;
