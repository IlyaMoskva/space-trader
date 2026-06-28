import { useState, useEffect, useCallback, useRef } from 'react';
import { SHIPS } from '../constants/ships.js';
import { COMMODITIES } from '../constants/commodities.js';
import { rnd } from '../engine/utils.js';
import { effectiveSkills, generatePirateShip } from '../engine/combat.js';
import { onPirateKilled } from '../engine/contracts.js';
import { useCombat } from '../hooks/useCombat.js';
import ShipSprite from '../components/ShipSprite.jsx';
import { ELITE_CAPTAINS, MERCENARY_POOL } from '../constants/mercenaries.js';
import { pick } from '../engine/utils.js';

function EncounterScreen({ game, encounter, onUpdate, onDone }) {
  const { combatLog, enemy, phase, fightRound, flee, surrender } = useCombat({ game, encounter, onUpdate, onDone });

  if (encounter.type === "pirate") {
    // Coward check: weak pirate may surrender on sight
    const cowardChance = encounter.cowardChance || 0;
    if (cowardChance > 0 && phase === "choice" && Math.random() < cowardChance) {
      // Auto-flee on first render — handle via a one-time effect
    }

    const threatLabel = encounter.shields > 0
      ? (encounter.shields >= 200 ? "ELITE" : "ARMED")
      : encounter.weapon?.id === "military" ? "DANGEROUS"
      : encounter.weapon?.id === "beam" ? "MODERATE" : "WEAK";
    const threatColor = threatLabel === "ELITE" ? "#ff4444"
      : threatLabel === "DANGEROUS" ? "#ff6b35"
      : threatLabel === "ARMED" || threatLabel === "MODERATE" ? "#ffd700"
      : "#8888bb";

    const isBountyHunter = encounter.sub === "bounty_hunter";

    return (
      <div className="encounter-box">
        <div className="encounter-title">
          {isBountyHunter ? "🎯 BOUNTY HUNTER" : "⚠ PIRATE ENCOUNTER"}
          <span style={{ fontSize: 13, color: threatColor, marginLeft: 10 }}>[{threatLabel}]</span>
          {encounter.angry && <span style={{ fontSize: 13, color: "#ff4444", marginLeft: 8 }}>ANGRY</span>}
          {encounter.maxWaves > 1 && (
            <span style={{ fontSize: 13, color: "#ff6b35", marginLeft: 10 }}>
              WAVE {encounter.wave}/{encounter.maxWaves}
            </span>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 10 }}>
          <div style={{ textAlign: "center" }}>
            <ShipSprite shipId={game.ship.id} size={52}/>
            <div style={{ fontSize: 16, color: "#00ff88" }}>YOU</div>
            <div style={{ fontSize: 15, color: "#00ff88" }}>Hull: {game.hull}</div>
            {game.shields.length > 0 && (
              <div style={{ fontSize: 13 }}>
                {game.shields.map((sh, i) => (
                  <div key={i} style={{ color: sh.id === "reflective" || sh.id === "lightning" ? "#ffd700" : "#4fc3f7" }}>
                    {sh.id === "lightning" ? "⚡" : sh.id === "reflective" ? "◆" : "⬡"} {sh.current}/{sh.max}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ fontSize: 16, color: "#ff6b35", alignSelf: "center" }}>VS</div>
          <div style={{ textAlign: "center" }}>
            <ShipSprite shipId={encounter.ship.id} size={52} flip={true}/>
            <div style={{ fontSize: 16, color: "#ff6b35" }}>PIRATE {encounter.ship.name.toUpperCase()}</div>
            <div style={{ fontSize: 15, color: "#ff6b35" }}>Hull: {enemy?.hull ?? encounter.hull}</div>
            {encounter.shields > 0 && <div style={{ fontSize: 13, color: "#4fc3f7" }}>Shield: {enemy?.shields ?? encounter.shields}</div>}
            <div style={{ fontSize: 13, color: "#888888" }}>{encounter.weapon?.name}</div>
          </div>
        </div>
        <div style={{ maxHeight: 80, overflow: "hidden", marginBottom: 10 }}>
          {combatLog.map((e, i) => <div key={i} className={"log-entry " + e.type}>{e.text}</div>)}
        </div>
        {phase !== "ended" && (
          <div className="flex-gap">
            <button className="btn btn-red" onClick={() => fightRound("fight")}>⚔ FIGHT</button>
            <button className="btn btn-blue" onClick={flee}>↗ FLEE</button>
          </div>
        )}
      </div>
    );
  }

  if (encounter.type === "police") {
    // Hostile police / bounty hunter — full combat
    if (encounter.sub === "hostile" || encounter.sub === "bounty_hunter") {
      return (
        <div className="encounter-box" style={{ borderColor: "#ff4444" }}>
          <div className="encounter-title" style={{ color: "#ff4444" }}>
            {encounter.sub === "bounty_hunter" ? "🎯 BOUNTY HUNTER" : "🔴 POLICE INTERCEPTOR"}
            <span style={{ fontSize: 13, color: "#ff6b35", marginLeft: 8 }}>HOSTILE</span>
          </div>
          <div className="encounter-desc">
            {encounter.sub === "bounty_hunter"
              ? "\"Commander " + game.commander + "! You have a price on your head. Stand down or be destroyed!\""
              : "\"All ships halt! By order of the law — you are under arrest!\""}
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 10 }}>
            <div style={{ textAlign: "center" }}>
              <ShipSprite shipId={game.ship.id} size={52}/>
              <div style={{ fontSize: 14, color: "#00ff88" }}>Hull: {game.hull}</div>
            </div>
            <div style={{ fontSize: 16, color: "#ff4444", alignSelf: "center" }}>VS</div>
            <div style={{ textAlign: "center" }}>
              <ShipSprite shipId={encounter.ship?.id || "hornet"} size={52} flip={true}/>
              <div style={{ fontSize: 14, color: "#ff4444" }}>{encounter.ship?.name || "Police"}</div>
              <div style={{ fontSize: 13, color: "#ff4444" }}>Hull: {(enemy?.hull ?? encounter.hull)}</div>
            </div>
          </div>
          <div style={{ maxHeight: 60, overflow: "hidden", marginBottom: 8 }}>
            {combatLog.map((e, i) => <div key={i} className={"log-entry " + e.type}>{e.text}</div>)}
          </div>
          {phase !== "ended" && (
            <div className="flex-gap">
              <button className="btn btn-red" onClick={() => fightRound("fight")}>⚔ FIGHT</button>
              <button className="btn btn-blue" onClick={flee}>↗ FLEE</button>
              <button className="btn btn-gray" onClick={() => {
                // Surrender to police: arrested, pay fine, lose days
                const rep = game.reputation || 0;
                const fine = Math.max(500, Math.abs(rep) * 500);
                const jailDays = Math.max(2, Math.abs(rep));
                const hasEscapePod = game.gadgets.some(g => g.id === "escape_pod");
                onUpdate({ ...game,
                  credits: Math.max(0, game.credits - fine),
                  days: game.days + jailDays,
                  reputation: Math.min(0, rep + 3),
                  policeRecord: (game.policeRecord || 0) + 1,
                  log: [{ type: "bad", text: "Arrested! Fine: " + fine + " cr · " + jailDays + " days in custody · Rep +3" }, ...game.log],
                });
                onDone();
              }}>🏳 SURRENDER</button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="encounter-box" style={{ borderColor: "#4fc3f7" }}>
        <div className="encounter-title" style={{ color: "#4fc3f7" }}>🔵 POLICE INSPECTION</div>
        <div className="encounter-desc">
          {encounter.contraband
            ? "Officer: \"We detect illegal goods in your hold. Surrender your contraband or face arrest!\""
            : "Officer: \"Routine inspection. Your papers appear to be in order. Carry on, Commander.\""}
        </div>
        {encounter.contraband ? (
          <div className="flex-gap">
            <button className="btn btn-red" onClick={() => {
              const newCargo = game.cargo.filter(c => !COMMODITIES.find(x => x.id === c.id)?.illegal);
              const entry = { type: "warn", text: "Contraband seized by police!" };
              onUpdate({ ...game, cargo: newCargo, policeRecord: game.policeRecord + 1, log: [entry, ...game.log] });
              onDone();
            }}>COMPLY</button>
            <button className="btn btn-gray" onClick={flee}>FLEE</button>
          </div>
        ) : (
          <button className="btn btn-blue" onClick={() => onDone()}>ACKNOWLEDGED</button>
        )}
      </div>
    );
  }

  if (encounter.type === "trader") {
    const { sellGoods = [], buyGoods = [] } = encounter;
    const cargoUsed = game.cargo.reduce((s, c) => s + c.qty, 0);
    const cargoFree = game.cargoCapacity - cargoUsed;

    const buyFromTrader = (item) => {
      if (game.credits < item.price || cargoFree < 1) return;
      const newCargo = [...game.cargo];
      const idx = newCargo.findIndex(c => c.id === item.id);
      if (idx >= 0) {
        const old = newCargo[idx];
        newCargo[idx] = { ...old, qty: old.qty + 1, buyPrice: Math.round((old.buyPrice * old.qty + item.price) / (old.qty + 1)) };
      } else {
        newCargo.push({ id: item.id, qty: 1, buyPrice: item.price });
      }
      onUpdate({ ...game, credits: game.credits - item.price, cargo: newCargo,
        log: [{ type: "good", text: "Bought 1x " + item.name + " @ " + item.price + " cr" }, ...game.log] });
    };

    const sellToTrader = (item) => {
      const held = game.cargo.find(c => c.id === item.id);
      if (!held || held.qty < 1) return;
      const profit = item.price - (held.buyPrice || 0);
      const newCargo = game.cargo.map(c => c.id === item.id ? { ...c, qty: c.qty - 1 } : c).filter(c => c.qty > 0);
      onUpdate({ ...game, credits: game.credits + item.price, cargo: newCargo,
        log: [{ type: profit >= 0 ? "good" : "warn", text: "Sold 1x " + item.name + " @ " + item.price + " cr (" + (profit >= 0 ? "+" : "") + profit + ")" }, ...game.log] });
    };

    return (
      <div className="encounter-box" style={{ borderColor: "#00ff88" }}>
        <div className="encounter-title" style={{ color: "#00ff88" }}>🚀 TRADER VESSEL</div>
        <div style={{ fontSize: 15, color: "#8888bb", marginBottom: 10 }}>
          A merchant hails you. No police monitoring this exchange.
          <span style={{ color: "#555588", marginLeft: 8 }}>Hold: {cargoUsed}/{game.cargoCapacity}</span>
        </div>

        {/* What they sell */}
        {sellGoods.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 14, color: "#4fc3f7", marginBottom: 4 }}>THEY SELL</div>
            {sellGoods.map(item => {
              const base = COMMODITIES.find(c => c.id === item.id)?.base || item.price;
              const isGood = item.price < base;
              const canBuy = game.credits >= item.price && cargoFree > 0;
              return (
                <div key={item.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"3px 0", borderBottom:"1px solid #1a1a3a" }}>
                  <span style={{ fontSize:15, color:"#c0c0ff" }}>{item.name}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:15, color: isGood ? "#00ff88" : "#ffd700" }}>
                      {item.price} cr{isGood ? " ↓" : ""}
                    </span>
                    <button className="qty-btn" style={canBuy ? {borderColor:"#00ff88",color:"#00ff88"} : {opacity:0.3}}
                      onClick={() => buyFromTrader(item)}>B</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* What they buy */}
        {buyGoods.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 14, color: "#ffd700", marginBottom: 4 }}>THEY BUY — no questions asked</div>
            {buyGoods.map(item => {
              const base = COMMODITIES.find(c => c.id === item.id)?.base || item.price;
              const isPremium = item.price > base * 0.95;
              const held = game.cargo.find(c => c.id === item.id)?.qty || 0;
              const canSell = held > 0;
              return (
                <div key={item.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"3px 0", borderBottom:"1px solid #1a1a3a" }}>
                  <span style={{ fontSize:15, color: item.illegal ? "#ff6b35" : "#c0c0ff" }}>
                    {item.name}{item.illegal ? " ⚠" : ""}
                    {held > 0 && <span style={{color:"#00ff88",marginLeft:4}}>({held} in hold)</span>}
                  </span>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:15, color: isPremium ? "#00ff88" : "#888888" }}>
                      {item.price} cr{isPremium ? " ↑" : ""}
                    </span>
                    <button className="qty-btn" style={canSell ? {borderColor:"#ff6b35",color:"#ff6b35"} : {opacity:0.3}}
                      onClick={() => sellToTrader(item)}>S</button>
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize:12, color:"#555566", marginTop:4 }}>⚠ = illegal goods · ↑ = above market price</div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button className="btn btn-gray" onClick={() => onDone()}>DEPART</button>
          {(game.reputation || 0) <= -3 && (
            <button className="btn btn-red" onClick={() => {
              // Attack the merchant — steal cargo, lose reputation
              const merchantShip = encounter.merchantShip || SHIPS[2];
              const stolen = encounter.sellGoods?.slice(0, rnd(1, 3)).map(g => ({
                id: g.id, qty: rnd(1, 3), buyPrice: 0
              })) || [];
              const newCargo = [...game.cargo, ...stolen].filter(c => c.qty > 0);
              const repLoss = -2;
              onUpdate({ ...game,
                cargo: newCargo,
                reputation: Math.max(-10, (game.reputation || 0) + repLoss),
                policeRecord: (game.policeRecord || 0) + 1,
                log: [{ type: "bad", text: "Attacked merchant! Seized cargo. Reputation −2." }, ...game.log],
              });
              onDone();
            }}>
              ⚔ ATTACK (rep −2)
            </button>
          )}
        </div>
      </div>
    );
  }

  if (encounter.type === "special") {
    const specials = {
      marie_celeste: {
        title: "🚢 MARIE CELESTE",
        desc: "You find a drifting Flea-class vessel — the Marie Celeste. It appears abandoned. The cargo hold contains Narcotics. Salvage law says you may take it, but...",
        options: [
          { label: "TAKE CARGO", action: () => {
            const newCargo = [...game.cargo, { id: "narcotics", qty: 3, buyPrice: 0 }];
            onUpdate({ ...game, cargo: newCargo, log: [{ type: "warn", text: "Took Marie Celeste cargo — police may be watching!" }, ...game.log] });
            onDone();
          }, cls: "btn-red" },
          { label: "IGNORE", action: () => onDone(), cls: "btn-gray" },
        ]
      },
      famous_captain: (() => {
        const captain = pick(ELITE_CAPTAINS);
        const hasItem = captain.wants === "military"
          ? game.weapons.some(w => w.id === "military")
          : captain.wants === "beam"
          ? game.weapons.some(w => w.id === "beam")
          : game.shields.some(s => s.id === captain.wants);

        if (!hasItem) return {
          title: captain.emoji + " " + captain.name.toUpperCase(),
          desc: captain.name + " hails you. \"Looking for a pilot with a " + captain.wantsName + ". Keep it in mind if you ever come across one.\"",
          options: [{ label: "ACKNOWLEDGED", action: () => onDone(), cls: "btn-gray" }]
        };

        return {
          title: captain.emoji + " " + captain.name.toUpperCase(),
          desc: captain.name + " hails you. \"I need your " + captain.wantsName + ". In exchange — I'll teach you something you won't forget.\"",
          options: [
            { label: "TRADE → " + captain.gives, action: () => {
              let newWeapons = game.weapons;
              let newShields = game.shields;
              if (captain.wants === "military" || captain.wants === "beam") {
                newWeapons = game.weapons.filter(w => w.id !== captain.wants);
              } else {
                newShields = game.shields.filter(s => s.id !== captain.wants);
              }
              const newSkills = { ...game.skills, [captain.skill]: Math.min(10, game.skills[captain.skill] + 1) };
              onUpdate({ ...game, weapons: newWeapons, shields: newShields, skills: newSkills,
                log: [{ type: "good", text: captain.name + ": traded " + captain.wantsName + " → " + captain.gives }, ...game.log] });
              onDone();
            }, cls: "btn-gold" },
            { label: "DECLINE", action: () => onDone(), cls: "btn-gray" },
          ]
        };
      })(),
      alien_machine: {
        title: "👽 ALIEN ENCOUNTER",
        desc: "A strange alien vessel drifts alongside you. Through its hull you can see a glowing learning machine. The alien gestures — 3,000 credits for one session.",
        options: [
          ...(game.credits >= 3000 ? [{ label: "USE MACHINE (3000 cr)", action: () => {
            const s = pick(["pilot","fighter","trader","engineer"]);
            const worked = Math.random() < 0.6;
            const newSkills = worked ? { ...game.skills, [s]: Math.min(10, game.skills[s] + 1) } : game.skills;
            onUpdate({ ...game, credits: game.credits - 3000, skills: newSkills,
              log: [{ type: worked ? "good" : "warn", text: worked ? "Alien machine worked! +" + s + " skill" : "Machine malfunctioned — no effect." }, ...game.log] });
            onDone();
          }, cls: "btn-blue" }] : [{ label: "INTRIGUING — NOT ENOUGH CREDITS", action: () => onDone(), cls: "btn-gray" }]),
          { label: "IGNORE", action: () => onDone(), cls: "btn-gray" },
        ]
      },
      mercenary_offer: (() => {
        const merc = pick(MERCENARY_POOL.filter(m => !(game.mercenaries || []).find(x => x.id === m.id)));
        if (!merc) return {
          title: "🤝 MERCENARY",
          desc: "A spacer offers their services, but your crew is full.",
          options: [{ label: "ACKNOWLEDGED", action: () => onDone(), cls: "btn-gray" }]
        };
        const full = (game.mercenaries || []).length >= (game.ship.slots_c ?? 0);
        return {
          title: "🤝 MERCENARY: " + merc.name.toUpperCase(),
          desc: merc.name + " seeks work. Check the Jobs board at any planet to hire crew.",
          options: [{ label: "ACKNOWLEDGED", action: () => onDone(), cls: "btn-blue" }]
        };
      })(),
      sealed_cargo: {
        title: "🎁 SEALED CARGO",
        desc: "A second-hand dealer offers you 3 sealed cargo containers for 1,000 cr. Could be anything — water to robots!",
        options: [
          ...(game.credits >= 1000 ? [{ label: "BUY (1000 cr)", action: () => {
            const items = ["water","furs","food","ore","games","medicine","robots"];
            const newCargo = [...game.cargo, { id: pick(items), qty: 3, buyPrice: 333 }];
            onUpdate({ ...game, credits: game.credits - 1000, cargo: newCargo,
              log: [{ type: "info", text: "Opened sealed cargo!" }, ...game.log] });
            onDone();
          }, cls: "btn-gold" }] : []),
          { label: game.credits >= 1000 ? "PASS" : "CAN'T AFFORD — PASS", action: () => onDone(), cls: "btn-gray" },
        ]
      },
      tonic: {
        title: "🧪 ALIEN TONIC",
        desc: "A traveler offers you a bottle of alien brew. Rumored to enhance skills — expiration date unreadable.",
        options: [
          ...(game.credits >= 500 ? [{ label: "DRINK (500 cr)", action: () => {
            const s = pick(["pilot","fighter","trader","engineer"]);
            const worked = Math.random() < 0.4;
            const newSkills = worked ? { ...game.skills, [s]: Math.min(10, game.skills[s] + 1) } : game.skills;
            onUpdate({ ...game, credits: game.credits - 500, skills: newSkills,
              log: [{ type: worked ? "good" : "warn", text: worked ? "Tonic worked! +" + s : "Tonic had no effect." }, ...game.log] });
            onDone();
          }, cls: "btn-green" }] : []),
          { label: game.credits >= 500 ? "DECLINE" : "CAN'T AFFORD — DECLINE", action: () => onDone(), cls: "btn-gray" },
        ]
      },
    };

    const spec = specials[encounter.sub] || specials.sealed_cargo;
    return (
      <div className="encounter-box" style={{ borderColor: "#ffd700" }}>
        <div className="encounter-title" style={{ color: "#ffd700" }}>{spec.title}</div>
        <div className="encounter-desc">{spec.desc}</div>
        <div className="flex-gap">
          {spec.options.map((opt, i) => (
            <button key={i} className={"btn " + opt.cls} onClick={opt.action}>{opt.label}</button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}


export default EncounterScreen;
